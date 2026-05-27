const crypto = require("crypto");
const User = require("../models/User");
const PaymentWebhookEvent = require("../models/PaymentWebhookEvent");

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
  async getWebhookEventsSummary(req, res) {
    try {
      const dateFrom = String(req.query?.dateFrom || "").trim();
      const dateTo = String(req.query?.dateTo || "").trim();

      const filter = {};
      if (dateFrom || dateTo) {
        const createdAt = {};
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          if (!Number.isNaN(to.getTime())) createdAt.$lte = to;
        }
        if (Object.keys(createdAt).length) filter.createdAt = createdAt;
      }

      const summary = await PaymentWebhookEvent.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { event: "$event", status: "$status" },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.event": 1, "_id.status": 1 } },
      ]);

      const totals = {
        totalEvents: summary.reduce((acc, item) => acc + Number(item.count || 0), 0),
      };

      return res.json({
        success: true,
        period: {
          dateFrom: dateFrom || null,
          dateTo: dateTo || null,
        },
        totals,
        items: summary.map((item) => ({
          event: item?._id?.event || "unknown",
          status: item?._id?.status || "unknown",
          count: Number(item.count || 0),
        })),
      });
    } catch (error) {
      console.error("Erro ao resumir eventos de webhook:", error);
      return sendError(res, 500, "Erro ao resumir eventos de webhook");
    }
  }

  async replayWebhookEvent(req, res) {
    try {
      const eventId = String(req.params?.eventId || "").trim();
      const replayReason = String(req.body?.reason || "").trim();
      if (!eventId) {
        return sendError(res, 400, "Evento invalido");
      }
      if (!replayReason) {
        return sendError(res, 400, "Motivo do replay obrigatorio");
      }

      const item = await PaymentWebhookEvent.findById(eventId);
      if (!item) {
        return sendError(res, 404, "Evento de webhook nao encontrado");
      }

      if (String(item.event || "") !== "payment.confirmed") {
        return sendError(res, 400, "Replay permitido apenas para payment.confirmed");
      }

      const transactionId = String(item.transactionId || "").trim();
      const userId = String(item.userId || item.rawPayload?.userId || "").trim();
      const amountValue = toMoney(item.amount || item.rawPayload?.amount);

      if (!transactionId || !userId || !Number.isFinite(amountValue) || amountValue <= 0) {
        return sendError(res, 400, "Evento sem dados suficientes para replay");
      }

      const user = await User.findById(userId).select("wallet");
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      user.wallet = user.wallet || { balance: 0, transactions: [] };
      user.wallet.transactions = user.wallet.transactions || [];

      const alreadySettled = user.wallet.transactions.some(
        (transaction) => String(transaction.referenceId || "") === transactionId,
      );

      if (alreadySettled) {
        item.status = "already_settled";
        item.processedAt = new Date();
        item.replayedAt = new Date();
        item.replayReason = replayReason;
        item.replayedBy = {
          adminId: String(req.user?.id || ""),
          adminEmail: String(req.user?.email || ""),
        };
        await item.save();
        return res.json({
          success: true,
          status: "already_settled",
          transactionId,
          eventId: String(item._id),
        });
      }

      user.wallet.balance = toMoney((user.wallet.balance || 0) + amountValue);
      user.wallet.transactions.push({
        type: "topup",
        amount: amountValue,
        description: "Credito aplicado por replay administrativo",
        referenceId: transactionId,
        createdAt: new Date(),
      });

      await user.save();

      item.status = "processed";
      item.processedAt = new Date();
      item.replayedAt = new Date();
      item.replayReason = replayReason;
      item.replayedBy = {
        adminId: String(req.user?.id || ""),
        adminEmail: String(req.user?.email || ""),
      };
      await item.save();

      return res.json({
        success: true,
        status: "processed",
        transactionId,
        eventId: String(item._id),
        balance: toMoney(user.wallet.balance || 0),
      });
    } catch (error) {
      console.error("Erro ao reprocessar evento de webhook:", error);
      return sendError(res, 500, "Erro ao reprocessar evento de webhook");
    }
  }

  async getWebhookEventById(req, res) {
    try {
      const eventId = String(req.params?.eventId || "").trim();
      if (!eventId) {
        return sendError(res, 400, "Evento invalido");
      }

      const item = await PaymentWebhookEvent.findById(eventId);
      if (!item) {
        return sendError(res, 404, "Evento de webhook nao encontrado");
      }

      return res.json({
        success: true,
        event: {
          id: String(item._id),
          transactionId: item.transactionId,
          event: item.event,
          userId: item.userId ? String(item.userId) : null,
          amount: toMoney(item.amount),
          status: item.status,
          rawPayload: item.rawPayload || {},
          processedAt: item.processedAt || item.createdAt,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar evento de webhook:", error);
      return sendError(res, 500, "Erro ao buscar evento de webhook");
    }
  }

  async listWebhookEvents(req, res) {
    try {
      const transactionId = String(req.query?.transactionId || "").trim();
      const event = String(req.query?.event || "").trim().toLowerCase();
      const dateFrom = String(req.query?.dateFrom || "").trim();
      const dateTo = String(req.query?.dateTo || "").trim();
      const limitValue = Number(req.query?.limit || 100);
      const limit = Number.isFinite(limitValue)
        ? Math.min(Math.max(Math.trunc(limitValue), 1), 500)
        : 100;

      const filter = {};
      if (transactionId) filter.transactionId = transactionId;
      if (event) filter.event = event;
      if (dateFrom || dateTo) {
        const createdAt = {};
        if (dateFrom) {
          const from = new Date(dateFrom);
          if (!Number.isNaN(from.getTime())) createdAt.$gte = from;
        }
        if (dateTo) {
          const to = new Date(dateTo);
          if (!Number.isNaN(to.getTime())) createdAt.$lte = to;
        }
        if (Object.keys(createdAt).length) filter.createdAt = createdAt;
      }

      const events = await PaymentWebhookEvent.find(filter)
        .sort({ createdAt: -1 })
        .limit(limit);

      return res.json({
        success: true,
        count: events.length,
        events: events.map((item) => ({
          id: String(item._id),
          transactionId: item.transactionId,
          event: item.event,
          userId: item.userId ? String(item.userId) : null,
          amount: toMoney(item.amount),
          status: item.status,
          processedAt: item.processedAt || item.createdAt,
          replayedAt: item.replayedAt || null,
          replayReason: item.replayReason || null,
          replayedBy: item.replayedBy || null,
          createdAt: item.createdAt,
        })),
      });
    } catch (error) {
      console.error("Erro ao listar eventos de webhook:", error);
      return sendError(res, 500, "Erro ao listar eventos de webhook");
    }
  }

  async webhook(req, res) {
    try {
      const expectedSecret = String(process.env.PAYMENTS_WEBHOOK_SECRET || "").trim();
      if (process.env.NODE_ENV === "production" && !expectedSecret) {
        return sendError(res, 500, "Webhook desabilitado por configuracao");
      }
      const receivedSecret = String(req.headers["x-webhook-secret"] || "").trim();
      if (expectedSecret && receivedSecret !== expectedSecret) {
        return sendError(res, 401, "Webhook nao autorizado");
      }

      const event = String(req.body?.event || "").trim().toLowerCase();
      const transactionId = String(req.body?.transactionId || req.body?.id || "").trim();
      const userId = String(req.body?.userId || "").trim();
      const amountValue = toMoney(req.body?.amount);

      if (!event || !transactionId) {
        return sendError(res, 400, "Evento de webhook invalido");
      }

      if (!["payment.confirmed", "payment.cancelled", "payment.failed"].includes(event)) {
        return sendError(res, 400, "Evento nao suportado");
      }

      const existingEvent = await PaymentWebhookEvent.findOne({ transactionId, event }).select(
        "_id",
      );
      if (existingEvent?._id) {
        return res.json({
          success: true,
          status: "already_processed",
          transactionId,
          event,
        });
      }

      if (event === "payment.confirmed") {
        if (!userId || !Number.isFinite(amountValue) || amountValue <= 0) {
          return sendError(res, 400, "Dados de conciliacao invalidos");
        }

        const user = await User.findById(userId).select("wallet");
        if (!user) {
          return sendError(res, 404, "Usuario nao encontrado");
        }

        user.wallet = user.wallet || { balance: 0, transactions: [] };
        user.wallet.transactions = user.wallet.transactions || [];

        const alreadySettled = user.wallet.transactions.some(
          (transaction) => String(transaction.referenceId || "") === transactionId,
        );
        if (alreadySettled) {
          await PaymentWebhookEvent.create({
            transactionId,
            event,
            userId: user._id,
            amount: amountValue,
            status: "already_settled",
            rawPayload: req.body || {},
            processedAt: new Date(),
          });
          return res.json({
            success: true,
            status: "already_settled",
            transactionId,
            event,
          });
        }

        user.wallet.balance = toMoney((user.wallet.balance || 0) + amountValue);
        user.wallet.transactions.push({
          type: "topup",
          amount: amountValue,
          description: "Credito confirmado por webhook",
          referenceId: transactionId,
          createdAt: new Date(),
        });

        await user.save();
        await PaymentWebhookEvent.create({
          transactionId,
          event,
          userId: user._id,
          amount: amountValue,
          status: "processed",
          rawPayload: req.body || {},
          processedAt: new Date(),
        });

        return res.json({
          success: true,
          status: "processed",
          transactionId,
          event,
          balance: toMoney(user.wallet.balance || 0),
        });
      }

      await PaymentWebhookEvent.create({
        transactionId,
        event,
        status: "acknowledged",
        rawPayload: req.body || {},
        processedAt: new Date(),
      });

      return res.json({
        success: true,
        status: "acknowledged",
        transactionId,
        event,
      });
    } catch (error) {
      console.error("Erro ao processar webhook de pagamento:", error);
      return sendError(res, 500, "Erro ao processar webhook de pagamento");
    }
  }

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

  /**
   * Gera QR Code PIX para depósito na carteira
   */
  async createPixDeposit(req, res) {
    try {
      const { amount } = req.body || {};
      const amountValue = toMoney(amount);

      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return sendError(res, 400, "Valor invalido para deposito");
      }

      const user = await User.findById(req.user.id).select("name email");
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      // Gerar transactionId único
      const transactionId = `pix_${crypto.randomBytes(16).toString("hex")}`;

      // Gerar código PIX copia-e-cola (simulado para MVP)
      // Em produção, integrar com gateway (Mercado Pago, PagSeguro, etc)
      const pixCode = `00020126580014BR.GOV.BCB.PIX0136${transactionId}5204000053039865802BR5925${user.name.substring(0, 25).padEnd(25)}6009SAO PAULO62070503***6304`;

      // Em produção, gerar QR Code real via biblioteca (qrcode)
      const qrCodeData = pixCode;

      return res.json({
        success: true,
        transactionId,
        amount: amountValue,
        pixCode,
        qrCodeData,
        expiresIn: 3600, // 1 hora
        status: "pending",
        instructions: [
          "Abra o app do seu banco",
          "Escolha pagar com PIX",
          "Escaneie o QR Code ou cole o código",
          "Confirme o pagamento",
        ],
      });
    } catch (error) {
      console.error("Erro ao gerar deposito PIX:", error);
      return sendError(res, 500, "Erro ao gerar deposito PIX");
    }
  }

  /**
   * Salva feedback de saída do usuário (quando abandona verificação)
   */
  async submitExitFeedback(req, res) {
    try {
      const { reason, category, details } = req.body || {};
      const userId = req.user.id;

      if (!reason || !category) {
        return sendError(res, 400, "Motivo e categoria sao obrigatorios");
      }

      // Em produção, salvar em tabela UserFeedback ou integrar com analytics
      console.log(`[ExitFeedback] User ${userId} - Category: ${category}, Reason: ${reason}`);

      // TODO: Salvar em banco de dados
      // await UserFeedback.create({ userId, category, reason, details, createdAt: new Date() });

      return res.json({
        success: true,
        message: "Feedback registrado com sucesso",
        feedbackId: `feedback_${crypto.randomBytes(8).toString("hex")}`,
      });
    } catch (error) {
      console.error("Erro ao salvar feedback de saida:", error);
      return sendError(res, 500, "Erro ao salvar feedback");
    }
  }

  /**
   * Processa verificação de identidade do usuário
   */
  async submitVerification(req, res) {
    try {
      const { documentType, documentFront, documentBack, selfie } = req.body || {};
      const userId = req.user.id;

      if (!documentType || !documentFront || !selfie) {
        return sendError(res, 400, "Documentos obrigatorios: documentType, documentFront, selfie");
      }

      const validTypes = ["rg", "cnh", "passaporte"];
      if (!validTypes.includes(documentType.toLowerCase())) {
        return sendError(res, 400, `Tipo de documento invalido. Use: ${validTypes.join(", ")}`);
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }

      // Em produção, enviar para serviço de verificação (IdWall, BigData Corp, etc)
      // Por enquanto, salvar no perfil do usuário como "pending"

      user.verification = user.verification || {};
      user.verification.status = "pending";
      user.verification.submittedAt = new Date();
      user.verification.documentType = documentType;
      user.verification.documentFront = documentFront;
      user.verification.documentBack = documentBack;
      user.verification.selfie = selfie;

      await user.save();

      return res.json({
        success: true,
        message: "Verificacao enviada com sucesso. Aguarde analise.",
        verificationId: `ver_${crypto.randomBytes(12).toString("hex")}`,
        status: "pending",
        estimatedReviewTime: "24-48 horas",
      });
    } catch (error) {
      console.error("Erro ao processar verificacao:", error);
      return sendError(res, 500, "Erro ao processar verificacao");
    }
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
