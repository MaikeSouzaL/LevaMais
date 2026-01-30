const Ride = require("../models/Ride");
const Withdrawal = require("../models/Withdrawal");
const mongoose = require("mongoose");

class WalletController {
  // Calcular saldo disponível
  async getBalance(req, res) {
    try {
      const userId = req.user.id;
      const balance = await WalletController._calculateBalance(userId);
      res.json(balance);
    } catch (error) {
      console.error("Erro ao buscar saldo:", error);
      res.status(500).json({ error: "Erro ao buscar saldo" });
    }
  }

  // Método auxiliar reutilizável
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

    // 2. Total sacado (considerando pending e paid como "saiu" do saldo disponível)
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
        return res.status(400).json({ error: "Valor inválido" });
      }
      if (!pixKey) {
        return res.status(400).json({ error: "Chave PIX obrigatória" });
      }

      // Verificar saldo
      const balance = await WalletController._calculateBalance(userId);
      if (balance.available < amount) {
        return res.status(400).json({ 
            error: "Saldo insuficiente", 
            available: balance.available 
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

      res.status(201).json({
        message: "Solicitação de saque realizada",
        withdrawal,
        newBalance: balance.available - amount
      });

    } catch (error) {
      console.error("Erro ao solicitar saque:", error);
      res.status(500).json({ error: "Erro ao solicitar saque" });
    }
  }

  // Extrato Unificado
  async getStatement(req, res) {
    try {
      const userId = req.user.id;
      const userObjectId = new mongoose.Types.ObjectId(userId);
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

      // Buscar Saques (Saídas)
      const withdrawals = await Withdrawal.find({
        userId: userId,
      })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

      // Normalizar e mergear
      const entries = rides.map(r => ({
        _id: r._id,
        type: 'ride',
        amount: (r.pricing?.total || 0) * 0.8,
        date: r.completedAt,
        description: `Corrida finalizada`,
        status: 'completed'
      }));

      const exits = withdrawals.map(w => ({
        _id: w._id,
        type: 'withdrawal',
        amount: -w.amount, // Negativo para exibir vermelho
        date: w.createdAt,
        description: 'Saque via PIX',
        status: w.status
      }));

      const all = [...entries, ...exits].sort((a, b) => {
        return new Date(b.date) - new Date(a.date);
      });

      // Paginação simples em memória (MVP)
      const startIndex = (page - 1) * limit;
      const paginated = all.slice(startIndex, startIndex + Number(limit));

      res.json(paginated);

    } catch (error) {
        console.error("Erro ao buscar extrato:", error);
        res.status(500).json({ error: "Erro ao buscar extrato" });
    }
  }
}

module.exports = new WalletController();
