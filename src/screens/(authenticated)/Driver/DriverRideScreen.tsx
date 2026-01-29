import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Modal, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { Marker } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import { DriverStatusCard } from "./components/DriverStatusCard";
import {
  DriverCancelReasonModal,
  CancelReason,
} from "./components/DriverCancelReasonModal";
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

  const [actionLoading, setActionLoading] = useState<
    null | "cancel" | "arrived" | "in_progress" | "completed"
  >(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<
    string | null
  >(null);

  const cancelReasons = useMemo<CancelReason[]>(
    () => [
      { id: "client_no_show", label: "Cliente não apareceu" },
      { id: "wrong_pickup", label: "Local de coleta incorreto" },
      { id: "vehicle_issue", label: "Problema com o veículo" },
      { id: "safety", label: "Problema de segurança" },
      { id: "accident", label: "Acidente / imprevisto" },
      { id: "other", label: "Outro" },
    ],
    [],
  );

  const statusLabel = useMemo(() => {
    if (!status) return "—";
    if (status === "accepted") return "Aceita";
    if (status === "arrived") return "Cheguei";
    if (status === "in_progress") return "Em andamento";
    if (status === "completed") return "Finalizada";
    if (String(status).startsWith("cancelled")) return "Cancelada";
    return status;
  }, [status]);

  const canArrive = status === "accepted";
  const canStart = status === "accepted" || status === "arrived";
  const canComplete = status === "in_progress";
  const canCancel =
    status === "accepted" || status === "arrived" || status === "in_progress";

  const isDelivery = ride?.serviceType === "delivery";

  async function takePhotoBase64() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissão de câmera negada");
    }

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.6,
      base64: true,
    });

    if (result.canceled) {
      throw new Error("Foto cancelada");
    }

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      throw new Error("Não foi possível ler a foto");
    }

    // data URL (MVP)
    return `data:image/jpeg;base64,${asset.base64}`;
  }

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

  const update = async (
    nextStatus: "arrived" | "in_progress" | "completed",
  ) => {
    if (!rideId) return;

    // validações do fluxo (estilo Uber/99)
    if (nextStatus === "arrived" && !canArrive) return;
    if (nextStatus === "in_progress" && !canStart) return;
    if (nextStatus === "completed" && !canComplete) return;

    setActionLoading(nextStatus);
    try {
      // iFood style: para entregas, exigir foto na coleta (antes de iniciar)
      if (isDelivery && nextStatus === "in_progress") {
        const photo = await takePhotoBase64();
        await rideService.uploadPickupProof(rideId, photo);
      }

      // iFood style: para entregas, exigir foto na entrega (antes de finalizar)
      if (isDelivery && nextStatus === "completed") {
        const photo = await takePhotoBase64();
        await rideService.uploadDeliveryProof(rideId, photo);
      }

      const r = await rideService.updateStatus(rideId, nextStatus);
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      if (nextStatus === "arrived") {
        webSocketService.emit("driver-arrived", { rideId });
        Toast.show({ type: "success", text1: "Você marcou: Cheguei" });
      }
      if (nextStatus === "in_progress") {
        webSocketService.emit("start-ride", { rideId });
        Toast.show({ type: "success", text1: "Entrega iniciada" });
      }
      if (nextStatus === "completed") {
        Toast.show({ type: "success", text1: "Entrega finalizada" });
        // estilo Uber/99: pedir avaliação
        try {
          (navigation as any).navigate("DriverRateClient", { rideId });
        } catch {
          try {
            (navigation as any).navigate("DriverHome");
          } catch {
            navigation.goBack();
          }
        }
      }
    } catch (e: any) {
      // se o motorista cancelou a foto, não tratar como erro grave
      const msg = e?.message || "Tente novamente";
      Toast.show({
        type: "error",
        text1: "Não foi possível continuar",
        text2: msg,
      });
      console.log("Falha ao atualizar status", e);
    } finally {
      setActionLoading(null);
    }
  };

  const cancel = async (reasonId: string) => {
    if (!rideId) return;
    if (!canCancel) return;

    // usar tela dedicada (estilo Uber/99)
    try {
      (navigation as any).navigate("DriverCancelRide", { rideId });
      return;
    } catch {}

    // fallback antigo
    setActionLoading("cancel");
    try {
      await rideService.cancel(rideId, reasonId);
      Toast.show({ type: "success", text1: "Entrega cancelada" });
      setCancelModalOpen(false);
      setSelectedCancelReason(null);
      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível cancelar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setActionLoading(null);
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
          <TouchableOpacity
            onPress={() => {
              if (!canCancel) return;
              try {
                (navigation as any).navigate("DriverCancelRide", { rideId });
              } catch {
                setCancelModalOpen(true);
              }
            }}
          >
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

        <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
          <DriverStatusCard
            statusLabel={statusLabel}
            pickupAddress={ride?.pickup?.address}
            dropoffAddress={ride?.dropoff?.address}
            canArrive={canArrive}
            canStart={canStart}
            canComplete={canComplete}
            actionLoading={actionLoading}
            onArrive={() => update("arrived")}
            onStart={() => update("in_progress")}
            onComplete={() => update("completed")}
          />
        </View>
      </View>

      <DriverCancelReasonModal
        visible={cancelModalOpen}
        reasons={cancelReasons}
        selectedReasonId={selectedCancelReason}
        onSelectReason={setSelectedCancelReason}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          if (!selectedCancelReason) return;
          cancel(selectedCancelReason);
        }}
        confirmDisabled={!selectedCancelReason || actionLoading != null}
        confirmLabel={
          actionLoading === "cancel" ? "Cancelando..." : "Confirmar"
        }
      />
    </SafeAreaView>
  );
}
