const mongoose = require("./node_modules/mongoose");
const MONGODB_URI = "mongodb://localhost:27017/leva-mais";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const DriverLocation = mongoose.model("DriverLocation", new mongoose.Schema({}, { strict: false }));

  const locations = await DriverLocation.find({ status: "available" }).lean();
  console.log("Available Driver Locations count:", locations.length);
  for (const loc of locations) {
    console.log("DriverLocation:", {
      driverId: loc.driverId,
      status: loc.status,
      vehicleType: loc.vehicleType,
      serviceTypes: loc.serviceTypes,
      lastUpdated: loc.lastUpdated
    });

    const user = await User.findById(loc.driverId).lean();
    if (user) {
      console.log("Associated User details:", {
        id: user._id,
        name: user.name,
        userType: user.userType,
        vehicleType: user.vehicleType,
        driverStatus: user.driverStatus,
        driverPreferences: user.driverPreferences
      });
    }
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
