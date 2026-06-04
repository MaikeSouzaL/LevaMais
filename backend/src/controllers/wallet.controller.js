const Ride = require("../models/Ride");
const RideHistory = require("../models/RideHistory");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
const PaymentWebhookEvent = require("../models/PaymentWebhookEvent");
const mongoose = require("mongoose");

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

function normalizePixKeyType(value) {
  const type = String(value || "")
    .trim()
    .toLowerCase();
  if (!type) return "cpf";
  if (type === "evp") return "random";
  if (["cpf", "email", "phone", "random"].includes(type)) return type;
  return null;
}

function parseAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return toMoney(numeric);
}

function normalizePositiveInteger(value, fallback, options = {}) {
  const { min = 1, max = 100 } = options;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

class WalletController {
  // Calcular saldo disponivel unificado (pré-pago)
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      const balance = await WalletController._calculateBalance(userId);
      return res.json(balance);
    } catch (error) {
      console.error("Erro ao buscar saldo:", error);
      return sendError(res, 500, "Erro ao buscar saldo");
    }
  }

  // Metodo auxiliar unificado
  static async _calculateBalance(userId) {
    const user = await User.findById(userId).select("driverBalance");
    if (!user) {
      return { totalEarnings: 0, totalWithdrawn: 0, available: 0 };
    }

    const db = user.driverBalance || {
      balance: 0,
      totalDeposits: 0,
      totalDeductions: 0,
      transactions: [],
    };

    // Calcula saques ativos no ledger para totalWithdrawn
    const totalWithdrawn = (db.transactions || [])
      .filter((t) => t.type === "withdrawal" && t.status !== "failed")
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      totalEarnings: toMoney(db.totalDeposits),
      totalWithdrawn: toMoney(totalWithdrawn),
      available: toMoney(db.balance),
    };
  }

  // Solicitar saque da carteira pré-paga
  async withdraw(req, res) {
    try {
      const userId = req.user.id;
      const { amount, pixKey, pixKeyType } = req.body;
      const amountValue = parseAmount(amount);
      const pixKeyValue = String(pixKey || "").trim();
      const pixTypeValue = normalizePixKeyType(pixKeyType);

      if (!amountValue) {
        return sendError(res, 400, "Valor invalido");
      }
      if (!pixKeyValue) {
        return sendError(res, 400, "Chave PIX obrigatoria");
      }
      if (pixKeyValue.length > 120) {
        return sendError(res, 400, "Chave PIX invalida");
      }
      if (!pixTypeValue) {
        return sendError(res, 400, "Tipo de chave PIX invalido");
      }

      // 1. Consultar Usuário para manipulação de saldo
      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      if (!user.driverBalance) {
        user.driverBalance = {
          balance: 0,
          totalDeposits: 0,
          totalDeductions: 0,
          transactions: [],
        };
      }

      if (user.driverBalance.balance < amountValue) {
        return sendError(res, 400, "Saldo insuficiente", {
          available: user.driverBalance.balance,
        });
      }

      // 2. Debitar e registrar transação no ledger
      user.driverBalance.balance = toMoney(user.driverBalance.balance - amountValue);
      user.driverBalance.transactions.push({
        type: "withdrawal",
        amount: amountValue,
        description: `Saque de R$ ${amountValue.toFixed(2)}`,
        pixKey: pixKeyValue,
        status: "pending",
        createdAt: new Date(),
      });

      await user.save();

      // 3. Criar documento de Saque independente para compatibilidade com Painel Admin
      const withdrawal = await Withdrawal.create({
        userId,
        amount: amountValue,
        pixKey: pixKeyValue,
        pixKeyType: pixTypeValue,
        status: "pending",
      });

      // 4. Emitir Websocket para sincronização em tempo real do app
      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${userId}`).emit("balance_updated", {
          balance: user.driverBalance.balance,
          totalDeposits: user.driverBalance.totalDeposits,
          totalDeductions: user.driverBalance.totalDeductions,
        });
      }

      return res.status(201).json({
        message: "Solicitacao de saque realizada",
        withdrawal,
        newBalance: user.driverBalance.balance,
      });
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      return sendError(res, 500, "Erro ao solicitar saque");
    }
  }

  // Extrato Unificado a partir do Ledger da Carteira
  async getStatement(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, page = 1 } = req.query;
      const numericPage = normalizePositiveInteger(page, 1, { min: 1, max: 100000 });
      const numericLimit = normalizePositiveInteger(limit, 50, { min: 1, max: 100 });

      const user = await User.findById(userId).select("driverBalance");
      if (!user) {
        return res.json({
          items: [],
          pagination: {
            page: numericPage,
            limit: numericLimit,
            total: 0,
            totalPages: 1,
            hasNext: false,
          },
        });
      }

      const transactions = user.driverBalance?.transactions || [];

      // Mapear transações ledger para o formato uniformizado esperado pelo Extrato do frontend
      const all = transactions
        .map((t) => {
          const isPositive = t.type === "deposit";
          return {
            _id: t._id || new mongoose.Types.ObjectId(),
            type: t.type === "withdrawal" ? "withdrawal" : "ride",
            amount: isPositive ? t.amount : -t.amount,
            date: t.createdAt,
            description:
              t.description ||
              (t.type === "deposit"
                ? "Depósito Pix"
                : t.type === "deduction"
                ? "Dedução de Corrida"
                : "Saque via Pix"),
            status: t.status || "completed",
          };
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));

      // Paginação simples
      const startIndex = (numericPage - 1) * numericLimit;
      const items = all.slice(startIndex, startIndex + numericLimit);
      const total = all.length;
      const totalPages = Math.max(1, Math.ceil(total / numericLimit));

      return res.json({
        items,
        pagination: {
          page: numericPage,
          limit: numericLimit,
          total,
          totalPages,
          hasNext: numericPage < totalPages,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar extrato:", error);
      return sendError(res, 500, "Erro ao buscar extrato");
    }
  }

  /**
   * Conciliação financeira da plataforma (ADMIN). Resumo de entradas, saídas,
   * receita (comissões + parte de cancelamento), saldo retido e dívidas.
   * Query: from, to (ISO). Padrão: últimos 30 dias.
   */
  async getFinancialReconciliation(req, res) {
    try {
      const to = req.query.to ? new Date(String(req.query.to)) : new Date();
      const from = req.query.from
        ? new Date(String(req.query.from))
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return sendError(res, 400, "Período inválido (use from/to ISO).");
      }

      const completedMatch = { status: "completed", completedAt: { $gte: from, $lte: to } };
      const ridesAgg = [
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            gmv: { $sum: { $ifNull: ["$pricing.total", 0] } },
            platformFee: { $sum: { $ifNull: ["$pricing.platformFee", 0] } },
            driverValue: { $sum: { $ifNull: ["$pricing.driverValue", 0] } },
          },
        },
      ];

      const cancelMatch = {
        cancelledAt: { $gte: from, $lte: to },
        "cancellationFee.amount": { $gt: 0 },
      };
      const cancelAgg = [
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            feeTotal: { $sum: { $ifNull: ["$cancellationFee.amount", 0] } },
            platformShare: { $sum: { $ifNull: ["$cancellationFee.platformShare", 0] } },
            driverShare: { $sum: { $ifNull: ["$cancellationFee.driverShare", 0] } },
          },
        },
      ];

      const sumAgg = (rows) => (rows && rows[0]) || {};

      const [ridesR, ridesH, cancelR, cancelH, deposits, withdrawalsByStatus, heldAgg, debtAgg] =
        await Promise.all([
          Ride.aggregate([{ $match: completedMatch }, ...ridesAgg]),
          RideHistory.aggregate([{ $match: completedMatch }, ...ridesAgg]),
          Ride.aggregate([{ $match: cancelMatch }, ...cancelAgg]),
          RideHistory.aggregate([{ $match: cancelMatch }, ...cancelAgg]),
          PaymentWebhookEvent.aggregate([
            { $match: { event: "payment.confirmed", processedAt: { $gte: from, $lte: to } } },
            { $group: { _id: null, count: { $sum: 1 }, total: { $sum: { $ifNull: ["$amount", 0] } } } },
          ]),
          Withdrawal.aggregate([
            { $match: { createdAt: { $gte: from, $lte: to } } },
            { $group: { _id: "$status", count: { $sum: 1 }, total: { $sum: { $ifNull: ["$amount", 0] } } } },
          ]),
          User.aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ["$wallet.held", 0] } } } }]),
          User.aggregate([{ $group: { _id: null, total: { $sum: { $ifNull: ["$pendingDebt", 0] } } } }]),
        ]);

      const rc = sumAgg(ridesR);
      const rh = sumAgg(ridesH);
      const cc = sumAgg(cancelR);
      const ch = sumAgg(cancelH);

      const completed = {
        count: (rc.count || 0) + (rh.count || 0),
        gmv: toMoney((rc.gmv || 0) + (rh.gmv || 0)),
        platformCommission: toMoney((rc.platformFee || 0) + (rh.platformFee || 0)),
        driverEarnings: toMoney((rc.driverValue || 0) + (rh.driverValue || 0)),
      };
      const cancellations = {
        count: (cc.count || 0) + (ch.count || 0),
        feeTotal: toMoney((cc.feeTotal || 0) + (ch.feeTotal || 0)),
        platformShare: toMoney((cc.platformShare || 0) + (ch.platformShare || 0)),
        driverShare: toMoney((cc.driverShare || 0) + (ch.driverShare || 0)),
      };
      const depositsSummary = {
        count: sumAgg(deposits).count || 0,
        total: toMoney(sumAgg(deposits).total || 0),
      };
      const withdrawals = withdrawalsByStatus.map((w) => ({
        status: w._id,
        count: w.count,
        total: toMoney(w.total),
      }));
      const platformRevenue = toMoney(completed.platformCommission + cancellations.platformShare);

      return res.json({
        success: true,
        period: { from, to },
        completed,
        cancellations,
        deposits: depositsSummary,
        withdrawals,
        platformRevenue,
        snapshot: {
          escrowHeld: toMoney(sumAgg(heldAgg).total || 0),
          pendingClientDebt: toMoney(sumAgg(debtAgg).total || 0),
        },
      });
    } catch (error) {
      console.error("Erro na conciliação financeira:", error);
      return sendError(res, 500, "Erro ao gerar conciliação financeira", { details: error.message });
    }
  }
}

module.exports = new WalletController();
