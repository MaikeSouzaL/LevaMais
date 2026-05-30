import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline, AnimatedRegion } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import * as Location from "expo-location";
import { ErrorBoundary } from "@/components/ErrorBoundary";

import rideService, { Ride } from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { useAuthStore } from "@/context/authStore";
import { useChatStore } from "@/context/chatStore";
import { darkMapStyle } from "@/utils/mapStyle";
import { decodePolyline, LatLng } from "@/utils/polyline";
import MapMarker from "@/components/MapMarker";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ClientStackParamList } from "../../../types/navigation";

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
  const watchRef = useRef<any>(null);
  const driverAnimatedLocation = useRef<any>(null);

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

  const handleSOS = () => {
    try {
      (navigation as any).navigate("ClientSafety");
    } catch {}
  };

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeEtaText, setRouteEtaText] = useState("");
  const [routeDistanceText, setRouteDistanceText] = useState("");
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
        navigation.replace("DeliveryTracking", { rideId });
        return;
      }

      if (TERMINAL_STATUSES.includes(String(data.status || ""))) {
        if (data.status === "completed") {
          navigation.replace("RideCompleted", {
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
    const poll = setInterval(loadRide, 5000);
    return () => clearInterval(poll);
  }, [rideId, navigation, loadRide]);

  useEffect(() => {
    if (!rideId) return;
    let mounted = true;
    const isCurrentDelivery =
      ride?.serviceType === "delivery" || ride?.serviceType === "frete";

    const onSocketConnected = () => {
      if (!mounted) return;
      webSocketService.waitingDriver(rideId);
    };

    const onStatusUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      loadRide();
    };

    const onCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      Toast.show({
        type: "error",
        text1: isCurrentDelivery ? "Entrega cancelada" : "Corrida cancelada",
        text2: payload?.reason ? String(payload.reason) : undefined,
      });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    };

    const onDriverLocation = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      const loc = payload?.location;
      if (
        Number.isFinite(Number(loc?.latitude)) &&
        Number.isFinite(Number(loc?.longitude))
      ) {
        const newLat = Number(loc.latitude);
        const newLng = Number(loc.longitude);

        if (!driverAnimatedLocation.current) {
          driverAnimatedLocation.current = new AnimatedRegion({
            latitude: newLat,
            longitude: newLng,
            latitudeDelta: 0.004,
            longitudeDelta: 0.004,
          });
        } else {
          driverAnimatedLocation.current.timing({
            latitude: newLat,
            longitude: newLng,
            duration: 3000,
            useNativeDriver: false,
          }).start();
        }

        setDriverLocation({
          latitude: newLat,
          longitude: newLng,
        });
      }
    };

    const onArrived = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      Toast.show({ type: "info", text1: "Motorista chegou ao ponto de coleta" });
      loadRide();
    };

    const onStarted = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      Toast.show({
        type: "info",
        text1: isCurrentDelivery ? "Entrega iniciada" : "Corrida iniciada",
      });
      loadRide();
    };

    const onNewMsg = (data: any) => {
      if (!mounted) return;
      if (data?.rideId !== rideId) return;
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
        Toast.show({ type: "info", text1: sender, text2: preview });
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("connect", onSocketConnected);
        webSocketService.waitingDriver(rideId);
        webSocketService.onRideStatusUpdated(onStatusUpdated);
        webSocketService.onRideCancelled(onCancelled);
        webSocketService.onDriverLocationUpdated(onDriverLocation);
        webSocketService.onDriverArrived(onArrived);
        webSocketService.onRideStarted(onStarted);
        webSocketService.onNewMessage(onNewMsg);
      } catch {
        // fallback no polling
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("ride-status-updated", onStatusUpdated);
      webSocketService.off("ride-cancelled", onCancelled);
      webSocketService.off("driver-location-updated", onDriverLocation);
      webSocketService.off("driver-arrived", onArrived);
      webSocketService.off("ride-started", onStarted);
      webSocketService.off("new-message", onNewMsg);
      webSocketService.off("connect", onSocketConnected);
    };
  }, [rideId, loadRide, navigation, currentUserId, ride?.serviceType]);

  useEffect(() => {
    let mounted = true;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        if (watchRef.current) {
          await watchRef.current();
          watchRef.current = null;
        }

        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 2000,
            distanceInterval: 5,
          },
          (pos) => {
            if (!mounted) return;
            try {
              webSocketService.emit("client-location-update", {
                rideId,
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                heading: pos.coords.heading ?? undefined,
                speed: pos.coords.speed ?? undefined,
              });
            } catch {}
          }
        );
      } catch {}
    };

    startLocationTracking();

    return () => {
      mounted = false;
      if (watchRef.current) {
        watchRef.current();
        watchRef.current = null;
      }
    };
  }, [rideId]);

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
        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(`${origin.latitude},${origin.longitude}`)}` +
          `&destination=${encodeURIComponent(`${destination.latitude},${destination.longitude}`)}` +
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
    const driverLabel = driverName || "motorista";
    const serviceLabel =
      ride?.serviceType === "delivery" || ride?.serviceType === "frete"
        ? "entrega"
        : "corrida";
    Share.share({
      message: `Estou em ${serviceLabel} no Leva Mais com ${driverLabel}. Pedido ${ride?._id || ""}.`,
    }).catch(() => {});
  };

  const isDriverGoingToPickup = [
    "driver_assigned",
    "accepted",
    "driver_arriving",
  ].includes(status);

  const cancellationFeePreview =
    ["accepted", "driver_arriving", "arrived", "in_progress"].includes(status) &&
    ride?.cancellationFee != null
      ? Number(ride.cancellationFee)
      : 0;

  return (
    <ErrorBoundary componentName="RideTrackingScreen">
      <SafeAreaView className="flex-1 bg-[#091A2F]">
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
        showsUserLocation
      >
        {routeCoords.length >= 2 ? (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={4}
            strokeColor={routeMode === "toPickup" ? "#60a5fa" : "#02de95"}
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
            strokeColor="#02de95"
          />
        ) : null}

{!!pickupCoord && (
  <Marker coordinate={pickupCoord} title="Coleta" tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
    <MapMarker type="pickup" />
  </Marker>
)}
{!!dropoffCoord && (
  <Marker coordinate={dropoffCoord} title="Destino" tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
    <MapMarker type="dropoff" />
  </Marker>
)}
{!!driverLocation && driverAnimatedLocation.current && (
  <Marker.Animated coordinate={driverAnimatedLocation.current as any} title="Motorista" tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
    <MapMarker type="driver" />
  </Marker.Animated>
)}
      </GlobalMap>

      <View className="absolute left-4 right-4 bg-[rgba(12,25,39,0.95)] border border-white/10 rounded-xl p-4" style={{ top: Math.max(insets.top + 10, 20) }}>
        <View className="flex-row justify-between items-center gap-1">
          <Text className="text-[rgba(255,255,255,0.5)] text-[10px] font-bold tracking-widest mb-1">ACOMPANHAMENTO EM TEMPO REAL</Text>
          {(ride?.serviceType === "delivery" || ride?.serviceType === "frete") && (
            <TouchableOpacity
              className="flex-row items-center gap-1 px-2 py-1.5 rounded-full border border-white/20 bg-white/[0.08]"
              accessibilityLabel="Voltar para início"
              accessibilityRole="button"
              onPress={() => navigation.navigate("Home")}
            >
              <MaterialIcons name="home" size={14} color="#fff" />
              <Text className="text-white text-[11px] font-bold">Inicio</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="flex-row items-center gap-1 px-2 py-1.5 rounded-full self-start" style={{ backgroundColor: statusMeta.bg }}>
          <View className="w-2 h-2 rounded-full" style={{ backgroundColor: statusMeta.color }} />
          <Text className="text-[10px] font-bold" style={{ color: statusMeta.color }}>{statusMeta.title}</Text>
        </View>
        <Text className="text-[rgba(255,255,255,0.85)] text-[13px] mt-1.5 leading-5">{statusMeta.subtitle}</Text>
        {isDriverGoingToPickup && (
          <View className="mt-3 p-4 rounded-xl border border-[rgba(96,165,250,0.24)] bg-[rgba(96,165,250,0.10)] flex-row items-center justify-between">
            <View>
              <Text className="text-[rgba(255,255,255,0.5)] text-[10px] font-bold uppercase">Chegada na coleta</Text>
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
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={320}
      />
      <View className="absolute left-4 right-4 bg-[rgba(12,25,39,0.96)] border border-white/10 rounded-2xl p-4" style={{ bottom: Math.max(insets.bottom + 10, 16) }}>
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

        <View className="mt-3 flex-row flex-wrap gap-2">
          <TouchableOpacity
            className="flex-1 min-w-[88px] flex-row items-center justify-center gap-1 py-2 rounded-lg border border-[rgba(2,222,149,0.35)] bg-[rgba(2,222,149,0.12)]"
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
            <MaterialIcons name="chat-bubble-outline" size={17} color="#fff" />
            <Text className="text-white text-[13px] font-semibold">Chat</Text>
            {unreadCount > 0 && (
              <View className="absolute -top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-[#ef4444] items-center justify-center px-1">
                <Text className="text-white text-[10px] font-bold">{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity className="flex-1 min-w-[88px] flex-row items-center justify-center gap-1 py-2 rounded-lg border border-[rgba(2,222,149,0.35)] bg-[rgba(2,222,149,0.12)]" onPress={handleShareRide} accessibilityLabel="Compartilhar viagem" accessibilityRole="button">
            <MaterialIcons name="ios-share" size={17} color="#fff" />
            <Text className="text-white text-[13px] font-semibold">Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canCancel}
            className={`flex-1 min-w-[88px] flex-row items-center justify-center gap-1 py-2 rounded-lg border border-[rgba(239,68,68,0.45)] bg-[rgba(239,68,68,0.12)] ${!canCancel ? "opacity-45" : ""}`}
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
            <MaterialIcons name="close" size={17} color="#ef4444" />
            <Text className="text-[#ef4444] text-[13px] font-semibold">Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}


