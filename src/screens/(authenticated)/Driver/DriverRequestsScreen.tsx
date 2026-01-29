import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useNavigation } from "@react-navigation/native";

import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import Toast from "react-native-toast-message";
import { DriverScreen } from "./components/DriverScreen";
import { DriverEmptyState } from "./components/DriverEmptyState";
import { DriverRequestCard } from "./components/DriverRequestCard";

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
        const isOnline =
          me?.status === "available" && me?.acceptingRides === true;
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
    <DriverScreen
      title="Solicitações"
      scroll
      headerRight={
        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
          {requests.length}
        </Text>
      }
    >
      {requests.length === 0 ? (
        <DriverEmptyState title="Nenhuma solicitação no momento." />
      ) : (
        requests.map((r) => (
          <DriverRequestCard
            key={r.rideId}
            item={r}
            onAccept={accept}
            onReject={reject}
          />
        ))
      )}
    </DriverScreen>
  );
}
