import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import DriverHeader from "./components/DriverHeader";
import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import { formatBRL } from "../../../utils/mappers";
import Toast from "react-native-toast-message";

type RideRequestItem = {
  rideId: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  dropoff?: { address?: string; latitude?: number; longitude?: number };
  pricing?: { total?: number };
  distance?: { text?: string };
  vehicleType?: string;
};

export default function DriverRequestsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<RideRequestItem[]>([]);

  useEffect(() => {
    let mounted = true;

    // Regra estilo Uber/99: só recebe/aceita corridas quando estiver ONLINE.
    (async () => {
      try {
        const me = await driverLocationService.getMe();
        const isOnline = me?.status === "available" && me?.acceptingRides === true;
        if (!isOnline) {
          Toast.show({
            type: "info",
            text1: "Fique online para receber solicitações",
            text2: "Ative o modo online na tela inicial do motorista.",
          });

          try {
            (navigation as any).navigate("DriverHome");
          } catch {}
          return;
        }
      } catch {
        Toast.show({
          type: "info",
          text1: "Atualize sua localização primeiro",
          text2: "Volte para a tela inicial e ative o modo online.",
        });

        try {
          (navigation as any).navigate("DriverHome");
        } catch {}
      }
    })();

    const onNewRide = async (payload: any) => {
      if (!mounted) return;
      const item: RideRequestItem = {
        rideId: payload?.rideId,
        pickup: payload?.pickup,
        dropoff: payload?.dropoff,
        pricing: payload?.pricing,
        distance: payload?.distance,
        vehicleType: payload?.vehicleType,
      };

      if (!item.rideId) return;

      setRequests((prev) => {
        if (prev.some((p) => p.rideId === item.rideId)) return prev;
        return [item, ...prev];
      });

      try {
        await driverAlertService.start();
      } catch (e) {
        console.log("Falha ao tocar alerta", e);
      }
    };

    const onRideTaken = (payload: any) => {
      if (!mounted) return;
      const takenId = payload?.rideId;
      if (!takenId) return;
      // remove da lista se outro motorista pegou
      setRequests((prev) => prev.filter((r) => r.rideId !== takenId));
    };

    const onRideExpired = (payload: any) => {
      if (!mounted) return;
      const expiredId = payload?.rideId;
      if (!expiredId) return;
      // remove da lista se a oferta expirou (backend passou para outro motorista)
      setRequests((prev) => prev.filter((r) => r.rideId !== expiredId));
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("new-ride-request", onNewRide);
        webSocketService.on("ride-taken", onRideTaken);
        webSocketService.on("ride-expired", onRideExpired);
      } catch (e) {
        console.log("Falha ao conectar WS", e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRide);
      webSocketService.off("ride-taken", onRideTaken);
      webSocketService.off("ride-expired", onRideExpired);
      // se sair desta tela, não para o alerta automaticamente (continua até aceitar/rejeitar)
    };
  }, []);

  useEffect(() => {
    // Se não há solicitações na lista, parar o alerta
    if (requests.length === 0) {
      driverAlertService.stop();
    }
  }, [requests.length]);

  const accept = async (rideId: string) => {
    try {
      const ride = await rideService.accept(rideId);
      await driverAlertService.stop();
      // remove da lista
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
      const currentRideId = e?.response?.data?.currentRideId;
      const msg = e?.response?.data?.error || e?.message;

      console.log("Falha ao aceitar", msg || e);

      // Se o backend indicar que já existe corrida ativa, abre direto
      if (currentRideId) {
        try {
          (navigation as any).navigate("DriverRide", { rideId: currentRideId });
        } catch {}
      }

      // remove a solicitação (provavelmente expirou / já foi aceita por outro)
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      driverAlertService.stop().catch(() => {});
    }
  };

  const reject = async (rideId: string) => {
    try {
      await rideService.reject(rideId, "driver_rejected");
      await driverAlertService.stop();
    } catch (e) {
      console.log("Falha ao rejeitar", e);
    } finally {
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader
        title="Solicitações"
        right={
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
            {requests.length}
          </Text>
        }
      />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        {requests.length === 0 ? (
          <Text style={{ color: "rgba(255,255,255,0.7)" }}>
            Nenhuma solicitação no momento.
          </Text>
        ) : (
          requests.map((r) => (
            <View
              key={r.rideId}
              style={{
                backgroundColor: "#162e26",
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "white", fontWeight: "800" }}>
                {formatBRL(r.pricing?.total ?? 0)}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 6 }}>
                Coleta: {r.pickup?.address || "—"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                Destino: {r.dropoff?.address || "—"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 6 }}>
                {r.distance?.text || ""}
              </Text>

              <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => reject(r.rideId)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "rgba(239,68,68,0.5)",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#ef4444", fontWeight: "900" }}>
                    Rejeitar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => accept(r.rideId)}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    borderRadius: 12,
                    backgroundColor: "#02de95",
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                    Aceitar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
