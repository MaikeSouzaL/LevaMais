const mongoose = require("mongoose");
const rideController = require("../src/controllers/ride.controller");
const Ride = require("../src/models/Ride");
const User = require("../src/models/User");
const DriverLocation = require("../src/models/DriverLocation");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/leva-mais";

async function run() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const latestRide = await Ride.findOne({ status: "requesting" }).sort({ createdAt: -1 });
  if (!latestRide) {
    console.log("No requesting rides found");
    await mongoose.disconnect();
    return;
  }
  console.log("Found Ride:", latestRide._id.toString(), "serviceType:", latestRide.serviceType);

  const driver = await User.findOne({ userType: "driver", driverStatus: "approved" });
  if (!driver) {
    console.log("No approved driver found");
    await mongoose.disconnect();
    return;
  }
  console.log("Found Driver:", driver._id.toString(), "name:", driver.name);

  // Let's ensure driver location exists and is available
  let driverLoc = await DriverLocation.findOne({ driverId: driver._id });
  if (!driverLoc) {
    driverLoc = await DriverLocation.create({
      driverId: driver._id,
      latitude: -11.6664,
      longitude: -61.1835,
      status: "available",
      vehicleType: latestRide.vehicleType,
      serviceTypes: ["ride", "delivery"],
    });
    console.log("Created DriverLocation");
  } else {
    driverLoc.status = "available";
    driverLoc.vehicleType = latestRide.vehicleType;
    driverLoc.serviceTypes = ["ride", "delivery"];
    driverLoc.currentRideId = null;
    await driverLoc.save();
    console.log("Updated DriverLocation to available");
  }

  // Mock req and res
  const req = {
    params: { rideId: latestRide._id.toString() },
    user: { id: driver._id.toString(), userType: "driver" },
    app: {
      get: (key) => {
        if (key === "io") {
          return {
            to: () => ({ emit: () => {} }),
            emit: () => {},
          };
        }
      },
    },
  };

  const res = {
    status: function (code) {
      console.log("res.status called with:", code);
      this.statusCode = code;
      return this;
    },
    json: function (data) {
      console.log("res.json called with:", JSON.stringify(data, null, 2));
      return this;
    },
  };

  try {
    await rideController.accept(req, res);
  } catch (err) {
    console.error("Controller threw error:", err);
  }

  await mongoose.disconnect();
}

run().catch(console.error);
