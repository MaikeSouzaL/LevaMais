const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// 🔐 SECURITY CONFIGURATION
const _RAW_ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!_RAW_ENCRYPTION_KEY) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("ENCRYPTION_KEY environment variable is required in production");
  }
  console.warn("[User Model] ENCRYPTION_KEY not set — using dev fallback. CPF/CNPJ encryption is NOT secure in this mode.");
}
const ENCRYPTION_KEY = _RAW_ENCRYPTION_KEY || "d6f9a2e1b4c7d0e3f6a9b2c5d8e1f4a7"; // Must be 32 bytes — dev fallback only
const IV_LENGTH = 16; 

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(text) {
  if (!text || typeof text !== "string" || !text.includes(":")) return text;
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(ENCRYPTION_KEY), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}

function generateHash(text) {
  if (!text) return text;
  return crypto.createHash("sha256").update(text).digest("hex");
}

const vehicleSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: [true, "Tipo de veículo é obrigatório"],
    },
    plate: { type: String, required: [true, "Placa é obrigatória"], uppercase: true, trim: true },
    model: { type: String, required: [true, "Modelo é obrigatório"], trim: true },
    color: { type: String, trim: true },
    year: { type: Number },
    renavam: { type: String, trim: true },
    
    // Campos Oficiais da API de Consulta de Placa
    officialBrand: { type: String, trim: true },
    officialChassis: { type: String, trim: true },
    officialColor: { type: String, trim: true },
    officialModel: { type: String, trim: true },
    officialYear: { type: Number },
    isVerifiedByAPI: { type: Boolean, default: false },
    plateVerifiedByAPI: { type: Boolean, default: false },
    plateVerificationSource: { type: String, enum: ["api", "fallback", "manual", "unchecked"], default: "unchecked" },
    
    // Documentação específica por veículo
    documents: {
      crlvFront: { type: String },
      crlvBack: { type: String },
      vehiclePhoto: { type: String },
      submittedAt: { type: Date, default: Date.now },
    },

    // Status de aprovação deste veículo específico
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    rejectionReason: { type: String, trim: true },
    vehicleDocumentsStatus: {
      crlvFront: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      crlvBack: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      vehiclePhoto: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
    },
  },
  {
    timestamps: true,
  }
);


const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome é obrigatório"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email é obrigatório"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Por favor, informe um email válido",
      ],
    },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      minlength: [6, "Senha deve ter no mínimo 6 caracteres"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
    },
    phoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneVerifiedAt: {
      type: Date,
      default: null,
    },
    lastPhoneVerificationMethod: {
      type: String,
      enum: ["sms", "whatsapp", "voice", "manual"],
      default: "sms",
    },
    city: {
      type: String,
      trim: true,
    },
    tourSeen: {
      type: Boolean,
      default: false,
    },
    // Documentos
    cpf: {
      type: String,
      trim: true,
      sparse: true,
      get: decrypt,
      set: encrypt,
    },
    cpfHash: {
      type: String,
      index: true,
      sparse: true,
    },
    cnpj: {
      type: String,
      trim: true,
      sparse: true,
      get: decrypt,
      set: encrypt,
    },
    cnpjHash: {
      type: String,
      index: true,
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

    // Campos de Auditoria e Validação via APIs Oficiais (CPF/CNPJ)
    officialCpfName: { type: String, trim: true },
    isCpfVerified: { type: Boolean, default: false },
    cpfVerifiedByAPI: { type: Boolean, default: false },

    officialCnpjRazaoSocial: { type: String, trim: true },
    officialCnpjNomeFantasia: { type: String, trim: true },
    officialCnpjCity: { type: String, trim: true },
    officialCnpjState: { type: String, trim: true },
    officialCnpjStatus: { type: String, trim: true },
    isCnpjVerified: { type: Boolean, default: false },
    cnpjVerifiedByAPI: { type: Boolean, default: false },

    // Verificacao do cliente (documentos, selfie, status)
    clientVerification: {
      status: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      cpfStatus: {
        type: String,
        enum: ["unchecked", "valid", "invalid", "manual_review"],
        default: "unchecked",
      },
      selfieStatus: {
        type: String,
        enum: ["none", "pending", "approved", "rejected"],
        default: "none",
      },
      documents: {
        selfie: { type: String },
        rgFront: { type: String },
        rgBack: { type: String },
      },
      rejectionReason: { type: String, trim: true },
      submittedAt: { type: Date },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewHistory: [{
        action: { type: String, enum: ["approved", "rejected"] },
        reason: { type: String, trim: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date, default: Date.now },
      }],
    },

    // Endereço
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
    // Endereços favoritos
    favoriteAddresses: [
      {
        name: { type: String, required: true, trim: true },
        icon: { type: String, default: "home" },
        
        formattedAddress: { type: String, trim: true },
        
        street: { type: String, trim: true },
        streetNumber: { type: String, trim: true },
        address: { type: String, required: true, trim: true },
        neighborhood: { type: String, trim: true },
        city: { type: String, trim: true },
        state: { type: String, trim: true },
        region: { type: String, trim: true }, 
        postalCode: { type: String, trim: true },
        
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
    driverBalance: {
      balance: { type: Number, default: 0 },
      totalDeposits: { type: Number, default: 0 },
      totalDeductions: { type: Number, default: 0 },
      operationalCredit: { type: Number, default: 0 },
      pendingReceivables: { type: Number, default: 0 },
      transactions: [
        {
          type: {
            type: String,
            enum: [
              "driver_topup",
              "client_in_app_payment",
              "app_fee_debit",
              "withdrawal",
              "refund",
              "manual_adjustment",
              "fee_reserve",
              "fee_release",
              "deposit",
              "deduction",
            ],
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
      acceptsCardMachine: {
        type: Boolean,
        default: false,
      },
      acceptsCash: {
        type: Boolean,
        default: true,
      },
      acceptsPix: {
        type: Boolean,
        default: true,
      },
    },
    preferredPayment: {
      type: String,
      enum: ["pix", "cash", "card"],
    },
    notificationsEnabled: {
      type: Boolean,
      default: true,
    },
    enableMapAnimation: {
      type: Boolean,
      default: true,
    },
    mapTheme: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    queueRedispatchInterval: {
      type: Number,
      default: null
    },
    userType: {
      type: String,
      enum: ["client", "driver", "admin"],
    },
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
    activeVehicleId: {
      type: mongoose.Schema.Types.ObjectId,
    },
    vehicles: [vehicleSchema],
    googleId: {
      type: String,
      sparse: true,
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
    driverStatus: {
      type: String,
      enum: ["none", "pending", "approved", "rejected"],
      default: "none",
    },
    driverDocuments: {
      cnhFront: { type: String },
      cnhBack: { type: String },
      crlvFront: { type: String },
      crlvBack: { type: String },
      vehiclePhoto: { type: String },
      selfie: { type: String },
      submittedAt: { type: Date },
      rejectionReason: { type: String, trim: true },
      cnhFrontStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      cnhBackStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      selfieStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      cpfStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      bankAccountStatus: { type: String, enum: ["none", "pending", "approved", "rejected"], default: "pending" },
      reviewedAt: { type: Date },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewHistory: [{
        documentType: { type: String },
        action: { type: String, enum: ["approved", "rejected"] },
        reason: { type: String, trim: true },
        reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reviewedAt: { type: Date, default: Date.now },
      }],
    },
    gpsQuality: {
      type: String,
      enum: ["low", "balanced", "high"],
      default: "high",
    },
    onlineStats: {
      totalSecondsToday: { type: Number, default: 0 },
      lastHeartbeatAt: { type: Date, default: Date.now },
      activeDateStr: { type: String, default: "" },
      isOnline: { type: Boolean, default: false },
    },
    lastLocation: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    ratingStats: {
      averageStars: { type: Number, default: 0 },
      totalRatings: { type: Number, default: 0 },
      starDistribution: {
        "1": { type: Number, default: 0 },
        "2": { type: Number, default: 0 },
        "3": { type: Number, default: 0 },
        "4": { type: Number, default: 0 },
        "5": { type: Number, default: 0 },
      },
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
    toJSON: { getters: true, transform: (doc, ret) => { delete ret.password; delete ret.cpfHash; delete ret.cnpjHash; return ret; } },
    toObject: { getters: true }
  }
);

userSchema.virtual("rating").get(function () {
  return this.ratingStats && this.ratingStats.totalRatings > 0
    ? this.ratingStats.averageStars
    : 5.0;
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password") && this.password) {
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    } catch (error) {
      return next(error);
    }
  }

  if (this.isModified("cpf") && this.cpf) {
    const rawCpf = this.cpf.includes(":") ? decrypt(this.cpf) : this.cpf;
    this.cpfHash = generateHash(rawCpf);
  }

  if (this.isModified("cnpj") && this.cnpj) {
    const rawCnpj = this.cnpj.includes(":") ? decrypt(this.cnpj) : this.cnpj;
    this.cnpjHash = generateHash(rawCnpj);
  }

  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) {
    return false;
  }
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
