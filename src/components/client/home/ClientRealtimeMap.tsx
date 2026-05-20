import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View, Platform, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Car, Bike, User } from "lucide-react-native";
import { MotiView } from "moti";
import { colors } from "@/theme";

// Premium Dark Map Style Injection
const mapDarkStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#0f172a" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#94a3b8" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#0f172a" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#64748b" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#334155" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#1e293b" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#020617" }] }
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
  useDarkStyle?: boolean;
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

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        key={useDarkStyle ? "client-dark" : "client-light"}
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={useDarkStyle ? mapDarkStyle : []}
        initialRegion={region}
        showsUserLocation={false} // Usamos nosso marker custom para controle visual total
        showsCompass={false}
        showsPointsOfInterest={false}
        showsBuildings={false}
        showsIndoors={false}
        onRegionChangeComplete={onRegionChangeComplete}
      >
        {/* 📍 Custom User Location Marker (with photo or icon) */}
        {userRegion && (
          <Marker coordinate={userRegion} anchor={{ x: 0.5, y: 0.5 }}>
            {/* Neon pulse ring */}
            <MotiView
              from={{ scale: 0.7, opacity: 0.9 }}
              animate={{ scale: 2.2, opacity: 0 }}
              transition={{ loop: true, duration: 1800, type: "timing" }}
              style={styles.userPulse}
            />
            {/* Photo or person icon puck */}
            <View style={[styles.userPuck, showAvatar && styles.userPuckPhoto]}>
              {showAvatar ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.userAvatar}
                  onError={() => setImageError(true)}
                />
              ) : (
                <User size={11} color="#091A2F" />
              )}
            </View>
          </Marker>
        )}

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
  userPulse: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary[500],
    position: "absolute",
    opacity: 0.4,
  },
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
