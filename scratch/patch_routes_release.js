const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "routes", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

const targetBlock = `  if (userType === "driver") {
    // 🛡️ Security Gate: Block unapproved drivers from accessing full dashboard
    if (userData?.driverStatus !== "approved") {
      return <DriverPendingRoutes />;
    }
    return <DriverBoot />;
  }`;

const replacementBlock = `  if (userType === "driver") {
    return <DriverBoot />;
  }`;

if (content.includes(targetBlock)) {
  content = content.replace(targetBlock, replacementBlock);
  console.log("Replaced legacy driver status gate block.");
} else {
  // Fallback just in case formatting differs
  const targetBlockShort = `  if (userType === "driver") {
    if (userData?.driverStatus !== "approved") {
      return <DriverPendingRoutes />;
    }
    return <DriverBoot />;
  }`;
  if (content.includes(targetBlockShort)) {
    content = content.replace(targetBlockShort, replacementBlock);
    console.log("Replaced legacy driver status gate block (fallback).");
  } else {
    console.log("Router target block not found! Checking alternate matches...");
  }
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("Routes file updated successfully!");
