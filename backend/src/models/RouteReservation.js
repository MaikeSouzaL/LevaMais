const mongoose = require("mongoose");

// Reserva de espaço de um cliente numa rota planejada — Fase D.
// O hold do escrow fica AQUI (retido na reserva); ao ser aceita, gera um Ride vinculado à rota.
const routeReservationSchema = new mongoose.Schema(
  {
    routeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverRoute",
      required: [true, "Rota é obrigatória"],
      index: true,
    },
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Cliente é obrigatório"],
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      default: null,
    }, // denormalizado da rota
    item: {
      type: { type: String, default: "" }, // documents | groceries | parts | package
      description: { type: String, default: "" },
      size: {
        type: String,
        enum: ["small", "medium", "large"],
        default: "small",
      },
      weightKg: { type: Number, min: 0, default: 0 },
      declaredValue: { type: Number, min: 0, default: 0 }, // base p/ seguro/garantia
    },
    pickup: {
      address: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      contactName: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
    },
    dropoff: {
      address: { type: String, default: "" },
      latitude: { type: Number, default: null },
      longitude: { type: Number, default: null },
      contactName: { type: String, default: "" },
      contactPhone: { type: String, default: "" },
    },
    pricing: {
      price: { type: Number, min: 0, default: 0 },
      commissionPct: { type: Number, default: 0 }, // comissão da plataforma sobre a reserva
      commissionAmount: { type: Number, default: 0 },
      driverPayout: { type: Number, default: 0 }, // price − commission
      promotionCode: { type: String, default: "" },
      discountAmount: { type: Number, default: 0 },
    },
    payment: {
      method: {
        type: String,
        enum: ["wallet", "pix", "card", "cash"],
        default: "wallet",
      },
      escrow: {
        status: {
          type: String,
          enum: ["none", "reserved", "released", "refunded", "failed"],
          default: "none",
        },
        amount: { type: Number, default: 0 },
        reservedAt: { type: Date, default: null },
        releasedAt: { type: Date, default: null },
        refundedAt: { type: Date, default: null },
      },
    },
    // Entrega executada vinculada à rota (motor Ride)
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      default: null,
      index: true,
    },
    status: {
      type: String,
      enum: [
        "requested",
        "accepted",
        "rejected",
        "awaiting_pickup",
        "in_transit",
        "delivered",
        "completed",
        "cancelled",
        "refunded",
      ],
      default: "requested",
      index: true,
    },
    statusHistory: [
      { status: String, at: { type: Date, default: Date.now }, note: String },
    ],
  },
  { timestamps: true },
);

routeReservationSchema.index({ routeId: 1, status: 1 });
routeReservationSchema.index({ clientId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("RouteReservation", routeReservationSchema);
