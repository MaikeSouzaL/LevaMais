const crypto = require("crypto");
const User = require("../models/User");
const PaymentWebhookEvent = require("../models/PaymentWebhookEvent");
const { processPayment: gatewayProcess } = require("../services/payment-gateway.service");
const walletEscrow = require("../services/walletEscrow.service");
const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

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

function canUseDepositAccount(user, account) {
  return account !== "driver_balance" || user?.userType === "driver";
}

/**
 * Credita um depósito confirmado na conta certa do usuário (idempotente por referenceId).
 *  - account "wallet"        → carteira do cliente (paga corridas via LevaPay).
 *  - account "driver_balance"→ saldo operacional do motorista (aceita corridas).
 * Muta o doc `user` (o chamador faz user.save()). Retorna true se creditou agora.
 */
function creditDepositToAccount(user, account, amount, { referenceId, description, receiptUrl } = {}) {
  const amt = toMoney(amount);
  if (!user || amt <= 0) return false;

  if (account === "driver_balance") {
    user.driverBalance = user.driverBalance || { balance: 0, totalDeposits: 0, totalDeductions: 0, transactions: [] };
    const txs = Array.isArray(user.driverBalance.transactions) ? user.driverBalance.transactions : [];
    if (referenceId && txs.some((t) => String(t.referenceId || "") === String(referenceId))) return false;
    user.driverBalance.balance = toMoney(Number(user.driverBalance.balance || 0) + amt);
    user.driverBalance.totalDeposits = toMoney(Number(user.driverBalance.totalDeposits || 0) + amt);
    user.driverBalance.transactions = txs;
    user.driverBalance.transactions.push({
      type: "driver_topup",
      amount: amt,
      description: description || "Recarga de saldo",
      referenceId: referenceId || undefined,
      receiptUrl: receiptUrl || undefined,
      status: "completed",
      createdAt: new Date(),
    });
    return true;
  }

  // default: wallet
  user.wallet = user.wallet || { balance: 0, held: 0, transactions: [] };
  const wtxs = Array.isArray(user.wallet.transactions) ? user.wallet.transactions : [];
  if (referenceId && wtxs.some((t) => String(t.referenceId || "") === String(referenceId))) return false;
  user.wallet.balance = toMoney(Number(user.wallet.balance || 0) + amt);
  user.wallet.transactions = wtxs;
  user.wallet.transactions.push({
    type: "topup",
    amount: amt,
    description: description || "Recarga de saldo",
    referenceId: referenceId || undefined,
    receiptUrl: receiptUrl || undefined,
    createdAt: new Date(),
  });
  return true;
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
        // Quita automaticamente taxa de cancelamento pendente com o novo saldo.
        await walletEscrow.settlePendingDebt(user);

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

      const user = await User.findById(req.user.id).select("wallet paymentMethods name email");
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

      // Delegate to payment gateway service
      const result = await gatewayProcess({
        method: paymentMethod,
        amount: amountValue,
        description: description || "Pagamento Leva+",
        user,
        cardId,
        pixKey,
      });

      // Log webhook event for idempotency
      await PaymentWebhookEvent.create({
        transactionId: result.transactionId,
        event: "payment.processed",
        userId: req.user.id,
        amount: amountValue,
        status: result.status === "completed" ? "processed" : "acknowledged",
        rawPayload: { method: paymentMethod, gateway: result.gatewayResponse },
      });

      return res.status(201).json({
        success: true,
        transactionId: result.transactionId,
        amount: amountValue,
        method: paymentMethod,
        status: result.status,
        receipt: {
          id: result.transactionId,
          date: new Date().toISOString(),
          amount: amountValue,
          method: paymentMethod,
        },
        gateway: {
          provider: result.gatewayResponse.provider,
          settlement: result.gatewayResponse.settlement,
          pixQrCode: result.gatewayResponse.pixQrCode,
          pixCopyPaste: result.gatewayResponse.pixCopyPaste,
        },
      });
    } catch (error) {
      console.error("[Payment] Process error:", error.message);
      return sendError(res, error.statusCode || 500, error.message || "Erro ao processar pagamento");
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
   * Gera QR Code PIX para depósito na carteira (com suporte/integração ao Stripe se disponível)
   */
  async createPixDeposit(req, res) {
    // Variáveis locais (evita globais implícitas compartilhadas entre requisições).
    let transactionId;
    let pixCode;
    let qrCodeData;
    try {
      const { amount } = req.body || {};
      const amountValue = toMoney(amount);
      // Para onde o saldo vai: carteira do cliente (wallet) ou saldo do motorista (driver_balance).
      const account = String(req.body?.account || "wallet") === "driver_balance" ? "driver_balance" : "wallet";

      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return sendError(res, 400, "Valor invalido para deposito");
      }

      const user = await User.findById(req.user.id).select("name email userType");
      if (!user) {
        return sendError(res, 404, "Usuario nao encontrado");
      }
      if (!canUseDepositAccount(user, account)) {
        return sendError(res, 403, "Apenas motoristas podem recarregar o saldo operacional.");
      }

      if (!stripe) {
        return sendError(res, 500, "Stripe não configurado no servidor. Chave secreta ausente.");
      }

      try {
        const amountInCents = Math.round(amountValue * 100);
        // Cria PaymentIntent PIX no Stripe (account vai em metadata p/ o webhook creditar certo).
        const paymentIntent = await stripe.paymentIntents.create({
          amount: amountInCents,
          currency: "brl",
          payment_method_types: ["pix"],
          payment_method_data: {
            type: "pix",
          },
          confirm: true,
          return_url: "https://example.com",
          metadata: { userId: String(user._id), account, kind: "deposit" },
        });

        transactionId = paymentIntent.id;

        if (paymentIntent.next_action && paymentIntent.next_action.pix_display_qr_code) {
          pixCode = paymentIntent.next_action.pix_display_qr_code.data;
          qrCodeData = paymentIntent.next_action.pix_display_qr_code.image_url_png || pixCode;
        } else {
          return sendError(res, 400, "O Stripe não retornou os dados de QR Code PIX.");
        }
      } catch (stripeError) {
        console.error("[Stripe PIX] Erro ao criar PIX Stripe:", stripeError.message);
        return sendError(res, 500, `Erro ao criar PIX no Stripe: ${stripeError.message}`);
      }

      // Salvar evento de pendência para controle do status
      await PaymentWebhookEvent.create({
        transactionId,
        event: "payment.pending",
        userId: user._id,
        amount: amountValue,
        status: "acknowledged",
        rawPayload: { method: "pix", simulated: false, gateway: "stripe", account }
      });

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
   * Consulta o status atual de um depósito Pix (com suporte/integração ao Stripe)
   */
  async getPixDepositStatus(req, res) {
    try {
      const { transactionId } = req.params;
      if (!transactionId) {
        return sendError(res, 400, "ID da transação obrigatório");
      }

      // 1. Procurar se já foi confirmado no banco local
      const confirmedEvent = await PaymentWebhookEvent.findOne({
        transactionId,
        event: "payment.confirmed"
      });

      if (confirmedEvent) {
        if (String(confirmedEvent.userId || "") !== String(req.user.id)) {
          return sendError(res, 404, "Depósito não encontrado");
        }
        return res.json({
          success: true,
          transactionId,
          status: "paid",
          amount: confirmedEvent.amount,
          paidAt: confirmedEvent.processedAt || confirmedEvent.createdAt,
          receiptUrl: confirmedEvent.rawPayload?.receiptUrl || null
        });
      }

      // 2. Procurar o evento pendente
      const pendingEvent = await PaymentWebhookEvent.findOne({
        transactionId,
        event: "payment.pending"
      });

      if (!pendingEvent) {
        return sendError(res, 404, "Depósito não encontrado");
      }
      if (String(pendingEvent.userId || "") !== String(req.user.id)) {
        return sendError(res, 404, "Depósito não encontrado");
      }

      // 3. Se for uma transação do Stripe real (não simulada de ponta a ponta)
      let stripeIsPaid = false;
      let stripeReceiptUrl = null;
      if (stripe && transactionId.startsWith("pi_")) {
        try {
          const paymentIntent = await stripe.paymentIntents.retrieve(transactionId);
          if (paymentIntent.status === "succeeded") {
            stripeIsPaid = true;
            const charge = paymentIntent.charges?.data?.[0];
            if (charge && charge.receipt_url) {
              stripeReceiptUrl = charge.receipt_url;
            }
          }
        } catch (stripeErr) {
          console.warn("[Stripe status check] Erro ao consultar PaymentIntent:", stripeErr.message);
        }
      }

      // 4. SÓ credita quando o Stripe confirma o pagamento de verdade (succeeded).
      //    (Removido o auto-crédito por tempo — creditava sem pagamento = falha grave.)
      if (stripeIsPaid) {
        const account = pendingEvent.rawPayload?.account === "driver_balance" ? "driver_balance" : "wallet";
        const user = await User.findById(pendingEvent.userId);
        if (user) {
          if (!canUseDepositAccount(user, account)) {
            return sendError(res, 403, "Apenas motoristas podem recarregar o saldo operacional.");
          }
          const credited = creditDepositToAccount(user, account, pendingEvent.amount, {
            referenceId: transactionId,
            description: "Recarga via PIX (Stripe)",
            receiptUrl: stripeReceiptUrl,
          });
          if (credited && account === "wallet") {
            await walletEscrow.settlePendingDebt(user);
          }
          await user.save();

          // Salvar evento de confirmação no log de webhooks
          const confirmed = await PaymentWebhookEvent.create({
            transactionId,
            event: "payment.confirmed",
            userId: user._id,
            amount: pendingEvent.amount,
            status: "processed",
            rawPayload: { method: "pix", account, stripeIsPaid, receiptUrl: stripeReceiptUrl },
            processedAt: new Date()
          });

          return res.json({
            success: true,
            transactionId,
            status: "paid",
            amount: pendingEvent.amount,
            paidAt: confirmed.processedAt,
            receiptUrl: stripeReceiptUrl
          });
        }
      }

      // Caso contrário, continua pendente
      return res.json({
        success: true,
        transactionId,
        status: "pending",
        amount: pendingEvent.amount
      });
    } catch (error) {
      console.error("Erro ao consultar status PIX:", error);
      return sendError(res, 500, "Erro ao consultar status do PIX");
    }
  }

  /**
   * Depósito via BOLETO (Stripe). Requer nome + CPF do pagador.
   * Credita carteira (account="wallet") ou saldo do motorista (account="driver_balance").
   */
  async createBoletoDeposit(req, res) {
    try {
      const { amount, taxId } = req.body || {};
      const amountValue = toMoney(amount);
      const account = String(req.body?.account || "wallet") === "driver_balance" ? "driver_balance" : "wallet";

      if (!Number.isFinite(amountValue) || amountValue <= 0) {
        return sendError(res, 400, "Valor invalido para deposito");
      }
      if (!stripe) {
        return sendError(res, 500, "Stripe não configurado no servidor.");
      }

      const user = await User.findById(req.user.id).select("name email cpf userType");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");
      if (!canUseDepositAccount(user, account)) {
        return sendError(res, 403, "Apenas motoristas podem recarregar o saldo operacional.");
      }

      const cpf = String(taxId || user.cpf || "").replace(/\D/g, "");
      if (cpf.length !== 11) {
        return sendError(res, 400, "CPF é obrigatório para boleto (11 dígitos).");
      }

      try {
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amountValue * 100),
          currency: "brl",
          payment_method_types: ["boleto"],
          payment_method_data: {
            type: "boleto",
            boleto: { tax_id: cpf },
            billing_details: {
              name: user.name || "Cliente Leva",
              email: user.email || undefined,
            },
          },
          confirm: true,
          metadata: { userId: String(user._id), account, kind: "deposit" },
        });

        const na = paymentIntent.next_action?.boleto_display_details || {};

        await PaymentWebhookEvent.create({
          transactionId: paymentIntent.id,
          event: "payment.pending",
          userId: user._id,
          amount: amountValue,
          status: "acknowledged",
          rawPayload: { method: "boleto", gateway: "stripe", account },
        });

        return res.json({
          success: true,
          transactionId: paymentIntent.id,
          amount: amountValue,
          status: "pending",
          boleto: {
            pdf: na.pdf || null,
            number: na.number || null,
            expiresAt: na.expires_at || null,
            hostedVoucherUrl: na.hosted_voucher_url || null,
          },
        });
      } catch (stripeError) {
        console.error("[Stripe Boleto] Erro:", stripeError.message);
        return sendError(res, 500, `Erro ao gerar boleto no Stripe: ${stripeError.message}`);
      }
    } catch (error) {
      console.error("Erro ao gerar deposito boleto:", error);
      return sendError(res, 500, "Erro ao gerar deposito via boleto");
    }
  }

  /**
   * Webhook OFICIAL do Stripe — verifica a assinatura e credita o depósito.
   * Trata payment_intent.succeeded (PIX/boleto). Idempotente.
   */
  async stripeWebhook(req, res) {
    if (!stripe) return res.status(500).send("Stripe não configurado");
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      if (webhookSecret) {
        event = stripe.webhooks.constructEvent(req.rawBody || req.body, signature, webhookSecret);
      } else {
        // Sem secret configurado: aceita o corpo já parseado (apenas dev).
        if (process.env.NODE_ENV === "production") {
          return res.status(500).send("STRIPE_WEBHOOK_SECRET ausente");
        }
        event = req.body;
      }
    } catch (err) {
      console.error("[Stripe webhook] Assinatura inválida:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;
        const transactionId = pi.id;
        const userId = pi.metadata?.userId;
        const amountValue = toMoney((pi.amount_received || pi.amount || 0) / 100);

        if (pi.metadata?.kind === "ride_payment") {
          const rideId = pi.metadata.rideId;
          const driverId = pi.metadata.driverId;
          const Ride = require("../models/Ride");
          const ride = await Ride.findById(rideId);
          if (ride && ride.payment?.status !== "completed") {
            if (!ride.payment) {
              ride.payment = { method: "pix" };
            }
            ride.payment.status = "completed";
            ride.payment.paidAt = new Date();
            ride.payment.transactionId = transactionId;
            await ride.save();

            const driver = await User.findById(driverId);
            if (driver) {
              driver.driverBalance = driver.driverBalance || { balance: 0, totalDeposits: 0, totalDeductions: 0, transactions: [] };
              driver.driverBalance.balance = toMoney(Number(driver.driverBalance.balance || 0) + amountValue);
              driver.driverBalance.totalDeposits = toMoney(Number(driver.driverBalance.totalDeposits || 0) + amountValue);
              driver.driverBalance.transactions.push({
                type: "client_in_app_payment",
                amount: amountValue,
                description: `Pagamento da corrida/entrega ${rideId} via PIX`,
                referenceId: transactionId,
                status: "completed",
                createdAt: new Date(),
              });
              await driver.save();
            }

            const io = req.app.get("io");
            if (io) {
              io.to(String(rideId)).emit("ride-status-updated", {
                rideId: String(rideId),
                status: ride.status,
                paymentStatus: "completed",
                ride
              });
              io.to(String(rideId)).emit("ride-payment-confirmed", {
                rideId: String(rideId),
                paymentStatus: "completed",
                amount: amountValue
              });
            }

            await PaymentWebhookEvent.create({
              transactionId,
              event: "payment.confirmed",
              userId: ride.clientId,
              amount: amountValue,
              status: "processed",
              rawPayload: { gateway: "stripe", kind: "ride_payment", rideId, driverId, type: event.type },
              processedAt: new Date(),
            });
          }
          return res.json({ received: true, status: "ride_payment_processed" });
        }

        const account = pi.metadata?.account === "driver_balance" ? "driver_balance" : "wallet";

        // Idempotência: já confirmado?
        const exists = await PaymentWebhookEvent.findOne({ transactionId, event: "payment.confirmed" }).select("_id");
        if (exists?._id) return res.json({ received: true, status: "already_processed" });

        if (userId && amountValue > 0) {
          const user = await User.findById(userId);
          if (user) {
            if (!canUseDepositAccount(user, account)) {
              await PaymentWebhookEvent.create({
                transactionId,
                event: "payment.confirmed",
                userId: user._id,
                amount: amountValue,
                status: "acknowledged",
                rawPayload: { gateway: "stripe", account, type: event.type, ignored: "invalid_account_for_user" },
                processedAt: new Date(),
              });
              return res.json({ received: true, status: "ignored_invalid_account" });
            }
            const receiptUrl = pi.charges?.data?.[0]?.receipt_url || null;
            const credited = creditDepositToAccount(user, account, amountValue, {
              referenceId: transactionId,
              description: `Recarga via ${pi.payment_method_types?.[0] || "Stripe"}`,
              receiptUrl,
            });
            if (credited && account === "wallet") {
              await walletEscrow.settlePendingDebt(user);
            }
            await user.save();
            await PaymentWebhookEvent.create({
              transactionId,
              event: "payment.confirmed",
              userId: user._id,
              amount: amountValue,
              status: "processed",
              rawPayload: { gateway: "stripe", account, type: event.type },
              processedAt: new Date(),
            });
          }
        }
      }
      return res.json({ received: true });
    } catch (error) {
      console.error("[Stripe webhook] Erro ao processar:", error.message);
      return res.status(500).send("Erro ao processar webhook");
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

  /**
   * Cria um PaymentIntent no Stripe
   */
  async createStripeIntent(req, res) {
    try {
      const { amount, currency } = req.body || {};
      const amountValue = Number(amount);
      const currencyCode = String(currency || "brl").toLowerCase();

      if (!stripe) {
        return sendError(res, 501, "Stripe não configurado no servidor");
      }

      if (!amountValue || amountValue <= 0) {
        return sendError(res, 400, "Valor do depósito inválido");
      }

      const user = await User.findById(req.user.id).select("name email");
      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountValue,
        currency: currencyCode,
        payment_method_types: ["card"],
        metadata: {
          userId: String(user._id),
          purpose: "levapay_topup",
        },
      });

      // Registrar o evento pendente
      await PaymentWebhookEvent.create({
        transactionId: paymentIntent.id,
        event: "payment.pending",
        userId: user._id,
        amount: toMoney(amountValue / 100),
        status: "acknowledged",
        rawPayload: { method: "stripe_card", paymentIntentId: paymentIntent.id }
      });

      return res.json({
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        amount: paymentIntent.amount,
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || null
      });
    } catch (error) {
      console.error("Erro ao criar PaymentIntent Stripe:", error);
      return sendError(res, 500, "Erro ao criar PaymentIntent");
    }
  }

  /**
   * Confirma o depósito via Stripe e credita na carteira
   */
  async confirmStripePayment(req, res) {
    try {
      const { paymentIntentId } = req.body || {};
      if (!paymentIntentId) {
        return sendError(res, 400, "paymentIntentId é obrigatório");
      }

      if (!stripe) {
        return sendError(res, 501, "Stripe não configurado no servidor");
      }

      // 1. Procurar se já foi confirmado no banco local
      const confirmedEvent = await PaymentWebhookEvent.findOne({
        transactionId: paymentIntentId,
        event: "payment.confirmed"
      });

      if (confirmedEvent) {
        const user = await User.findOne({ "wallet.transactions.referenceId": paymentIntentId });
        const txn = user?.wallet?.transactions?.find((t) => String(t.referenceId || "") === paymentIntentId);
        return res.json({
          success: true,
          paymentIntentId,
          status: "succeeded",
          message: "Depósito já creditado na carteira",
          receiptUrl: txn?.receiptUrl || confirmedEvent.rawPayload?.receiptUrl || null
        });
      }

      // 2. Buscar o intent direto no Stripe
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        return res.json({
          success: true,
          paymentIntentId,
          status: paymentIntent.status,
          message: `O pagamento está em estado: ${paymentIntent.status}`
        });
      }

      // 3. Creditar o valor na carteira do usuário
      const userId = paymentIntent.metadata?.userId;
      if (!userId) {
        return sendError(res, 400, "Metadados do PaymentIntent inválidos (userId ausente)");
      }

      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuário do depósito não encontrado");
      }

      const amountInReais = toMoney(paymentIntent.amount / 100);
      const charge = paymentIntent.charges?.data?.[0];
      const receiptUrl = charge?.receipt_url || null;

      user.wallet = user.wallet || { balance: 0, transactions: [] };
      user.wallet.transactions = user.wallet.transactions || [];

      const alreadySettled = user.wallet.transactions.some(
        (t) => String(t.referenceId || "") === paymentIntentId
      );

      if (!alreadySettled) {
        user.wallet.balance = toMoney((user.wallet.balance || 0) + amountInReais);
        user.wallet.transactions.push({
          type: "topup",
          amount: amountInReais,
          description: "Recarga via cartão de crédito (Stripe)",
          referenceId: paymentIntentId,
          receiptUrl: receiptUrl,
          createdAt: new Date()
        });
        // Quita automaticamente taxa de cancelamento pendente com o novo saldo.
        await walletEscrow.settlePendingDebt(user);
        await user.save();
      }

      // Salvar evento de confirmação no log de webhooks
      await PaymentWebhookEvent.create({
        transactionId: paymentIntentId,
        event: "payment.confirmed",
        userId: user._id,
        amount: amountInReais,
        status: "processed",
        rawPayload: { method: "stripe_card", paymentIntent, receiptUrl },
        processedAt: new Date()
      });

      return res.json({
        success: true,
        paymentIntentId,
        status: "succeeded",
        message: "Depósito creditado com sucesso!",
        receiptUrl: receiptUrl
      });
    } catch (error) {
      console.error("Erro ao confirmar pagamento Stripe:", error);
      return sendError(res, 500, "Erro ao confirmar pagamento Stripe");
    }
  }

  /**
   * Cancela o PaymentIntent no Stripe
   */
  async cancelStripeIntent(req, res) {
    try {
      const { paymentIntentId } = req.body || {};
      if (!paymentIntentId) {
        return sendError(res, 400, "paymentIntentId é obrigatório");
      }

      if (!stripe) {
        return sendError(res, 501, "Stripe não configurado no servidor");
      }

      await stripe.paymentIntents.cancel(paymentIntentId);

      return res.json({
        success: true,
        message: "PaymentIntent cancelado com sucesso"
      });
    } catch (error) {
      console.error("Erro ao cancelar PaymentIntent Stripe:", error);
      return sendError(res, 500, "Erro ao cancelar PaymentIntent");
    }
  }
}

module.exports = new PaymentController();
