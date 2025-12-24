const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Nome da regra é obrigatório"],
      trim: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      required: [true, "Cidade é obrigatória"],
    },
    vehicleCategory: {
      type: String,
      required: [true, "Categoria do veículo é obrigatória"],
      enum: ["motorcycle", "car", "van", "truck"],
    },
    purposeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purpose",
    },
    // Preços base
    pricing: {
      basePrice: {
        type: Number,
        default: 0,
        min: 0,
      },
      pricePerKm: {
        type: Number,
        required: [true, "Preço por km é obrigatório"],
        min: 0,
      },
      pricePerMinute: {
        type: Number,
        default: 0,
        min: 0,
      },
      minimumPrice: {
        type: Number,
        required: [true, "Preço mínimo é obrigatório"],
        min: 0,
      },
    },
    // Taxas adicionais
    fees: {
      nightFee: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        startTime: { type: String, default: "22:00" },
        endTime: { type: String, default: "06:00" },
      },
      peakHourFee: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
        periods: [
          {
            startTime: String,
            endTime: String,
            days: [{ type: Number, min: 0, max: 6 }], // 0 = Domingo, 6 = Sábado
          },
        ],
      },
      weatherFee: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
      },
      holidayFee: {
        enabled: { type: Boolean, default: false },
        percentage: { type: Number, default: 0, min: 0, max: 100 },
      },
    },
    // Distâncias especiais
    specialDistances: {
      shortRide: {
        maxKm: { type: Number, default: 3 },
        fixedPrice: Number,
      },
      longRide: {
        minKm: { type: Number, default: 50 },
        discountPercentage: { type: Number, default: 0, min: 0, max: 100 },
      },
    },
    // Configurações
    active: {
      type: Boolean,
      default: true,
    },
    priority: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Índices
pricingRuleSchema.index({ cityId: 1, vehicleCategory: 1, purposeId: 1 });
pricingRuleSchema.index({ active: 1 });

module.exports = mongoose.model("PricingRule", pricingRuleSchema);
