const Ride = require("../models/Ride");
const Withdrawal = require("../models/Withdrawal");
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
  if (["cpf", "email", "phone", "random"].includes(type)) return type;
  return null;
}

function parseAmount(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return toMoney(numeric);
}

function getDriverNetValueFromRide(ride) {
  const pricing = ride?.pricing || {};
  const driverValue = Number(pricing.driverValue);

  if (Number.isFinite(driverValue) && driverValue > 0) {
    return toMoney(driverValue);
  }

  const total = Number(pricing.total);
  if (Number.isFinite(total) && total > 0) {
    return toMoney(total * 0.8);
  }

  return 0;
}

class WalletController {
  // Calcular saldo disponivel
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

  // Metodo auxiliar reutilizavel
  static async _calculateBalance(userId) {
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // 1. Total ganho em corridas (completed)
    const earningsAgg = await Ride.aggregate([
      {
        $match: {
          driverId: userObjectId,
          status: "completed",
        },
      },
      {
        $project: {
          rideNetValue: {
            $cond: [
              { $gt: [{ $ifNull: ["$pricing.driverValue", 0] }, 0] },
              "$pricing.driverValue",
              {
                $multiply: [{ $ifNull: ["$pricing.total", 0] }, 0.8],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$rideNetValue" },
        },
      },
    ]);

    const totalEarnings = toMoney(earningsAgg[0]?.total || 0);

    // 2. Total sacado (considerando pending e paid como "saiu" do saldo disponivel)
    const withdrawalsAgg = await Withdrawal.aggregate([
      {
        $match: {
          userId: userObjectId,
          status: { $in: ["pending", "processing", "paid"] },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$amount" },
        },
      },
    ]);
    const totalWithdrawn = withdrawalsAgg[0] ? withdrawalsAgg[0].total : 0;

    return {
      totalEarnings,
      totalWithdrawn: toMoney(totalWithdrawn),
      available: toMoney(totalEarnings - totalWithdrawn),
    };
  }

  // Solicitar saque
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

      // Verificar saldo
      const balance = await WalletController._calculateBalance(userId);
      if (balance.available < amountValue) {
        return sendError(res, 400, "Saldo insuficiente", {
          available: balance.available,
        });
      }

      // Criar saque
      const withdrawal = await Withdrawal.create({
        userId,
        amount: amountValue,
        pixKey: pixKeyValue,
        pixKeyType: pixTypeValue,
        status: "pending",
      });

      return res.status(201).json({
        message: "Solicitacao de saque realizada",
        withdrawal,
        newBalance: toMoney(balance.available - amountValue),
      });
    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      return sendError(res, 500, "Erro ao solicitar saque");
    }
  }

  // Extrato Unificado
  async getStatement(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 50, page = 1 } = req.query;

      // Buscar Corridas (Entradas)
      const rides = await Ride.find({
        driverId: userId,
        status: "completed",
      })
        .select("pricing completedAt pickup dropoff")
        .sort({ completedAt: -1 })
        .limit(100) // limit hardcoded for merge logic MVP
        .lean();

      // Buscar Saques (Saidas)
      const withdrawals = await Withdrawal.find({ userId })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      // Normalizar e mergear
      const entries = rides.map((r) => ({
        _id: r._id,
        type: "ride",
        amount: getDriverNetValueFromRide(r),
        date: r.completedAt,
        description: "Corrida finalizada",
        status: "completed",
      }));

      const exits = withdrawals.map((w) => ({
        _id: w._id,
        type: "withdrawal",
        amount: -w.amount,
        date: w.createdAt,
        description: "Saque via PIX",
        status: w.status,
      }));

      const all = [...entries, ...exits].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      // Paginacao simples em memoria (MVP)
      const numericPage = Math.max(1, Number(page) || 1);
      const numericLimit = Math.min(100, Math.max(1, Number(limit) || 50));
      const startIndex = (numericPage - 1) * numericLimit;
      const paginated = all.slice(startIndex, startIndex + numericLimit);

      return res.json(paginated);
    } catch (error) {
      console.error("Erro ao buscar extrato:", error);
      return sendError(res, 500, "Erro ao buscar extrato");
    }
  }
}

module.exports = new WalletController();
