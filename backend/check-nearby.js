const mongoose = require("./node_modules/mongoose");
const MONGODB_URI = "mongodb://localhost:27017/leva-mais";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB!");

  const DriverLocation = require("./src/models/DriverLocation");
  const User = require("./src/models/User");

  // Let's find our online driver first to get their coordinates
  const onlineLoc = await DriverLocation.findOne({ status: "available" }).lean();
  if (!onlineLoc) {
    console.log("No online driver found!");
    await mongoose.disconnect();
    return;
  }

  const [lng, lat] = onlineLoc.location.coordinates;
  console.log(`Querying nearby drivers from coordinates: lat=${lat}, lng=${lng}`);

  // Query nearby exactly like the controller
  const drivers = await DriverLocation.findNearby(
    lat,
    lng,
    7000,
    undefined,
    10
  );

  console.log("Found nearby drivers count:", drivers.length);

  const populated = await DriverLocation.populate(drivers, {
    path: "driverId",
    select: "name profilePhoto rating",
  });

  const mapped = populated.map((d) => {
    const driverUser = d.driverId && typeof d.driverId === "object" ? d.driverId : {};
    return {
      id: driverUser._id || d.driverId,
      name: driverUser.name || "Motorista",
      profilePhoto: driverUser.profilePhoto || null,
      rating: driverUser.rating || 5.0,
      latitude: d.location.coordinates[1],
      longitude: d.location.coordinates[0],
      type: d.vehicleType || "car",
      rotation: 0,
      serviceTypes: d.serviceTypes || [],
    };
  });

  console.log("Mapped results:", JSON.stringify(mapped, null, 2));

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
