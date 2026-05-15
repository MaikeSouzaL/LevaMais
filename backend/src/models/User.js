const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome Ã© obrigatÃ³rio"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email Ã© obrigatÃ³rio"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um email vÃ¡lido",
      ],
    },
    password: {
      type: String,
      required: function () {
        // Senha Ã© obrigatÃ³ria apenas se nÃ£o for login com Google
        return !this.googleId;
      },
      minlength: [6, "Senha deve ter no mÃ­nimo 6 caracteres"],
      select: false, // NÃ£o retornar senha por padrÃ£o
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    // Documentos
    cpf: {
      type: String,
      trim: true,
      sparse: true,
    },
    cnpj: {
      type: String,
      trim: true,
      sparse: true,
    },
    // Dados da empresa (se CNPJ)
    companyName: {
      type: String,
      trim: true,
    },
    companyEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    companyPhone: {
      type: String,
      trim: true,
    },
    // EndereÃ§o
    address: {
      street: { type: String, trim: true },
      number: { type: String, trim: true },
      complement: { type: String, trim: true },
      neighborhood: { type: String, trim: true },
      city: { type: String, trim: true },
      state: { type: String, trim: true, maxlength: 2 },
      zipCode: { type: String, trim: true },
      referencePoint: { type: String, trim: true },
      latitude: { type: Number },
      longitude: { type: Number },
    },
    // EndereÃ§os favoritos
    favoriteAddresses: [
      {
        name: { type: String, required: true, trim: true }, // ex: "Casa", "Trabalho", "Academia"
        icon: { type: String, default: "home" }, // home, work, favorite, shopping-cart, school, restaurant, gym
        
        // EndereÃ§o completo formatado
        formattedAddress: { type: String, trim: true },
        
        // Componentes do endereÃ§o
        street: { type: String, trim: true },
        streetNumber: { type: String, trim: true },
        address: { type: String, required: true, trim: true },
        neighborhood: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        region: { type: String, trim: true }, 
        postalCode: { type: String, trim: true },
        
        // Coordenadas
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true },
        
        createdAt: { type: Date, default: Date.now },
      },
    ],
    paymentMethods: [
      {
        brand: { type: String, trim: true },
        last4: { type: String, trim: true },
        holderName: { type: String, trim: true },
        expiryMonth: { type: Number, min: 1, max: 12 },
        expiryYear: { type: Number, min: 0, max: 99 },
        token: { type: String, trim: true },
        isDefault: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    wallet: {
      balance: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: ["topup", "ride_payment", "refund", "adjustment"],
          },
          amount: { type: Number, required: true },
          description: { type: String, trim: true },
          createdAt: { type: Date, default: Date.now },
          referenceId: { type: String, trim: true },
        },
      ],
    },
    // Saldo do Motorista (para trabalhar com o sistema de depósito)
    driverBalance: {
      balance: { type: Number, default: 0 },
      totalDeposits: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: ["deposit", "deduction", "withdrawal"],
          },
          amount: { type: Number, required: true },
          description: { type: String, trim: true },
          rideId: { type: String, trim: true },
          pixKey: { type: String, trim: true },
          status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
          createdAt: { type: Date, default: Date.now },
        },
      ],
    },
    driverPreferences: {
      serviceTypes: {
        type: [String],
        enum: ["ride", "delivery"],
        default: ["ride", "delivery"],
      },
      selectedVehicles: {
        type: [String],
        enum: ["motorcycle", "car", "van", "truck"],
        default: [],
      },
      searchRadiusKm: {
        type: Number,
        default: 15,
        min: 1,
        max: 300,
      },
      autoAccept: {
        type: Boolean,
        default: false,
      },
    },
    // Preferências
    preferredPayment: {
      type: String,
      enum: ["pix", "cash", "card"],
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    queueRedispatchInterval: {
      type: Number,
      default: null // null significa usar o padrão do sistema (PlatformConfig)
    },
    userType: {
      type: String,
      enum: ["client", "driver", "admin"],
      default: "client",
    },
    // Dados especÃ­ficos do motorista
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
    },
    vehicleInfo: {
      plate: String,
      model: String,
      color: String,
      year: Number,
    },
    googleId: {
      type: String,
      sparse: true, // Permite mÃºltiplos documentos sem esse campo
    },
    profilePhoto: {
      type: String,
    },
    acceptedTerms: {
      type: Boolean,
      default: false,
    },
    acceptedTermsAt: {
      type: Date,
    },
    acceptedPrivacyAt: {
      type: Date,
    },
    consentVersion: {
      type: String,
      trim: true,
      default: "2026-05-14",
    },
    termsVersion: {
      type: String,
      trim: true,
      default: "2026-05-14",
    },
    privacyPolicyVersion: {
      type: String,
      trim: true,
      default: "2026-05-14",
    },
    consentRevokedAt: {
      type: Date,
    },
    // Push Notifications
    pushToken: {
      type: String,
      trim: true,
    },
    pushTokenUpdatedAt: {
      type: Date,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    accountDeletionRequestedAt: {
      type: Date,
    },
    accountDeletionCompletedAt: {
      type: Date,
    },
    accountDeletionReason: {
      type: String,
      trim: true,
    },
    accountDeletionStatus: {
      type: String,
      enum: ["none", "requested", "completed"],
      default: "none",
    },
    // Status do Fluxo do Motorista
    driverStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    // Fotos e Documentos físicos (armazenar caminho no servidor/bucket)
    driverDocuments: {
      cnhFront: { type: String },
      cnhBack: { type: String },
      crlvFront: { type: String },
      crlvBack: { type: String },
      vehiclePhoto: { type: String },
      selfie: { type: String },
      submittedAt: { type: Date },
    },
    // ConfiguraÃ§Ã£o de qualidade do GPS para economia de bateria
    gpsQuality: {
      type: String,
      enum: ["low", "balanced", "high"],
      default: "high",
    },
    // MÃ©tricas exatas de tempo online acumulado
    onlineStats: {
      totalSecondsToday: { type: Number, default: 0 },
      lastHeartbeatAt: { type: Date, default: Date.now },
      activeDateStr: { type: String, default: "" },
      isOnline: { type: Boolean, default: false },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Hash da senha antes de salvar
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// MÃ©todo para comparar senha
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

// MÃ©todo para remover campos sensÃ­veis do JSON
userSchema.methods.toJSON = function () {
  const userObject = this.toObject();
  delete userObject.password;
  return userObject;
};

const User = mongoose.model("User", userSchema);

module.exports = User;
