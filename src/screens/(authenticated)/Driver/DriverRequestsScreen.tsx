import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import Toast from "react-native-toast-message";
import { DriverScreen } from "./components/DriverScreen";
import { DriverEmptyState } from "./components/DriverEmptyState";
import { DriverRequestCard } from "./components/DriverRequestCard";
import { formatBRL } from "@/utils/mappers";

type RideRequestItem = {
  rideId: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  dropoff?: { address?: string; latitude?: number; longitude?: number };
  pricing?: { total?: number };
  distance?: { text?: string };
  duration?: { text?: string };
  serviceType?: string;
  vehicleType?: string;
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
  };
};

export default function DriverRequestsScreen() {
  const navigation = useNavigation();
  const [requests, setRequests] = useState<RideRequestItem[]>([]);

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      (async () => {
        try {
          const ride = await rideService.getActive();
          if (!active) return;
          if (ride?.active && ride.ride?._id) {
            (navigation as any).navigate("DriverRide", { rideId: ride.ride._id });
            return;
          }

          const me = await driverLocationService.getMe();
          if (!active) return;
          const isOnline = me?.status === "available";
          const hasAnyService =
            Array.isArray(me?.serviceTypes) && me.serviceTypes.length > 0;

          if (!isOnline || !hasAnyService) {
            (navigation as any).navigate("DriverHome");
          }
        } catch {
          if (!active) return;
          (navigation as any).navigate("DriverHome");
        }
      })();

      return () => {
        active = false;
      };
    }, [navigation]),
  );

  useEffect(() => {
    let mounted = true;
    const syncAvailableRequests = async () => {
      try {
        const available = await rideService.getAvailableRequests();
        if (!mounted) return;
        setRequests(
          (available?.requests || []).map((item: any) => ({
            rideId: item.rideId,
            pickup: item.pickup,
            dropoff: item.dropoff,
            pricing: item.pricing,
            distance: item.distance,
            duration: item.duration,
            serviceType: item.serviceType,
            vehicleType: item.vehicleType,
            negotiation: item.negotiation,
          })),
        );
      } catch {
        // ignora para manter a tela responsiva em reconexao
      }
    };

    (async () => {
      try {
        const active = await rideService.getActive();
        if (active?.active && active.ride?._id) {
          try {
            (navigation as any).navigate("DriverRide", {
              rideId: active.ride._id,
            });
          } catch {}
          return;
        }

        const me = await driverLocationService.getMe();
        const isOnline = me?.status === "available";
        const hasAnyService =
          Array.isArray(me?.serviceTypes) && me.serviceTypes.length > 0;

        if (!isOnline || !hasAnyService) {
          Toast.show({
            type: "info",
            text1: "Fique online para receber solicitacoes",
            text2: "Ative o modo online na tela inicial do motorista.",
          });

          try {
            (navigation as any).navigate("DriverHome");
          } catch {}
          return;
        }

        await syncAvailableRequests();
      } catch {
        Toast.show({
          type: "info",
          text1: "Atualize sua localizacao primeiro",
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
        duration: payload?.duration,
        serviceType: payload?.serviceType,
        vehicleType: payload?.vehicleType,
        negotiation: payload?.negotiation,
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
      setRequests((prev) => prev.filter((r) => r.rideId !== takenId));
    };

    const onRideExpired = (payload: any) => {
      if (!mounted) return;
      const expiredId = payload?.rideId;
      if (!expiredId) return;
      setRequests((prev) => prev.filter((r) => r.rideId !== expiredId));
    };

    const onSocketConnected = () => {
      syncAvailableRequests().catch(() => {});
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("connect", onSocketConnected);
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
      webSocketService.off("connect", onSocketConnected);
      driverAlertService.stop().catch(() => {});
    };
  }, [navigation]);

  useEffect(() => {
    if (requests.length === 0) {
      driverAlertService.stop();
    }
  }, [requests.length]);

  const accept = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId);
    if (request?.negotiation?.enabled) {
      try {
        await rideService.respondToOffer(rideId, { action: "accept" });
        Toast.show({
          type: "success",
          text1: "Oferta aceita",
          text2: "Aguardando cliente selecionar sua proposta.",
        });
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao enviar oferta",
          text2: e?.response?.data?.error || e?.message || "Tente novamente",
        });
      } finally {
        setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
        driverAlertService.stop().catch(() => {});
      }
      return;
    }

    try {
      const ride = await rideService.accept(rideId);
      await driverAlertService.stop();
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
      const currentRideId = e?.response?.data?.currentRideId;
      const msg = e?.response?.data?.error || e?.message;

      console.log("Falha ao aceitar", msg || e);

      if (currentRideId) {
        try {
          (navigation as any).navigate("DriverRide", { rideId: currentRideId });
        } catch {}
      }

      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      driverAlertService.stop().catch(() => {});
    }
  };

  const counterOffer = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId);
    if (!request?.negotiation?.enabled) return;

    const base = Number(request.negotiation.suggestedMinPrice || request.negotiation.clientOffer || 0);
    const amount = Number((base + 5).toFixed(2));

    try {
      await rideService.respondToOffer(rideId, {
        action: "counter",
        amount,
        message: "Contraoferta enviada automaticamente pelo app.",
      });
      Toast.show({
        type: "success",
        text1: "Contraoferta enviada",
        text2: `Valor sugerido: ${formatBRL(amount)}`,
      });
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      driverAlertService.stop().catch(() => {});
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha na contraoferta",
        text2: e?.response?.data?.error || e?.message || "Tente novamente",
      });
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
      title="Solicitacoes"
      scroll
      headerRight={
        <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800" }}>
          {requests.length}
        </Text>
      }
    >
      {requests.length === 0 ? (
        <DriverEmptyState title="Nenhuma solicitacao no momento." />
      ) : (
        requests.map((r) => (
          <DriverRequestCard
            key={r.rideId}
            item={r}
            onAccept={accept}
            onReject={reject}
            onCounterOffer={counterOffer}
          />
        ))
      )}
    </DriverScreen>
  );
}
