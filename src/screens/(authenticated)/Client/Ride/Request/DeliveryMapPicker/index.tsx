import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { RouteProp, StackActions, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronLeft } from "lucide-react-native";
import { GlobalMap } from "@/components/GlobalMap";
import MapView from "react-native-maps";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { ClientStackParamList } from "../../../types/navigation";
import { reverseGeocode, type PlaceDetails } from "@/services/googlePlaces.service";
import AddressAutocomplete from "@/components/AddressAutocomplete";

function formatPinAddress(details: PlaceDetails): string {
  const streetLine = [details.street, details.streetNumber].filter(Boolean).join(", ");
  const parts = [
    streetLine || details.formattedAddress,
    details.neighborhood,
    details.city,
    details.stateCode || details.state,
  ].filter(Boolean);

  return parts.join(" - ") || details.formattedAddress;
}

export default function DeliveryMapPickerScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "DeliveryMapPicker">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "DeliveryMapPicker">>();
  const mapRef = useRef<MapView>(null);

  const initialLat = route.params?.initialLatitude ?? -11.6722;
  const initialLng = route.params?.initialLongitude ?? -61.1936;
  const returnField = route.params?.returnField || "address";
  const returnScreen = route.params?.returnScreen;

  const [region] = useState({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  });

  const [pinCoord, setPinCoord] = useState({
    latitude: initialLat,
    longitude: initialLng,
  });

  const [address, setAddress] = useState("Carregando endereço...");
  const [fullAddress, setFullAddress] = useState("");
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<"light" | "dark" | "satellite">("light");
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchTimeoutRef = useRef<any>(null);
  const reverseGeocodeSeqRef = useRef(0);
  const lastReversePointRef = useRef<{ latitude: number; longitude: number } | null>(null);

  // Load map style pref
  useEffect(() => {
    AsyncStorage.getItem("mapStylePref").then((pref) => {
      if (pref === "dark" || pref === "light" || pref === "satellite") {
        setMapStyleMode(pref as any);
      }
    }).catch(() => {});
  }, []);

  // Reverse geocode on initial load
  useEffect(() => {
    geocodeCurrentPin(initialLat, initialLng);
  }, []);

  const geocodeCurrentPin = async (lat: number, lng: number, seq?: number) => {
    setIsGeocodingPin(true);
    try {
      const details = await reverseGeocode(lat, lng);
      if (seq && seq !== reverseGeocodeSeqRef.current) return;
      
      if (details) {
        const detailedAddress = formatPinAddress(details);
        setFullAddress(detailedAddress || details.formattedAddress || "");
        setAddress(detailedAddress || details.formattedAddress);
        lastReversePointRef.current = { latitude: lat, longitude: lng };
      } else {
        setFullAddress("");
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch {
      if (seq && seq !== reverseGeocodeSeqRef.current) return;
      setFullAddress("");
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
    setIsGeocodingPin(false);
  };

  const handleMapRegionComplete = (newRegion: any) => {
    setPinCoord({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    const prev = lastReversePointRef.current;
    if (prev) {
      const dLat = newRegion.latitude - prev.latitude;
      const dLng = newRegion.longitude - prev.longitude;
      // Approx 15 meters threshold to avoid geocoding on micro-jitters
      const movedMetersApprox = Math.sqrt(dLat * dLat + dLng * dLng) * 111000;
      if (movedMetersApprox < 15) {
        return;
      }
    }

    searchTimeoutRef.current = setTimeout(async () => {
      const seq = ++reverseGeocodeSeqRef.current;
      geocodeCurrentPin(newRegion.latitude, newRegion.longitude, seq);
    }, 450);
  };

  const handleSelectSearchedAddress = (details: PlaceDetails) => {
    const lat = details.latitude;
    const lng = details.longitude;

    if (lat && lng) {
      const target = { latitude: lat, longitude: lng };
      setPinCoord(target);
      
      const detailedAddress = formatPinAddress(details);
      setFullAddress(detailedAddress || details.formattedAddress || "");
      setAddress(detailedAddress || details.formattedAddress);
      
      lastReversePointRef.current = target;

      mapRef.current?.animateToRegion({
        ...target,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      }, 800);

      setIsSearchingAddress(false);
    }
  };

  const handleToggleMapStyle = () => {
    if (isSwitchingMapStyle) return;
    setIsSwitchingMapStyle(true);
    setMapStyleMode((prev) => {
      let next: "light" | "dark" | "satellite" = "light";
      if (prev === "light") next = "dark";
      else if (prev === "dark") next = "satellite";
      else next = "light";

      AsyncStorage.setItem("mapStylePref", next).catch(() => {});
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
        mapRef.current?.animateToRegion({
          ...target,
          latitudeDelta: 0.005,
          longitudeDelta: 0.005,
        }, 600);
        geocodeCurrentPin(target.latitude, target.longitude);
      }
    } catch {}
    setTimeout(() => setIsCentering(false), 700);
  };

  const handleConfirm = () => {
    const selectedAddress = fullAddress || address;
    if (returnScreen === "FavoriteAddressFlow") {
      navigation.dispatch(StackActions.replace("FavoriteAddressFlow", {
        initialSearchMode: route.params?.favoriteInitialSearchMode || "favorite",
        selectionMode: route.params?.selectionMode,
        returnScreen: "DeliverySenderInfo",
        returnMode: route.params?.returnMode,
        vehicleType: route.params?.vehicleType,
        flow: route.params?.flow,
        pickupProfile: route.params?.pickupProfile || null,
        dropoffProfile: route.params?.dropoffProfile || null,
        mapPickedAddress: selectedAddress,
        mapPickedLatitude: pinCoord.latitude,
        mapPickedLongitude: pinCoord.longitude,
        isFromMapSelection: true,
      }));
      return;
    }

    // Navigate back with the selected location data
    navigation.navigate("DeliverySenderInfo", {
      mode: route.params?.returnMode,
      vehicleType: route.params?.vehicleType,
      flow: route.params?.flow,
      pickupProfile: route.params?.pickupProfile || null,
      dropoffProfile: route.params?.dropoffProfile || null,
      mapPickedAddress: selectedAddress,
      mapPickedLatitude: pinCoord.latitude,
      mapPickedLongitude: pinCoord.longitude,
      isFromMapSelection: true,
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <GlobalMap
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={handleMapRegionComplete}
        mapStyleMode={mapStyleMode}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Fixed center pin (not draggable — moves with map) */}
      <View style={styles.centerPin} pointerEvents="none">
        <View style={styles.pinBaseDot} />
        <View style={styles.pinHead}>
          <View style={styles.pinDot} />
        </View>
        <View style={styles.pinStem} />
      </View>

      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <ChevronLeft size={24} color="#091A2F" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Floating instruction toast */}
      <View style={styles.instructionContainer} pointerEvents="none">
        <View style={styles.instructionContent}>
          <Text style={styles.instructionText}>
            Arraste o mapa para escolher o local desejado
          </Text>
        </View>
      </View>

      {/* Search Input Overlay */}
      {isSearchingAddress && (
        <View style={styles.searchOverlay}>
          <AddressAutocomplete
            query={searchQuery}
            setQuery={setSearchQuery}
            onSelect={handleSelectSearchedAddress}
            placeholder="Buscar novo endereço..."
            label=""
            containerStyle={{ marginBottom: 0 }}
          />
          <TouchableOpacity
            style={styles.cancelSearchBtn}
            onPress={() => setIsSearchingAddress(false)}
          >
            <Text style={styles.cancelSearchText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Map action buttons */}
      <MapActionButtons
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        mapStyleMode={mapStyleMode}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        topOffset={120}
      />

      {/* Bottom Card */}
      <View style={styles.bottomCard}>
        <Text style={styles.cardTitle}>
          Selecione o local de {returnField === "pickup" ? "coleta" : "entrega"}
        </Text>

        <View style={styles.addressRow}>
          <View style={styles.greenDot} />
          <View style={{ flex: 1 }}>
            {isGeocodingPin ? (
              <ActivityIndicator size="small" color="#02de95" style={{ alignSelf: "flex-start" }} />
            ) : (
              <View>
                <Text style={styles.addressText} numberOfLines={2}>
                  {address}
                </Text>
                <Text style={styles.coordinatesText}>
                  Lat: {pinCoord.latitude.toFixed(6)} | Lng: {pinCoord.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => setIsSearchingAddress(true)}
          >
            <Text style={styles.editBtnText}>Editar</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.confirmButton, isGeocodingPin && { opacity: 0.5 }]}
          onPress={handleConfirm}
          disabled={isGeocodingPin}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmButtonText}>
            Definir local de {returnField === "pickup" ? "coleta" : "entrega"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091A2F" },
  map: { ...StyleSheet.absoluteFillObject },
  centerPin: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -42,
    width: 32,
    height: 42,
    alignItems: "center",
    zIndex: 10,
  },
  pinHead: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  pinDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
  pinStem: {
    width: 3,
    height: 12,
    backgroundColor: "#02de95",
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
  },

  pinBaseDot: {
    position: "absolute",
    bottom: -4,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#02de95", // bolinha menor verde
    borderWidth: 1,
    borderColor: "#fff",
    zIndex: 12,
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 100,
  },
  instructionContainer: {
    position: "absolute",
    top: 52,
    left: 76,
    right: 76,
    alignItems: "center",
    zIndex: 99,
  },
  instructionContent: {
    backgroundColor: "rgba(9, 26, 47, 0.85)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  instructionText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  searchOverlay: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 50,
    backgroundColor: "#11253E",
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.2)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    flexDirection: "column",
    gap: 8,
  },
  cancelSearchBtn: {
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 8,
  },
  cancelSearchText: {
    color: "#9abcb0",
    fontSize: 14,
    fontWeight: "700",
  },
  bottomCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 15,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111",
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  greenDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#02de95",
  },
  addressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  coordinatesText: {
    fontSize: 12,
    color: "#777",
    marginTop: 4,
    fontWeight: "500",
  },
  editBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  confirmButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#091A2F",
  },
});
