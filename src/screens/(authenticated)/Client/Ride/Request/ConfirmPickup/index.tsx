import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import MapView, { Marker } from "react-native-maps";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { LoadingButton } from "../../../Shared/components";
import { darkMapStyle } from "@/utils/mapStyle";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { ClientStackParamList } from "../../../types/navigation";

export default function ConfirmPickupScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "ConfirmPickup">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "ConfirmPickup">>();
  const mapRef = useRef<MapView>(null);

  const initialAddress = route.params?.formattedAddress || route.params?.address || "Sua localizacao";
  const initialLat = route.params?.latitude;
  const initialLng = route.params?.longitude;

  const [region, setRegion] = useState({
    latitude: initialLat || -23.5505,
    longitude: initialLng || -46.6333,
    latitudeDelta: 0.005,
    longitudeDelta: 0.005,
  });

  const [pinCoord, setPinCoord] = useState({
    latitude: initialLat || -23.5505,
    longitude: initialLng || -46.6333,
  });

  const [useDarkMap, setUseDarkMap] = useState(true);
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

  const [address, setAddress] = useState(initialAddress);

  useEffect(() => {
    if (initialLat && initialLng) {
      setRegion((r) => ({ ...r, latitude: initialLat, longitude: initialLng }));
      setPinCoord({ latitude: initialLat, longitude: initialLng });
    }
  }, [initialLat, initialLng]);

  const handleConfirm = () => {
    navigation.navigate("Home", {
      currentLocation: {
        address,
        latitude: pinCoord.latitude,
        longitude: pinCoord.longitude,
      },
    });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        customMapStyle={useDarkMap ? darkMapStyle : undefined}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <Marker
          coordinate={pinCoord}
          draggable
          onDragEnd={(e) => {
            setPinCoord(e.nativeEvent.coordinate);
            setAddress(
              `${e.nativeEvent.coordinate.latitude.toFixed(6)}, ${e.nativeEvent.coordinate.longitude.toFixed(6)}`
            );
          }}
          title="Ponto de coleta"
        />
      </MapView>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <MaterialIcons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>

      <View style={styles.pinHint}>
        <Text style={styles.pinHintText}>Arraste o pin para o local exato de coleta</Text>
      </View>


      <MapActionButtons
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={220}
      />
      <View style={styles.bottomSheet}>
        <View style={styles.addressRow}>
          <View style={styles.dot} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>PONTO DE COLETA</Text>
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.editButton}
          >
            <MaterialIcons name="edit" size={20} color={colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <LoadingButton title="Confirmar local de coleta" onPress={handleConfirm} variant="primary" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  map: { ...StyleSheet.absoluteFillObject },
  backButton: {
    position: "absolute",
    top: 50,
    left: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pinHint: {
    position: "absolute",
    top: 110,
    alignSelf: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  pinHintText: { color: "#fff", fontSize: fontSize.sm, fontWeight: fontWeight.semibold },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.background.primary,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing["3xl"],
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  addressLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: 2,
  },
  addressText: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  editButton: { padding: spacing.sm },
});
