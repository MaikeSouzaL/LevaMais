const crypto = require("crypto");
const User = require("../models/User");

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function detectCardBrand(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  return "card";
}

function parseExpiry(expiry) {
  const cleaned = String(expiry || "").replace(/\D/g, "");
  if (cleaned.length < 4) return null;

  const month = Number(cleaned.slice(0, 2));
  const year = Number(cleaned.slice(2, 4));

  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  if (!Number.isFinite(year) || year < 0 || year > 99) return null;

  return { month, year };
}

function normalizePaymentMethod(rawMethod) {
  const value = String(rawMethod || "")
    .trim()
    .toLowerCase();

  if (!value) return null;
  if (["cash", "dinheiro"].includes(value)) return "cash";
  if (["pix"].includes(value)) return "pix";
  if (["wallet", "carteira"].includes(value)) return "wallet";
  if (["card", "credit_card", "debit_card", "credit", "debit"].includes(value)) {
    return "credit_card";
  }

  return null;
}

function isValidPixKey(pixKey) {
  const value = String(pixKey || "").trim();
  if (!value) return false;
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);

  const digits = value.replace(/\D/g, "");
  if (digits.length === 11 || digits.length === 14) return true;
  if (digits.length >= 10 && digits.length <= 13) return true;

  return value.length >= 8 && value.length <= 120;
}

class PaymentController {
  async listCards(req, res) {
    try {
      const user = await User.findById(req.user.id).select("paymentMethods");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      return res.json({
        success: true,
        cards: (user.paymentMethods || []).map((method) => ({
          id: String(method._id),
          brand: method.brand || "card",
          lastFour: method.last4 || "",
          holderName: method.holderName || "",
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: Boolean(method.isDefault),
        })),
      });
    } catch (error) {
      console.error("Erro ao listar cartoes:", error);
      return sendError(res, 500, "Erro ao listar cartoes");
    }
  }

  async addCard(req, res) {
    try {
      const { cardNumber, holderName, expiryMonth, expiryYear, expiry, isDefault } =
        req.body || {};

      const digits = String(cardNumber || "").replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) {
        return sendError(res, 400, "Numero do cartao invalido");
      }

      const holder = String(holderName || "").trim();
      if (!holder) {
        return sendError(res, 400, "Nome do titular obrigatorio");
      }

      let parsedExpiry = null;
      if (expiryMonth && expiryYear) {
        parsedExpiry = {
          month: Number(expiryMonth),
          year: Number(expiryYear),
        };
      } else {
        parsedExpiry = parseExpiry(expiry);
      }

      if (
        !parsedExpiry ||
        !Number.isFinite(parsedExpiry.month) ||
        parsedExpiry.month < 1 ||
        parsedExpiry.month > 12 ||
        !Number.isFinite(parsedExpiry.year)
      ) {
        return sendError(res, 400, "Validade invalida");
      }

      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      user.paymentMethods = user.paymentMethods || [];
      if (user.paymentMethods.length >= 8) {
        return sendError(res, 400, "Limite de cartoes atingido");
      }

      const shouldBeDefault = Boolean(isDefault) || user.paymentMethods.length === 0;
      if (shouldBeDefault) {
        user.paymentMethods.forEach((method) => {
          method.isDefault = false;
        });
      }

      user.paymentMethods.push({
        brand: detectCardBrand(digits),
        last4: digits.slice(-4),
        holderName: holder,
        expiryMonth: parsedExpiry.month,
        expiryYear: parsedExpiry.year,
        token: `pm_${crypto.randomBytes(12).toString("hex")}`,
        isDefault: shouldBeDefault,
      });

      await user.save();
      const created = user.paymentMethods[user.paymentMethods.length - 1];

      return res.status(201).json({
        success: true,
        card: {
          id: String(created._id),
          brand: created.brand,
          lastFour: created.last4,
          holderName: created.holderName,
          expiryMonth: created.expiryMonth,
          expiryYear: created.expiryYear,
          isDefault: Boolean(created.isDefault),
        },
      });
    } catch (error) {
      console.error("Erro ao adicionar cartao:", error);
      return sendError(res, 500, "Erro ao adicionar cartao");
    }
  }

  async deleteCard(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const cards = user.paymentMethods || [];
      const index = cards.findIndex(
        (method) => String(method._id) === String(req.params.cardId),
      );

      if (index < 0) return sendError(res, 404, "Cartao nao encontrado");

      const removedWasDefault = Boolean(cards[index].isDefault);
      cards.splice(index, 1);

      if (removedWasDefault && cards.length > 0) {
        cards[0].isDefault = true;
      }

      user.paymentMethods = cards;
      await user.save();

      return res.json({
        success: true,
        message: "Cartao removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover cartao:", error);
      return sendError(res, 500, "Erro ao remover cartao");
    }
  }

  async process(req, res) {
    try {
      const { amount, method, description, cardId, pixKey } = req.body || {};
      const paymentMethod = normalizePaymentMethod(method);
      const amountValue = toMoney(amount);

      if (!paymentMethod) {
        return sendError(res, 400, "Metodo de pagamento invalido");
      }

      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return sendError(res, 400, "Valor invalido");
      }

      const user = await User.findById(req.user.id).select("wallet paymentMethods");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      if (paymentMethod === "credit_card" && cardId) {
        const hasCard = (user.paymentMethods || []).some(
          (paymentCard) => String(paymentCard._id) === String(cardId),
        );
        if (!hasCard) {
          return sendError(res, 400, "Cartao nao encontrado");
        }
      }

      if (paymentMethod === "pix" && pixKey && !isValidPixKey(pixKey)) {
        return sendError(res, 400, "Chave PIX invalida");
      }

      const transactionId = `pay_${crypto.randomBytes(10).toString("hex")}`;

      if (paymentMethod === "wallet") {
        user.wallet = user.wallet || { balance: 0, transactions: [] };
        const currentBalance = toMoney(user.wallet.balance || 0);
        if (currentBalance < amountValue) {
          return sendError(res, 400, "Saldo insuficiente", {
            available: currentBalance,
          });
        }

        user.wallet.balance = toMoney(currentBalance - amountValue);
        user.wallet.transactions = user.wallet.transactions || [];
        user.wallet.transactions.push({
          type: "ride_payment",
          amount: amountValue,
          description: description || "Pagamento de corrida/entrega",
          referenceId: transactionId,
          createdAt: new Date(),
        });

        await user.save();
      }

      return res.status(201).json({
        success: true,
        transactionId,
        amount: amountValue,
        method: paymentMethod,
        status: "completed",
        receipt: {
          id: transactionId,
          date: new Date().toISOString(),
          amount: amountValue,
          method: paymentMethod,
        },
        gateway: {
          provider: "internal-mvp",
          settlement: paymentMethod === "wallet" ? "captured" : "authorized",
        },
      });
    } catch (error) {
      console.error("Erro ao processar pagamento:", error);
      return sendError(res, 500, "Erro ao processar pagamento");
    }
  }

  async validatePix(req, res) {
    const pixKey = String(req.body?.pixKey || "").trim();
    return res.json({
      valid: isValidPixKey(pixKey),
      name: pixKey ? "Titular validacao local" : undefined,
    });
  }

  async getReceipt(req, res) {
    const transactionId = String(req.params.transactionId || "");
    if (!transactionId) {
      return sendError(res, 400, "Transacao invalida");
    }

    return res.json({
      success: true,
      receipt: {
        id: transactionId,
        date: new Date().toISOString(),
      },
    });
  }

  async getHistory(req, res) {
    try {
      const user = await User.findById(req.user.id).select("wallet");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const payments = (user.wallet?.transactions || [])
        .filter((transaction) => transaction.type === "ride_payment")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((transaction) => ({
          transactionId: transaction.referenceId || String(transaction._id),
          amount: toMoney(transaction.amount),
          method: "wallet",
          status: "completed",
          description: transaction.description || "Pagamento",
          createdAt: transaction.createdAt,
        }));

      return res.json({
        success: true,
        payments,
      });
    } catch (error) {
      console.error("Erro ao buscar historico de pagamentos:", error);
      return sendError(res, 500, "Erro ao buscar historico");
    }
  }

  async refund(req, res) {
    try {
      const transactionId = String(req.params.transactionId || "");
      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      user.wallet = user.wallet || { balance: 0, transactions: [] };
      const transactions = user.wallet.transactions || [];
      const original = transactions.find(
        (transaction) => String(transaction.referenceId) === transactionId,
      );

      if (!original) {
        return sendError(res, 404, "Pagamento nao encontrado");
      }

      const amountValue = toMoney(original.amount);
      user.wallet.balance = toMoney((user.wallet.balance || 0) + amountValue);
      transactions.push({
        type: "refund",
        amount: amountValue,
        description: "Estorno de pagamento",
        referenceId: `refund_${transactionId}`,
        createdAt: new Date(),
      });

      await user.save();

      return res.json({
        success: true,
        message: "Estorno registrado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao estornar pagamento:", error);
      return sendError(res, 500, "Erro ao estornar pagamento");
    }
  }

  async estimateFee(req, res) {
    const amountValue = toMoney(req.query?.amount);
    const paymentMethod = normalizePaymentMethod(req.query?.method);
    const rates = {
      credit_card: 0.0349,
      pix: 0,
      wallet: 0,
      cash: 0,
    };

    const fee =
      amountValue > 0 && paymentMethod
        ? toMoney(amountValue * (rates[paymentMethod] || 0))
        : 0;

    return res.json({
      success: true,
      fee,
    });
  }
}

module.exports = new PaymentController();
