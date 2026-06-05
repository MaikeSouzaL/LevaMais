const mongoose = require("mongoose");

// Loja digital de um parceiro (cardápio/catálogo, horários, geo) — Fase D.
// location é o ponto de COLETA das entregas; usa GeoJSON Point + índice 2dsphere para findNearby.
const storeSchema = new mongoose.Schema(
  {
    partnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Partner",
      required: [true, "Parceiro é obrigatório"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Nome da loja é obrigatório"],
      trim: true,
    },
    slug: { type: String, unique: true, lowercase: true, trim: true }, // URL pública (web marketplace)
    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Categoria é obrigatória"],
      index: true,
    },
    description: { type: String, default: "" },
    logo: { type: String, default: "" },
    cover: { type: String, default: "" },
    address: {
      street: { type: String, default: "" },
      number: { type: String, default: "" },
      complement: { type: String, default: "" },
      neighborhood: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
    },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      index: true,
      default: null,
    },
    // Comissão override (%). Precede a categoria; ver fluxo financeiro Fase D.
    commissionPct: { type: Number, min: 0, max: 100, default: null },
    // Horário de funcionamento (weekday 0-6, "HH:mm")
    hours: [
      {
        weekday: { type: Number, min: 0, max: 6 },
        open: String,
        close: String,
      },
    ],
    isOpenManualOverride: {
      type: String,
      enum: ["auto", "force_open", "force_closed"],
      default: "auto",
    },
    prepTimeMinutes: { type: Number, min: 0, default: 25 }, // SLA base de preparo
    minOrderValue: { type: Number, min: 0, default: 0 },
    deliveryMode: {
      type: String,
      enum: ["platform", "pickup", "both"],
      default: "platform",
    },
    rating: {
      average: { type: Number, min: 0, max: 5, default: 0 },
      count: { type: Number, min: 0, default: 0 },
    },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["active", "paused", "under_review", "blocked"],
      default: "under_review",
      index: true,
    },
  },
  { timestamps: true },
);

storeSchema.index({ location: "2dsphere" });
storeSchema.index({ cityId: 1, status: 1, categoryId: 1 });

module.exports = mongoose.model("Store", storeSchema);
