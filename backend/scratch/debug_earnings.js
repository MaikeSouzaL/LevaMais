const mongoose = require("mongoose");
require("dotenv").config({ path: ".env" });

async function debug() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/leva-mais");
  const User = require("../src/models/User");

  const driver = await User.findOne({ userType: "driver" });
  if (!driver) {
    console.log("No driver found!");
    return mongoose.disconnect();
  }

  console.log("Driver Name:", driver.name);
  console.log("Raw driverBalance.transactions:");
  console.log(JSON.stringify(driver.driverBalance?.transactions, null, 2));

  await mongoose.disconnect();
}

debug().catch(err => {
  console.error(err);
  mongoose.disconnect();
});
