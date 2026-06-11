import React, { memo, useEffect, useState } from "react";
import { StyleSheet, View, Platform, Image, TouchableOpacity } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Car, Bike, User, Navigation } from "lucide-react-native";

import { colors } from "@/theme";
import { MotiView } from "moti";
import { DriverAvailabilityBadge } from "./DriverAvailabilityBadge";

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

import rideService from "@/services/ride.service";
import { supabase } from "@/lib/supabase";

interface RealtimeVehicle {
  id: string;
  type: "car" | "motorcycle" | "van" | "truck";
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
  rideDrivers?: number;
  deliveryDrivers?: number;
  totalNearby?: number;
  availabilityLoading?: boolean;
  availabilityError?: string | null;
}

export const ClientRealtimeMap = memo(({
  mapRef,
  region,
  userRegion,
  onRegionChangeComplete,
  useDarkStyle = true,
  avatarUrl,
  rideDrivers = 0,
  deliveryDrivers = 0,
  totalNearby = 0,
  availabilityLoading = false,
  availabilityError = null,
}: ClientRealtimeMapProps) => {
  const [imageError, setImageError] = useState(false);
  const showAvatar = !!avatarUrl && !imageError;

  const [vehicles, setVehicles] = useState<RealtimeVehicle[]>([]);

  // ⚡ Motoristas reais online em TEMPO REAL (sem polling): carrega uma vez e reage
  // a mudanças em driver_locations via Realtime. O refresh é debounced para coalescer
  // rajadas (vários motoristas movendo ao mesmo tempo) sem martelar o Supabase.
  useEffect(() => {
    if (!userRegion?.latitude || !userRegion?.longitude) return;
    let mounted = true;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    const fetchRealDrivers = async () => {
      try {
        const driversList = await rideService.getNearbyDrivers(
          userRegion.latitude,
          userRegion.longitude,
          8000, // raio de até 8km
        );
        if (!mounted) return;
        setVehicles(
          driversList.map((d: any) => ({
            id: d.id,
            type: d.type || "car",
            lat: d.latitude,
            lng: d.longitude,
            rotation: d.rotation || 0,
          })),
        );
      } catch (err) {
        console.warn("[ClientRealtimeMap] Error getting real drivers", err);
      }
    };

    // Carga inicial
    fetchRealDrivers();

    // Atualiza ao haver qualquer mudança nas posições/disponibilidade dos motoristas
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (mounted) fetchRealDrivers();
      }, 1500);
    };

    const channel = supabase
      .channel(`nearby-drivers-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "driver_locations" },
        scheduleRefresh,
      )
      .subscribe();

    return () => {
      mounted = false;
      if (debounceTimer) clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, [userRegion?.latitude, userRegion?.longitude]);

  useEffect(() => {
    if (mapRef.current && userRegion?.latitude) {
      mapRef.current.animateToRegion({
        latitude: userRegion.latitude,
        longitude: userRegion.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 1000);
    }
  }, [userRegion?.latitude, userRegion?.longitude]);

  const handleCenterUser = () => {
    if (mapRef.current && userRegion?.latitude) {
      mapRef.current.animateToRegion({
        latitude: userRegion.latitude,
        longitude: userRegion.longitude,
        latitudeDelta: 0.003,
        longitudeDelta: 0.003,
      }, 800);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={useDarkStyle ? mapSoftDarkStyle : []}
        initialRegion={region}
        showsUserLocation={true}
        showsMyLocationButton={false} // Desativa o botão nativo do SDK no topo-direito
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

      <DriverAvailabilityBadge
        rideDrivers={rideDrivers}
        deliveryDrivers={deliveryDrivers}
        totalNearby={totalNearby}
        loading={availabilityLoading}
        error={availabilityError}
      />

      {/* 🧭 Custom Floating GPS Target Button */}
      {userRegion?.latitude && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleCenterUser}
          style={{
            position: "absolute",
            bottom: 82, // Posicionado logo acima da barra de busca do cliente
            right: 14,
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255, 255, 255, 0.96)",
            borderWidth: 1,
            borderColor: "rgba(9, 26, 47, 0.08)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 5,
            elevation: 4,
          }}
        >
          <Navigation size={16} color="#091A2F" fill="#091A2F" />
        </TouchableOpacity>
      )}
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
