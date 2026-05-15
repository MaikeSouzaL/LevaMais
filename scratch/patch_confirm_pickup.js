const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Client", "Ride", "Request", "ConfirmPickup", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top imports
const importMarker = 'import { darkMapStyle } from "@/utils/mapStyle";';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";\nimport AsyncStorage from "@react-native-async-storage/async-storage";\nimport * as Location from "expo-location";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Added imports for MapActionButtons.");
}

// 2. Add hooks and handler logic above state declaration
const stateMarker = '  const [address, setAddress] = useState(initialAddress);';
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
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos?.coords) {
        const target = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        };
        setPinCoord(target);
        setRegion((r) => ({
          ...r,
          latitude: target.latitude,
          longitude: target.longitude,
        }));
        mapRef.current?.animateToRegion({
          ...target,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 600);
      }
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
  console.log("[2] Injected location states and map actions logic.");
}

// 3. Wire conditional Map style
const customStyleTarget = 'customMapStyle={darkMapStyle}';
const customStyleReplacement = 'customMapStyle={useDarkMap ? darkMapStyle : undefined}';

if (!content.includes("useDarkMap ? darkMapStyle")) {
  content = content.replace(customStyleTarget, customStyleReplacement);
  console.log("[3] Wired dark/light layer swapping.");
}

// 4. Add JSX above the bottom sheet
const sheetAnchor = `      <View style={styles.bottomSheet}>`;
const sheetInject = `
      <MapActionButtons
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={220}
      />
`;

if (!content.includes("<MapActionButtons")) {
  content = content.replace(sheetAnchor, sheetInject + sheetAnchor);
  console.log("[4] Appended visual component instance above confirmed details container.");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("ConfirmPickupScreen updated fully successfully!");
