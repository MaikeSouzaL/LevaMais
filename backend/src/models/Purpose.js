const mongoose = require("mongoose");

const purposeSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    vehicleType: { type: String, enum: ["motorcycle", "car", "van", "truck"], default: "car" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

purposeSchema.index({ vehicleType: 1, isActive: 1 });
purposeSchema.index({ id: 1, vehicleType: 1 });

module.exports = mongoose.model("Purpose", purposeSchema);
