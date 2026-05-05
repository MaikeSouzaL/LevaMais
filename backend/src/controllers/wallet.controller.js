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
        $group: {
          _id: null,
          total: { $sum: "$pricing.total" },
        },
      },
    ]);
    const totalEarningsBruto = earningsAgg[0] ? earningsAgg[0].total : 0;
    // Driver gets 80% (MVP rule)
    const totalEarnings = totalEarningsBruto * 0.8;

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
      totalWithdrawn,
      available: totalEarnings - totalWithdrawn,
    };
  }

  // Solicitar saque
  async withdraw(req, res) {
    try {
      const userId = req.user.id;
      const { amount, pixKey, pixKeyType } = req.body;

      if (!amount || amount <= 0) {
        return sendError(res, 400, "Valor invalido");
      }
      if (!pixKey) {
        return sendError(res, 400, "Chave PIX obrigatoria");
      }

      // Verificar saldo
      const balance = await WalletController._calculateBalance(userId);
      if (balance.available < amount) {
        return sendError(res, 400, "Saldo insuficiente", {
          available: balance.available,
        });
      }

      // Criar saque
      const withdrawal = await Withdrawal.create({
        userId,
        amount,
        pixKey,
        pixKeyType,
        status: "pending",
      });

      return res.status(201).json({
        message: "Solicitacao de saque realizada",
        withdrawal,
        newBalance: balance.available - amount,
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
        amount: (r.pricing?.total || 0) * 0.8,
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
      const numericPage = Number(page) || 1;
      const numericLimit = Number(limit) || 50;
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
