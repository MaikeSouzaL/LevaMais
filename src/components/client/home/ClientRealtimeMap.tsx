import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View, Platform, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Car, Bike, User } from "lucide-react-native";

import { colors } from "@/theme";
import { MotiView } from "moti";

// Mapa sutilmente escuro — casinhas e edifícios visíveis em tom mais claro
const mapSoftDarkStyle = [
  { elementType: "geometry", stylers: [{ color: "#1d2c3b" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8fa8c8" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a2535" }] },
  // Casas e edificios — tom mais claro para se destacar do fundo
  { featureType: "landscape.man_made", elementType: "geometry", stylers: [{ color: "#2e4560" }] },
  { featureType: "landscape.man_made", elementType: "geometry.stroke", stylers: [{ color: "#3a5578" }] },
  { featureType: "landscape.natural", elementType: "geometry", stylers: [{ color: "#1a2d3e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a3f57" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#1a2c3e" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#7a9ab8" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3a5570" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#0f1f2e" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d5a74" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1e3045" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#1a3428" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#6a8fa8" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1e3045" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2d4a65" }] },
];


interface RealtimeVehicle {
  id: string;
  type: "car" | "motorcycle";
  lat: number;
  lng: number;
  rotation: number;
}

interface ClientRealtimeMapProps {
  mapRef: React.RefObject<MapView | null>;
  region: any;
  userRegion: any;
  onRegionChangeComplete: (r: any) => void;
  useDarkStyle?: boolean; // mantido para compatibilidade, não tem efeito
  avatarUrl?: string;
}

export const ClientRealtimeMap = memo(({
  mapRef,
  region,
  userRegion,
  onRegionChangeComplete,
  useDarkStyle = true,
  avatarUrl,
}: ClientRealtimeMapProps) => {
  const [imageError, setImageError] = useState(false);
  const showAvatar = !!avatarUrl && !imageError;

  const [vehicles, setVehicles] = useState<RealtimeVehicle[]>([]);

  // ⚡ Real-time vehicle simulation (Simula motoristas circulando perto do usuario)
  useEffect(() => {
    if (!userRegion?.latitude) return;
    
    // Gerador deterministico inicial baseado na lat do usuario
    const initialVehicles: RealtimeVehicle[] = [
      { id: "v1", type: "car", lat: userRegion.latitude + 0.002, lng: userRegion.longitude + 0.002, rotation: 45 },
      { id: "v2", type: "motorcycle", lat: userRegion.latitude - 0.0025, lng: userRegion.longitude + 0.001, rotation: 120 },
      { id: "v3", type: "car", lat: userRegion.latitude + 0.001, lng: userRegion.longitude - 0.003, rotation: 270 },
      { id: "v4", type: "motorcycle", lat: userRegion.latitude - 0.0015, lng: userRegion.longitude - 0.002, rotation: 200 },
    ];
    setVehicles(initialVehicles);

    // Loop de movimentação fluida (Realtime vibes)
    const interval = setInterval(() => {
      setVehicles((current) => current.map(v => ({
        ...v,
        lat: v.lat + (Math.random() - 0.5) * 0.00015,
        lng: v.lng + (Math.random() - 0.5) * 0.00015,
        rotation: v.rotation + (Math.random() - 0.5) * 5,
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, [userRegion?.latitude, userRegion?.longitude]);

  const [hasCentered, setHasCentered] = useState(false);

  useEffect(() => {
    if (mapRef.current && userRegion?.latitude && !hasCentered) {
      mapRef.current.animateToRegion({
        latitude: userRegion.latitude,
        longitude: userRegion.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 1000);
      setHasCentered(true);
    }
  }, [userRegion?.latitude, userRegion?.longitude, hasCentered]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={mapSoftDarkStyle}
        initialRegion={region}
        showsUserLocation={true}
        showsCompass={false}
        showsPointsOfInterest={true}
        showsBuildings={true}
        showsIndoors={true}
        onRegionChangeComplete={onRegionChangeComplete}
      >

        {/* 🚗 Dynamic Vehicle Markers */}
        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            coordinate={{ latitude: vehicle.lat, longitude: vehicle.lng }}
            rotation={vehicle.rotation}
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={Platform.OS === "android" ? false : true} // Otimizacao de performance
          >
            <View style={styles.vehicleMarkerWrapper}>
              <MotiView
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ loop: true, duration: 1500, type: "timing" }}
                style={[
                  styles.vehicleIconContainer,
                  { backgroundColor: vehicle.type === "motorcycle" ? colors.info : colors.primary[500] }
                ]}
              >
                {vehicle.type === "car" ? (
                  <Car size={14} color="#000" fill="#000" />
                ) : (
                  <Bike size={14} color="#000" fill="#000" />
                )}
              </MotiView>
            </View>
          </Marker>
        ))}
      </MapView>
    </View>
  );
});

const styles = StyleSheet.create({
  userPuck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    elevation: 6,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    overflow: "hidden",
  },
  userPuckPhoto: {
    backgroundColor: "#091A2F",
    borderColor: colors.primary[500],
  },
  userAvatar: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
    resizeMode: "cover",
  },
  vehicleMarkerWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  }
});
