import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, AppState, Alert, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import { DriverStatusCard } from "./components/DriverStatusCard";
import { ActiveDeliveryHeader } from "./components/ActiveDeliveryHeader";
import { FloatingMapControls } from "./components/FloatingMapControls";
import { ActiveDeliveryBottomSheet } from "./components/ActiveDeliveryBottomSheet";
import {
  DriverCancelReasonModal,
  CancelReason,
} from "./components/DriverCancelReasonModal";

import rideService, { Ride } from "../../../services/ride.service";
import webSocketService from "../../../services/websocket.service";
import { useAuthStore } from "../../../context/authStore";
import { useChatStore } from "../../../context/chatStore";
import MapMarker, { getClientMarkerType } from "../../../components/MapMarker";
import { decodePolyline, LatLng } from "../../../utils/polyline";
import { VehicleMarker } from "@/components/maps/VehicleMarker";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
  const vehicleType = useAuthStore((s) => s.userData?.vehicleType) || "motorcycle";
  const unreadCount = useChatStore((s) => s.unreadCounts[rideId || ""]) || 0;

  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<string>("accepted");
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [clientCoords, setClientCoords] = useState<{
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
  const autoArrivingRequestedRef = useRef(false);

  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  // Security PIN Verification States 🔐
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinType, setPinType] = useState<"pickup" | "delivery">("pickup");
  const [pinValue, setPinValue] = useState("");
  const [onPinSubmit, setOnPinSubmit] = useState<((pin: string) => void) | null>(null);
  const [onPinCancel, setOnPinCancel] = useState<(() => void) | null>(null);

  const promptForPin = (type: "pickup" | "delivery"): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPinType(type);
      setPinValue("");
      setPinModalVisible(true);
      setOnPinSubmit(() => (submittedPin: string) => {
        setPinModalVisible(false);
        resolve(submittedPin);
      });
      setOnPinCancel(() => () => {
        setPinModalVisible(false);
        reject(new Error("PIN nao verificado. Digite o PIN correto para prosseguir."));
      });
    });
  };

  useEffect(() => {
    AsyncStorage.getItem("mapStylePref").then((pref) => {
      if (pref) setUseDarkMap(pref === "dark");
    }).catch(() => {});
  }, []);

  const handleToggleMapStyle = () => {
    if (isSwitchingMapStyle) return;
    setIsSwitchingMapStyle(true);
    setUseDarkMap((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mapStylePref", next ? "dark" : "light").catch(() => {});
      return next;
    });
    setTimeout(() => setIsSwitchingMapStyle(false), 300);
  };

  const handleCenterMyLocation = () => {
    if (!driverCoords) return;
    setIsCentering(true);
    mapRef.current?.animateToRegion({
      ...driverCoords,
      latitudeDelta: 0.008,
      longitudeDelta: 0.008,
    }, 600);
    setTimeout(() => setIsCentering(false), 700);
  };

  const handleSOS = () => {
    try {
      (navigation as any).navigate("DriverSafety");
    } catch {}
  };

  const [actionLoading, setActionLoading] = useState<
    null | "cancel" | "driver_arriving" | "arrived" | "in_progress" | "completed" | "arrived_at_dropoff"
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
    if (status === "payment_pending") return "Aguardando pagamento do cliente";
    if (status === "driver_arriving") return "A caminho da coleta";
    if (status === "driver_assigned") return "Entrega reservada";
    if (status === "accepted") return "Aceita";
    if (status === "arrived") return "Cheguei";
    if (status === "in_progress") return "Em andamento";
    if (status === "completed") return "Finalizada";
    if (String(status).startsWith("cancelled")) return "Cancelada";
    return status;
  }, [status]);

  const isDelivery = ride?.serviceType === "delivery";
  const isAwaitingPayment = status === "payment_pending";
  const arrivedAtDropoff = Boolean(ride?.arrivedAtDropoff);

  const canArrive =
    status === "accepted" ||
    status === "driver_assigned" ||
    status === "driver_arriving";
  const canStart = status === "arrived";
  const canComplete = status === "in_progress" && (!isDelivery || arrivedAtDropoff);
  const canArriveDropoff = isDelivery && status === "in_progress" && !arrivedAtDropoff;
  const canCancel =
    status === "payment_pending" ||
    status === "accepted" ||
    status === "driver_assigned" ||
    status === "driver_arriving" ||
    status === "arrived" ||
    status === "in_progress";

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

  useEffect(() => {
    if (!rideId) return;
    if (!["accepted", "driver_assigned"].includes(status)) return;
    if (autoArrivingRequestedRef.current) return;

    autoArrivingRequestedRef.current = true;

    (async () => {
      try {
        const updated = await rideService.updateStatus(rideId, "driver_arriving");
        setRide(updated as any);
        setStatus(updated?.status || "driver_arriving");
      } catch {
        // fallback silencioso: mantem fluxo com status atual
      }
    })();
  }, [rideId, status]);

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
    autoArrivingRequestedRef.current = false;
    cancelHandledRef.current = false;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatus(r?.status || "accepted");
      } catch (e) {
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
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
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
          handleCancelledOnce(
            isDelivery
              ? "O cliente encerrou a entrega."
              : "O cliente encerrou a corrida.",
          );
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
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
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
      if (payload?.status) { setStatus(String(payload.status)); if (payload.ride) setRide(payload.ride); }
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId !== rideId) return;
      handleCancelledOnce(
        isDelivery
          ? "O cliente encerrou a entrega."
          : "O cliente encerrou a corrida.",
      );
    };

    const onNewMsg = (data: any) => {
      if (!mounted) return;
      if (data?.rideId !== rideId) return;
      if (String(data?.senderId) === currentUserId) return;

      const sender =
        data?.senderName || (data?.senderType === "client" ? "Cliente" : "Motorista");
      const preview = String(data?.message || "").slice(0, 80);
      const navState = navigation.getState?.();
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

    const onClientLocationUpdate = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId !== rideId) return;
      const lat = Number(payload?.latitude);
      const lng = Number(payload?.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setClientCoords({ latitude: lat, longitude: lng });
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("ride-status-updated", onStatusUpdated);
        webSocketService.on("ride-cancelled", onRideCancelled);
        webSocketService.on("delivery-cancelled", onRideCancelled);
        webSocketService.on("new-message", onNewMsg);
        webSocketService.on("client-location-update", onClientLocationUpdate);
      } catch {}
    })();

    return () => {
      mounted = false;
      webSocketService.off("ride-status-updated", onStatusUpdated);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("delivery-cancelled", onRideCancelled);
      webSocketService.off("new-message", onNewMsg);
      webSocketService.off("client-location-update", onClientLocationUpdate);
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
            accuracy: pos.coords.accuracy ?? undefined,
            rideId: rideId || undefined,
            phase: statusRef.current === "driver_arriving" ? "to_pickup"
                 : statusRef.current === "arrived" ? "at_pickup"
                 : statusRef.current === "in_progress" ? "to_dropoff"
                 : "to_pickup",
            capturedAt: new Date().toISOString(),
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


  const handleArriveDropoff = async () => {
    if (!rideId) return;
    setActionLoading("arrived_at_dropoff");
    try {
      const r = await rideService.updateStatus(rideId, undefined as any, true);
      setRide(r as any);
      setStatus(r?.status || status);
      Toast.show({ type: "success", text1: "Chegada no destino registrada" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setActionLoading(null);
    }
  };
  const update = async (
    nextStatus: "driver_arriving" | "arrived" | "in_progress" | "completed",
  ) => {
    if (!rideId) return;

    // validacoes do fluxo (estilo Uber/99)
    if (
      nextStatus === "driver_arriving" &&
      !["accepted", "driver_assigned"].includes(status)
    ) return;
    if (nextStatus === "arrived" && !canArrive) return;
    if (nextStatus === "in_progress" && !canStart) return;
    if (nextStatus === "completed" && !canComplete) return;

    let inputPickupPin: string | undefined = undefined;
    let inputDeliveryPin: string | undefined = undefined;

    if (nextStatus === "in_progress" && ride?.details?.pickupPin) {
      try {
        inputPickupPin = await promptForPin("pickup");
      } catch {
        return;
      }
    }
    if (nextStatus === "completed" && ride?.details?.deliveryPin) {
      try {
        inputDeliveryPin = await promptForPin("delivery");
      } catch {
        return;
      }
    }

    setActionLoading(nextStatus);
    try {
      const r = await rideService.updateStatus(rideId, nextStatus, false, {
        pickupPin: inputPickupPin,
        deliveryPin: inputDeliveryPin,
      });
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      if (nextStatus === "driver_arriving") {
        Toast.show({ type: "success", text1: "Voce esta a caminho da coleta" });
      }
      if (nextStatus === "arrived") {
        webSocketService.emit("driver-arrived", { rideId });
        Toast.show({ type: "success", text1: "Voce marcou: Cheguei" });
        // Redirecionar para confirmacao de coleta (delivery)
        if (isDelivery) {
          setTimeout(() => {
            (navigation as any).navigate("DeliveryPickupConfirm", { rideId });
          }, 500);
          return;
        }
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
      Toast.show({
        type: "success",
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      });
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
  const pickupLat = Number(ride?.pickup?.latitude);
  const pickupLng = Number(ride?.pickup?.longitude);
  const dropoffLat = Number(ride?.dropoff?.latitude);
  const dropoffLng = Number(ride?.dropoff?.longitude);
  const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
  const hasDropoffCoords = Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng);

  const targetCoords =
    status === "in_progress"
      ? hasDropoffCoords
        ? {
            latitude: dropoffLat,
            longitude: dropoffLng,
          }
        : null
      : hasPickupCoords
        ? {
            latitude: pickupLat,
            longitude: pickupLng,
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

  const driverAvatar = useAuthStore((s) => s.userData?.profilePhoto || s.userData?.fotoPerfil);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }} edges={["top"]}>
      <ActiveDeliveryHeader
        driverPhoto={driverAvatar}
        isDelivery={isDelivery}
        canCancel={canCancel}
        onCancelPress={() => {
          try {
            (navigation as any).navigate("DriverCancelRide", { rideId });
          } catch {
            setCancelModalOpen(true);
          }
        }}
      />

      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation={false}
          useDarkStyle={useDarkMap}
          onMapRef={(ref) => {
            mapRef.current = ref;
          }}
        >
          {!!driverCoords && (
             <Marker
               key={`driver-puck-${vehicleType}`}
               coordinate={{
                 latitude: driverCoords.latitude,
                 longitude: driverCoords.longitude,
               }}
               flat={true}
               anchor={{ x: 0.5, y: 0.5 }}
               tracksViewChanges={true}
               style={{ width: 40, height: 40 }}
             >
                <VehicleMarker 
                  type={vehicleType as any} 
                  isOnline={true} 
                />
             </Marker>
          )}
          {!!clientCoords && (
             <Marker
               coordinate={{
                 latitude: clientCoords.latitude,
                 longitude: clientCoords.longitude,
               }}
               title="Cliente"
               tracksViewChanges={false}
               anchor={{ x: 0.5, y: 1 }}
             >
               <MapMarker type="client" />
             </Marker>
          )}
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
          {hasPickupCoords && (
            <Marker
              coordinate={{
                latitude: pickupLat,
                longitude: pickupLng,
              }}
              title="Coleta"
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapMarker type={getClientMarkerType(ride?.serviceType)} />
            </Marker>
          )}
          {hasDropoffCoords && (
            <Marker
              coordinate={{
                latitude: dropoffLat,
                longitude: dropoffLng,
              }}
              title="Destino"
              tracksViewChanges={false}
              anchor={{ x: 0.5, y: 1 }}
            >
              <MapMarker type="dropoff" />
            </Marker>
          )}
        </GlobalMap>

        {/* Floating GPS Map Controls */}
        <FloatingMapControls
          duration={liveEtaText || ride?.duration?.text}
          onCenterLocation={handleCenterMyLocation}
          onToggleStyle={handleToggleMapStyle}
          isCentering={isCentering}
          isSwitchingStyle={isSwitchingMapStyle}
        />

        {/* Active Delivery Bottom Sheet */}
        <View style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
          <ActiveDeliveryBottomSheet
            status={status}
            pickupAddress={ride?.pickup?.address}
            dropoffAddress={ride?.dropoff?.address}
            distance={liveDistanceText || ride?.distance?.text}
            duration={liveEtaText || ride?.duration?.text}
            earnings={ride?.pricing?.total || ride?.pricing?.driverValue}
            paymentLabel={ride?.payment?.method}
            recipientPhone={ride?.details?.recipientPhone}
            unreadCount={unreadCount}
            onChat={() => {
              if (!rideId) return;
              useChatStore.getState().clearUnread(rideId);
              (navigation as any).navigate("DriverChat", {
                rideId,
                clientName: (ride?.clientId as any)?.name || "Cliente",
              });
            }}
            onReportProblem={() => {
              try {
                (navigation as any).navigate("DriverCancelRide", { rideId });
              } catch {
                setCancelModalOpen(true);
              }
            }}
            onPrimaryActionPress={() => {
              if (canArrive) {
                update("arrived");
              } else if (canStart) {
                update("in_progress");
              } else if (canComplete) {
                update("completed");
              }
            }}
            actionLoading={actionLoading != null}
            canArrive={canArrive}
            canStart={canStart}
            canComplete={canComplete}
            isDelivery={isDelivery}
            canArriveDropoff={canArriveDropoff}
            onArriveDropoff={handleArriveDropoff}
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

      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onPinCancel?.()}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(9, 26, 47, 0.85)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <View style={{
            width: "100%",
            maxWidth: 340,
            backgroundColor: "#0c1927",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(2, 222, 149, 0.25)",
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 8,
            }}>
              {pinType === "pickup" ? "Segurança na Coleta" : "Segurança na Entrega"}
            </Text>
            
            <Text style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 18,
              marginBottom: 20,
            }}>
              {pinType === "pickup" 
                ? "Solicite o PIN de Coleta com o remetente da encomenda para poder iniciar o trajeto." 
                : "Solicite o PIN de Entrega com o recebedor para poder finalizar a corrida."}
            </Text>

            <TextInput
              style={{
                width: 160,
                height: 52,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1.5,
                borderColor: "#02de95",
                borderRadius: 8,
                color: "#fff",
                fontSize: 22,
                fontWeight: "900",
                textAlign: "center",
                letterSpacing: 8,
                paddingLeft: 8,
                marginBottom: 24,
              }}
              value={pinValue}
              onChangeText={(txt) => setPinValue(txt.replace(/[^0-9]/g, ""))}
              placeholder="0000"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus={true}
            />

            <View style={{
              flexDirection: "row",
              width: "100%",
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => onPinCancel?.()}
              >
                <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: pinValue.length === 4 ? "#02de95" : "rgba(2, 222, 149, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                disabled={pinValue.length !== 4}
                onPress={() => {
                  if (pinValue.length === 4) {
                    onPinSubmit?.(pinValue);
                  }
                }}
              >
                <Text style={{ color: pinValue.length === 4 ? "#091A2F" : "rgba(255,255,255,0.5)", fontWeight: "900", fontSize: 13 }}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
