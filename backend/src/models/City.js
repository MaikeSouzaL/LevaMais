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
    // Referência ao Representante (Novo Modelo)
    representativeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Representative",
      default: null
    },
    // Divisão de receita (Opcional, se quiser override do padrão global)
    // Se null, usa padrão (50/50)
    revenueSharing: {
      representativePercentage: { type: Number, default: 50 }, 
      platformPercentage: { type: Number, default: 50 }
    },
    // Estatísticas
    stats: {
      totalDrivers: { type: Number, default: 0 },
      activeDrivers: { type: Number, default: 0 },
      totalClients: { type: Number, default: 0 },
      totalRides: { type: Number, default: 0 },
      monthlyRevenue: { type: Number, default: 0 }
    },
    // Coordenadas para o centro da cidade
    coordinates: {
      latitude: Number,
      longitude: Number,
    },
  },
  {
    timestamps: true,
  }
);

citySchema.index({ name: 1, state: 1 }, { unique: true });
citySchema.index({ isActive: 1 });

module.exports = mongoose.model("City", citySchema);
