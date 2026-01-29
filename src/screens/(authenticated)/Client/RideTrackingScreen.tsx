import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import GlobalMap from "../../../components/GlobalMap";
import rideService, { Ride } from "../../../services/ride.service";
import webSocketService from "../../../services/websocket.service";
import { Marker } from "react-native-maps";

type Params = {
  RideTracking: {
    rideId: string;
  };
};

export default function RideTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "RideTracking">>();
  const rideId = route.params?.rideId;

  const [ride, setRide] = useState<Ride | null>(null);
  const [driverLatLng, setDriverLatLng] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [statusText, setStatusText] = useState<string>(
    "Aguardando motorista...",
  );
  const [driverInfo, setDriverInfo] = useState<any>(null);

  const initialRegion = useMemo(() => {
    const lat = ride?.pickup?.latitude ?? -23.5505;
    const lng = ride?.pickup?.longitude ?? -46.6333;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [ride?.pickup?.latitude, ride?.pickup?.longitude]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatusText(
          r?.status ? `Status: ${r.status}` : "Aguardando motorista...",
        );
      } catch (e) {
        console.log("Falha ao carregar corrida", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    const onDriverFound = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      setStatusText("Motorista encontrado");
      if (payload?.driver) setDriverInfo(payload.driver);
    };

    const onDriverLocationUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverLatLng({ latitude: loc.latitude, longitude: loc.longitude });
      }
    };

    const onRideStatusUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      if (payload?.status) setStatusText(`Status: ${payload.status}`);
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      setStatusText("Corrida cancelada");
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onDriverFound(onDriverFound);
        webSocketService.onDriverLocationUpdated(onDriverLocationUpdated);
        webSocketService.onRideStatusUpdated(onRideStatusUpdated);
        webSocketService.onRideCancelled(onRideCancelled);
      } catch (e) {
        console.log("Falha ao conectar WebSocket", e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("driver-found", onDriverFound);
      webSocketService.off("driver-location-updated", onDriverLocationUpdated);
      webSocketService.off("ride-status-updated", onRideStatusUpdated);
      webSocketService.off("ride-cancelled", onRideCancelled);
    };
  }, [rideId]);

  const handleCancel = async () => {
    if (!rideId) return;
    try {
      await rideService.cancel(rideId, "cancelled_by_client");
      setStatusText("Corrida cancelada");
      navigation.goBack();
    } catch (e) {
      console.log("Falha ao cancelar", e);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#02de95" />
          <Text style={{ color: "white", fontWeight: "800" }}>Acompanhar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCancel}>
          <Text style={{ color: "#ef4444", fontWeight: "800" }}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation
          region={undefined}
        >
          {!!ride?.pickup?.latitude && !!ride?.pickup?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Coleta"
              description={ride.pickup.address}
              tracksViewChanges={false}
            />
          )}

          {!!ride?.dropoff?.latitude && !!ride?.dropoff?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="Destino"
              description={ride.dropoff.address}
              pinColor="#02de95"
              tracksViewChanges={false}
            />
          )}

          {driverLatLng && (
            <Marker
              coordinate={driverLatLng}
              title="Motorista"
              tracksViewChanges={false}
            />
          )}
        </GlobalMap>

        {/* HUD */}
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            backgroundColor: "#111816",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800", fontSize: 16 }}>
            {statusText}
          </Text>

          {!!driverInfo?.name && (
            <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
              Motorista: {driverInfo.name}
            </Text>
          )}
          {!!ride?.pickup?.address && (
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
              Coleta: {ride.pickup.address}
            </Text>
          )}
          {!!ride?.dropoff?.address && (
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Destino: {ride.dropoff.address}
            </Text>
          )}
          {driverLatLng && (
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
              Motorista: {driverLatLng.latitude.toFixed(5)},{" "}
              {driverLatLng.longitude.toFixed(5)}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}
