import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, AppState, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
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
import { useAuthStore } from "../../../context/authStore";
import { useChatStore } from "../../../context/chatStore";
import MapMarker, { getClientMarkerType } from "../../../components/MapMarker";
import { decodePolyline, LatLng } from "../../../utils/polyline";

type Params = {
  DriverRide: {
    rideId: string;
  };
};

export default function DriverRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRide">>();
  const rideId = route.params?.rideId;
  const currentUserId = useAuthStore((s) => s.userData?.id) || "";
  const unreadCount = useChatStore((s) => s.unreadCounts[rideId || ""]) || 0;

  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<string>("accepted");
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [liveEtaText, setLiveEtaText] = useState<string>("");
  const [liveDistanceText, setLiveDistanceText] = useState<string>("");
  const [liveSpeedKmh, setLiveSpeedKmh] = useState<number>(0);
  const intervalRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);
  const lastCameraUpdateRef = useRef(0);
  const cancelHandledRef = useRef(false);
  const statusRef = useRef<string>("accepted");
  const lastAppStateRef = useRef(AppState.currentState);

  const [actionLoading, setActionLoading] = useState<
    null | "cancel" | "arrived" | "in_progress" | "completed"
  >(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<
    string | null
  >(null);

  const cancelReasons = useMemo<CancelReason[]>(
    () => [
      { id: "client_no_show", label: "Cliente nao apareceu" },
      { id: "wrong_pickup", label: "Local de coleta incorreto" },
      { id: "vehicle_issue", label: "Problema com o veiculo" },
      { id: "safety", label: "Problema de seguranca" },
      { id: "accident", label: "Acidente / imprevisto" },
      { id: "other", label: "Outro" },
    ],
    [],
  );

  const statusLabel = useMemo(() => {
    if (!status) return "-";
    if (status === "driver_arriving") return "A caminho da coleta";
    if (status === "accepted") return "Aceita";
    if (status === "arrived") return "Cheguei";
    if (status === "in_progress") return "Em andamento";
    if (status === "completed") return "Finalizada";
    if (String(status).startsWith("cancelled")) return "Cancelada";
    return status;
  }, [status]);

  const canArrive = status === "accepted" || status === "driver_arriving";
  const canStart = status === "arrived";
  const canComplete = status === "in_progress";
  const canCancel =
    status === "accepted" || status === "arrived" || status === "in_progress";

  const isDelivery = ride?.serviceType === "delivery";

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const recoverActiveRide = useCallback(async () => {
    try {
      const active = await rideService.getActive();
      if (active?.active && active.ride?._id) {
        const activeRideId = String(active.ride._id);
        if (!rideId || activeRideId !== String(rideId)) {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: "DriverRide", params: { rideId: activeRideId } }],
          });
        }
        return;
      }
    } catch {}

    (navigation as any).reset({
      index: 0,
      routes: [{ name: "DriverHome" }],
    });
  }, [navigation, rideId]);

  async function takePhotoBase64() {
    if (AppState.currentState !== "active") {
      throw new Error("Abra o app e tente novamente para usar a camera.");
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissao de camera negada");
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("current activity")) {
        throw new Error(
          "Nao foi possivel abrir a camera agora. Volte para o app e tente novamente.",
        );
      }
      throw e;
    }

    if (result.canceled) {
      throw new Error("Foto cancelada");
    }

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      throw new Error("Nao foi possivel ler a foto");
    }

    return `data:image/jpeg;base64,${asset.base64}`;
  }

  async function askContinueWithoutPhoto(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Camera indisponivel",
        "Nao foi possivel abrir a camera agora. Deseja continuar sem enviar foto?",
        [
          { text: "Voltar", style: "cancel", onPress: () => resolve(false) },
          { text: "Continuar", style: "default", onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });
  }

  useEffect(() => {
    let mounted = true;
    if (!rideId) {
      recoverActiveRide().catch(() => {});
      return;
    }
    cancelHandledRef.current = false;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatus(r?.status || "accepted");
      } catch (e) {
        console.log("Falha ao carregar corrida", e);
        if (mounted) {
          recoverActiveRide().catch(() => {});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recoverActiveRide, rideId]);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    let timer: any = null;
    const handleCancelledOnce = (message?: string) => {
      if (!mounted || cancelHandledRef.current) return;
      cancelHandledRef.current = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      Toast.show({
        type: "info",
        text1: "Corrida cancelada",
        text2: message,
      });
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "DriverHome" }],
      });
    };

    const syncRide = async () => {
      try {
        const current = await rideService.getById(rideId);
        if (!mounted) return;

        setRide(current as any);
        setStatus(current?.status || "accepted");

        if (String(current?.status || "").startsWith("cancelled")) {
          handleCancelledOnce("O cliente encerrou a corrida.");
        }
      } catch {
        // segue silencioso para evitar loop de erro em polling
      }
    };

    timer = setInterval(syncRide, 7000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [navigation, rideId]);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    const handleCancelledOnce = (message?: string) => {
      if (!mounted || cancelHandledRef.current) return;
      cancelHandledRef.current = true;
      Toast.show({
        type: "info",
        text1: "Corrida cancelada",
        text2: message,
      });
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "DriverHome" }],
      });
    };

    const onStatusUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId !== rideId) return;
      if (payload?.status) setStatus(String(payload.status));
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId !== rideId) return;
      handleCancelledOnce("O cliente encerrou a corrida.");
    };

    const onNewMsg = (data: any) => {
      if (!mounted) return;
      if (data?.rideId !== rideId) return;
      if (String(data?.senderId) === currentUserId) return;

      const sender =
        data?.senderName || (data?.senderType === "client" ? "Cliente" : "Motorista");
      const preview = String(data?.message || "").slice(0, 80);
      const navState = (navigation as any).getState?.();
      const activeRoute =
        navState?.routes?.[
          typeof navState?.index === "number" ? navState.index : (navState?.routes?.length || 1) - 1
        ];
      const activeRouteName = String(activeRoute?.name || "");

      if (activeRouteName !== "DriverChat") {
        useChatStore.getState().incrementUnread(rideId);
        Toast.show({ type: "info", text1: sender, text2: preview });
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("ride-status-updated", onStatusUpdated);
        webSocketService.on("ride-cancelled", onRideCancelled);
        webSocketService.on("new-message", onNewMsg);
      } catch {}
    })();

    return () => {
      mounted = false;
      webSocketService.off("ride-status-updated", onStatusUpdated);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("new-message", onNewMsg);
    };
  }, [navigation, rideId, currentUserId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      const resumed =
        prevState.match(/inactive|background/) && nextState === "active";

      if (!resumed) return;

      (async () => {
        try {
          await webSocketService.connect();
        } catch {}

        if (!rideId) {
          await recoverActiveRide();
          return;
        }

        try {
          const current = await rideService.getById(rideId);
          setRide(current as any);
          setStatus(current?.status || "accepted");

          const currentStatus = String(current?.status || "");
          if (currentStatus === "completed") {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: "DriverRateClient", params: { rideId } }],
            });
            return;
          }

          if (currentStatus.startsWith("cancelled")) {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: "DriverHome" }],
            });
          }
        } catch {
          await recoverActiveRide();
        }
      })().catch(() => {});
    });

    return () => subscription.remove();
  }, [navigation, recoverActiveRide, rideId]);

  useEffect(() => {
    const start = async () => {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== "granted") return;

      const tick = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setDriverCoords(current);
          setLiveSpeedKmh(
            typeof pos.coords.speed === "number" && pos.coords.speed > 0
              ? Math.max(0, pos.coords.speed * 3.6)
              : 0,
          );
          webSocketService.emit("update-location", {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
          });

          const now = Date.now();
          if (now - lastCameraUpdateRef.current > 700) {
            lastCameraUpdateRef.current = now;
            mapRef.current?.animateCamera(
              {
                center: current,
                pitch: 52,
                heading: pos.coords.heading ?? 0,
                zoom: statusRef.current === "in_progress" ? 19.6 : 19.2,
              },
              { duration: 450 },
            );
          }
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

    // validacoes do fluxo (estilo Uber/99)
    if (nextStatus === "arrived" && !canArrive) return;
    if (nextStatus === "in_progress" && !canStart) return;
    if (nextStatus === "completed" && !canComplete) return;

    setActionLoading(nextStatus);
    try {
      if (isDelivery && nextStatus === "in_progress") {
        try {
          const photo = await takePhotoBase64();
          await rideService.uploadPickupProof(rideId, photo);
        } catch (e: any) {
          const msg = String(e?.message || "");
          const isCameraUnavailable =
            msg.toLowerCase().includes("camera") ||
            msg.toLowerCase().includes("activity");

          if (!isCameraUnavailable) {
            throw e;
          }

          const continueWithoutPhoto = await askContinueWithoutPhoto();
          if (!continueWithoutPhoto) {
            throw new Error("Inicio cancelado: foto de coleta nao enviada.");
          }
        }
      }

      if (isDelivery && nextStatus === "completed") {
        try {
          const photo = await takePhotoBase64();
          await rideService.uploadDeliveryProof(rideId, photo);
        } catch (e: any) {
          const msg = String(e?.message || "");
          const isCameraUnavailable =
            msg.toLowerCase().includes("camera") ||
            msg.toLowerCase().includes("activity");

          if (!isCameraUnavailable) {
            throw e;
          }

          const continueWithoutPhoto = await askContinueWithoutPhoto();
          if (!continueWithoutPhoto) {
            throw new Error("Finalizacao cancelada: foto de entrega nao enviada.");
          }
        }
      }

      const r = await rideService.updateStatus(rideId, nextStatus);
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      if (nextStatus === "arrived") {
        webSocketService.emit("driver-arrived", { rideId });
        Toast.show({ type: "success", text1: "Voce marcou: Cheguei" });
      }
      if (nextStatus === "in_progress") {
        webSocketService.emit("start-ride", { rideId });
        Toast.show({
          type: "success",
          text1: isDelivery ? "Entrega iniciada" : "Corrida iniciada",
        });
      }
      if (nextStatus === "completed") {
        Toast.show({
          type: "success",
          text1: isDelivery ? "Entrega finalizada" : "Corrida finalizada",
        });
        // estilo Uber/99: pedir avaliacao
        try {
          (navigation as any).navigate("DriverRateClient", { rideId: r._id });
        } catch {
          try {
            (navigation as any).navigate("DriverHome");
          } catch {
            navigation.goBack();
          }
        }
      }
    } catch (e: any) {
      // se o motorista cancelou a foto, nao tratar como erro grave
      const msg = e?.message || "Tente novamente";
      Toast.show({
        type: "error",
        text1: "Nao foi possivel continuar",
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
        text1: "Nao foi possivel cancelar",
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

  const targetCoords =
    status === "in_progress"
      ? ride?.dropoff?.latitude && ride?.dropoff?.longitude
        ? {
            latitude: ride.dropoff.latitude,
            longitude: ride.dropoff.longitude,
          }
        : null
      : ride?.pickup?.latitude && ride?.pickup?.longitude
        ? {
            latitude: ride.pickup.latitude,
            longitude: ride.pickup.longitude,
          }
        : null;

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const run = async () => {
      if (!driverCoords || !targetCoords) return;
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      if (!key) return;

      try {
        const origin = `${driverCoords.latitude},${driverCoords.longitude}`;
        const destination = `${targetCoords.latitude},${targetCoords.longitude}`;
        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}` +
          `&destination=${encodeURIComponent(destination)}&mode=driving&key=${encodeURIComponent(key)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;

        const route = data?.routes?.[0];
        const leg = route?.legs?.[0];
        const points = route?.overview_polyline?.points;
        if (!route || !leg || !points) return;

        setLiveEtaText(String(leg?.duration?.text || ""));
        setLiveDistanceText(String(leg?.distance?.text || ""));
        setRouteCoords(decodePolyline(points));
      } catch {}
    };

    run();
    timer = setInterval(run, 8000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [driverCoords?.latitude, driverCoords?.longitude, targetCoords?.latitude, targetCoords?.longitude]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <DriverHeader
        title="Corrida ativa"
        right={
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
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
          </View>
        }
      />

      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation
          onMapRef={(ref) => {
            mapRef.current = ref;
          }}
        >
          {routeCoords.length >= 2 ? (
            <Polyline
              coordinates={routeCoords as any}
              strokeWidth={5}
              strokeColor="#02de95"
            />
          ) : !!driverCoords && !!targetCoords ? (
            <Polyline
              coordinates={[driverCoords, targetCoords] as any}
              strokeWidth={5}
              strokeColor="#02de95"
            />
          ) : null}
          {!!ride?.pickup?.latitude && !!ride?.pickup?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Coleta"
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapMarker type={getClientMarkerType(ride.serviceType, ride.purposeId)} />
            </Marker>
          )}
          {!!ride?.dropoff?.latitude && !!ride?.dropoff?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="Destino"
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapMarker type="dropoff" />
            </Marker>
          )}
        </GlobalMap>

        <View
          style={{
            position: "absolute",
            right: 12,
            top: 92,
            gap: 8,
            alignItems: "center",
          }}
        >
          {[
            { label: "ETA", value: liveEtaText || "--" },
            { label: "KM", value: liveDistanceText || "--" },
            { label: "VEL", value: `${Math.round(liveSpeedKmh)}` },
          ].map((item) => (
            <View
              key={item.label}
              style={{
                width: 58,
                height: 58,
                borderRadius: 29,
                backgroundColor: "rgba(12,25,39,0.9)",
                borderWidth: 1,
                borderColor: "rgba(2,222,149,0.35)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 9, fontWeight: "800" }}>
                {item.label}
              </Text>
              <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 13, marginTop: 1 }}>
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ position: "absolute", left: 16, right: 16, bottom: 16 }}>
          <DriverStatusCard
            statusLabel={statusLabel}
            pickupAddress={ride?.pickup?.address}
            dropoffAddress={ride?.dropoff?.address}
            showRouteDetails
            canArrive={canArrive}
            canStart={canStart}
            canComplete={canComplete}
            actionLoading={actionLoading}
            onArrive={() => update("arrived")}
            onStart={() => update("in_progress")}
            onComplete={() => update("completed")}
            onChat={() => {
              if (!rideId) return;
              useChatStore.getState().clearUnread(rideId);
              (navigation as any).navigate("DriverChat", {
                rideId,
                clientName: (ride?.clientId as any)?.name || "Cliente",
              });
            }}
            unreadCount={unreadCount}
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
