const mongoose = require("mongoose");

const vehiclePricingSchema = new mongoose.Schema(
  {
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      required: true,
    },
    basePrice: { type: Number, default: 0, min: 0 },
    pricePerKm: { type: Number, required: true, min: 0 },
    pricePerMinute: { type: Number, default: 0, min: 0 },
    minimumKm: { type: Number, required: true, min: 0 },
    minimumFee: { type: Number, default: 0, min: 0 },
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const peakHourSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    dayOfWeek: [{ type: Number, min: 0, max: 6 }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    multiplier: { type: Number, default: 1, min: 1, max: 5 },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const cancellationFeeSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["client", "driver"], required: true },
    timeLimit: { type: Number, default: 0 },
    feePercentage: { type: Number, default: 0 },
    minimumFee: { type: Number, default: 0 },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const platformSettingsSchema = new mongoose.Schema(
  {
    platformFeePercentage: { type: Number, default: 15, min: 0, max: 50 },
    searchRadius: { type: Number, default: 10, min: 1, max: 50 },
    driverTimeoutSeconds: { type: Number, default: 30, min: 10, max: 120 },
    maxDriversToNotify: { type: Number, default: 5, min: 1, max: 100 },
    autoAcceptRadius: { type: Number, default: 2, min: 0, max: 50 },
  },
  { _id: false }
);

const purposePricingSchema = new mongoose.Schema(
  {
    purposeId: { type: mongoose.Schema.Types.ObjectId, ref: "Purpose" },
    purposeName: { type: String },
    additionalPercentage: { type: Number, default: 0 },
    additionalFixed: { type: Number, default: 0 },
    enabled: { type: Boolean, default: false },
  },
  { _id: false }
);

const pricingConfigSchema = new mongoose.Schema(
  {
    vehiclePricing: [vehiclePricingSchema],
    peakHours: [peakHourSchema],
    cancellationFees: [cancellationFeeSchema],
    platformSettings: platformSettingsSchema,
    purposePricing: [purposePricingSchema],
    updatedBy: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PricingConfig", pricingConfigSchema);
