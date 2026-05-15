const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Driver", "DriverHomeScreen.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top import
const importMarker = 'import { QueueTagYellowFloating } from "@/components/QueueTagYellow";';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Added import for MapActionButtons");
} else {
  console.log("[1] Import already exists");
}

// 2. Locate targets by looking for the specific block of 3 buttons
// We construct a very rigid regex or exact slice that matches the target block
const blockTarget = `                  {/* SOS Panic */}
                 <TouchableOpacity 
                   onPress={handleSOS}
                   className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl items-center justify-center shadow-2xl"
                 >
                   <ShieldAlert size={22} color="#EF4444" />
                 </TouchableOpacity>

                 {/* Center Map */}
                 <TouchableOpacity 
                   onPress={handleCenterMyLocation}
                   disabled={isCentering}
                   className="w-12 h-12 bg-[#091A2F]/80 border border-white/10 rounded-xl items-center justify-center shadow-2xl"
                 >
                   <MaterialIcons name="my-location" size={24} color={isCentering ? "#02de9550" : "#02de95"} />
                 </TouchableOpacity>

                 {/* Map Style Layers */}
                 <TouchableOpacity 
                   onPress={handleToggleMapStyle}
                   className={\`w-12 h-12 border rounded-xl items-center justify-center shadow-2xl \${
                      isSwitchingMapStyle ? 'bg-[#02de95] border-[#02de95]' : 'bg-[#091A2F]/80 border-white/10'
                   }\`}
                 >
                   <Layers size={22} color={isSwitchingMapStyle ? "#091A2F" : "#FFF"} />
                  </TouchableOpacity>`;

const blockReplacement = `                  <MapActionButtons
                    onSosPress={handleSOS}
                    onLocationPress={handleCenterMyLocation}
                    onMapStylePress={handleToggleMapStyle}
                    useDarkMap={useDarkMap}
                    isCentering={isCentering}
                    isSwitchingStyle={isSwitchingMapStyle}
                    containerStyle={{ position: "relative", right: 0 }}
                  />`;

// Normalize line endings in both content and pattern for 100% reliability
const normalizedContent = content.replace(/\r\n/g, "\n");
const normalizedTarget = blockTarget.replace(/\r\n/g, "\n");
const normalizedReplacement = blockReplacement.replace(/\r\n/g, "\n");

if (normalizedContent.includes(normalizedTarget)) {
  const updated = normalizedContent.replace(normalizedTarget, normalizedReplacement);
  fs.writeFileSync(filePath, updated, "utf-8");
  console.log("[2] Successfully replaced floating buttons with MapActionButtons component!");
} else {
  console.error("[2] COULD NOT LOCATE THE FLOATING BUTTONS BLOCK EXACTLY! Let's check alternatives...");
  
  // Fallback: Less strict replacement by regex that finds specific start and end boundary
  const fallbackRegex = /\{\/\* SOS Panic \*\/\}\s*<TouchableOpacity[\s\S]+?onPress=\{handleToggleMapStyle\}[\s\S]+?<Layers size=\{22\}[\s\S]+?<\/TouchableOpacity>/;
  if (fallbackRegex.test(normalizedContent)) {
    const updated = normalizedContent.replace(fallbackRegex, normalizedReplacement);
    fs.writeFileSync(filePath, updated, "utf-8");
    console.log("[2] Successfully replaced floating buttons using fallback regex mapping!");
  } else {
    console.error("[FATAL] Regex and direct match both failed to locate target blocks.");
  }
}
