const mongoose = require("mongoose");
const Ride = require("../src/models/Ride");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/leva-mais";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const rides = await Ride.find({}).sort({ createdAt: -1 }).limit(10);
  console.log("Total recent rides:", rides.length);
  for (const ride of rides) {
    console.log({
      id: ride._id.toString(),
      status: ride.status,
      serviceType: ride.serviceType,
      vehicleType: ride.vehicleType,
      pricingTotal: ride.pricing?.total,
      isWaitingInQueue: ride.isWaitingInQueue,
      clientId: ride.clientId,
      createdAt: ride.createdAt,
    });
  }

  await mongoose.disconnect();
}

run().catch(console.error);
