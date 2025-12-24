const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome da cidade é obrigatório"],
      trim: true,
    },
    state: {
      type: String,
      required: [true, "Estado é obrigatório"],
      trim: true,
      maxlength: 2,
      uppercase: true,
    },
    region: {
      type: String,
      enum: ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"],
      trim: true,
    },
    ibgeCode: {
      type: String,
      trim: true,
    },
    timezone: {
      type: String,
      required: [true, "Fuso horário é obrigatório"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Configurações operacionais
    operatingHours: {
      start: {
        type: String,
        default: "00:00",
      },
      end: {
        type: String,
        default: "23:59",
      },
    },
    // Representante da cidade
    representative: {
      name: {
        type: String,
        trim: true,
      },
      email: {
        type: String,
        trim: true,
        lowercase: true,
      },
      phone: {
        type: String,
        trim: true,
      },
    },
    // Divisão de receita
    revenueSharing: {
      representativePercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      platformPercentage: {
        type: Number,
        default: 50,
        min: 0,
        max: 100,
      },
      minimumMonthlyFee: {
        type: Number,
        default: 0,
        min: 0,
      },
      paymentDay: {
        type: Number,
        default: 5,
        min: 1,
        max: 31,
      },
    },
    // Estatísticas
    stats: {
      totalDrivers: {
        type: Number,
        default: 0,
      },
      activeDrivers: {
        type: Number,
        default: 0,
      },
      totalClients: {
        type: Number,
        default: 0,
      },
      totalRides: {
        type: Number,
        default: 0,
      },
    },
    // Coordenadas para o centro da cidade
    coordinates: {
      latitude: {
        type: Number,
      },
      longitude: {
        type: Number,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Validação: soma das porcentagens deve ser 100%
citySchema.pre("save", function (next) {
  const rep = this.revenueSharing?.representativePercentage ?? 0;
  const platform = this.revenueSharing?.platformPercentage ?? 0;
  const total = rep + platform;
  if (total !== 100) {
    return next(new Error("A soma das porcentagens de divisão deve ser 100%"));
  }
  next();
});

// Índices
citySchema.index({ name: 1, state: 1 }, { unique: true });
citySchema.index({ isActive: 1 });

module.exports = mongoose.model("City", citySchema);
