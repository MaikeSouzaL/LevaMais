import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Marker } from "react-native-maps";
import * as Location from "expo-location";

import DriverHeader from "./components/DriverHeader";
import GlobalMap from "../../../components/GlobalMap";
import rideService, { Ride } from "../../../services/ride.service";
import webSocketService from "../../../services/websocket.service";

type Params = {
  DriverRide: {
    rideId: string;
  };
};

export default function DriverRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRide">>();
  const rideId = route.params?.rideId;

  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<string>("accepted");
  const intervalRef = useRef<any>(null);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatus(r?.status || "accepted");
      } catch (e) {
        console.log("Falha ao carregar corrida", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  useEffect(() => {
    const start = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      const tick = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          webSocketService.emit("update-location", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          });
        } catch {}
      };

      await tick();
      intervalRef.current = setInterval(tick, 4000);
    };

    start();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const update = async (nextStatus: string) => {
    if (!rideId) return;
    try {
      const r = await rideService.updateStatus(rideId, nextStatus);
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      // também emitir eventos auxiliares (opcional)
      if (nextStatus === "arrived") {
        webSocketService.emit("driver-arrived", { rideId });
      }
      if (nextStatus === "in_progress") {
        webSocketService.emit("start-ride", { rideId });
      }
    } catch (e) {
      console.log("Falha ao atualizar status", e);
    }
  };

  const cancel = async () => {
    if (!rideId) return;
    try {
      await rideService.cancel(rideId, "cancelled_by_driver");
      navigation.goBack();
    } catch (e) {
      console.log("Falha ao cancelar", e);
    }
  };

  const initialRegion = {
    latitude: ride?.pickup?.latitude ?? -23.5505,
    longitude: ride?.pickup?.longitude ?? -46.6333,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader
        title="Corrida ativa"
        right={
          <TouchableOpacity onPress={cancel}>
            <Text style={{ color: "#ef4444", fontWeight: "900" }}>
              Cancelar
            </Text>
          </TouchableOpacity>
        }
      />

      <View style={{ flex: 1 }}>
        <GlobalMap initialRegion={initialRegion as any} showsUserLocation>
          {!!ride?.pickup?.latitude && !!ride?.pickup?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Coleta"
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
              pinColor="#02de95"
              tracksViewChanges={false}
            />
          )}
        </GlobalMap>

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
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            Status: {status}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
            Coleta: {ride?.pickup?.address || "—"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
            Destino: {ride?.dropoff?.address || "—"}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => update("arrived")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#1f2d29",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>Cheguei</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => update("in_progress")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#02de95",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                Iniciar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => update("completed")}
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 12,
                backgroundColor: "#3b82f6",
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Finalizar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
