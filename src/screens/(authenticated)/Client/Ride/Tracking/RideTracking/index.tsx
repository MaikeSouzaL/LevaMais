import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Share, Animated, Modal, Image, ActivityIndicator, Clipboard, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAudioPlayer } from "expo-audio";
import { MessageCircle, QrCode } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline, AnimatedRegion } from "react-native-maps";
import { Icon } from "@/components/ui/Icon";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import rideService, { Ride } from "@/services/ride.service";
import chatService from "@/services/chat.service";
import { useAuthStore } from "@/context/authStore";
import { useChatStore } from "@/context/chatStore";
import { supabase } from "@/lib/supabase";
import { darkMapStyle } from "@/utils/mapStyle";
import { decodePolyline, LatLng } from "@/utils/polyline";
import { getPaymentMethodType } from "@/utils/payment";
import { estimateCancellationFee } from "@/utils/cancellationFee";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClientStackParamList } from "../../../types/navigation";
import { SOSButton } from "@/components/client/tracking/SOSButton";
import { ShareRideSheet } from "@/components/client/tracking/ShareRideSheet";
import { DriverIdentityCard } from "@/components/client/tracking/DriverIdentityCard";

const TERMINAL_STATUSES = [
  "completed",
  "cancelled",
  "cancelled_by_client",
  "cancelled_by_driver",
  "cancelled_no_driver",
  "expired",
];

const CANCELLABLE_STATUSES = [
  "requesting",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
];

function getStatusMeta(status?: string, serviceType?: string) {
  const isDelivery = serviceType === "delivery" || serviceType === "frete";

  const map: Record<
    string,
    { title: string; subtitle: string; color: string; bg: string }
  > = {
    requesting: {
      title: "Buscando motorista",
      subtitle: "Estamos procurando o melhor motorista para voce.",
      color: "#fbbf24",
      bg: "rgba(251,191,36,0.16)",
    },
    payment_pending: {
      title: "Aguardando pagamento",
      subtitle: "Confirme o pagamento para liberar a entrega.",
      color: "#f59e0b",
      bg: "rgba(245,158,11,0.18)",
    },
    driver_assigned: {
      title: "Motorista encontrado",
      subtitle: "Aguardando confirmacao final do motorista.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    accepted: {
      title: "Motorista aceitou",
      subtitle: "Ele ja esta indo para o ponto de coleta.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    driver_arriving: {
      title: "Motorista a caminho",
      subtitle: "Acompanhe no mapa a chegada na coleta.",
      color: "#60a5fa",
      bg: "rgba(96,165,250,0.16)",
    },
    arrived: {
      title: "Motorista chegou",
      subtitle: isDelivery ? "Vá ao encontro do motorista para entregar o pacote." : "Dirija-se ao ponto de embarque.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    in_progress: {
      title: isDelivery ? "Entrega em andamento" : "Corrida em andamento",
      subtitle: "Siga o trajeto ate o destino final.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    completed: {
      title: isDelivery ? "Entrega finalizada" : "Corrida finalizada",
      subtitle: "Pedido concluido com sucesso.",
      color: "#02de95",
      bg: "rgba(2,222,149,0.18)",
    },
    cancelled: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "O pedido foi cancelado.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_by_client: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "Cancelada por voce.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_by_driver: {
      title: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      subtitle: "Cancelada pelo motorista.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    cancelled_no_driver: {
      title: "Sem motorista disponivel",
      subtitle: "Nao foi possivel encontrar motorista.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
    expired: {
      title: "Busca expirada",
      subtitle: "A solicitacao expirou por falta de aceite.",
      color: "#ef4444",
      bg: "rgba(239,68,68,0.16)",
    },
  };

  return map[status || ""] || {
    title: "Acompanhando pedido",
    subtitle: "Estamos atualizando os dados do pedido.",
    color: "#fff",
    bg: "rgba(255,255,255,0.12)",
  };
}

type DeliveryTimelineStep = {
  key: string;
  label: string;
  done: boolean;
  active: boolean;
};

function getDeliveryTimeline(status: string): DeliveryTimelineStep[] {
  const isDone = (target: string) => {
    if (target === "to_pickup") {
      return ["driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress", "completed"].includes(status);
    }
    if (target === "arrived_pickup") {
      return ["arrived", "in_progress", "completed"].includes(status);
    }
    if (target === "picked_up") {
      return ["in_progress", "completed"].includes(status);
    }
    if (target === "to_dropoff") {
      return ["in_progress", "completed"].includes(status);
    }
    if (target === "arrived_dropoff") {
      return ["completed"].includes(status);
    }
    if (target === "completed") {
      return ["completed"].includes(status);
    }
    return false;
  };

  return [
    {
      key: "to_pickup",
      label: "Motorista a caminho da coleta",
      done: isDone("to_pickup"),
      active: ["driver_assigned", "accepted", "driver_arriving"].includes(status),
    },
    {
      key: "arrived_pickup",
      label: "Motorista chegou na coleta",
      done: isDone("arrived_pickup"),
      active: status === "arrived",
    },
    {
      key: "picked_up",
      label: "Pacote coletado",
      done: isDone("picked_up"),
      active: status === "in_progress",
    },
    {
      key: "to_dropoff",
      label: "A caminho da entrega",
      done: isDone("to_dropoff"),
      active: status === "in_progress",
    },
    {
      key: "arrived_dropoff",
      label: "Chegou no destino",
      done: isDone("arrived_dropoff"),
      active: false,
    },
    {
      key: "completed",
      label: "Entrega concluida",
      done: isDone("completed"),
      active: status === "completed",
    },
  ];
}

export default function RideTrackingScreen() {
  const route = useRoute<RouteProp<ClientStackParamList, "RideTracking">>();
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const insets = useSafeAreaInsets();
  const { rideId } = route.params;
  const currentUserId = useAuthStore((s) => s.userData?.id) || "";
  const unreadCount = useChatStore((s) => s.unreadCounts[rideId]) || 0;
  const mapRef = useRef<MapView>(null);
  const driverAnimatedLocation = useRef<any>(null);
  const [chatNotification, setChatNotification] = useState<{ sender: string; text: string } | null>(null);
  const notificationTimeoutRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(-400)).current;

  const handleNotificationPress = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setChatNotification(null);
      useChatStore.getState().clearUnread(rideId);
      navigation.navigate("Chat", { rideId, driverName: chatNotification?.sender });
    });
  };

  const handleNotificationClose = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setChatNotification(null);
    });
  };

  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

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

  const handleCenterMyLocation = async () => {
    setIsCentering(true);
    try {
      const pos = await Location.getLastKnownPositionAsync();
      if (pos?.coords) {
        mapRef.current?.animateToRegion({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      } else {
        const fresh = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        mapRef.current?.animateToRegion({
          latitude: fresh.coords.latitude,
          longitude: fresh.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 500);
      }
    } catch {}
    setTimeout(() => setIsCentering(false), 600);
  };

  const [shareSheetVisible, setShareSheetVisible] = useState(false);
  const [showSOS, setShowSOS] = useState(false);

  const handleSOSActivated = () => {
    setShowSOS(false);
    Toast.show({ type: 'info', text1: 'Alerta enviado', text2: 'As autoridades foram notificadas.' });
  };

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [traveledPath, setTraveledPath] = useState<LatLng[]>([]);
  const [routeEtaText, setRouteEtaText] = useState("");
  const [routeDistanceText, setRouteDistanceText] = useState("");
  const [showPixModal, setShowPixModal] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);
  const isDeliveryFlow =
    ride?.serviceType === "delivery" || ride?.serviceType === "frete";
  const driverName = useMemo(() => {
    const driver = ride?.driverId;
    if (!driver || typeof driver === "string") return null;
    return driver.name || null;
  }, [ride?.driverId]);

  const loadRide = useCallback(async () => {
    if (!rideId) return;

    try {
      const data = await rideService.getById(rideId);
      setRide(data);

      // Redirect to DeliveryTracking if this is a delivery
      if (data.serviceType === "delivery" || data.serviceType === "frete") {
        navigation.navigate("DeliveryTracking", { rideId });
        return;
      }

      if (TERMINAL_STATUSES.includes(String(data.status || ""))) {
        if (data.status === "completed") {
          navigation.navigate("RideCompleted", {
            rideId: data._id,
            total: data?.pricing?.total,
            pickupAddress: data?.pickup?.address,
            dropoffAddress: data?.dropoff?.address,
            driverName: typeof data?.driverId === "string" ? undefined : data?.driverId?.name,
            serviceType: data?.serviceType,
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        }
      }
    } catch (error: any) {
      const msg =
        error?.message ||
        `Nao foi possivel carregar ${
          isDeliveryFlow ? "a entrega" : "a corrida"
        }`;
      Toast.show({ type: "error", text1: "Erro", text2: msg });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } finally {
      setLoading(false);
    }
  }, [navigation, rideId, isDeliveryFlow]);

  useEffect(() => {
    if (!rideId) {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      return;
    }

    loadRide();
    // Realtime ensures the component updates immediately. Polling is redundant.
    // const poll = setInterval(loadRide, 5000);
    // return () => clearInterval(poll);
  }, [rideId, navigation, loadRide]);

  useEffect(() => {
    if (!rideId) return;
    let mounted = true;
    const isCurrentDelivery =
      ride?.serviceType === "delivery" || ride?.serviceType === "frete";

    const onNewMsg = async (data: any) => {
      if (!mounted) return;
      if (String(data?.senderId) === currentUserId) return;

      const sender =
        data?.senderName || (data?.senderType === "driver" ? "Motorista" : "Cliente");
      const preview = String(data?.message || "").slice(0, 80);
      const navState = navigation.getState?.();
      const activeRoute =
        navState?.routes?.[
          typeof navState?.index === "number" ? navState.index : (navState?.routes?.length || 1) - 1
        ];
      const activeRouteName = String(activeRoute?.name || "");

      if (activeRouteName !== "Chat") {
        useChatStore.getState().incrementUnread(rideId);

        // Play sound
        try {
          const player = createAudioPlayer(require("../../../../../../assets/sound/notification.mp3"));
          player.volume = 1.0;
          player.loop = false;
          player.play();
          const subscription = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
              subscription.remove();
              player.release();
            }
          });
        } catch (error) {
          console.log("Falha ao reproduzir som:", error);
        }

        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        setChatNotification({ sender, text: preview });
        slideAnim.setValue(-400);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();

        notificationTimeoutRef.current = setTimeout(() => {
          if (mounted) {
            Animated.timing(slideAnim, {
              toValue: 400,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setChatNotification(null);
            });
          }
        }, 10000);
      }
    };

    // Supabase Realtime: escuta mudanças na corrida (nome de canal único por instância)
    const rideChannel = supabase
      .channel(`ride:${rideId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideId}` },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as any;
          if (String(row?.status || "").startsWith("cancelled")) {
            Toast.show({
              type: "error",
              text1: isCurrentDelivery ? "Entrega cancelada" : "Corrida cancelada",
            });
            navigation.reset({ index: 0, routes: [{ name: "Home" }] });
            return;
          }
          if (row?.payment?.status === "paid") {
            Toast.show({
              type: "success",
              text1: "Pagamento Confirmado!",
              text2: "Seu pagamento via PIX foi processado com sucesso.",
            });
            setShowPixModal(false);
          }
          loadRide();
        },
      )
      .subscribe();

    // Chat via chatService Supabase Realtime
    const cleanupChat = chatService.onNewMessage(rideId, (msg) => {
      onNewMsg(msg);
    });

    return () => {
      mounted = false;
      supabase.removeChannel(rideChannel);
      cleanupChat();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [rideId, loadRide, navigation, currentUserId, ride?.serviceType]);

  // Breadcrumb: trajeto realmente percorrido pelo motorista (route-audit)
  useEffect(() => {
    if (!rideId) return;
    const activeStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
    if (!activeStatuses.includes(String(ride?.status || ""))) return;

    let active = true;
    const loadTrack = async () => {
      try {
        const audit = await rideService.getRouteAudit(rideId);
        if (!active) return;
        const pts = Array.isArray(audit?.track) ? audit.track : [];
        const path = pts
          .filter((p: any) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
          .map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        if (path.length >= 2) setTraveledPath(path);
      } catch {}
    };
    loadTrack();
    const timer = setInterval(loadTrack, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [rideId, ride?.status]);

  // Supabase Realtime: posição do motorista em tempo real (complementa o socket)
  useEffect(() => {
    const driverRaw = ride?.driverId;
    const driverId = typeof driverRaw === "string"
      ? driverRaw
      : (driverRaw as any)?._id || (driverRaw as any)?.id;
    if (!driverId) return;

    const channel = supabase
      .channel(`driver-location:${driverId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "driver_locations", filter: `id=eq.${driverId}` },
        (payload) => {
          const row = payload.new as any;
          const lat = Number(row?.latitude);
          const lng = Number(row?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

          if (!driverAnimatedLocation.current) {
            driverAnimatedLocation.current = new AnimatedRegion({
              latitude: lat,
              longitude: lng,
              latitudeDelta: 0.004,
              longitudeDelta: 0.004,
            });
          } else {
            driverAnimatedLocation.current.timing({
              latitude: lat,
              longitude: lng,
              duration: 3000,
              useNativeDriver: false,
            }).start();
          }
          setDriverLocation({ latitude: lat, longitude: lng });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ride?.driverId]);

  const pickupCoord = useMemo(() => {
    const pickupLat = Number(ride?.pickup?.latitude);
    const pickupLng = Number(ride?.pickup?.longitude);
    if (
      !Number.isFinite(pickupLat) ||
      !Number.isFinite(pickupLng)
    ) {
      return null;
    }
    return {
      latitude: pickupLat,
      longitude: pickupLng,
    };
  }, [ride?.pickup?.latitude, ride?.pickup?.longitude]);

  const dropoffCoord = useMemo(() => {
    const dropoffLat = Number(ride?.dropoff?.latitude);
    const dropoffLng = Number(ride?.dropoff?.longitude);
    if (
      !Number.isFinite(dropoffLat) ||
      !Number.isFinite(dropoffLng)
    ) {
      return null;
    }
    return {
      latitude: dropoffLat,
      longitude: dropoffLng,
    };
  }, [ride?.dropoff?.latitude, ride?.dropoff?.longitude]);

  const status = String(ride?.status || "");
  const statusMeta = getStatusMeta(status, ride?.serviceType);
  const canCancel = CANCELLABLE_STATUSES.includes(status);
  const rideLabel =
    ride?.serviceType === "delivery" || ride?.serviceType === "frete"
      ? "Entrega"
      : "Corrida";
  const deliveryTimeline = useMemo(
    () => (isDeliveryFlow ? getDeliveryTimeline(status) : []),
    [isDeliveryFlow, status],
  );

  const routeMode: "toPickup" | "toDropoff" | "none" = useMemo(() => {
    if (!pickupCoord || !dropoffCoord) return "none";
    if (status === "in_progress") return "toDropoff";
    if (!driverLocation) return "toDropoff";
    if (["accepted", "driver_arriving", "arrived", "driver_assigned"].includes(status)) {
      return "toPickup";
    }
    return "toDropoff";
  }, [driverLocation, pickupCoord, dropoffCoord, status]);

  const toDropoffOrigin = useMemo(() => {
    if (driverLocation && status === "in_progress") return driverLocation;
    return pickupCoord;
  }, [driverLocation, pickupCoord, status]);

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const loadRoute = async () => {
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      if (!key) return;

      const origin =
        routeMode === "toPickup"
          ? driverLocation
          : routeMode === "toDropoff"
            ? toDropoffOrigin
            : null;

      const destination =
        routeMode === "toPickup"
          ? pickupCoord
          : routeMode === "toDropoff"
            ? dropoffCoord
            : null;

      if (!origin || !destination) {
        setRouteCoords([]);
        return;
      }

      try {
        let waypointsQuery = "";
        if (routeMode === "toDropoff" && Array.isArray(ride?.stops) && ride.stops.length > 0) {
          const wpString = ride.stops.map((s: any) => `${s.latitude},${s.longitude}`).join("|");
          waypointsQuery = `&waypoints=${encodeURIComponent(wpString)}`;
        }

        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}` +
          `&destination=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}${waypointsQuery}` +
          `&mode=driving&key=${encodeURIComponent(key)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;
        const points = data?.routes?.[0]?.overview_polyline?.points;
        const leg = data?.routes?.[0]?.legs?.[0];
        if (!points) return;
        setRouteEtaText(String(leg?.duration?.text || ""));
        setRouteDistanceText(String(leg?.distance?.text || ""));
        setRouteCoords(decodePolyline(points));
      } catch {}
    };

    loadRoute();
    timer = setInterval(loadRoute, 8000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [
    routeMode,
    driverLocation?.latitude,
    driverLocation?.longitude,
    toDropoffOrigin?.latitude,
    toDropoffOrigin?.longitude,
    pickupCoord?.latitude,
    pickupCoord?.longitude,
    dropoffCoord?.latitude,
    dropoffCoord?.longitude,
    JSON.stringify(ride?.stops),
  ]);

  useEffect(() => {
    const points: { latitude: number; longitude: number }[] = [];
    if (pickupCoord) points.push(pickupCoord);
    if (dropoffCoord) points.push(dropoffCoord);
    if (driverLocation) points.push(driverLocation);

    if (points.length < 2) return;
    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(points, {
        edgePadding: { top: 170, right: 48, bottom: 250, left: 48 },
        animated: true,
      });
    }, 200);

    return () => clearTimeout(timer);
  }, [pickupCoord, dropoffCoord, driverLocation]);

  const handleShareRide = () => {
    setShareSheetVisible(true);
  };

  const isDriverGoingToPickup = [
    "driver_assigned",
    "accepted",
    "driver_arriving",
  ].includes(status);

  // Preview da taxa de cancelamento (espelha a regra do backend: janela 2 min / 20%).
  const cancellationFeePreview = estimateCancellationFee(ride as any);

  return (
    <ErrorBoundary componentName="RideTrackingScreen">
      <SafeAreaView className="flex-1 bg-[#091A2F]">
      <StatusBar barStyle="light-content" backgroundColor="#091A2F" translucent={false} />
      <GlobalMap
        ref={mapRef}
        className="absolute inset-0"
        initialRegion={{
          latitude: pickupCoord?.latitude || -23.5505,
          longitude: pickupCoord?.longitude || -46.6333,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        useDarkStyle={useDarkMap}
        showsUserLocation={false}
      >
        {/* Breadcrumb: por onde o motorista já passou (cinza, por baixo) */}
        {traveledPath.length >= 2 && (
          <Polyline
            coordinates={traveledPath}
            strokeWidth={5}
            strokeColor="rgba(148,163,184,0.65)"
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}
        {routeCoords.length >= 2 ? (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={routeMode === "toPickup" ? "#60a5fa" : "#0000"}
          />
        ) : routeMode === "toPickup" && driverLocation && pickupCoord ? (
          <Polyline
            coordinates={[driverLocation, pickupCoord]}
            strokeWidth={4}
            strokeColor="#60a5fa"
          />
        ) : routeMode === "toDropoff" && toDropoffOrigin && dropoffCoord ? (
          <Polyline
            coordinates={[toDropoffOrigin, dropoffCoord]}
            strokeWidth={4}
            strokeColor="#0000"
          />
        ) : null}

{!!pickupCoord && (
  <Marker coordinate={pickupCoord} title="Coleta" tracksViewChanges={true} anchor={{ x: 0.35, y: 0.75 }}>
    <RoutePin variant="pickup" />
  </Marker>
)}
{Array.isArray(ride?.stops) && ride!.stops!.map((stop: any, idx: number) => {
  const sLat = Number(stop?.latitude);
  const sLng = Number(stop?.longitude);
  if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return null;
  return (
    <Marker key={`stop-${idx}`} coordinate={{ latitude: sLat, longitude: sLng }} title={`Parada ${idx + 1}`} tracksViewChanges={true} anchor={{ x: 0.5, y: 1 }}>
      <StopPin index={idx + 1} />
    </Marker>
  );
})}
{!!dropoffCoord && (
  <Marker coordinate={dropoffCoord} title="Destino" tracksViewChanges={true} anchor={{ x: 0.35, y: 0.75 }}>
    <RoutePin variant="dropoff" />
  </Marker>
)}
{!!driverLocation && driverAnimatedLocation.current && (
  <Marker.Animated coordinate={driverAnimatedLocation.current as any} title="Motorista" tracksViewChanges={true} anchor={{ x: 0.35, y: 0.75 }}>
    <RoutePin variant="driver" />
  </Marker.Animated>
)}
      </GlobalMap>

      <View className="absolute left-4 right-4 bg-[#11253E] border border-white/[0.06] rounded-2xl p-4" style={{ top: Math.max(insets.top + 10, 20) }}>
        <View className="flex-row justify-between items-center gap-1">
          <Text className="text-[rgba(255,255,255,0.5)] text-[10px] font-bold tracking-widest mb-1">ACOMPANHAMENTO EM TEMPO REAL</Text>
          {(ride?.serviceType === "delivery" || ride?.serviceType === "frete") && (
            <TouchableOpacity
              className="flex-row items-center gap-1 px-2 py-1.5 rounded-full border border-white/20 bg-white/[0.08]"
              accessibilityLabel="Voltar para início"
              accessibilityRole="button"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home", params: { suppressAutoRedirect: rideId } }] })}
            >
              <Icon name="home" size={14} color="#fff" />
              <Text className="text-white text-[11px] font-bold">Inicio</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1.5 rounded-full self-start" style={{ backgroundColor: statusMeta.bg }}>
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
          <Text className="text-[10px] font-bold" style={{ color: statusMeta.color }}>{statusMeta.title}</Text>
        </View>
        <Text className="text-[rgba(255,255,255,0.85)] text-[13px] mt-1.5 leading-5">{statusMeta.subtitle}</Text>
        {(isDriverGoingToPickup || status === "in_progress") && (
          <View className="mt-3 p-4 rounded-xl border border-[rgba(96,165,250,0.24)] bg-[rgba(96,165,250,0.10)] flex-row items-center justify-between">
            <View>
              <Text className="text-[rgba(255,255,255,0.5)] text-[10px] font-bold uppercase">
                {status === "in_progress"
                  ? (isDeliveryFlow ? "Chegada no destino" : "Chegada no desembarque")
                  : (isDeliveryFlow ? "Chegada na coleta" : "Chegada no embarque")}
              </Text>
              <Text className="text-white text-[17px] font-bold mt-1">{routeEtaText || "Calculando..."}</Text>
            </View>
            <View className="w-[1px] h-9 bg-white/[0.12]" />
            <View>
              <Text className="text-[rgba(255,255,255,0.5)] text-[10px] font-bold uppercase">Distancia</Text>
              <Text className="text-white text-[17px] font-bold mt-1">{routeDistanceText || "--"}</Text>
            </View>
          </View>
        )}
      </View>


      <MapActionButtons
        onSosPress={() => setShowSOS(true)}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={320}
      />
      <View className="absolute left-4 right-4 bg-[#11253E] border border-white/[0.06] rounded-2xl p-4" style={{ bottom: Math.max(insets.bottom + 10, 16) }}>
        <Text className="text-white text-[17px] font-bold mb-2">
          {status === "in_progress" ? `${rideLabel} em andamento` : "Resumo do pedido"}
        </Text>

        {isDeliveryFlow && (
          <>
            <View className="mb-3 p-3 rounded-xl border border-white/10 bg-white/[0.03]">
              <Text className="text-white text-[13px] font-bold mb-2">Fases da entrega</Text>
              {deliveryTimeline.map((step, index) => (
                <View key={step.key} className="flex-row items-start gap-2 min-h-[28px]">
                  <View className="w-[14px] items-center">
                    <View className={`w-[10px] h-[10px] rounded-full mt-0.5 ${step.done ? "bg-[#02de95]" : step.active ? "bg-[#60a5fa]" : "bg-white/25"}`} />
                    {index < deliveryTimeline.length - 1 && (
                      <View className={`w-[2px] flex-1 mt-0.5 rounded-sm ${step.done ? "bg-[rgba(2,222,149,0.6)]" : "bg-white/[0.14]"}`} />
                    )}
                  </View>
                  <Text className={`flex-1 text-xs leading-[18px] pb-2 ${step.done ? "text-white font-bold" : step.active ? "text-[#93c5fd] font-bold" : "text-[rgba(255,255,255,0.5)]"}`}>
                    {step.label}
                  </Text>
                </View>
              ))}
            </View>

            {(!!ride?.details?.pickupPin || !!ride?.details?.deliveryPin) && (
              <View className="mb-3 p-3 rounded-xl border border-[rgba(2,222,149,0.3)] bg-[rgba(2,222,149,0.06)] flex-row items-center justify-between">
                {!!ride?.details?.pickupPin && (
                  <View className="flex-1 items-center">
                    <Text className="text-[rgba(255,255,255,0.7)] text-[9px] font-bold uppercase mb-1">PIN Coleta (Remetente)</Text>
                    <Text className="text-[#02de95] text-lg font-extrabold tracking-wider">{ride.details.pickupPin}</Text>
                  </View>
                )}
                {!!ride?.details?.pickupPin && !!ride?.details?.deliveryPin && (
                  <View className="w-[1px] h-8 bg-white/[0.15]" />
                )}
                {!!ride?.details?.deliveryPin && (
                  <View className="flex-1 items-center">
                    <Text className="text-[rgba(255,255,255,0.7)] text-[9px] font-bold uppercase mb-1">PIN Entrega (Recebedor)</Text>
                    <Text className="text-[#02de95] text-lg font-extrabold tracking-wider">{ride.details.deliveryPin}</Text>
                  </View>
                )}
              </View>
            )}
          </>
        )}

        <Text className="text-[rgba(255,255,255,0.6)] text-[13px] mb-1" numberOfLines={1}>
          Coleta: {ride?.pickup?.address || "-"}
        </Text>
        <Text className="text-[rgba(255,255,255,0.6)] text-[13px] mb-1" numberOfLines={1}>
          Destino: {ride?.dropoff?.address || "-"}
        </Text>

        <View className="mt-2 flex-row justify-between gap-2">
          <Text className="flex-1 text-[rgba(255,255,255,0.5)] text-[10px]">
            Motorista: {driverName || "Aguardando atribuicao"}
          </Text>
          <Text className="flex-1 text-[rgba(255,255,255,0.5)] text-[10px]">
            Total: {ride?.pricing?.total != null ? `R$ ${Number(ride.pricing.total).toFixed(2)}` : "-"}
          </Text>
        </View>

        {loading && <Text className="text-[rgba(255,255,255,0.5)] text-[10px] mt-1">Atualizando dados...</Text>}

        {getPaymentMethodType(ride?.payment) === "pix" && !!ride?.payment?.pixCode && ride?.payment?.status !== "paid" && (
          <TouchableOpacity
            className="mt-3 w-full flex-row items-center justify-center gap-2 h-12 rounded-xl bg-[#32BCAD]"
            onPress={() => setShowPixModal(true)}
            accessibilityLabel="Pagar com PIX"
            accessibilityRole="button"
          >
            <QrCode size={17} color="#091A2F" />
            <Text className="text-[#091A2F] text-[13px] font-extrabold">PAGAR COM PIX</Text>
          </TouchableOpacity>
        )}

        <View className="mt-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            className="flex-1 min-w-[88px] flex-row items-center justify-center gap-1.5 h-11 rounded-xl border border-[rgba(2,222,149,0.35)] bg-[rgba(2,222,149,0.12)]"
            onPress={() => {
              useChatStore.getState().clearUnread(rideId);
              navigation.navigate("Chat", {
                rideId,
                driverName: driverName || "Motorista",
              });
            }}
            accessibilityLabel={`Abrir chat com ${driverName || 'motorista'}`}
            accessibilityRole="button"
          >
            <Icon name="chat-bubble-outline" size={17} color="#fff" />
            <Text className="text-white text-[13px] font-semibold">Chat</Text>
            {unreadCount > 0 && (
              <View className="absolute -top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-[#ef4444] items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 min-w-[88px] flex-row items-center justify-center gap-1.5 h-11 rounded-xl border border-[rgba(2,222,149,0.35)] bg-[rgba(2,222,149,0.12)]" onPress={handleShareRide} accessibilityLabel="Compartilhar viagem" accessibilityRole="button">
            <Icon name="ios-share" size={17} color="#fff" />
            <Text className="text-white text-[13px] font-semibold">Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canCancel}
            className={`flex-1 min-w-[88px] flex-row items-center justify-center gap-1.5 h-11 rounded-xl border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.12)] ${!canCancel ? "opacity-45" : ""}`}
            onPress={() =>
              navigation.navigate("ClientCancelRide", {
                rideId,
                total: ride?.pricing?.total,
                status,
                estimatedFee: cancellationFeePreview,
              })
            }
            accessibilityLabel="Cancelar corrida"
            accessibilityRole="button"
            accessibilityState={{ disabled: !canCancel }}
          >
            <Icon name="close" size={17} color="#ef4444" />
            <Text className="text-[#ef4444] text-[13px] font-semibold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
      </SafeAreaView>

      {/* Driver Identity Card — show when driver is coming to pickup */}
      {isDriverGoingToPickup && ride?.driverId && typeof ride.driverId !== 'string' && (
        <View style={{ position: 'absolute', bottom: Math.max(insets.bottom + 10, 16) + 280, left: 0, right: 0 }}>
          <DriverIdentityCard
            driver={{
              id: String(ride.driverId._id || ''),
              name: driverName || 'Motorista',
              phone: ride.driverId.phone,
              profilePhoto: ride.driverId.profilePhoto,
              rating: typeof ride.driverId.rating === 'number' ? ride.driverId.rating : 5,
              vehicle: {
                type: ride.vehicleType || 'car',
                plate: ride.driverId.vehicleInfo?.plate || 'XXX-0000',
                model: ride.driverId.vehicleInfo?.model || 'Veículo',
                color: ride.driverId.vehicleInfo?.color || 'Branco',
              },
            }}
            eta={routeEtaText || undefined}
            etaDistance={routeDistanceText || undefined}
            onChat={() => {
              useChatStore.getState().clearUnread(rideId);
              navigation.navigate('Chat', { rideId, driverName: driverName || 'Motorista' });
            }}
            onCancel={() => navigation.navigate('ClientCancelRide', {
              rideId,
              total: ride?.pricing?.total,
              status,
              estimatedFee: cancellationFeePreview,
            })}
          />
        </View>
      )}

      {/* SOS Modal */}
      <SOSButton
        rideId={rideId}
        driverName={driverName || undefined}
        onSosActivated={handleSOSActivated}
      />

      {/* Share Sheet */}
      <ShareRideSheet
        rideId={rideId}
        driverName={driverName || undefined}
        isVisible={shareSheetVisible}
        onClose={() => setShareSheetVisible(false)}
      />

      {/* Modal de Pagamento PIX para o Cliente */}
      <Modal
        visible={showPixModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPixModal(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(9, 26, 47, 0.9)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <View style={{
            width: "100%",
            maxWidth: 345,
            backgroundColor: "#0c1927",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(50, 188, 173, 0.25)",
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <Text style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 4,
            }}>
              Pagamento via PIX
            </Text>
            
            <Text style={{
              color: "#32BCAD",
              fontSize: 13,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 20,
            }}>
              Escaneie o QR Code ou copie o código abaixo
            </Text>

            <View style={{ alignItems: "center", width: "100%" }}>
              {/* QR Code Container */}
              <View style={{
                backgroundColor: "#fff",
                padding: 12,
                borderRadius: 16,
                marginBottom: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 8,
              }}>
                {ride?.payment?.qrCodeData ? (
                  <Image
                    source={{ uri: ride.payment.qrCodeData }}
                    style={{ width: 180, height: 180 }}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={{ width: 180, height: 180, justifyContent: "center", alignItems: "center" }}>
                    <ActivityIndicator size="small" color="#091A2F" />
                  </View>
                )}
              </View>

              {/* Valor */}
              <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 16 }}>
                R$ {ride?.pricing?.total ? Number(ride.pricing.total).toFixed(2).replace(".", ",") : "0,00"}
              </Text>

              {/* Copia e Cola */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={{
                  backgroundColor: "rgba(255,255,255,0.05)",
                  borderWidth: 1.2,
                  borderColor: "rgba(255,255,255,0.12)",
                  borderRadius: 12,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  marginBottom: 24,
                }}
                onPress={() => {
                  Clipboard.setString(ride?.payment?.pixCode || "");
                  Toast.show({ type: "success", text1: "PIX Copia e Cola copiado!" });
                }}
              >
                <Text
                  style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }}
                  numberOfLines={1}
                >
                  {ride?.payment?.pixCode || "Código PIX"}
                </Text>
                <Text style={{ color: "#32BCAD", fontSize: 12, fontWeight: "900" }}>
                  COPIAR
                </Text>
              </TouchableOpacity>

              {/* Actions */}
              <View style={{ flexDirection: "row", width: "100%", gap: 12 }}>
                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setShowPixModal(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                    Fechar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    flex: 1,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#32BCAD",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 8,
                  }}
                  disabled={confirmingPix}
                  onPress={async () => {
                    try {
                      setConfirmingPix(true);
                      await rideService.confirmRidePixPaymentMock(rideId);
                      Toast.show({
                        type: "success",
                        text1: "Pagamento confirmado!",
                        text2: "Simulação de pagamento PIX concluída.",
                      });
                      setShowPixModal(false);
                      loadRide();
                    } catch (err: any) {
                      Toast.show({
                        type: "error",
                        text1: "Erro ao confirmar pagamento",
                        text2: err?.message || "Erro desconhecido",
                      });
                    } finally {
                      setConfirmingPix(false);
                    }
                  }}
                >
                  {confirmingPix ? (
                    <ActivityIndicator size="small" color="#091A2F" />
                  ) : (
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14 }}>
                      Simular Pago
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Chat Notification Banner */}
      {chatNotification && (
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + 10,
            left: 16,
            right: 16,
            transform: [{ translateX: slideAnim }],
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNotificationPress}
            style={{
              backgroundColor: "#11253E",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.3)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <View style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(2,222,149,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <MessageCircle size={20} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
                Nova mensagem
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                {chatNotification.sender}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 1 }} numberOfLines={1}>
                {chatNotification.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNotificationClose}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </ErrorBoundary>
  );
}



