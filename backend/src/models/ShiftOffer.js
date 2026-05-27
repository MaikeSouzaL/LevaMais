const mongoose = require("mongoose");

const ShiftOfferSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cityId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
      trim: true,
    },
    vehicleType: {
      type: String,
      default: "motorcycle",
    },
    dailyAmount: {
      type: Number,
      required: true,
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
      enum: ["open", "accepted", "completed", "cancelled"],
      default: "open",
    },
    acceptedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    acceptedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ShiftOffer", ShiftOfferSchema);
