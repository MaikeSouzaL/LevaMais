const User = require("../models/User");

const driverController = {
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
          selectedCategories: [],
          selectedVehicles: [],
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
          selectedCategories: [],
          selectedVehicles: [],
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
          selectedCategories: [],
          selectedVehicles: [],
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

  // Update driver selected categories and vehicles
  updateDriverPreferences: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { selectedCategories, selectedVehicles } = req.body;

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
          selectedCategories: [],
          selectedVehicles: [],
        };
      }

      if (selectedCategories && Array.isArray(selectedCategories)) {
        user.driverBalance.selectedCategories = selectedCategories;
      }

      if (selectedVehicles && Array.isArray(selectedVehicles)) {
        user.driverBalance.selectedVehicles = selectedVehicles;
      }

      await user.save();

      res.json({
        success: true,
        message: "Preferências atualizadas com sucesso",
        data: user.driverBalance,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
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
