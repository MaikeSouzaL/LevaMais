const mongoose = require("mongoose");

/**
 * RideCategory — categorias e precificação EXCLUSIVAS do fluxo de Corrida (ride).
 *
 * IMPORTANTE: É totalmente separado de `PricingRule` (que é só para Entrega/delivery).
 * Não misturar lógicas/cálculos de corrida com entrega.
 *
 * Categorias suportadas (estilo Uber):
 *  - moto         (motocicleta)
 *  - car_economy  (carro econômico / simples)
 *  - car_comfort  (carro confort)
 *  - car_luxury   (carro de luxo)
 *
 * Os valores ficam salvos no banco para que a dashboard administrativa controle tudo.
 */

const RIDE_CATEGORIES = ["moto", "car_economy", "car_comfort", "car_luxury"];

const rideCategorySchema = new mongoose.Schema(
  {
    // Chave da categoria (única por cidade)
    category: {
      type: String,
      enum: RIDE_CATEGORIES,
      required: true,
    },
    // Rótulo exibido ao usuário (ex.: "Comfort")
    label: { type: String, required: true },
    description: { type: String, default: "" },
    // Ícone (nome do ícone usado no app)
    icon: { type: String, default: "directions-car" },
    // Tipo de veículo base mapeado para o modelo Ride (motorcycle|car)
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car"],
      required: true,
    },
    // Cidade (null = regra global)
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    active: { type: Boolean, default: true },
    // Ordem de exibição na lista
    order: { type: Number, default: 0 },
    // Precificação independente de corrida
    pricing: {
      minimumKm: { type: Number, default: 2 },
      minimumFee: { type: Number, default: 5 },
      pricePerKm: { type: Number, default: 1.6 },
      pricePerMinute: { type: Number, default: 0 },
      // Multiplicador da categoria (luxo > comfort > economy > moto)
      multiplier: { type: Number, default: 1.0 },
      // Taxa fixa por parada adicional
      feePerStop: { type: Number, default: 2 },
    },
    // Quantidade máxima de passageiros (informativo)
    maxPassengers: { type: Number, default: 4 },
  },
  { timestamps: true }
);

rideCategorySchema.index({ cityId: 1, category: 1, active: 1 }, { unique: false });
rideCategorySchema.index({ category: 1, active: 1 });

rideCategorySchema.statics.CATEGORIES = RIDE_CATEGORIES;

module.exports = mongoose.model("RideCategory", rideCategorySchema);
module.exports.RIDE_CATEGORIES = RIDE_CATEGORIES;
