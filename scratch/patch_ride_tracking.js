const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Client", "Ride", "Tracking", "RideTracking", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top imports
const importMarker = 'import MapMarker from "@/components/MapMarker";';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";\nimport AsyncStorage from "@react-native-async-storage/async-storage";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Imports injected successfully.");
}

// 2. Inject hooks states and handle functions above first useEffect
const stateMarker = '  const [ride, setRide] = useState<Ride | null>(null);';
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
      const pos = await Location.getLastKnownPositionAsync();
      if (pos?.coords) {
        mapRef.current?.animateToRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      } else {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        mapRef.current?.animateToRegion({
          latitude: fresh.coords.latitude,
          longitude: fresh.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch {}
    setTimeout(() => setIsCentering(false), 600);
  };

  const handleSOS = () => {
    try {
      (navigation as any).navigate("ClientSafety");
    } catch {}
  };

`;

if (!content.includes("handleToggleMapStyle")) {
  content = content.replace(stateMarker, stateInject + stateMarker);
  console.log("[2] Injected state hooks and location handlers.");
}

// 3. Wire conditional Map style
const customStyleTarget = 'customMapStyle={darkMapStyle}';
const customStyleReplacement = 'customMapStyle={useDarkMap ? darkMapStyle : undefined}';

if (!content.includes("useDarkMap ? darkMapStyle")) {
  content = content.replace(customStyleTarget, customStyleReplacement);
  console.log("[3] Conditional map style applied.");
}

// 4. Append MapActionButtons at end of UI overlay blocks
const jsxAnchor = `      <View style={[styles.bottomCard, { bottom: Math.max(insets.bottom + 10, spacing.lg) }]}>`;
const jsxInject = `
      <MapActionButtons
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={320}
      />
`;

if (!content.includes("<MapActionButtons")) {
  content = content.replace(jsxAnchor, jsxInject + jsxAnchor);
  console.log("[4] Placed MapActionButtons perfectly floating above the summary bottom sheet!");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("RideTrackingScreen patched successfully!");
