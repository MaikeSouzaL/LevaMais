const mongoose = require("mongoose");

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    state: { type: String, default: "" },
    stateCode: { type: String, default: "" },
    country: { type: String, default: "BR" },
    isActive: { type: Boolean, default: true },
    center: {
      latitude: { type: Number },
      longitude: { type: Number },
    },
    defaultVehicleType: { type: String, enum: ["motorcycle", "car", "van", "truck"], default: "car" },
  },
  { timestamps: true }
);

citySchema.index({ name: 1, state: 1 });
citySchema.index({ isActive: 1 });

module.exports = mongoose.model("City", citySchema);
