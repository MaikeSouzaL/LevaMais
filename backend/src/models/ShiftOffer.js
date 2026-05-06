const mongoose = require("mongoose");

const shiftOfferSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "City",
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "car", "van", "truck"],
      default: "motorcycle",
    },
    dailyAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    fuelIncluded: {
      type: Boolean,
      default: false,
    },
    startAt: {
      type: Date,
      required: true,
    },
    endAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "accepted", "completed", "cancelled", "expired"],
      default: "open",
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedAt: Date,
  },
  {
    timestamps: true,
  },
);

shiftOfferSchema.index({ clientId: 1, createdAt: -1 });
shiftOfferSchema.index({ acceptedBy: 1, startAt: 1, endAt: 1, status: 1 });
shiftOfferSchema.index({ status: 1, startAt: 1, endAt: 1, vehicleType: 1 });
shiftOfferSchema.index({ cityId: 1, status: 1, startAt: 1 });

const ShiftOffer = mongoose.model("ShiftOffer", shiftOfferSchema);

module.exports = ShiftOffer;
