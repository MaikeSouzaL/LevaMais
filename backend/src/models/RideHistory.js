const mongoose = require("mongoose");
const Ride = require("./Ride");

// Reuse the exact schema from Ride model
const rideHistorySchema = Ride.schema.clone();

const RideHistory = mongoose.model("RideHistory", rideHistorySchema);

module.exports = RideHistory;
