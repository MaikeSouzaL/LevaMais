import { useEffect, useRef, useState } from "react";
import Toast from "react-native-toast-message";
import { supabase } from "@/lib/supabase";

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

    const channel = supabase
      .channel(`driver-search:${currentRideId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${currentRideId}` },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as any;
          const status = String(row?.status || "").toLowerCase();

          if (String(row?.status || "").startsWith("cancelled")) {
            setSearchingState((prev) => ({ ...prev, visible: false }));
            resetDriverState();
            try { driverFoundRef.current?.close?.(); } catch {}

            const noDriverDetected = status === "cancelled_no_driver";
            setCancelNotice({
              visible: true,
              kind: noDriverDetected ? "no_driver" : "generic",
              reason: noDriverDetected ? "Nenhum motorista disponivel no momento." : undefined,
            });
            Toast.show({
              type: "error",
              text1: "Corrida cancelada",
              text2: "Tente novamente.",
            });
            return;
          }

          // Motorista encontrado
          if (row?.driver_id && ["accepted", "driver_assigned", "driver_arriving", "arrived", "in_progress"].includes(status)) {
            setSearchingState((prev) => ({ ...prev, visible: false }));
            setDriverFoundState({
              found: true,
              info: null,
              location: null,
            });
            setTimeout(() => {
              driverFoundRef.current?.snapToIndex?.(0);
            }, 150);
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
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

