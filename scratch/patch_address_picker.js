const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Client", "Ride", "Request", "AddressPicker", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top imports
const importMarker = 'import { darkMapStyle } from \'@/utils/mapStyle\';';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";\nimport AsyncStorage from "@react-native-async-storage/async-storage";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Added MapActionButtons imports.");
}

// 2. Inject hooks states and handle functions above first useEffect
const stateMarker = '  // O endereço texto exibido no input';
const stateInject = `  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("mapStylePref").then((pref) => {
      if (pref) setUseDarkMap(pref === "dark");
    }).catch(() => {});
  }, []);

  const handleToggleMapStyle = () => {
    if (isSwitchingMapStyle) return;
    setIsSwitchingMapStyle(true);
    setUseDarkMap((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mapStylePref", next ? "dark" : "light").catch(() => {});
      return next;
    });
    setTimeout(() => setIsSwitchingMapStyle(false), 300);
  };

  const handleCenterMyLocation = async () => {
    setIsCentering(true);
    try {
      await mapLocation.centerOnUser();
    } catch {}
    setTimeout(() => setIsCentering(false), 700);
  };

  const handleSOS = () => {
    try {
      (navigation as any).navigate("ClientSafety");
    } catch {}
  };

`;

if (!content.includes("handleToggleMapStyle")) {
  content = content.replace(stateMarker, stateInject + stateMarker);
  console.log("[2] Added location dependency states and toggle handlers.");
}

// 3. Wire conditional Map style
const customStyleTarget = 'customMapStyle={darkMapStyle}';
const customStyleReplacement = 'customMapStyle={useDarkMap ? darkMapStyle : undefined}';

if (!content.includes("useDarkMap ? darkMapStyle")) {
  content = content.replace(customStyleTarget, customStyleReplacement);
  console.log("[3] Connected conditional customMapStyle layers.");
}

// 4. Inject MapActionButtons JSX block right above the bottom panel
const sheetAnchor = `        <View style={styles.bottomPanel}>`;
const sheetInject = `
        <MapActionButtons
          onSosPress={handleSOS}
          onLocationPress={handleCenterMyLocation}
          onMapStylePress={handleToggleMapStyle}
          useDarkMap={useDarkMap}
          isCentering={isCentering}
          isSwitchingStyle={isSwitchingMapStyle}
          bottomOffset={230}
        />
`;

if (!content.includes("<MapActionButtons")) {
  content = content.replace(sheetAnchor, sheetInject + sheetAnchor);
  console.log("[4] Appended floating actions component above confirmation panel.");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("AddressPickerScreen patched successfully!");
