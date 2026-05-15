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

  // 🚗 Múltiplos Veículos: Listar frota do motorista
  listVehicles: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const user = await User.findById(userId).select("userType vehicles activeVehicleId");
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      res.json({
        success: true,
        vehicles: user.vehicles || [],
        activeVehicleId: user.activeVehicleId || null
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 📝 Múltiplos Veículos: Cadastrar novo veículo pendente de análise
  addVehicle: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { type, plate, model, color, year, documents } = req.body;

      if (!type || !plate || !model) {
        return res.status(400).json({ error: "Campos obrigatórios faltando: tipo, placa e modelo" });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const exists = user.vehicles && user.vehicles.some(
        (v) => String(v.plate).toUpperCase() === String(plate).trim().toUpperCase()
      );

      if (exists) {
        return res.status(400).json({ error: "Você já possui um veículo cadastrado com esta placa" });
      }

      const newVehicle = {
        type,
        plate: String(plate).trim().toUpperCase(),
        model: String(model).trim(),
        color: color ? String(color).trim() : undefined,
        year: year ? Number(year) : undefined,
        documents: documents || {},
        status: "pending"
      };

      user.vehicles = user.vehicles || [];
      user.vehicles.push(newVehicle);
      
      await user.save();

      res.status(201).json({
        success: true,
        message: "Veículo cadastrado com sucesso. Aguarde a aprovação administrativa.",
        vehicle: user.vehicles[user.vehicles.length - 1]
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // ⚡️ Múltiplos Veículos: Ativar um veículo APROVADO como ferramenta de trabalho
  activateVehicle: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const vehicle = user.vehicles && user.vehicles.id(id);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado na sua frota" });
      }

      if (vehicle.status !== "approved") {
        return res.status(400).json({ 
          error: "Este veículo ainda não foi aprovado pela administração", 
          status: vehicle.status 
        });
      }

      // Set as active
      user.activeVehicleId = vehicle._id;
      user.vehicleType = vehicle.type;
      user.vehicleInfo = {
        plate: vehicle.plate,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year
      };

      await user.save();

      // Atualiza instantaneamente a localização do motorista online com o novo veículo
      try {
        const DriverLocation = require("../models/DriverLocation");
        await DriverLocation.findOneAndUpdate(
          { driverId: userId },
          { 
            vehicleType: vehicle.type,
            vehicle: {
              plate: vehicle.plate,
              model: vehicle.model,
              color: vehicle.color,
              year: vehicle.year
            }
          }
        );
      } catch (locErr) {
        console.error("Falha ao sincronizar veículo no DriverLocation:", locErr);
      }

      res.json({
        success: true,
        message: `O veículo ${vehicle.model} está ativado e pronto para receber chamadas!`,
        activeVehicle: {
          type: user.vehicleType,
          info: user.vehicleInfo,
          id: user.activeVehicleId
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },
};

module.exports = driverController;
