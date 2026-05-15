const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "..", "src", "screens", "(authenticated)", "Client", "Ride", "SearchingDriver", "index.tsx");
let content = fs.readFileSync(filePath, "utf-8");

// 1. Inject top imports
const importMarker = 'import { darkMapStyle } from "@/utils/mapStyle";';
const importInject = '\nimport { MapActionButtons } from "@/components/MapActionButtons";\nimport AsyncStorage from "@react-native-async-storage/async-storage";';

if (!content.includes('import { MapActionButtons }')) {
  content = content.replace(importMarker, importMarker + importInject);
  console.log("[1] Added imports for MapActionButtons.");
}

// 2. Inject states and location handlers above DoneRef
const stateMarker = '  const doneRef = useRef(false);';
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
    if (!pickupCoords) return;
    setIsCentering(true);
    mapRef.current?.animateCamera({
      center: {
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
      },
      zoom: 14,
      pitch: 35,
      heading: 0,
    }, { duration: 800 });
    setTimeout(() => setIsCentering(false), 900);
  };

  const handleSOS = () => {
    try {
      navigation.navigate("ClientSafety");
    } catch {}
  };

`;

if (!content.includes("handleToggleMapStyle")) {
  content = content.replace(stateMarker, stateInject + stateMarker);
  console.log("[2] Injected location state dependencies.");
}

// 3. Wire conditional customMapStyle
const mapStyleTarget = 'customMapStyle={darkMapStyle}';
const mapStyleReplacement = 'customMapStyle={useDarkMap ? darkMapStyle : undefined}';

if (!content.includes("useDarkMap ? darkMapStyle")) {
  content = content.replace(mapStyleTarget, mapStyleReplacement);
  console.log("[3] Wired map layers logic.");
}

// 4. Inject MapActionButtons JSX block right above DeliverySearchBottomSheet
const sheetAnchor = `      {/* Integrated Logistics Control Panel */}`;
const sheetInject = `
      <MapActionButtons
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={390}
      />
`;

if (!content.includes("<MapActionButtons")) {
  content = content.replace(sheetAnchor, sheetInject + "\n" + sheetAnchor);
  console.log("[4] Inserted component instance floating above search sheet.");
}

fs.writeFileSync(filePath, content.replace(/\r\n/g, "\n"), "utf-8");
console.log("SearchingDriverScreen successfully fully updated!");
