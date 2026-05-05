import { useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import webSocketService from "@/services/websocket.service";

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  photo?: string;
  rating: number;
  vehicle: {
    brand: string;
    model: string;
    color: string;
    plate: string;
  };
}

export interface SearchingState {
  visible: boolean;
  title: string;
  price: string;
  eta: string;
  rideId?: string;
  secondsLeft?: number;
}

export interface DriverFoundState {
  found: boolean;
  info: DriverInfo | null;
  etaText?: string;
  location: {
    latitude: number;
    longitude: number;
  } | null;
}

export interface CancelNotice {
  visible: boolean;
  kind?: "driver_cancelled" | "no_driver" | "generic";
  reason?: string;
}

export function useDriverSearch(rideId?: string) {
  const [searchingState, setSearchingState] = useState<SearchingState>({
    visible: false,
    title: "",
    price: "",
    eta: "",
    secondsLeft: undefined,
  });

  const [driverFoundState, setDriverFoundState] = useState<DriverFoundState>({
    found: false,
    info: null,
    location: null,
  });

  const [cancelNotice, setCancelNotice] = useState<CancelNotice>({
    visible: false,
  });

  const driverFoundRef = useRef<any>(null);

  const startSearch = (data: {
    title: string;
    price: string;
    eta: string;
    rideId: string;
    secondsLeft?: number;
  }) => {
    setSearchingState({
      visible: true,
      ...data,
      secondsLeft: data.secondsLeft || 30,
    });
  };

  const stopSearch = () => {
    setSearchingState((prev) => ({ ...prev, visible: false }));
  };

  const setSearchSecondsLeft = (secondsLeft: number) => {
    setSearchingState((prev) => ({
      ...prev,
      secondsLeft: Math.max(0, secondsLeft),
    }));
  };

  const resetDriverState = () => {
    setDriverFoundState({
      found: false,
      info: null,
      location: null,
    });
  };

  useEffect(() => {
    let mounted = true;
    const currentRideId = searchingState.rideId || rideId;

    if (!searchingState.visible || !currentRideId) return;

    const onDriverFound = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      setSearchingState((prev) => ({ ...prev, visible: false }));

      const etaText =
        payload?.eta?.text ||
        (typeof payload?.eta === "string" ? payload.eta : undefined);

      setDriverFoundState({
        found: true,
        info: payload?.driver || null,
        etaText,
        location: null,
      });

      setTimeout(() => {
        driverFoundRef.current?.snapToIndex?.(0);
      }, 150);
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      setSearchingState((prev) => ({ ...prev, visible: false }));
      resetDriverState();

      try {
        driverFoundRef.current?.close?.();
      } catch {
        // no-op
      }

      const cancelledBy = payload?.cancelledBy;
      const reason = payload?.reason;
      const status = String(payload?.status || "").toLowerCase();
      const noDriverDetected =
        status === "cancelled_no_driver" ||
        cancelledBy === "system" ||
        /nenhum motorista|sem motorista|no driver/i.test(String(reason || ""));

      if (noDriverDetected) {
        setCancelNotice({
          visible: true,
          kind: "no_driver",
          reason: reason ? String(reason) : "Nenhum motorista disponivel no momento.",
        });
      } else if (cancelledBy === "driver") {
        setCancelNotice({
          visible: true,
          kind: "driver_cancelled",
          reason: reason ? String(reason) : undefined,
        });

        setTimeout(() => {
          setCancelNotice({ visible: false, kind: undefined });
        }, 6000);
      } else {
        setCancelNotice({
          visible: true,
          kind: "generic",
          reason: reason ? String(reason) : undefined,
        });
      }

      Toast.show({
        type: "error",
        text1: cancelledBy === "driver" ? "O motorista cancelou" : "Corrida cancelada",
        text2: reason ? String(reason) : "Tente novamente.",
      });
    };

    const onDriverLocationUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== currentRideId) return;

      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverFoundState((prev) => ({
          ...prev,
          location: {
            latitude: Number(loc.latitude),
            longitude: Number(loc.longitude),
          },
        }));
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onDriverFound(onDriverFound);
        webSocketService.onRideCancelled(onRideCancelled);
        webSocketService.onDriverLocationUpdated(onDriverLocationUpdated);
        webSocketService.waitingDriver(currentRideId);
      } catch (e) {
        console.log("Falha ao conectar WebSocket", e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("driver-found", onDriverFound);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("driver-location-updated", onDriverLocationUpdated);
    };
  }, [searchingState.visible, searchingState.rideId, rideId]);

  return {
    searchingState,
    driverFoundState,
    cancelNotice,
    driverFoundRef,
    startSearch,
    stopSearch,
    setSearchSecondsLeft,
    resetDriverState,
    setCancelNotice,
  };
}

