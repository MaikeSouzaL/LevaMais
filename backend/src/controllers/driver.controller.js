const User = require("../models/User");
const DriverDailyStats = require("../models/DriverDailyStats");
const { getRuntimeConfig } = require("../services/platformConfig.service");

const DEFAULT_APP_TIMEZONE = process.env.APP_TIMEZONE || "America/Sao_Paulo";

function getDateKeyInTimezone(date = new Date(), timeZone = DEFAULT_APP_TIMEZONE) {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    if (!year || !month || !day) return date.toISOString().split("T")[0];
    return `${year}-${month}-${day}`;
  } catch {
    return date.toISOString().split("T")[0];
  }
}

function toMoney(value) {
  const number = Number(value || 0);
  if (!Number.isFinite(number)) return 0;
  return Math.round(number * 100) / 100;
}

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

async function fetchVehicleDataFromAPI(plate) {
  try {
    const runtimeConfig = await getRuntimeConfig().catch(() => null);
    const isDevelopmentMode = runtimeConfig?.isDevelopmentMode !== undefined
      ? Boolean(runtimeConfig.isDevelopmentMode)
      : true;
    if (isDevelopmentMode) {
      console.log("[Vehicle API Consult] Development Mode is ACTIVE. Bypassing external API validation.");
      return { valid: true, isFallback: true };
    }

    const cleanPlate = String(plate).toUpperCase().replace(/[^A-Z0-9]/g, "");
    const plateRegex = /^[A-Z]{3}[0-9][A-Z0-9][0-9]{2}$/;
    if (!plateRegex.test(cleanPlate)) {
      return { valid: false, error: "Placa em formato inválido (ex: ABC-1234 ou ABC1D23)" };
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://wdapi2.com.br/api/v1/placa/${cleanPlate}/json`, {
      signal: controller.signal
    }).catch(() => null);

    clearTimeout(id);

    if (response && response.ok) {
      const data = await response.json().catch(() => null);
      if (data && !data.error && !data.erros) {
        return {
          valid: true,
          model: data.modelo || data.model || null,
          color: data.cor || data.color || null,
          year: data.ano || data.anoModelo || null,
          brand: data.marca || null,
          chassis: data.chassi || null
        };
      }
    }
    return { valid: true, isFallback: true };
  } catch (error) {
    console.warn("[Vehicle API Consult] Erro ao consultar placa:", error.message);
    return { valid: true, isFallback: true };
  }
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
        description: t?.description || "",
        rideId: t?.rideId ? String(t.rideId) : undefined,
        createdAt: t?.createdAt || null,
        date: t?.createdAt || null,
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
        data: {
          ...balance,
          available: Number(balance.balance || 0),
          totalWithdrawn: Array.isArray(balance.transactions)
            ? balance.transactions
                .filter((t) => t?.type === "withdrawal")
                .reduce((acc, t) => acc + Number(t?.amount || 0), 0)
            : 0,
        },
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // Add deposit
  addDeposit: async (req, res) => {
    return res.status(410).json({
      success: false,
      error: "Use /payments/deposit/pix ou /payments/deposit/boleto para recarregar saldo do motorista.",
      message: "A recarga direta foi desativada. O saldo só é creditado após confirmação do provedor de pagamento.",
    });
  },

  // Deduct balance (when ride is completed)
  deductBalance: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { amount, rideId, deductionPercentage } = req.body;

      // Buscar percentual configurado se nao enviado no request
      let effectiveDeductionPercentage = Number(deductionPercentage);
      if (!Number.isFinite(effectiveDeductionPercentage) || effectiveDeductionPercentage <= 0) {
        const runtimeConfig = await getRuntimeConfig().catch(() => null);
        effectiveDeductionPercentage = Number(runtimeConfig?.appFeePercentage || 15);
      }

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

      const deductAmount = Number((amount * effectiveDeductionPercentage / 100).toFixed(2));

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
        type: "app_fee_debit",
        amount: deductAmount,
        description: `Taxa Leva Mais ${effectiveDeductionPercentage}% sobre R$ ${amount.toFixed(2)}`,
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

      // Buscar percentual de taxa configurado
      const runtimeConfig = await getRuntimeConfig().catch(() => null);
      const appFeePercentage = Number(runtimeConfig?.appFeePercentage || 15);

      const balance = user.driverBalance?.balance || 0;
      const opCredit = user.driverBalance?.operationalCredit || 0;
      const requiredBalance = Number((rideValue * appFeePercentage / 100).toFixed(2));
      const canAccept = (balance + opCredit) >= requiredBalance;

      res.json({
        success: true,
        canAccept: canAccept,
        currentBalance: balance,
        requiredBalance: requiredBalance,
        rideValue: rideValue,
        appFeePercentage,
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
          operationalCredit: 50,
          transactions: [],
        };
      }

      const totalAvailable = (user.driverBalance.balance || 0) + (user.driverBalance.operationalCredit || 0);
      if (totalAvailable < amount) {
        return res.status(400).json({
          error: "Saldo insuficiente",
          required: amount,
          available: totalAvailable,
        });
      }

      // 3. Deducao prioriza credito operacional primeiro
      const opCredit = user.driverBalance.operationalCredit || 0;

      // Create withdrawal request
      user.driverBalance.balance -= amount;
      user.driverBalance.transactions.push({
        type: "withdrawal",
        amount: amount,
        description: `Saque solicitado de R$ ${amount.toFixed(2)}`,
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

      const { serviceTypes, selectedVehicles, searchRadiusKm, autoAccept, acceptsCardMachine, acceptsCash, acceptsPix } = req.body || {};

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
          acceptsCardMachine: false,
          acceptsCash: true,
          acceptsPix: true,
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

      if (acceptsCardMachine !== undefined) {
        user.driverPreferences.acceptsCardMachine = Boolean(acceptsCardMachine);
      }

      if (acceptsCash !== undefined) {
        user.driverPreferences.acceptsCash = Boolean(acceptsCash);
      }

      if (acceptsPix !== undefined) {
        user.driverPreferences.acceptsPix = Boolean(acceptsPix);
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

  // Go online (verifica driverStatus, documentos, veiculo aprovado, saldo e termos)
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

      // 0. Antifraude: conta bloqueada/suspensa não pode trabalhar.
      const acct = String(user.accountStatus || "active");
      if (acct === "blocked" || acct === "suspended") {
        return res.status(403).json({
          error: acct === "blocked"
            ? "Sua conta está bloqueada. Fale com o suporte."
            : "Sua conta está suspensa temporariamente. Fale com o suporte.",
          accountStatus: acct,
        });
      }

      // 1. Verificar driverStatus
      if (user.driverStatus !== "approved") {
        const statusMessages = {
          none: "Seu cadastro ainda nao foi iniciado. Complete o onboarding.",
          pending: "Seus documentos estao em analise. Aguarde a aprovacao.",
          rejected: `Seu cadastro foi reprovado${user.driverDocuments?.rejectionReason ? ": " + user.driverDocuments.rejectionReason : ""}. Corrija e reenvie.`,
          blocked: `Sua conta de motorista esta bloqueada${user.driverDocuments?.rejectionReason ? ": " + user.driverDocuments.rejectionReason : ""}. Fale com o suporte.`,
          suspended: `Sua conta de motorista esta suspensa${user.driverDocuments?.rejectionReason ? ": " + user.driverDocuments.rejectionReason : ""}. Fale com o suporte.`,
        };
        return res.status(400).json({
          error: statusMessages[user.driverStatus] || "Cadastro nao aprovado",
          driverStatus: user.driverStatus,
        });
      }

      // 2. Verificar se documentos pessoais foram enviados
      const docs = user.driverDocuments || {};
      if (!docs.cnhFront || !docs.cnhBack || !docs.selfie) {
        return res.status(400).json({
          error: "Documentos pessoais incompletos. Envie CNH frente, CNH verso e selfie.",
        });
      }

      // 3. Verificar veiculo ativo e aprovado
      const activeVehicle = user.vehicles?.find(
        (v) => String(v._id) === String(user.activeVehicleId)
      );
      if (!activeVehicle) {
        return res.status(400).json({
          error: "Nenhum veiculo ativo. Cadastre e ative um veiculo aprovado.",
        });
      }
      if (activeVehicle.status !== "approved") {
        return res.status(400).json({
          error: `Seu veiculo ${activeVehicle.plate || activeVehicle.model || ""} ainda nao foi aprovado.`,
          vehicleStatus: activeVehicle.status,
        });
      }

      // 4. Verificar termos aceitos
      if (!user.acceptedTerms) {
        return res.status(400).json({
          error: "Voce precisa aceitar os Termos de Uso antes de trabalhar.",
        });
      }

      // 5. Verificar saldo (permite saldo zero — motorista novo ganha credito operacional)
      const balance = user.driverBalance?.balance || 0;
      const existingCredit = user.driverBalance?.operationalCredit || 0;
      const totalAvailable = balance + existingCredit;
      if (totalAvailable <= 0) {
        // Concede credito operacional inicial para novos motoristas (valor via dashboard)
        const runtimeConfig = await getRuntimeConfig().catch(() => null);
        const creditAmount = Number(runtimeConfig?.operationalCreditAmount || 5);
        user.driverBalance = user.driverBalance || {};
        user.driverBalance.operationalCredit = creditAmount;
        user.driverBalance.balance = user.driverBalance.balance || 0;
        await user.save();
      }

      const now = new Date();
      const todayStr = getDateKeyInTimezone(now);
      user.onlineStats = user.onlineStats || {
        totalSecondsToday: 0,
        lastHeartbeatAt: now,
        activeDateStr: todayStr,
        isOnline: false,
      };

      if (user.onlineStats.activeDateStr !== todayStr) {
        await DriverDailyStats.findOneAndUpdate(
          { driverId: user._id, dateStr: user.onlineStats.activeDateStr },
          {
            $set: {
              totalSeconds: Number(user.onlineStats.totalSecondsToday || 0),
              walletBalanceEnd: toMoney(user?.driverBalance?.balance || 0),
              lastOfflineAt: now,
            },
          },
          { upsert: true, new: true }
        );

        user.onlineStats.totalSecondsToday = 0;
        user.onlineStats.activeDateStr = todayStr;
      }

      user.onlineStats.lastHeartbeatAt = now;
      user.onlineStats.isOnline = true;
      await user.save();

      await DriverDailyStats.findOneAndUpdate(
        { driverId: user._id, dateStr: todayStr },
        {
          $setOnInsert: {
            walletBalanceStart: toMoney(user?.driverBalance?.balance || 0),
            firstOnlineAt: now,
          },
          $set: {
            walletBalanceEnd: toMoney(user?.driverBalance?.balance || 0),
          },
          $inc: {
            onlineSessionsCount: 1,
          },
        },
        { upsert: true, new: true }
      );

      // Buscar appFeePercentage para informar ao motorista
      const runtimeConfig = await getRuntimeConfig().catch(() => null);
      const appFeePercentage = Number(runtimeConfig?.appFeePercentage || 15);

      res.json({
        success: true,
        message: "Motorista liberado para trabalhar",
        balance: balance,
        totalSecondsToday: Number(user?.onlineStats?.totalSecondsToday || 0),
        appFeePercentage,
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

      const now = new Date();
      const todayStr = getDateKeyInTimezone(now);
      user.onlineStats = user.onlineStats || {
        totalSecondsToday: 0,
        lastHeartbeatAt: now,
        activeDateStr: todayStr,
        isOnline: false,
      };

      if (user.onlineStats.activeDateStr !== todayStr) {
        await DriverDailyStats.findOneAndUpdate(
          { driverId: user._id, dateStr: user.onlineStats.activeDateStr },
          {
            $set: {
              totalSeconds: Number(user.onlineStats.totalSecondsToday || 0),
              walletBalanceEnd: toMoney(user?.driverBalance?.balance || 0),
              lastOfflineAt: now,
            },
          },
          { upsert: true, new: true }
        );

        user.onlineStats.totalSecondsToday = 0;
        user.onlineStats.activeDateStr = todayStr;
      } else if (user.onlineStats.isOnline && user.onlineStats.lastHeartbeatAt) {
        const diffSec = Math.floor((Date.now() - new Date(user.onlineStats.lastHeartbeatAt).getTime()) / 1000);
        if (diffSec > 0 && diffSec < 3600) {
          user.onlineStats.totalSecondsToday += diffSec;
        }
      }

      user.onlineStats.lastHeartbeatAt = now;
      user.onlineStats.isOnline = false;
      await user.save();

      await DriverDailyStats.findOneAndUpdate(
        { driverId: user._id, dateStr: todayStr },
        {
          $set: {
            totalSeconds: Number(user.onlineStats.totalSecondsToday || 0),
            walletBalanceEnd: toMoney(user?.driverBalance?.balance || 0),
            lastOfflineAt: now,
          },
          $setOnInsert: {
            walletBalanceStart: toMoney(user?.driverBalance?.balance || 0),
          },
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: "Motorista offline",
        totalSecondsToday: Number(user?.onlineStats?.totalSecondsToday || 0),
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

      const { type, plate, model, color, year, renavam, documents, rideCategory } = req.body;

      if (!type || !plate || !model) {
        return res.status(400).json({ error: "Campos obrigatórios faltando: tipo, placa e modelo" });
      }

      // Categoria de corrida: moto sempre "moto"; carro usa a informada ou "car_economy".
      const resolvedRideCategory =
        type === "motorcycle"
          ? "moto"
          : type === "car"
            ? (["car_economy", "car_comfort", "car_luxury"].includes(rideCategory) ? rideCategory : "car_economy")
            : null;

      const cleanPlate = String(plate).toUpperCase().replace(/[^A-Z0-9]/g, "");

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const exists = user.vehicles && user.vehicles.some(
        (v) => String(v.plate).toUpperCase() === cleanPlate
      );

      if (exists) {
        return res.status(400).json({ error: "Você já possui um veículo cadastrado com esta placa" });
      }

      const apiResult = await fetchVehicleDataFromAPI(cleanPlate);
      if (!apiResult.valid) {
        return res.status(400).json({ error: apiResult.error || "Placa de veículo inválida." });
      }

      let finalModel = String(model).trim();
      let finalColor = color ? String(color).trim() : undefined;
      let finalYear = year ? Number(year) : undefined;

      if (apiResult.model && !apiResult.isFallback) {
        finalModel = `${apiResult.brand || ""} ${apiResult.model}`.trim();
        if (apiResult.color) finalColor = apiResult.color;
        if (apiResult.year) finalYear = Number(apiResult.year);
      }

      const newVehicle = {
        type,
        plate: cleanPlate,
        model: finalModel,
        color: finalColor,
        year: finalYear,
        renavam: renavam ? String(renavam).trim() : undefined,
        rideCategory: resolvedRideCategory,
        officialBrand: apiResult.brand ? String(apiResult.brand).trim() : undefined,
        officialChassis: apiResult.chassis ? String(apiResult.chassis).trim() : undefined,
        officialColor: apiResult.color ? String(apiResult.color).trim() : undefined,
        officialModel: apiResult.model ? String(apiResult.model).trim() : undefined,
        officialYear: apiResult.year ? Number(apiResult.year) : undefined,
        isVerifiedByAPI: !apiResult.isFallback,
        plateVerifiedByAPI: !apiResult.isFallback,
        plateVerificationSource: apiResult.isFallback ? "fallback" : "api",
        documents: documents || {},
        vehicleDocumentsStatus: {
          crlvFront: (documents?.crlvFront && documents.crlvFront.length > 0) ? "pending" : "none",
          crlvBack: (documents?.crlvBack && documents.crlvBack.length > 0) ? "pending" : "none",
          vehiclePhoto: (documents?.vehiclePhoto && documents.vehiclePhoto.length > 0) ? "pending" : "none",
        },
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

      // Categoria de corrida: moto sempre "moto"; carro usa a do veículo ou "car_economy".
      const resolvedRideCategory =
        vehicle.type === "motorcycle"
          ? "moto"
          : vehicle.type === "car"
            ? (["car_economy", "car_comfort", "car_luxury"].includes(vehicle.rideCategory)
                ? vehicle.rideCategory
                : "car_economy")
            : null;

      // Set as active
      user.activeVehicleId = vehicle._id;
      user.vehicleType = vehicle.type;
      user.vehicleInfo = {
        plate: vehicle.plate,
        model: vehicle.model,
        color: vehicle.color,
        year: vehicle.year,
        rideCategory: resolvedRideCategory,
      };

      await user.save();

      // Atualiza instantaneamente a localização do motorista online com o novo veículo
      try {
        const DriverLocation = require("../models/DriverLocation");
        await DriverLocation.findOneAndUpdate(
          { driverId: userId },
          {
            vehicleType: vehicle.type,
            rideCategory: resolvedRideCategory,
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

  // 🚗 Define a categoria de CORRIDA de um carro (economy/comfort/luxury)
  setVehicleRideCategory: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { id } = req.params;
      const { rideCategory } = req.body;
      const VALID = ["car_economy", "car_comfort", "car_luxury"];
      if (!VALID.includes(rideCategory)) {
        return res.status(400).json({ error: "Categoria de corrida inválida", valid: VALID });
      }

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const vehicle = user.vehicles && user.vehicles.id(id);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado na sua frota" });
      }
      if (vehicle.type !== "car") {
        return res.status(400).json({ error: "Categoria de corrida só se aplica a carros" });
      }

      vehicle.rideCategory = rideCategory;

      // Se for o veículo ativo, reflete em vehicleInfo + DriverLocation (cache de disponibilidade)
      if (String(user.activeVehicleId || "") === String(vehicle._id)) {
        user.vehicleInfo = { ...(user.vehicleInfo || {}), rideCategory };
        try {
          const DriverLocation = require("../models/DriverLocation");
          await DriverLocation.findOneAndUpdate({ driverId: userId }, { rideCategory });
        } catch (locErr) {
          console.error("Falha ao sincronizar rideCategory no DriverLocation:", locErr);
        }
      }

      await user.save();

      res.json({
        success: true,
        message: "Categoria de corrida atualizada",
        vehicleId: String(vehicle._id),
        rideCategory,
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  // 📸 Upload de documentos do veículo (multipart) - substitui o envio de file:// URIs
  uploadVehicleDocuments: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: "Usuário não autenticado" });
      }

      const { vehicleId } = req.params;

      const user = await User.findById(userId);
      if (!user || user.userType !== "driver") {
        return res.status(403).json({ error: "Usuário não é um motorista" });
      }

      const vehicle = user.vehicles?.id(vehicleId);
      if (!vehicle) {
        return res.status(404).json({ error: "Veículo não encontrado na sua frota" });
      }

      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({ error: "Nenhum documento foi enviado" });
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}/uploads/drivers`;

      const docKeys = ["crlvFront", "crlvBack", "vehiclePhoto"];
      const updatedDocs = { ...(vehicle.documents || {}) };
      const updatedDocStatus = { ...(vehicle.vehicleDocumentsStatus || {}) };

      docKeys.forEach((key) => {
        if (req.files[key] && req.files[key][0]) {
          updatedDocs[key] = `${baseUrl}/${req.files[key][0].filename}`;
          updatedDocStatus[key] = "pending";
        }
      });

      vehicle.documents = updatedDocs;
      vehicle.documents.submittedAt = new Date();
      vehicle.vehicleDocumentsStatus = updatedDocStatus;
      vehicle.status = "pending";

      await user.save();

      return res.json({
        success: true,
        message: "Documentos do veículo enviados com sucesso. Aguardando análise.",
        data: {
          documents: vehicle.documents,
          vehicleDocumentsStatus: vehicle.vehicleDocumentsStatus,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar documentos do veículo:", error);
      return res.status(500).json({ error: error.message });
    }
  },

  // ───────────────────────── PAYOUT (ADMIN, manual) ─────────────────────────
  // Lista saques (transações type "withdrawal") por status (padrão: pending).
  adminListWithdrawals: async (req, res) => {
    try {
      const status = String(req.query.status || "pending");
      const users = await User.find({
        "driverBalance.transactions": { $elemMatch: { type: "withdrawal", status } },
      })
        .select("name phone driverBalance.transactions")
        .lean();

      const items = [];
      for (const u of users) {
        const txs = u.driverBalance?.transactions || [];
        for (const t of txs) {
          if (t.type === "withdrawal" && t.status === status) {
            items.push({
              withdrawalId: String(t._id),
              driverId: String(u._id),
              driverName: u.name,
              driverPhone: u.phone,
              amount: Number(t.amount || 0),
              pixKey: t.pixKey || null,
              status: t.status,
              requestedAt: t.createdAt,
              processedAt: t.processedAt || null,
              receiptUrl: t.receiptUrl || null,
              adminNote: t.adminNote || null,
            });
          }
        }
      }
      items.sort((a, b) => new Date(a.requestedAt) - new Date(b.requestedAt));
      return res.json({ success: true, count: items.length, withdrawals: items });
    } catch (error) {
      console.error("Erro ao listar saques (admin):", error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Marca um saque como PAGO (status completed) com comprovante.
  adminMarkWithdrawalPaid: async (req, res) => {
    try {
      const { driverId, withdrawalId } = req.params;
      const { receiptUrl, note } = req.body || {};

      const user = await User.findById(driverId);
      if (!user) return res.status(404).json({ error: "Motorista não encontrado" });

      const tx = (user.driverBalance?.transactions || []).id(withdrawalId);
      if (!tx || tx.type !== "withdrawal") {
        return res.status(404).json({ error: "Saque não encontrado" });
      }
      if (tx.status !== "pending") {
        return res.status(400).json({ error: `Saque já está '${tx.status}'` });
      }

      tx.status = "completed";
      tx.processedAt = new Date();
      if (receiptUrl) tx.receiptUrl = String(receiptUrl);
      if (note) tx.adminNote = String(note);
      await user.save();

      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${driverId}`).emit("withdrawal_paid", {
          withdrawalId: String(tx._id),
          amount: Number(tx.amount || 0),
          receiptUrl: tx.receiptUrl || null,
        });
      }

      return res.json({ success: true, withdrawalId: String(tx._id), status: tx.status });
    } catch (error) {
      console.error("Erro ao marcar saque como pago (admin):", error);
      return res.status(500).json({ error: error.message });
    }
  },

  // Rejeita um saque: estorna o valor ao saldo do motorista.
  adminRejectWithdrawal: async (req, res) => {
    try {
      const { driverId, withdrawalId } = req.params;
      const { reason } = req.body || {};

      const user = await User.findById(driverId);
      if (!user) return res.status(404).json({ error: "Motorista não encontrado" });

      const tx = (user.driverBalance?.transactions || []).id(withdrawalId);
      if (!tx || tx.type !== "withdrawal") {
        return res.status(404).json({ error: "Saque não encontrado" });
      }
      if (tx.status !== "pending") {
        return res.status(400).json({ error: `Saque já está '${tx.status}'` });
      }

      // Estorna o valor que havia sido deduzido na solicitação.
      user.driverBalance.balance = Number((Number(user.driverBalance.balance || 0) + Number(tx.amount || 0)).toFixed(2));
      tx.status = "failed";
      tx.processedAt = new Date();
      tx.adminNote = String(reason || "Rejeitado pelo administrador");
      await user.save();

      const io = req.app?.get("io");
      if (io) {
        io.to(`driver-${driverId}`).emit("balance_updated", {
          balance: user.driverBalance.balance,
        });
        io.to(`driver-${driverId}`).emit("withdrawal_rejected", {
          withdrawalId: String(tx._id),
          amount: Number(tx.amount || 0),
          reason: tx.adminNote,
        });
      }

      return res.json({ success: true, withdrawalId: String(tx._id), status: tx.status, refunded: Number(tx.amount || 0) });
    } catch (error) {
      console.error("Erro ao rejeitar saque (admin):", error);
      return res.status(500).json({ error: error.message });
    }
  },
};

module.exports = driverController;
