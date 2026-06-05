const mongoose = require("mongoose");

// Frete sob demanda (Modo Transportadora / T3).
// Cliente solicita um frete direto a uma transportadora → cotação → aceite/pagamento
// (hold) → execução via Ride (sourceType="freight") → release ao motorista na entrega.
const contactSchema = new mongoose.Schema(
  {
    address: { type: String, default: "" },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    contactName: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
  },
  { _id: false },
);

const freightRequestSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cliente é obrigatório"],
      index: true,
    },
    carrierId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Carrier",
      required: [true, "Transportadora é obrigatória"],
      index: true,
    },
    driverId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true }, // denormalizado
    pickup: { type: contactSchema, default: () => ({}) },
    dropoff: { type: contactSchema, default: () => ({}) },
    item: {
      description: { type: String, default: "" },
      size: { type: String, enum: ["small", "medium", "large"], default: "small" },
      weightKg: { type: Number, min: 0, default: 0 },
      declaredValue: { type: Number, min: 0, default: 0 },
    },
    desiredDate: { type: Date, default: null },
    notes: { type: String, default: "" },
    // Cotação enviada pela transportadora
    quote: {
      price: { type: Number, default: null },
      message: { type: String, default: "" },
      quotedAt: { type: Date, default: null },
    },
    // Quebra financeira (calculada no aceite, a partir de quote.price)
    pricing: {
      price: { type: Number, default: 0 },
      commissionPct: { type: Number, default: 0 },
      commissionAmount: { type: Number, default: 0 },
      driverPayout: { type: Number, default: 0 },
    },
    payment: {
      method: { type: String, enum: ["wallet", "pix", "card", "cash"], default: "wallet" },
      escrow: {
        status: { type: String, enum: ["none", "reserved", "released", "refunded", "failed"], default: "none" },
        amount: { type: Number, default: 0 },
        reservedAt: { type: Date, default: null },
        releasedAt: { type: Date, default: null },
        refundedAt: { type: Date, default: null },
      },
    },
    rideId: { type: mongoose.Schema.Types.ObjectId, ref: "Ride", default: null, index: true },
    status: {
      type: String,
      enum: [
        "requested",
        "quoted",
        "accepted",
        "rejected",
        "cancelled",
        "in_transit",
        "delivered",
        "completed",
        "refunded",
        "expired",
      ],
      default: "requested",
      index: true,
    },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now }, note: String }],
  },
  { timestamps: true },
);

freightRequestSchema.index({ carrierId: 1, status: 1, createdAt: -1 });
freightRequestSchema.index({ clientId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("FreightRequest", freightRequestSchema);
