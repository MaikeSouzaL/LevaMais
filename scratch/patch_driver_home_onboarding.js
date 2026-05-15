const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Driver", "DriverHomeScreen.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top import
const importMarker = 'import { DriverBottomSheet } from "./components/DriverBottomSheet";';
const importInject = '\nimport DriverOnboardingDashboard from "@/components/driver/home/DriverOnboardingDashboard";';

if (!content.includes('import DriverOnboardingDashboard')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Imported DriverOnboardingDashboard.");
}

// 2. Compute isApproved hook below 'const userData = useAuthStore((s) => s.userData);'
const stateMarker = '  const userData = useAuthStore((s) => s.userData);';
const isApprovedInject = '\n  const isApproved = userData?.driverStatus === "approved";';

if (!content.includes("const isApproved = userData")) {
  content = content.replace(stateMarker, stateMarker + isApprovedInject);
  console.log("[2] Added const isApproved gate status.");
}

// 3. Wrap Dynamic UI overlays in isApproved check
// Target: '{!!region && (\n          <>'
const overlayTarget = '{!!region && (\n          <>';
const overlayReplacement = '{!!region && isApproved && (\n          <>';

if (content.includes(overlayTarget)) {
  content = content.replace(overlayTarget, overlayReplacement);
  console.log("[3] Gated active HUD overlays for unapproved drivers.");
}

// 4. Gating the master dispatch interception node and BottomSheet
// Target: '<IncomingRideCard' ➔ '{isApproved && <IncomingRideCard'
const incomingTarget = '        <IncomingRideCard';
const incomingReplacement = '        {isApproved && (\n        <IncomingRideCard';

const incomingEndTarget = '        {/* 📊 INTELLIGENT OPERATIONAL BASE CAMP (Hidden during active dispatch to prevent visual collision) */}';
const incomingEndReplacement = '        )}\n\n        {/* 📊 INTELLIGENT OPERATIONAL BASE CAMP (Hidden during active dispatch to prevent visual collision) */}';

if (content.includes(incomingTarget) && !content.includes("{isApproved && (\n        <IncomingRideCard")) {
  content = content.replace(incomingTarget, incomingReplacement);
  content = content.replace(incomingEndTarget, incomingEndReplacement);
  console.log("[4] Gated IncomingRideCard dispatch node.");
}

// 5. Gating the intelligent operational base camp BottomSheet
// Target: '{!incomingRequest?.rideId && (' ➔ '{isApproved && !incomingRequest?.rideId && ('
const sheetTarget = '{!incomingRequest?.rideId && (';
const sheetReplacement = '{isApproved && !incomingRequest?.rideId && (';

if (content.includes(sheetTarget) && !content.includes(sheetReplacement)) {
  content = content.replace(sheetTarget, sheetReplacement);
  console.log("[5] Gated DriverBottomSheet navigation controls.");
}

// 6. Append the OnboardingDashboard at the very bottom of the inner wrapper
const bottomMarker = '      </View>\n    </GestureHandlerRootView>';
const bottomInject = '        {!isApproved && (\n          <DriverOnboardingDashboard />\n        )}\n';

if (!content.includes("<DriverOnboardingDashboard")) {
  content = content.replace(bottomMarker, bottomInject + bottomMarker);
  console.log("[6] Appended DriverOnboardingDashboard overlay container.");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("DriverHomeScreen patched successfully!");
