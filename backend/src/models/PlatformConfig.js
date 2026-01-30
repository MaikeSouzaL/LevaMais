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
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PlatformConfig", platformConfigSchema);
