const mongoose = require("mongoose");

// Indicação (referral) — Fase D. Gap total: não existia nada no projeto.
// Regra: crédito em carteira do indicador após a 1ª conclusão paga do indicado.
const referralSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, "Código é obrigatório"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    referrerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Indicador é obrigatório"],
      index: true,
    },
    // Indicado — preenchido no cadastro de quem usou o código
    refereeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded", "expired"],
      default: "pending",
      index: true,
    },
    rewardAmount: { type: Number, min: 0, default: 0 }, // crédito em carteira ao qualificar
    // Ride/StoreOrder/RouteReservation que qualificou (1ª conclusão paga)
    qualifyingRefId: { type: mongoose.Schema.Types.ObjectId, default: null },
    qualifyingRefType: {
      type: String,
      enum: ["ride", "store_order", "route_reservation", null],
      default: null,
    },
    rewardedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

referralSchema.index({ referrerId: 1, status: 1 });

module.exports = mongoose.model("Referral", referralSchema);
