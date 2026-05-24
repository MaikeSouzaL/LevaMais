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

  const [region, setRegion] = useState({
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
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  // Load map style pref
  useEffect(() => {
    AsyncStorage.getItem("mapStylePref").then((pref) => {
      if (pref) setUseDarkMap(pref === "dark");
    }).catch(() => {});
  }, []);

  // Reverse geocode on initial load
  useEffect(() => {
    geocodeCurrentPin(initialLat, initialLng);
  }, []);

  const geocodeCurrentPin = async (lat: number, lng: number) => {
    setIsGeocodingPin(true);
    try {
      const details = await reverseGeocode(lat, lng);
      if (details) {
        const detailedAddress = formatPinAddress(details);
        setFullAddress(detailedAddress || details.formattedAddress || "");
        setAddress(detailedAddress || details.formattedAddress);
      } else {
        setFullAddress("");
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch {
      setFullAddress("");
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    }
    setIsGeocodingPin(false);
  };

  const handleMapRegionChange = (newRegion: any) => {
    setRegion(newRegion);
    // Update pin to center of map
    setPinCoord({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
  };

  const handleMapRegionComplete = (newRegion: any) => {
    setRegion(newRegion);
    setPinCoord({
      latitude: newRegion.latitude,
      longitude: newRegion.longitude,
    });
    geocodeCurrentPin(newRegion.latitude, newRegion.longitude);
  };

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
      }));
      return;
    }

    // Navigate back with the selected location data
    navigation.navigate("DeliverySenderInfo", {
      mapPickedAddress: selectedAddress,
      mapPickedLatitude: pinCoord.latitude,
      mapPickedLongitude: pinCoord.longitude,
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Map */}
      <GlobalMap
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChange={handleMapRegionChange}
        onRegionChangeComplete={handleMapRegionComplete}
        useDarkStyle={useDarkMap}
        showsUserLocation
        showsMyLocationButton={false}
      />

      {/* Fixed center pin (not draggable — moves with map) */}
      <View style={styles.centerPin} pointerEvents="none">
        <View style={styles.pinShadow} />
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
        <ChevronLeft size={24} color="#fff" strokeWidth={2.5} />
      </TouchableOpacity>

      {/* Map action buttons */}
      <MapActionButtons
        onSosPress={() => {}}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={200}
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
              <Text style={styles.addressText} numberOfLines={2}>
                {address}
              </Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.editBtn}
            onPress={() => navigation.goBack()}
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
  pinShadow: {
    position: "absolute",
    bottom: -4,
    width: 16,
    height: 6,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
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
