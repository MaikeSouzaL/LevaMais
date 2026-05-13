const Ride = require("../models/Ride");
const Withdrawal = require("../models/Withdrawal");
const User = require("../models/User");
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
}

module.exports = new WalletController();
