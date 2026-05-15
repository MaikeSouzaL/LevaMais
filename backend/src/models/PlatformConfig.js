const mongoose = require("mongoose");

// Configurações Globais da Plataforma
// Substitui o antigo PricingConfig complexo
const platformConfigSchema = new mongoose.Schema(
  {
    // Taxa padrão do App (ex: 15 ou 20)
    appFeePercentage: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    // Configurações de Split
    splitRules: {
      representativeShare: {
        type: Number,
        default: 50, // 50% do lucro da cidade vai pro representante
        min: 0,
        max: 100
      }
    },
    // Outras configs globais futuras (ex: raio de busca padrão)
    defaultSearchRadius: {
      type: Number,
      default: 5000 // metros
    },
    queueRedispatchInterval: {
      type: Number,
      default: 60 // segundos entre reenvios da fila de espera
    },
    rideSearchTimeoutSeconds: {
      type: Number,
      default: 60 // tempo de busca padrao em segundos
    },
    driverGoals: {
      dailyGoalRides: {
        type: Number,
        default: 10,
        min: 1,
      },
      dailyBonusAmount: {
        type: Number,
        default: 20,
        min: 0,
      },
    },
    supportChannels: {
      phone: {
        type: String,
        default: "0800123456",
      },
      email: {
        type: String,
        default: "suporte@levamais.app",
      },
      whatsapp: {
        type: String,
        default: "5500000000000",
      },
      helpCenterUrl: {
        type: String,
        default: "",
      },
    },
    policyVersions: {
      termsVersion: {
        type: String,
        default: "2026-05-14",
      },
      privacyPolicyVersion: {
        type: String,
        default: "2026-05-14",
      },
      consentVersion: {
        type: String,
        default: "2026-05-14",
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PlatformConfig", platformConfigSchema);
