require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./src/models/User");

const email = "aike.let@gmail.com";
const action = process.argv[2] ? process.argv[2].toLowerCase() : "approve";

async function run() {
  const mongoURI = process.env.MONGODB_URI || "mongodb://localhost:27017/leva-mais";
  console.log("Connecting to database at:", mongoURI);
  
  try {
    await mongoose.connect(mongoURI);
    console.log("Database connected successfully.");

    const user = await User.findOne({ email });
    if (!user) {
      console.error(`User with email "${email}" not found in database!`);
      process.exit(1);
    }

    console.log(`Current State of "${user.name}":`);
    console.log(`- userType: ${user.userType}`);
    console.log(`- driverStatus: ${user.driverStatus}`);
    if (user.vehicles && user.vehicles.length > 0) {
      user.vehicles.forEach((v, i) => {
        console.log(`- Vehicle ${i + 1} (${v.model} - ${v.plate}): status = ${v.status}, rejectionReason = "${v.rejectionReason || ""}"`);
      });
    } else {
      console.log("- No vehicles registered yet.");
    }
    console.log(`- personalDocuments rejectionReason: "${user.driverDocuments?.rejectionReason || ""}"`);

    console.log("\n-------------------------------------------");
    console.log(`Performing Action: "${action.toUpperCase()}"...`);

    if (action === "approve") {
      user.driverStatus = "approved";
      if (user.driverDocuments) {
        user.driverDocuments.rejectionReason = "";
      }
      if (user.vehicles && user.vehicles.length > 0) {
        user.vehicles.forEach(v => {
          v.status = "approved";
          v.rejectionReason = "";
        });
      }
      console.log("✔ Set driverStatus and all vehicles status to \"approved\"");
    } else if (action === "reject") {
      user.driverStatus = "rejected";
      if (user.driverDocuments) {
        user.driverDocuments.rejectionReason = "Foto da CNH traseira com baixa resolução ou ilegível. Por favor, reenvie uma imagem nítida.";
      }
      if (user.vehicles && user.vehicles.length > 0) {
        user.vehicles.forEach(v => {
          v.status = "rejected";
          v.rejectionReason = "O documento CRLV está vencido. Favor cadastrar um veículo com licenciamento regularizado.";
        });
      }
      console.log("✘ Set driverStatus and vehicles status to \"rejected\" with sample rejection reasons!");
    } else if (action === "pending") {
      user.driverStatus = "pending";
      if (user.driverDocuments) {
        user.driverDocuments.rejectionReason = "";
      }
      if (user.vehicles && user.vehicles.length > 0) {
        user.vehicles.forEach(v => {
          v.status = "pending";
          v.rejectionReason = "";
        });
      }
      console.log("⏳ Set driverStatus and vehicles status back to \"pending\"");
    } else if (action === "reset") {
      user.driverStatus = "none";
      if (user.driverDocuments) {
        user.driverDocuments.rejectionReason = "";
      }
      user.vehicles = [];
      console.log("♻ Reset account status to initial/none (cleared vehicles)");
    } else {
      console.log("Unknown action! Supported arguments: approve, reject, pending, reset");
      process.exit(1);
    }

    user.markModified("driverDocuments");
    user.markModified("vehicles");
    await user.save();

    console.log("Database updated successfully.");
    console.log("\nNew State:");
    console.log(`- driverStatus: ${user.driverStatus}`);
    if (user.vehicles && user.vehicles.length > 0) {
      user.vehicles.forEach((v, i) => {
        console.log(`- Vehicle ${i + 1} (${v.model} - ${v.plate}): status = ${v.status}, rejectionReason = "${v.rejectionReason || ""}"`);
      });
    } else {
      console.log("- No vehicles registered.");
    }
    console.log(`- personalDocuments rejectionReason: "${user.driverDocuments?.rejectionReason || ""}"`);

  } catch (err) {
    console.error("Error updating database:", err);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from database.");
  }
}

run();
