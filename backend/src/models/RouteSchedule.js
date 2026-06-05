const mongoose = require("mongoose");

// Agenda de rota recorrente (Modo Transportadora / T2).
// Gera DriverRoute automaticamente nos dias/horário configurados.
const geoPointSchema = new mongoose.Schema(
  {
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    label: { type: String, default: "" },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], default: undefined },
    },
  },
  { _id: false },
);

const routeScheduleSchema = new mongoose.Schema(
  {
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Motorista é obrigatório"],
      index: true,
    },
    carrierId: { type: mongoose.Schema.Types.ObjectId, ref: "Carrier", default: null },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: true,
    },
    origin: { type: geoPointSchema, required: true },
    destination: { type: geoPointSchema, required: true },
    waypoints: { type: [geoPointSchema], default: [] },
    // Dias da semana (0=domingo ... 6=sábado) e horário de partida "HH:mm"
    daysOfWeek: { type: [Number], default: [] },
    departTime: { type: String, default: "08:00" },
    capacity: {
      maxItems: { type: Number, min: 0, default: 10 },
      maxWeightKg: { type: Number, min: 0, default: 50 },
      maxVolumeL: { type: Number, min: 0, default: 100 },
      acceptedItemTypes: { type: [String], default: [] },
    },
    pricing: {
      basePrice: { type: Number, min: 0, default: 0 },
      pricePerKg: { type: Number, min: 0, default: 0 },
      sizeMultipliers: {
        small: { type: Number, default: 1 },
        medium: { type: Number, default: 1.2 },
        large: { type: Number, default: 1.5 },
      },
    },
    active: { type: Boolean, default: true, index: true },
    lastGeneratedDate: { type: Date, default: null },
  },
  { timestamps: true },
);

routeScheduleSchema.index({ driverId: 1, active: 1 });

module.exports = mongoose.model("RouteSchedule", routeScheduleSchema);
