const User = require("../models/User");

function normalizeServiceTypes(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return null;

  const normalized = [...new Set(raw.map((item) => String(item || "").trim().toLowerCase()))]
    .filter((item) => ["ride", "delivery"].includes(item));

  return normalized.length ? normalized : null;
}

function normalizeSelectedVehicles(raw) {
  if (raw === undefined || raw === null) return undefined;
  if (!Array.isArray(raw)) return null;

  const normalized = [...new Set(raw.map((item) => String(item || "").trim().toLowerCase()))]
    .filter((item) => ["motorcycle", "car", "van", "truck"].includes(item));

  return normalized.length ? normalized : null;
}

const driverController = {
  getBalanceHistory: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const limitRaw = Number(req.query?.limit);
      const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(Math.floor(limitRaw), 1), 200) : 50;

      const user = await User.findById(userId).select("userType driverBalance");
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const transactions = Array.isArray(user.driverBalance?.transactions)
        ? user.driverBalance.transactions
        : [];

      const sorted = [...transactions].sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();
        const bTime = new Date(b?.createdAt || 0).getTime();
        return bTime - aTime;
      });

      const items = sorted.slice(0, limit).map((t) => ({
        id: String(t?._id || ""),
        type: t?.type || "deduction",
        amount: Number(t?.amount || 0),
        reason: t?.description || "",
        rideId: t?.rideId ? String(t.rideId) : undefined,
        createdAt: t?.createdAt || null,
        status: t?.status || "completed",
      }));

      return res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Get driver balance
  getBalance: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const balance = user.driverBalance || {
        balance: 0,
        totalDeposits: 0,
        totalDeductions: 0,
        transactions: [],
      };

      res.json({
        success: true,
        data: balance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add deposit
  addDeposit: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { amount } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor de depósito inválido" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      // Initialize driverBalance if not exists
      if (!user.driverBalance) {
        user.driverBalance = {
          balance: 0,
          totalDeposits: 0,
          totalDeductions: 0,
          transactions: [],
        };
      }

      // Add deposit
      user.driverBalance.balance += amount;
      user.driverBalance.totalDeposits += amount;
      user.driverBalance.transactions.push({
        type: "deposit",
        amount: amount,
        description: `Depósito de R$ ${amount.toFixed(2)}`,
        status: "completed",
        createdAt: new Date(),
      });

      await user.save();

      // Emit websocket event
      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${userId}`).emit("balance_updated", {
          balance: user.driverBalance.balance,
          totalDeposits: user.driverBalance.totalDeposits,
          totalDeductions: user.driverBalance.totalDeductions,
        });
      }

      res.json({
        success: true,
        message: "Depósito realizado com sucesso",
        data: user.driverBalance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Deduct balance (when ride is completed)
  deductBalance: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { amount, rideId, deductionPercentage = 0.2 } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor de dedução inválido" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      // Initialize driverBalance if not exists
      if (!user.driverBalance) {
        user.driverBalance = {
          balance: 0,
          totalDeposits: 0,
          totalDeductions: 0,
          transactions: [],
        };
      }

      const deductAmount = amount * deductionPercentage;

      // Check if has sufficient balance
      if (user.driverBalance.balance < deductAmount) {
        return res.status(400).json({
          error: "Saldo insuficiente",
          required: deductAmount,
          available: user.driverBalance.balance,
        });
      }

      // Deduct balance
      user.driverBalance.balance -= deductAmount;
      user.driverBalance.totalDeductions += deductAmount;
      user.driverBalance.transactions.push({
        type: "deduction",
        amount: deductAmount,
        description: `Dedução de 20% da corrida (R$ ${amount.toFixed(2)})`,
        rideId: rideId,
        status: "completed",
        createdAt: new Date(),
      });

      await user.save();

      // Emit websocket event
      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${userId}`).emit("balance_updated", {
          balance: user.driverBalance.balance,
          totalDeposits: user.driverBalance.totalDeposits,
          totalDeductions: user.driverBalance.totalDeductions,
        });
      }

      res.json({
        success: true,
        message: "Saldo debitado com sucesso",
        data: user.driverBalance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Check if driver can accept ride
  canAcceptRide: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { rideValue } = req.body;

      if (!rideValue || rideValue <= 0) {
        return res.status(400).json({ error: "Valor da corrida inválido" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const balance = user.driverBalance?.balance || 0;
      // Need to have at least the ride value as 20% will be deducted
      const requiredBalance = rideValue * 0.2;
      const canAccept = balance >= requiredBalance;

      res.json({
        success: true,
        canAccept: canAccept,
        currentBalance: balance,
        requiredBalance: requiredBalance,
        rideValue: rideValue,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Request withdrawal
  requestWithdrawal: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { amount, pixKey } = req.body;

      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Valor de saque inválido" });
      }

      if (!pixKey || !pixKey.trim()) {
        return res.status(400).json({ error: "Chave PIX obrigatória" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      // Initialize driverBalance if not exists
      if (!user.driverBalance) {
        user.driverBalance = {
          balance: 0,
          totalDeposits: 0,
          totalDeductions: 0,
          transactions: [],
        };
      }

      if (user.driverBalance.balance < amount) {
        return res.status(400).json({
          error: "Saldo insuficiente",
          required: amount,
          available: user.driverBalance.balance,
        });
      }

      // Create withdrawal request
      user.driverBalance.balance -= amount;
      user.driverBalance.transactions.push({
        type: "withdrawal",
        amount: amount,
        description: `Saque de R$ ${amount.toFixed(2)}`,
        pixKey: pixKey,
        status: "pending",
        createdAt: new Date(),
      });

      await user.save();

      // Emit websocket event
      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${userId}`).emit("balance_updated", {
          balance: user.driverBalance.balance,
          totalDeposits: user.driverBalance.totalDeposits,
          totalDeductions: user.driverBalance.totalDeductions,
        });
      }

      res.json({
        success: true,
        message: "Solicitação de saque criada. Será processada em até 2 dias úteis.",
        data: user.driverBalance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  updateDriverPreferences: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { serviceTypes, selectedVehicles, searchRadiusKm, autoAccept } = req.body || {};

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      if (!user.driverPreferences) {
        user.driverPreferences = {
          serviceTypes: ["ride", "delivery"],
          selectedVehicles: user.vehicleType ? [user.vehicleType] : [],
          searchRadiusKm: 15,
          autoAccept: false,
        };
      }

      const normalizedServiceTypes = normalizeServiceTypes(serviceTypes);
      if (normalizedServiceTypes === null) {
        return res.status(400).json({ error: "Tipos de serviço inválidos" });
      }

      const normalizedSelectedVehicles = normalizeSelectedVehicles(selectedVehicles);
      if (normalizedSelectedVehicles === null) {
        return res.status(400).json({ error: "Veículos selecionados inválidos" });
      }

      if (normalizedServiceTypes) {
        user.driverPreferences.serviceTypes = normalizedServiceTypes;
      }

      if (normalizedSelectedVehicles) {
        user.driverPreferences.selectedVehicles = normalizedSelectedVehicles;
      } else if (
        normalizedSelectedVehicles === undefined &&
        (!user.driverPreferences.selectedVehicles || !user.driverPreferences.selectedVehicles.length) &&
        user.vehicleType
      ) {
        user.driverPreferences.selectedVehicles = [user.vehicleType];
      }

      if (searchRadiusKm !== undefined && searchRadiusKm !== null) {
        const radius = Number(searchRadiusKm);
        if (!Number.isFinite(radius) || radius < 1 || radius > 300) {
          return res.status(400).json({ error: "Raio de busca inválido" });
        }
        user.driverPreferences.searchRadiusKm = radius;
      }

      if (autoAccept !== undefined) {
        user.driverPreferences.autoAccept = Boolean(autoAccept);
      }

      await user.save();

      return res.json({
        success: true,
        message: "Preferências atualizadas com sucesso",
        data: user.driverPreferences,
      });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  },

  // Go online (check if has balance)
  goOnline: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const balance = user.driverBalance?.balance || 0;

      if (balance <= 0) {
        return res.status(400).json({
          error: "Saldo insuficiente para trabalhar",
          currentBalance: balance,
          message: "Você precisa ter um saldo positivo para ficar online",
        });
      }

      res.json({
        success: true,
        message: "Motorista online com saldo suficiente",
        balance: balance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Go offline
  goOffline: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      res.json({
        success: true,
        message: "Motorista offline",
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = driverController;
