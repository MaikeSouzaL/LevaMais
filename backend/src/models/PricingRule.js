const mongoose = require("mongoose");

const pricingRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "City", default: null },
    vehicleCategory: { type: String, enum: ["motorcycle", "car", "van", "truck"], required: true },
    purposeId: { type: mongoose.Schema.Types.ObjectId, ref: "Purpose", default: null },
    active: { type: Boolean, default: true },
    pricing: {
      minimumKm: { type: Number, default: 2 },
      minimumFee: { type: Number, default: 5 },
      pricePerKm: { type: Number, default: 1.5 },
      pricePerMinute: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

pricingRuleSchema.index({ cityId: 1, vehicleCategory: 1, purposeId: 1, active: 1 });
pricingRuleSchema.index({ cityId: 1, vehicleCategory: 1, active: 1 });

module.exports = mongoose.model("PricingRule", pricingRuleSchema);
