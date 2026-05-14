const User = require("../models/User");
const Withdrawal = require("../models/Withdrawal");

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

function inferPixKeyType(pixKey) {
  const value = String(pixKey || "").trim();
  if (value.includes("@")) return "email";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return "cpf";
  if (digits.length >= 10 && digits.length <= 13) return "phone";
  return "random";
}

function isValidPixKey(pixKey) {
  const value = String(pixKey || "").trim();
  if (!value) return false;
  if (value.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(value);
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 || (digits.length >= 10 && digits.length <= 13) || value.length >= 8;
}

function parseAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return toMoney(numeric);
}

function normalizePositiveInteger(value, fallback, options = {}) {
  const { min = 0, max = 100 } = options;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(parsed)));
}

function mapWithdrawal(withdrawal) {
  return {
    id: String(withdrawal._id),
    amount: toMoney(withdrawal.amount),
    pixKey: withdrawal.pixKey,
    pixKeyType: withdrawal.pixKeyType,
    status: withdrawal.status,
    createdAt: withdrawal.createdAt,
    scheduledFor: withdrawal.scheduledFor,
    completedAt: withdrawal.processedAt,
    failureReason: withdrawal.rejectionReason,
    transactionId: withdrawal.transactionId,
  };
}

class WithdrawController {
  async getBalance(req, res) {
    try {
      const user = await User.findById(req.user.id).select("userType driverBalance");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");
      if (user.userType !== "driver") return sendError(res, 403, "Usuario nao e um motorista");

      const ledger = user.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        transactions: [],
      };

      const pendingWithdrawals = (ledger.transactions || [])
        .filter((transaction) => transaction.type === "withdrawal" && transaction.status === "pending")
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      const totalWithdrawn = (ledger.transactions || [])
        .filter(
          (transaction) =>
            transaction.type === "withdrawal" && transaction.status !== "failed",
        )
        .reduce((sum, transaction) => sum + Number(transaction.amount || 0), 0);

      return res.json({
        success: true,
        balance: {
          available: toMoney(ledger.balance || 0),
          totalEarnings: toMoney(ledger.totalDeposits || 0),
          totalWithdrawn: toMoney(totalWithdrawn),
          pending: toMoney(pendingWithdrawals),
        },
      });
    } catch (error) {
      console.error("Erro ao buscar saldo de saque:", error);
      return sendError(res, 500, "Erro ao buscar saldo");
    }
  }

  async request(req, res) {
    try {
      const amountValue = parseAmount(req.body?.amount);
      const pixKey = String(req.body?.pixKey || "").trim();
      const pixKeyType =
        normalizePixKeyType(req.body?.pixKeyType) || inferPixKeyType(pixKey);

      if (!amountValue) return sendError(res, 400, "Valor invalido");
      if (!isValidPixKey(pixKey)) return sendError(res, 400, "Chave PIX invalida");

      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");
      if (user.userType !== "driver") return sendError(res, 403, "Usuario nao e um motorista");

      user.driverBalance = user.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
        selectedCategories: [],
        selectedVehicles: [],
      };

      if (toMoney(user.driverBalance.balance || 0) < amountValue) {
        return sendError(res, 400, "Saldo insuficiente", {
          available: toMoney(user.driverBalance.balance || 0),
        });
      }

      user.driverBalance.balance = toMoney(user.driverBalance.balance - amountValue);
      user.driverBalance.transactions.push({
        type: "withdrawal",
        amount: amountValue,
        description: `Saque de R$ ${amountValue.toFixed(2)}`,
        pixKey,
        status: "pending",
        createdAt: new Date(),
      });

      const withdrawal = await Withdrawal.create({
        userId: req.user.id,
        amount: amountValue,
        pixKey,
        pixKeyType,
        status: "pending",
        notes: String(req.body?.notes || "").trim() || undefined,
      });

      await user.save();

      return res.status(201).json({
        success: true,
        withdraw: mapWithdrawal(withdrawal),
        balance: {
          available: toMoney(user.driverBalance.balance || 0),
        },
      });
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      return sendError(res, 500, "Erro ao solicitar saque");
    }
  }

  async schedule(req, res) {
    try {
      const scheduledFor = req.body?.scheduledFor ? new Date(req.body.scheduledFor) : null;
      if (!scheduledFor || Number.isNaN(scheduledFor.getTime())) {
        return sendError(res, 400, "Data de agendamento invalida");
      }

      req.body = {
        ...req.body,
        scheduledFor,
      };

      const amountValue = parseAmount(req.body?.amount);
      const pixKey = String(req.body?.pixKey || "").trim();
      const pixKeyType =
        normalizePixKeyType(req.body?.pixKeyType) || inferPixKeyType(pixKey);

      if (!amountValue) return sendError(res, 400, "Valor invalido");
      if (!isValidPixKey(pixKey)) return sendError(res, 400, "Chave PIX invalida");

      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");
      if (user.userType !== "driver") return sendError(res, 403, "Usuario nao e um motorista");

      user.driverBalance = user.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
        selectedCategories: [],
        selectedVehicles: [],
      };

      if (toMoney(user.driverBalance.balance || 0) < amountValue) {
        return sendError(res, 400, "Saldo insuficiente", {
          available: toMoney(user.driverBalance.balance || 0),
        });
      }

      user.driverBalance.balance = toMoney(user.driverBalance.balance - amountValue);
      user.driverBalance.transactions.push({
        type: "withdrawal",
        amount: amountValue,
        description: `Saque agendado para ${scheduledFor.toISOString()}`,
        pixKey,
        status: "pending",
        createdAt: new Date(),
      });

      const withdrawal = await Withdrawal.create({
        userId: req.user.id,
        amount: amountValue,
        pixKey,
        pixKeyType,
        status: "pending",
        scheduledFor,
        notes: String(req.body?.notes || "").trim() || undefined,
      });

      await user.save();

      return res.status(201).json({
        success: true,
        withdraw: mapWithdrawal(withdrawal),
      });
    } catch (error) {
      console.error("Erro ao agendar saque:", error);
      return sendError(res, 500, "Erro ao agendar saque");
    }
  }

  async history(req, res) {
    try {
      const limit = normalizePositiveInteger(req.query?.limit, 20, { min: 1, max: 100 });
      const offset = normalizePositiveInteger(req.query?.offset, 0, { min: 0, max: 10000 });

      const withdrawals = await Withdrawal.find({ userId: req.user.id })
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      return res.json({
        success: true,
        withdraws: withdrawals.map(mapWithdrawal),
      });
    } catch (error) {
      console.error("Erro ao buscar historico de saques:", error);
      return sendError(res, 500, "Erro ao buscar historico");
    }
  }

  async getById(req, res) {
    try {
      const withdrawal = await Withdrawal.findOne({
        _id: req.params.withdrawId,
        userId: req.user.id,
      });

      if (!withdrawal) return sendError(res, 404, "Saque nao encontrado");

      return res.json({
        success: true,
        withdraw: mapWithdrawal(withdrawal),
      });
    } catch (error) {
      console.error("Erro ao buscar saque:", error);
      return sendError(res, 500, "Erro ao buscar saque");
    }
  }

  async cancel(req, res) {
    try {
      const withdrawal = await Withdrawal.findOne({
        _id: req.params.withdrawId,
        userId: req.user.id,
      });

      if (!withdrawal) return sendError(res, 404, "Saque nao encontrado");
      if (withdrawal.status !== "pending") {
        return sendError(res, 400, "Somente saques pendentes podem ser cancelados");
      }

      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      user.driverBalance = user.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
        selectedCategories: [],
        selectedVehicles: [],
      };

      const ledgerItem = (user.driverBalance.transactions || []).find(
        (transaction) =>
          transaction.type === "withdrawal" &&
          transaction.status === "pending" &&
          String(transaction.pixKey || "") === String(withdrawal.pixKey || "") &&
          toMoney(transaction.amount) === toMoney(withdrawal.amount),
      );

      if (ledgerItem) {
        ledgerItem.status = "failed";
        ledgerItem.description = "Saque cancelado pelo motorista";
      }

      user.driverBalance.balance = toMoney(
        Number(user.driverBalance.balance || 0) + Number(withdrawal.amount || 0),
      );

      withdrawal.status = "rejected";
      withdrawal.rejectionReason = "Cancelado pelo motorista";
      withdrawal.processedAt = new Date();
      withdrawal.cancelledAt = new Date();

      await user.save();
      await withdrawal.save();

      return res.json({
        success: true,
        message: "Saque cancelado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao cancelar saque:", error);
      return sendError(res, 500, "Erro ao cancelar saque");
    }
  }

  async validatePix(req, res) {
    const pixKey = String(req.body?.pixKey || "").trim();
    return res.json({
      valid: isValidPixKey(pixKey),
      accountHolder: pixKey ? "Titular validacao local" : undefined,
    });
  }

  async limits(req, res) {
    return res.json({
      success: true,
      limits: {
        minAmount: 10,
        maxAmount: 10000,
        dailyLimit: 5000,
        monthlyLimit: 50000,
        remainingDaily: 5000,
        remainingMonthly: 50000,
      },
    });
  }
}

module.exports = new WithdrawController();
