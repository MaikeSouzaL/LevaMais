const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Driver", "DriverRideScreen.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top imports
const importMarker = 'import { VehicleMarker } from "@/components/maps/VehicleMarker";';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";\nimport AsyncStorage from "@react-native-async-storage/async-storage";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Injected component imports successfully.");
}

// 2. Add component states and helper functions right above useEffect
const stateMarker = '  const [actionLoading, setActionLoading] = useState<';
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

  const handleCenterMyLocation = () => {
    if (!driverCoords) return;
    setIsCentering(true);
    mapRef.current?.animateToRegion({
      ...driverCoords,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }, 600);
    setTimeout(() => setIsCentering(false), 700);
  };

  const handleSOS = () => {
    try {
      (navigation as any).navigate("DriverSafety");
    } catch {}
  };

`;

if (!content.includes("handleToggleMapStyle")) {
  content = content.replace(stateMarker, stateInject + stateMarker);
  console.log("[2] Added state dependencies and helper functions successfully.");
}

// 3. Wire up GlobalMap useDarkStyle prop
const mapTarget = `<GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation={false}`;
const mapReplacement = `<GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation={false}
          useDarkStyle={useDarkMap}`;

if (!content.includes("useDarkStyle={useDarkMap}")) {
  content = content.replace(mapTarget, mapReplacement);
  console.log("[3] Connected useDarkMap state to GlobalMap component.");
}

// 4. Add MapActionButtons JSX block below the floating circles
const hudEndMarker = `          ))}
        </View>`;

const jsxInject = `

        <MapActionButtons
          onSosPress={handleSOS}
          onLocationPress={handleCenterMyLocation}
          onMapStylePress={handleToggleMapStyle}
          useDarkMap={useDarkMap}
          isCentering={isCentering}
          isSwitchingStyle={isSwitchingMapStyle}
          topOffset={300}
        />`;

if (!content.includes("<MapActionButtons")) {
  content = content.replace(hudEndMarker, hudEndMarker + jsxInject);
  console.log("[4] Placed MapActionButtons component inside UI structure!");
}

// Save it back
const normalized = content.replace(/\r\n/g, "\n");
fs.writeFileSync(filePath, normalized, "utf-8");
console.log("DriverRideScreen fully successfully updated!");
