const mongoose = require("mongoose");

const rideTrackPointSchema = new mongoose.Schema(
  {
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ride",
      required: true,
      index: true,
    },
    driverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    latitude: {
      type: Number,
      required: true,
    },
    longitude: {
      type: Number,
      required: true,
    },
    heading: {
      type: Number,
      default: null,
    },
    speed: {
      type: Number,
      default: null,
    },
    accuracy: {
      type: Number,
      default: null,
    },
    phase: {
      type: String,
      enum: ["to_pickup", "at_pickup", "to_dropoff", "at_dropoff", "completed"],
      default: "to_pickup",
    },
    capturedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índices para consulta eficiente
rideTrackPointSchema.index({ rideId: 1, capturedAt: 1 });
rideTrackPointSchema.index({ rideId: 1, phase: 1 });
rideTrackPointSchema.index({ capturedAt: 1 });

const RideTrackPoint = mongoose.model("RideTrackPoint", rideTrackPointSchema);

module.exports = RideTrackPoint;
