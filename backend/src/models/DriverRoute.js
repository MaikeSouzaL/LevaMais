const mongoose = require("mongoose");

// Rota futura publicada por um motorista (maloteiro/transportadora colaborativa) — Fase D.
// Cada RouteReservation aceita gera uma entrega (Ride) vinculada por plannedRouteId.
const geoPointSchema = new mongoose.Schema(
  {
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    label: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined }, // [lng, lat]
    },
  },
  { _id: false },
);

const driverRouteSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Motorista é obrigatório"],
      index: true,
    },
    // Agenda recorrente que gerou esta rota (modo transportadora / T2). null = avulsa.
    scheduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "RouteSchedule",
      default: null,
      index: true,
    },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: [true, "Tipo de veículo é obrigatório"],
    },
    origin: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, required: true },
    // Cidades intermediárias atendidas (descoberta por proximidade)
    waypoints: { type: [geoPointSchema], default: [] },
    departAt: {
      type: Date,
      required: [true, "Data/hora de partida é obrigatória"],
      index: true,
    },
    arriveEstimateAt: { type: Date, default: null },
    capacity: {
      maxItems: { type: Number, min: 0, default: 10 },
      maxWeightKg: { type: Number, min: 0, default: 50 },
      maxVolumeL: { type: Number, min: 0, default: 100 },
      acceptedItemTypes: { type: [String], default: [] }, // ["documents","parts","packages","groceries"]
    },
    capacityUsed: {
      items: { type: Number, min: 0, default: 0 },
      weightKg: { type: Number, min: 0, default: 0 },
      volumeL: { type: Number, min: 0, default: 0 },
    },
    // Precificação da rota (base + regra por tamanho/peso)
    pricing: {
      basePrice: { type: Number, min: 0, default: 0 },
      pricePerKg: { type: Number, min: 0, default: 0 },
      sizeMultipliers: {
        small: { type: Number, default: 1 },
        medium: { type: Number, default: 1.2 },
        large: { type: Number, default: 1.5 },
      },
      dynamicEnabled: { type: Boolean, default: false }, // precificação dinâmica por ocupação
    },
    status: {
      type: String,
      enum: ["draft", "published", "in_transit", "completed", "cancelled"],
      default: "draft",
      index: true,
    },
    statusHistory: [
      { status: String, at: { type: Date, default: Date.now }, note: String },
    ],
  },
  { timestamps: true },
);

driverRouteSchema.index({ "origin.location": "2dsphere" });
driverRouteSchema.index({ "destination.location": "2dsphere" });
driverRouteSchema.index({ departAt: 1, status: 1 });
driverRouteSchema.index({ driverId: 1, status: 1 });

module.exports = mongoose.model("DriverRoute", driverRouteSchema);
