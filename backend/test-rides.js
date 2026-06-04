const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const Ride = require("./src/models/Ride");

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/leva_mais");
  
  const activeRides = await Ride.find({
    status: { $in: [
      "requesting",
      "payment_pending",
      "driver_assigned",
      "accepted",
      "driver_arriving",
      "arrived",
      "in_progress",
      "scheduled",
      "searching_driver",
      "offers_received"
    ]}
  });
  
  console.log(`Active rides count: ${activeRides.length}`);
  for (const ride of activeRides) {
    console.log(`Ride ID: ${ride._id} | Client: ${ride.clientId} | Driver: ${ride.driverId} | Status: ${ride.status} | Service: ${ride.serviceType}`);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
