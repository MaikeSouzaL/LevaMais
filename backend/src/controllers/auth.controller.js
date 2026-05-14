const User = require("../models/User");
const PasswordReset = require("../models/PasswordReset");
const PhoneVerification = require("../models/PhoneVerification");
const Ride = require("../models/Ride");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const crypto = require("crypto");
const mongoose = require("mongoose");
const ACTIVE_RIDE_STATUSES = [
  "requesting",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];
const CURRENT_CONSENT_VERSION = "2026-05-14";
const RIDE_CAPABLE_VEHICLES = new Set(["motorcycle", "car"]);

function normalizePhone(phone) {
  if (!phone) return "";
  return String(phone).replace(/\D/g, "");
}

function normalizePreferredPayment(value) {
  const raw = String(value || "")
    .trim()
    .toLowerCase();
  if (!raw) return undefined;
  if (["pix", "cash", "card"].includes(raw)) return raw;
  if (["credit", "credit_card", "debit", "debit_card"].includes(raw)) return "card";
  return undefined;
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(String(email || ""));
}

function sendError(res, status, message, extras = {}) {
  return res.status(status).json({
    success: false,
    message,
    error: message,
    ...extras,
  });
}

function detectCardBrand(cardNumber) {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (/^4/.test(digits)) return "visa";
  if (/^5[1-5]/.test(digits)) return "mastercard";
  if (/^3[47]/.test(digits)) return "amex";
  if (/^6(?:011|5)/.test(digits)) return "discover";
  return "card";
}

function parseExpiry(expiry) {
  const cleaned = String(expiry || "").replace(/\D/g, "");
  if (cleaned.length < 4) return null;
  const month = Number(cleaned.slice(0, 2));
  const year = Number(cleaned.slice(2, 4));
  if (!Number.isFinite(month) || month < 1 || month > 12) return null;
  if (!Number.isFinite(year) || year < 0 || year > 99) return null;
  return { month, year };
}

function toMoney(value) {
  return Number(Number(value || 0).toFixed(2));
}

function toNullableString(value) {
  if (value === undefined || value === null) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function buildDeletedEmail(userId) {
  return `deleted_${String(userId)}@leva.local`;
}

function getCompatibleServiceTypes(vehicleType, serviceTypes) {
  const normalized = Array.isArray(serviceTypes) ? serviceTypes : ["ride", "delivery"];
  if (RIDE_CAPABLE_VEHICLES.has(String(vehicleType || "").toLowerCase())) {
    return normalized;
  }
  return normalized.filter((item) => item !== "ride");
}

class AuthController {
  // Gerar token JWT
  generateToken(user) {
    const userId = typeof user === "string" ? user : user?._id;
    const userType = typeof user === "string" ? undefined : user?.userType;

    return jwt.sign(
      { id: userId, userType },
      process.env.JWT_SECRET || "secret",
      {
        expiresIn: process.env.JWT_EXPIRE || "7d",
      },
    );
  }

  // Cadastrar usuário com email e senha
  async register(req, res) {
    try {
      const {
        name,
        email,
        password,
        phone,
        city,
        userType,
        acceptedTerms,
        // Tipo de documento
        documentType,
        // Documentos
        cpf,
        cnpj,
        // Dados da empresa
        companyName,
        companyEmail,
        companyPhone,
        // Endereço
        address,
        // Preferências
        preferredPayment,
        notificationsEnabled,
        // Driver
        vehicleType,
        vehicleInfo,
        // Google (opcional)
        googleId,
        profilePhoto,
      } = req.body;

      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      const normalizedPhone = normalizePhone(phone);
      const resolvedUserType = ["client", "driver"].includes(String(userType || ""))
        ? String(userType)
        : "client";
      const normalizedPreferredPayment = normalizePreferredPayment(preferredPayment);
      const consentAccepted = Boolean(acceptedTerms);
      const consentTimestamp = consentAccepted ? new Date() : undefined;

      // Validar campos obrigatórios
      if (!name || !email || !password) {
        return sendError(res, 400, "Nome, email e senha são obrigatórios");
      }

      // Verificar se o email já existe
      if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizedEmail)) {
        return sendError(res, 400, "Email invalido");
      }

      if (normalizedPhone && (normalizedPhone.length < 10 || normalizedPhone.length > 11)) {
        return sendError(res, 400, "Telefone invalido");
      }

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return sendError(res, 400, "Email já cadastrado");
      }

      // Se tiver address com city, usar o city do address, senão usar o city direto
      const userCity = address?.city || city;

      // Preparar objeto de criação do usuário (remover campos undefined/vazios)
      const userData = {
        name,
        email: normalizedEmail,
        password,
        userType: resolvedUserType,
        acceptedTerms: consentAccepted,
        consentVersion: CURRENT_CONSENT_VERSION,
      };

      if (consentTimestamp) {
        userData.acceptedTermsAt = consentTimestamp;
        userData.acceptedPrivacyAt = consentTimestamp;
      }

      // Google
      if (googleId) userData.googleId = googleId;
      if (profilePhoto) userData.profilePhoto = profilePhoto;

      // Adicionar campos opcionais apenas se tiverem valor
      if (normalizedPhone) userData.phone = normalizedPhone;
      if (userCity && userCity.trim() !== "") userData.city = userCity.trim();

      // Documentos
      if (cpf && cpf.trim() !== "") userData.cpf = cpf.trim();
      if (cnpj && cnpj.trim() !== "") userData.cnpj = cnpj.trim();

      // Dados da empresa
      if (companyName && companyName.trim() !== "")
        userData.companyName = companyName.trim();
      if (companyEmail && companyEmail.trim() !== "")
        userData.companyEmail = companyEmail.toLowerCase().trim();
      if (companyPhone && companyPhone.trim() !== "")
        userData.companyPhone = companyPhone.trim();

      // Endereço (só adiciona se tiver pelo menos street e number)
      if (address && address.street && address.number) {
        userData.address = {
          street: address.street.trim(),
          number: address.number.trim(),
        };
        if (address.complement)
          userData.address.complement = address.complement.trim();
        if (address.neighborhood)
          userData.address.neighborhood = address.neighborhood.trim();
        if (address.city) userData.address.city = address.city.trim();
        if (address.state)
          userData.address.state = address.state.trim().substring(0, 2);
        if (address.zipCode) userData.address.zipCode = address.zipCode.trim();
        if (address.referencePoint)
          userData.address.referencePoint = address.referencePoint.trim();
        if (address.latitude !== undefined)
          userData.address.latitude = address.latitude;
        if (address.longitude !== undefined)
          userData.address.longitude = address.longitude;
      }

      // Preferências
      if (normalizedPreferredPayment) userData.preferredPayment = normalizedPreferredPayment;
      userData.notificationsEnabled =
        notificationsEnabled !== undefined ? notificationsEnabled : true;

      // Dados do motorista
      if (resolvedUserType === "driver") {
        if (!vehicleType) {
          return sendError(res, 400, "Tipo de veiculo e obrigatorio para motorista");
        }
        if (vehicleType) userData.vehicleType = vehicleType;
        if (vehicleInfo) userData.vehicleInfo = vehicleInfo;
        const defaultServiceTypes = getCompatibleServiceTypes(vehicleType, ["ride", "delivery"]);
        userData.driverPreferences = {
          serviceTypes: defaultServiceTypes,
          selectedVehicles: vehicleType ? [vehicleType] : [],
          searchRadiusKm: 15,
          autoAccept: false,
        };
      }

      // Criar novo usuário
      const user = await User.create(userData);

      // Gerar token
      const token = this.generateToken(user);

      res.status(201).json({
        success: true,
        message: "Usuário cadastrado com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro ao cadastrar usuário:", error);
      return sendError(res, 500, "Erro ao cadastrar usuário", { details: error.message });
    }
  }

  // Login com email e senha
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos obrigatórios
      if (!email || !password) {
        return sendError(res, 400, "Email e senha são obrigatórios");
      }

      // Buscar usuário com senha
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password",
      );

      if (!user) {
        return sendError(res, 401, "Email ou senha inválidos");
      }

      // Verificar se a conta está ativa
      if (!user.isActive) {
        return sendError(res, 401, "Conta desativada");
      }

      // Verificar senha
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        return sendError(res, 401, "Email ou senha inválidos");
      }

      // Gerar token
      const token = this.generateToken(user);

      res.json({
        success: true,
        message: "Login realizado com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro ao fazer login:", error);
      return sendError(res, 500, "Erro ao fazer login", { details: error.message });
    }
  }

  // Verificar se email já existe (antes do Google login)
  async checkEmail(req, res) {
    try {
      const { email } = req.body;

      if (!email) return sendError(res, 400, "Email e obrigatorio");
      if (!isValidEmail(email)) return sendError(res, 400, "Email invalido");

      const user = await User.findOne({ email: String(email).toLowerCase() })
        .select("_id email userType isActive")
        .lean();

      return res.json({
        success: true,
        data: {
          exists: !!user,
          isActive: user ? !!user.isActive : false,
          userType: user?.userType,
        },
      });
    } catch (error) {
      console.error("Erro ao verificar email:", error);
      return sendError(res, 500, "Erro ao verificar email", { details: error.message });
    }
  }

  // Login ou cadastro com Google
  async googleAuth(req, res) {
    try {
      const { googleId, email, name, profilePhoto } = req.body;

      if (!googleId || !email) {
        return sendError(res, 400, "Google ID e email são obrigatórios");
      }

      // Buscar usuário existente por googleId ou email
      let user = await User.findOne({
        $or: [{ googleId }, { email: email.toLowerCase() }],
      });

      if (user) {
        if (!user.isActive) {
          return sendError(res, 401, "Conta desativada");
        }

        // Atualizar informações do Google se necessário
        if (!user.googleId) {
          user.googleId = googleId;
        }
        if (profilePhoto && !user.profilePhoto) {
          user.profilePhoto = profilePhoto;
        }
        await user.save();
      } else {
        // Criar novo usuário
        user = await User.create({
          googleId,
          email: email.toLowerCase(),
          name,
          profilePhoto,
          userType: "client",
          acceptedTerms: true,
          acceptedTermsAt: new Date(),
          acceptedPrivacyAt: new Date(),
          consentVersion: CURRENT_CONSENT_VERSION,
        });
      }

      // Gerar token
      const token = this.generateToken(user);

      res.json({
        success: true,
        message: "Autenticação Google realizada com sucesso",
        data: {
          user,
          token,
        },
      });
    } catch (error) {
      console.error("Erro na autenticação Google:", error);
      return sendError(res, 500, "Erro na autenticação Google", { details: error.message });
    }
  }

  // Buscar perfil do usuário autenticado
  async getProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      res.json({
        success: true,
        data: {
          user,
        },
      });
    } catch (error) {
      console.error("Erro ao buscar perfil:", error);
      return sendError(res, 500, "Erro ao buscar perfil", { details: error.message });
    }
  }

  // Atualizar perfil do usuário autenticado (MVP)
  async updateProfile(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      const {
        name,
        phone,
        city,
        profilePhoto,
        preferredPayment,
        notificationsEnabled,
        queueRedispatchInterval,
        // driver
        vehicleType,
        vehicleInfo,
        gpsQuality,
      } = req.body || {};

      if (name !== undefined) user.name = String(name);
      if (phone !== undefined) {
        const normalizedPhone = normalizePhone(phone);
        if (normalizedPhone && (normalizedPhone.length < 10 || normalizedPhone.length > 11)) {
          return sendError(res, 400, "Telefone invalido");
        }
        user.phone = normalizedPhone || "";
      }
      if (city !== undefined) user.city = String(city);
      if (profilePhoto !== undefined) user.profilePhoto = String(profilePhoto);

      if (preferredPayment !== undefined) {
        const normalized = normalizePreferredPayment(preferredPayment);
        if (!normalized) {
          return sendError(res, 400, "Metodo de pagamento invalido");
        }
        user.preferredPayment = normalized;
      }
      if (notificationsEnabled !== undefined) {
        user.notificationsEnabled = !!notificationsEnabled;
      }
      if (queueRedispatchInterval !== undefined) {
        user.queueRedispatchInterval = queueRedispatchInterval === null ? null : Number(queueRedispatchInterval);
      }

      if (user.userType === "driver") {
        if (vehicleType !== undefined) {
          user.vehicleType = vehicleType;
          user.driverPreferences = user.driverPreferences || {
            serviceTypes: ["ride", "delivery"],
            selectedVehicles: [],
            searchRadiusKm: 15,
            autoAccept: false,
          };
          user.driverPreferences.serviceTypes = getCompatibleServiceTypes(
            vehicleType,
            user.driverPreferences.serviceTypes,
          );
          user.driverPreferences.selectedVehicles = [vehicleType];
        }
        if (vehicleInfo !== undefined) user.vehicleInfo = vehicleInfo;
        if (gpsQuality !== undefined && ["low", "balanced", "high"].includes(gpsQuality)) {
          user.gpsQuality = gpsQuality;
        }
      }

      await user.save();

      return res.json({
        success: true,
        message: "Perfil atualizado",
        data: { user },
      });
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      return sendError(res, 500, "Erro ao atualizar perfil", { details: error.message });
    }
  }

  async listPaymentMethods(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("paymentMethods");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const methods = (user.paymentMethods || []).map((method) => ({
        _id: method._id,
        brand: method.brand || "card",
        last4: method.last4 || "",
        holderName: method.holderName || "",
        expiryMonth: method.expiryMonth,
        expiryYear: method.expiryYear,
        isDefault: Boolean(method.isDefault),
        createdAt: method.createdAt,
      }));

      return res.json({
        success: true,
        paymentMethods: methods,
      });
    } catch (error) {
      console.error("Erro ao listar cartoes:", error);
      return sendError(res, 500, "Erro ao listar cartoes", { details: error.message });
    }
  }

  async addPaymentMethod(req, res) {
    try {
      const userId = req.user.id;
      const { cardNumber, holderName, expiry, isDefault } = req.body || {};

      const digits = String(cardNumber || "").replace(/\D/g, "");
      if (digits.length < 13 || digits.length > 19) {
        return sendError(res, 400, "Numero do cartao invalido");
      }

      const holder = String(holderName || "").trim();
      if (!holder) {
        return sendError(res, 400, "Nome do titular obrigatorio");
      }

      const parsedExpiry = parseExpiry(expiry);
      if (!parsedExpiry) {
        return sendError(res, 400, "Validade invalida");
      }

      const user = await User.findById(userId);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      user.paymentMethods = user.paymentMethods || [];
      if (user.paymentMethods.length >= 8) {
        return sendError(res, 400, "Limite de cartoes atingido");
      }

      const last4 = digits.slice(-4);
      const brand = detectCardBrand(digits);
      const shouldBeDefault = Boolean(isDefault) || user.paymentMethods.length === 0;

      if (shouldBeDefault) {
        user.paymentMethods.forEach((method) => {
          method.isDefault = false;
        });
      }

      user.paymentMethods.push({
        brand,
        last4,
        holderName: holder,
        expiryMonth: parsedExpiry.month,
        expiryYear: parsedExpiry.year,
        token: `pm_${crypto.randomBytes(12).toString("hex")}`,
        isDefault: shouldBeDefault,
      });

      await user.save();
      const created = user.paymentMethods[user.paymentMethods.length - 1];

      return res.status(201).json({
        success: true,
        message: "Cartao adicionado com sucesso",
        paymentMethod: {
          _id: created._id,
          brand: created.brand,
          last4: created.last4,
          holderName: created.holderName,
          expiryMonth: created.expiryMonth,
          expiryYear: created.expiryYear,
          isDefault: created.isDefault,
          createdAt: created.createdAt,
        },
      });
    } catch (error) {
      console.error("Erro ao adicionar cartao:", error);
      return sendError(res, 500, "Erro ao adicionar cartao", { details: error.message });
    }
  }

  async deletePaymentMethod(req, res) {
    try {
      const userId = req.user.id;
      const { methodId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(methodId)) {
        return sendError(res, 400, "Cartao invalido");
      }

      const user = await User.findById(userId);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const methods = user.paymentMethods || [];
      const index = methods.findIndex((method) => String(method._id) === String(methodId));
      if (index < 0) return sendError(res, 404, "Cartao nao encontrado");

      const removedWasDefault = Boolean(methods[index].isDefault);
      methods.splice(index, 1);

      if (removedWasDefault && methods.length > 0) {
        methods[0].isDefault = true;
      }

      user.paymentMethods = methods;
      await user.save();

      return res.json({
        success: true,
        message: "Cartao removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover cartao:", error);
      return sendError(res, 500, "Erro ao remover cartao", { details: error.message });
    }
  }

  async setDefaultPaymentMethod(req, res) {
    try {
      const userId = req.user.id;
      const { methodId } = req.params;

      if (!mongoose.Types.ObjectId.isValid(methodId)) {
        return sendError(res, 400, "Cartao invalido");
      }

      const user = await User.findById(userId);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const methods = user.paymentMethods || [];
      const target = methods.find((method) => String(method._id) === String(methodId));
      if (!target) return sendError(res, 404, "Cartao nao encontrado");

      methods.forEach((method) => {
        method.isDefault = String(method._id) === String(methodId);
      });

      user.paymentMethods = methods;
      await user.save();

      return res.json({
        success: true,
        message: "Cartao padrao atualizado com sucesso",
        paymentMethod: {
          _id: target._id,
          brand: target.brand || "card",
          last4: target.last4 || "",
          holderName: target.holderName || "",
          expiryMonth: target.expiryMonth,
          expiryYear: target.expiryYear,
          isDefault: true,
          createdAt: target.createdAt,
        },
      });
    } catch (error) {
      console.error("Erro ao definir cartao padrao:", error);
      return sendError(res, 500, "Erro ao definir cartao padrao", { details: error.message });
    }
  }

  async getClientWallet(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select("wallet userType");
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const wallet = user.wallet || { balance: 0, transactions: [] };
      const transactions = (wallet.transactions || [])
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 100);

      return res.json({
        success: true,
        balance: toMoney(wallet.balance || 0),
        transactions,
      });
    } catch (error) {
      console.error("Erro ao buscar carteira:", error);
      return sendError(res, 500, "Erro ao buscar carteira", { details: error.message });
    }
  }

  async topupClientWallet(req, res) {
    try {
      const userId = req.user.id;
      const amount = Number(req.body?.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        return sendError(res, 400, "Valor invalido");
      }

      const roundedAmount = toMoney(amount);
      const user = await User.findById(userId);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      user.wallet = user.wallet || { balance: 0, transactions: [] };
      user.wallet.balance = toMoney((user.wallet.balance || 0) + roundedAmount);
      user.wallet.transactions = user.wallet.transactions || [];
      user.wallet.transactions.push({
        type: "topup",
        amount: roundedAmount,
        description: "Recarga de saldo",
        referenceId: `topup_${Date.now()}`,
      });

      await user.save();

      return res.json({
        success: true,
        message: "Saldo atualizado com sucesso",
        balance: toMoney(user.wallet.balance),
      });
    } catch (error) {
      console.error("Erro ao recarregar carteira:", error);
      return sendError(res, 500, "Erro ao recarregar carteira", { details: error.message });
    }
  }

  async listNotifications(req, res) {
    try {
      const userId = req.user.id;
      const userType = String(req.user.userType || "");

      const rideQuery =
        userType === "driver"
          ? { driverId: userId }
          : { clientId: userId };

      const rides = await Ride.find(rideQuery)
        .select("status serviceType pricing.total updatedAt createdAt pickup dropoff")
        .sort({ updatedAt: -1 })
        .limit(40)
        .lean();

      const notifications = rides.map((ride) => {
        const serviceLabel = ride.serviceType === "delivery" ? "Entrega" : "Corrida";
        let title = `${serviceLabel} atualizada`;
        let body = `${ride.pickup?.address || "Origem"} -> ${ride.dropoff?.address || "Destino"}`;
        let type = "ride";

        if (ride.status === "completed") {
          title = `${serviceLabel} finalizada`;
          body = `Total: R$ ${Number(ride?.pricing?.total || 0).toFixed(2)}`;
          type = "payment";
        } else if (String(ride.status || "").startsWith("cancelled")) {
          title = `${serviceLabel} cancelada`;
          body = "Seu pedido foi encerrado.";
          type = "system";
        } else if (ride.status === "accepted" || ride.status === "driver_arriving") {
          title = "Motorista a caminho";
          body = serviceLabel === "Entrega" ? "Seu entregador esta chegando." : "Seu motorista esta chegando.";
          type = "ride";
        }

        return {
          id: String(ride._id),
          title,
          body,
          type,
          createdAt: ride.updatedAt || ride.createdAt || new Date(),
          read: false,
        };
      });

      return res.json({
        success: true,
        notifications,
      });
    } catch (error) {
      console.error("Erro ao listar notificacoes:", error);
      return sendError(res, 500, "Erro ao listar notificacoes", { details: error.message });
    }
  }

  // Solicitar reset de senha (envia código por email)
  async exportPrivacyData(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select(
        "name email phone city userType profilePhoto preferredPayment notificationsEnabled createdAt updatedAt paymentMethods wallet address cpf cnpj companyName companyEmail companyPhone",
      );

      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const ridesSummary = await Ride.aggregate([
        {
          $match: {
            $or: [{ clientId: user._id }, { driverId: user._id }],
          },
        },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const totalRides = ridesSummary.reduce(
        (acc, item) => acc + Number(item.count || 0),
        0,
      );

      const exportPayload = {
        generatedAt: new Date().toISOString(),
        account: {
          id: String(user._id),
          name: user.name,
          email: user.email,
          phone: user.phone || "",
          city: user.city || "",
          userType: user.userType,
          profilePhoto: user.profilePhoto || null,
          preferredPayment: user.preferredPayment || null,
          notificationsEnabled: Boolean(user.notificationsEnabled),
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        documents: {
          cpf: user.cpf || null,
          cnpj: user.cnpj || null,
          companyName: user.companyName || null,
          companyEmail: user.companyEmail || null,
          companyPhone: user.companyPhone || null,
        },
        address: user.address || null,
        paymentMethods: (user.paymentMethods || []).map((method) => ({
          id: String(method._id),
          brand: method.brand || "card",
          last4: method.last4 || "",
          holderName: method.holderName || "",
          expiryMonth: method.expiryMonth,
          expiryYear: method.expiryYear,
          isDefault: Boolean(method.isDefault),
          createdAt: method.createdAt,
        })),
        wallet: {
          balance: toMoney(user.wallet?.balance || 0),
          transactionsCount: Array.isArray(user.wallet?.transactions)
            ? user.wallet.transactions.length
            : 0,
        },
        privacy: {
          consentVersion: user.consentVersion || CURRENT_CONSENT_VERSION,
          acceptedTerms: Boolean(user.acceptedTerms),
          acceptedTermsAt: user.acceptedTermsAt || null,
          acceptedPrivacyAt: user.acceptedPrivacyAt || null,
          consentRevokedAt: user.consentRevokedAt || null,
          accountDeletionStatus: user.accountDeletionStatus || "none",
          accountDeletionRequestedAt: user.accountDeletionRequestedAt || null,
          accountDeletionCompletedAt: user.accountDeletionCompletedAt || null,
        },
        rides: {
          total: totalRides,
          byStatus: ridesSummary.reduce((acc, item) => {
            acc[item._id || "unknown"] = Number(item.count || 0);
            return acc;
          }, {}),
        },
      };

      return res.json({
        success: true,
        data: exportPayload,
      });
    } catch (error) {
      console.error("Erro ao exportar dados de privacidade:", error);
      return sendError(res, 500, "Erro ao exportar dados", {
        details: error.message,
      });
    }
  }

  async recordPrivacyConsent(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const acceptedTerms = req.body?.acceptedTerms !== false;
      const acceptedPrivacy = req.body?.acceptedPrivacy !== false;
      const consentVersion =
        toNullableString(req.body?.consentVersion) || CURRENT_CONSENT_VERSION;

      if (!acceptedTerms || !acceptedPrivacy) {
        return sendError(res, 400, "Aceite de termos e privacidade obrigatorio");
      }

      const now = new Date();
      user.acceptedTerms = true;
      user.acceptedTermsAt = now;
      user.acceptedPrivacyAt = now;
      user.consentVersion = consentVersion;
      user.consentRevokedAt = undefined;
      user.isActive = true;

      await user.save();

      return res.json({
        success: true,
        message: "Consentimento registrado com sucesso",
        data: {
          consentVersion: user.consentVersion,
          acceptedTermsAt: user.acceptedTermsAt,
          acceptedPrivacyAt: user.acceptedPrivacyAt,
        },
      });
    } catch (error) {
      console.error("Erro ao registrar consentimento:", error);
      return sendError(res, 500, "Erro ao registrar consentimento", {
        details: error.message,
      });
    }
  }

  async revokePrivacyConsent(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const activeRide = await Ride.findOne({
        $or: [{ clientId: user._id }, { driverId: user._id }],
        status: { $in: ACTIVE_RIDE_STATUSES },
      })
        .select("_id status")
        .lean();

      if (activeRide) {
        return sendError(
          res,
          409,
          "Finalize a corrida ativa antes de revogar o consentimento",
          { activeRideId: String(activeRide._id) },
        );
      }

      const now = new Date();
      user.acceptedTerms = false;
      user.consentRevokedAt = now;
      user.notificationsEnabled = false;
      user.pushToken = undefined;
      user.pushTokenUpdatedAt = now;
      user.isActive = false;

      await user.save();

      return res.json({
        success: true,
        message: "Consentimento revogado e conta desativada",
        data: {
          consentRevokedAt: user.consentRevokedAt,
        },
      });
    } catch (error) {
      console.error("Erro ao revogar consentimento:", error);
      return sendError(res, 500, "Erro ao revogar consentimento", {
        details: error.message,
      });
    }
  }

  async deleteOwnAccount(req, res) {
    try {
      const user = await User.findById(req.user.id);
      if (!user) return sendError(res, 404, "Usuario nao encontrado");

      const activeRide = await Ride.findOne({
        $or: [{ clientId: user._id }, { driverId: user._id }],
        status: { $in: ACTIVE_RIDE_STATUSES },
      })
        .select("_id status")
        .lean();

      if (activeRide) {
        return sendError(
          res,
          409,
          "Finalize a corrida ativa antes de excluir a conta",
          { activeRideId: String(activeRide._id) },
        );
      }

      const now = new Date();
      const deletionReason = toNullableString(req.body?.reason);

      user.accountDeletionRequestedAt = now;
      user.accountDeletionCompletedAt = now;
      user.accountDeletionReason = deletionReason;
      user.accountDeletionStatus = "completed";
      user.isActive = false;
      user.acceptedTerms = false;
      user.consentRevokedAt = now;
      user.pushToken = undefined;
      user.pushTokenUpdatedAt = now;
      user.notificationsEnabled = false;

      user.name = "Conta excluida";
      user.email = buildDeletedEmail(user._id);
      user.phone = undefined;
      user.city = undefined;
      user.cpf = undefined;
      user.cnpj = undefined;
      user.companyName = undefined;
      user.companyEmail = undefined;
      user.companyPhone = undefined;
      user.address = undefined;
      user.favoriteAddresses = [];
      user.paymentMethods = [];
      user.profilePhoto = undefined;
      user.googleId = undefined;
      user.driverDocuments = undefined;
      user.wallet = {
        balance: 0,
        transactions: [],
      };

      await user.save();

      return res.json({
        success: true,
        message: "Conta excluida com anonimização dos dados pessoais",
        data: {
          accountDeletionCompletedAt: user.accountDeletionCompletedAt,
          accountDeletionStatus: user.accountDeletionStatus,
        },
      });
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      return sendError(res, 500, "Erro ao excluir conta", {
        details: error.message,
      });
    }
  }

  async forgotPassword(req, res) {
    try {
      const { email } = req.body;

      if (!email) return sendError(res, 400, "Email e obrigatorio");
      if (!isValidEmail(email)) return sendError(res, 400, "Email invalido");

      // Verificar se o usuário existe
      const user = await User.findOne({ email: email.toLowerCase() });

      // Por segurança, sempre retornar sucesso mesmo se o email não existir
      // Isso previne enumeração de emails
      if (!user) {
        return res.json({
          success: true,
          message: "Se o email existir, você receberá um código de verificação",
        });
      }

      // Gerar código de 6 dígitos
      const code = crypto.randomInt(100000, 999999).toString();

      // Definir expiração (10 minutos)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Invalidar códigos anteriores não usados do mesmo email
      await PasswordReset.updateMany(
        { email: email.toLowerCase(), used: false },
        { used: true },
      );

      // Salvar código no banco
      await PasswordReset.create({
        email: email.toLowerCase(),
        code,
        expiresAt,
      });

      // Enviar email
      const emailResult = await emailService.sendPasswordResetEmail(
        email.toLowerCase(),
        code,
      );

      if (!emailResult.success) {
        console.error("Erro ao enviar email:", emailResult.error);
        return sendError(res, 500, "Erro ao enviar email. Tente novamente mais tarde.");
      }

      res.json({
        success: true,
        message: "Código de verificação enviado para seu email",
      });
    } catch (error) {
      console.error("Erro ao solicitar reset de senha:", error);
      return sendError(res, 500, "Erro ao processar solicitação", { details: error.message });
    }
  }

  // Verificar código de reset
  async verifyResetCode(req, res) {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return sendError(res, 400, "Email e código são obrigatórios");
      }

      // Buscar código válido
      const resetRequest = await PasswordReset.findOne({
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { $gt: new Date() }, // Ainda não expirou
      });

      if (!resetRequest) {
        return sendError(res, 400, "Código inválido ou expirado");
      }

      res.json({
        success: true,
        message: "Código verificado com sucesso",
      });
    } catch (error) {
      console.error("Erro ao verificar código:", error);
      return sendError(res, 500, "Erro ao verificar código", { details: error.message });
    }
  }

  // Redefinir senha com código
  async resetPassword(req, res) {
    try {
      const { email, code, newPassword } = req.body;

      if (!email || !code || !newPassword) {
        return sendError(res, 400, "Email, código e nova senha são obrigatórios");
      }

      if (newPassword.length < 6) {
        return sendError(res, 400, "A senha deve ter no mínimo 6 caracteres");
      }

      // Buscar código válido
      const resetRequest = await PasswordReset.findOne({
        email: email.toLowerCase(),
        code,
        used: false,
        expiresAt: { $gt: new Date() },
      });

      if (!resetRequest) {
        return sendError(res, 400, "Código inválido ou expirado");
      }

      // Buscar usuário
      const user = await User.findOne({ email: email.toLowerCase() }).select(
        "+password",
      );

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      // Atualizar senha
      user.password = newPassword;
      await user.save();

      // Marcar código como usado
      resetRequest.used = true;
      await resetRequest.save();

      res.json({
        success: true,
        message: "Senha redefinida com sucesso",
      });
    } catch (error) {
      console.error("Erro ao redefinir senha:", error);
      return sendError(res, 500, "Erro ao redefinir senha", { details: error.message });
    }
  }

  async sendPhoneCode(req, res) {
    try {
      const normalizedPhone = normalizePhone(req.body?.phone);

      if (!normalizedPhone) {
        return sendError(res, 400, "Telefone e obrigatorio");
      }

      if (normalizedPhone.length < 10 || normalizedPhone.length > 11) {
        return sendError(res, 400, "Telefone invalido");
      }

      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentAttempts = await PhoneVerification.countDocuments({
        phone: normalizedPhone,
        createdAt: { $gte: fiveMinutesAgo },
      });

      if (recentAttempts >= 5) {
        return sendError(res, 429, "Muitas tentativas. Tente novamente em alguns minutos.");
      }

      await PhoneVerification.updateMany(
        { phone: normalizedPhone, used: false },
        { used: true },
      );

      const code = crypto.randomInt(100000, 999999).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

      await PhoneVerification.create({
        phone: normalizedPhone,
        code,
        expiresAt,
      });

      const isProd = process.env.NODE_ENV === "production";
      console.log(
        `[PhoneVerification] code generated for ${normalizedPhone}: ${code}`,
      );

      return res.json({
        success: true,
        message: "Codigo de verificacao enviado",
        data: isProd ? undefined : { devCode: code },
      });
    } catch (error) {
      console.error("Erro ao enviar codigo de telefone:", error);
      return sendError(res, 500, "Erro ao enviar codigo", { details: error.message });
    }
  }

  async verifyPhoneCode(req, res) {
    try {
      const normalizedPhone = normalizePhone(req.body?.phone);
      const code = String(req.body?.code || "").trim();

      if (!normalizedPhone || !code) {
        return sendError(res, 400, "Telefone e codigo sao obrigatorios");
      }

      const verification = await PhoneVerification.findOne({
        phone: normalizedPhone,
        used: false,
      }).sort({ createdAt: -1 });

      if (!verification) {
        return sendError(res, 400, "Nenhum codigo valido encontrado. Solicite um novo codigo.");
      }

      if (verification.expiresAt <= new Date()) {
        verification.used = true;
        await verification.save();

        return sendError(res, 400, "Codigo expirado. Solicite um novo codigo.");
      }

      if (verification.code !== code) {
        verification.attempts = (verification.attempts || 0) + 1;
        if (verification.attempts >= 5) {
          verification.used = true;
        }
        await verification.save();

        return sendError(res, 400, "Codigo invalido");
      }

      verification.used = true;
      verification.verifiedAt = new Date();
      await verification.save();

      return res.json({
        success: true,
        message: "Telefone verificado com sucesso",
        data: { verified: true, phone: normalizedPhone },
      });
    } catch (error) {
      console.error("Erro ao verificar codigo de telefone:", error);
      return sendError(res, 500, "Erro ao verificar codigo", { details: error.message });
    }
  }

  // Salvar push token do dispositivo
  async savePushToken(req, res) {
    try {
      const { pushToken } = req.body;
      const userId = req.user.id;

      // Validar token
      if (!pushToken || typeof pushToken !== "string") {
        return sendError(res, 400, "Push token é obrigatório");
      }

      // Validar formato do token Expo
      if (
        !pushToken.startsWith("ExponentPushToken[") &&
        !pushToken.startsWith("ExpoPushToken[")
      ) {
        return sendError(res, 400, "Formato de push token inválido");
      }

      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      // Atualizar push token
      user.pushToken = pushToken;
      user.pushTokenUpdatedAt = new Date();
      await user.save();

      console.log(`Push token salvo para usuário ${user.email}: ${pushToken}`);

      res.json({
        success: true,
        message: "Push token salvo com sucesso",
        data: {
          pushToken: user.pushToken,
          pushTokenUpdatedAt: user.pushTokenUpdatedAt,
        },
      });
    } catch (error) {
      console.error("Erro ao salvar push token:", error);
      return sendError(res, 500, "Erro ao salvar push token", { details: error.message });
    }
  }

  // Remover push token (quando usuário faz logout ou desativa notificações)
  async removePushToken(req, res) {
    try {
      const userId = req.user.id;

      // Buscar usuário
      const user = await User.findById(userId);
      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      // Remover push token
      user.pushToken = null;
      user.pushTokenUpdatedAt = new Date();
      await user.save();

      console.log(`Push token removido para usuário ${user.email}`);

      res.json({
        success: true,
        message: "Push token removido com sucesso",
      });
    } catch (error) {
      console.error("Erro ao remover push token:", error);
      return sendError(res, 500, "Erro ao remover push token", { details: error.message });
    }
  }

  // Listar usuários (para admin)
  async listUsers(req, res) {
    try {
      const { userType, isActive, limit = 100, page = 1 } = req.query;

      const query = {};

      if (userType) {
        query.userType = userType;
      }

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      const users = await User.find(query)
        .select("-password")
        .limit(parseInt(limit))
        .skip((parseInt(page) - 1) * parseInt(limit))
        .sort({ createdAt: -1 });

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        users,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (error) {
      console.error("Erro ao listar usuários:", error);
      return sendError(res, 500, "Erro ao listar usuários", { details: error.message });
    }
  }

  // Buscar usuário por ID (para admin)
  async getUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findById(id).select("-password");

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      return sendError(res, 500, "Erro ao buscar usuário", { details: error.message });
    }
  }

  // Atualizar usuario por ID (admin)
  async updateUserById(req, res) {
    try {
      const { id } = req.params;
      const allowedFields = [
        "name",
        "email",
        "phone",
        "city",
        "userType",
        "isActive",
        "vehicleType",
        "vehicleInfo",
        "cpf",
        "cnpj",
      ];

      const payload = req.body || {};
      const updates = {};

      allowedFields.forEach((field) => {
        if (Object.prototype.hasOwnProperty.call(payload, field)) {
          updates[field] = payload[field];
        }
      });

      if (updates.email) {
        updates.email = String(updates.email).toLowerCase().trim();
      }

      const user = await User.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      }).select("-password");

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      return res.json({
        success: true,
        message: "Usuário atualizado com sucesso",
        user,
      });
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error);
      return sendError(res, 400, "Erro ao atualizar usuário", { details: error.message });
    }
  }

  // Deletar usuario por ID (admin)
  async deleteUserById(req, res) {
    try {
      const { id } = req.params;

      const user = await User.findByIdAndDelete(id);
      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      return res.status(204).send();
    } catch (error) {
      console.error("Erro ao deletar usuário:", error);
      return sendError(res, 500, "Erro ao deletar usuário", { details: error.message });
    }
  }

  // Enviar documentos para análise do motorista
  async submitDriverVerification(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      console.log("[BACKEND] submitDriverVerification triggered!");
      console.log("[BACKEND] Files in req:", req.files ? Object.keys(req.files) : "null/undefined");

      if (!req.files || Object.keys(req.files).length === 0) {
        console.log("[BACKEND] REJECTED: No files received!");
        return sendError(res, 400, "Nenhum documento foi enviado");
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}/uploads/drivers`;

      const documents = {
        submittedAt: new Date(),
      };

      const docKeys = ["cnhFront", "cnhBack", "crlvFront", "crlvBack", "vehiclePhoto", "selfie"];
      
      docKeys.forEach((key) => {
        if (req.files[key] && req.files[key][0]) {
          documents[key] = `${baseUrl}/${req.files[key][0].filename}`;
        }
      });

      user.driverDocuments = {
        ...(user.driverDocuments || {}),
        ...documents
      };
      user.driverStatus = "pending";
      user.userType = "driver";

      await user.save();

      return res.json({
        success: true,
        message: "Documentos enviados com sucesso. Cadastro em análise.",
        data: {
          driverStatus: user.driverStatus,
          driverDocuments: user.driverDocuments,
        },
      });
    } catch (error) {
      console.error("Erro ao enviar documentos:", error);
      return sendError(res, 500, "Erro ao processar verificação", { details: error.message });
    }
  }

  async uploadProfilePhoto(req, res) {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId);

      if (!user) {
        return sendError(res, 404, "Usuário não encontrado");
      }

      if (!req.file) {
        return sendError(res, 400, "Nenhuma imagem foi enviada");
      }

      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const baseUrl = `${protocol}://${host}/uploads/drivers`;
      const photoUrl = `${baseUrl}/${req.file.filename}`;

      user.profilePhoto = photoUrl;
      await user.save();

      return res.json({
        success: true,
        message: "Foto de perfil atualizada com sucesso",
        data: {
          user: {
            _id: user._id,
            profilePhoto: user.profilePhoto,
          },
        },
      });
    } catch (error) {
      console.error("Erro ao atualizar foto de perfil:", error);
      return sendError(res, 500, "Erro ao salvar foto de perfil", { details: error.message });
    }
  }
}

const authController = new AuthController();

module.exports = authController;
