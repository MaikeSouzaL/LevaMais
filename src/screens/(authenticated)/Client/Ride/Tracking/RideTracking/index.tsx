import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Linking, Share } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import rideService, { Ride } from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { useAuthStore } from "@/context/authStore";
import { useChatStore } from "@/context/chatStore";
import { darkMapStyle } from "@/utils/mapStyle";
import { decodePolyline, LatLng } from "@/utils/polyline";
import MapMarker from "@/components/MapMarker";

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
    color: colors.text.primary,
    bg: "rgba(255,255,255,0.12)",
  };
}

export default function RideTrackingScreen() {
  const route = useRoute();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { rideId } = (route.params as any) || {};
  const currentUserId = useAuthStore((s) => s.userData?.id) || "";
  const unreadCount = useChatStore((s) => s.unreadCounts[rideId]) || 0;
  const mapRef = useRef<MapView>(null);

  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeEtaText, setRouteEtaText] = useState("");
  const [routeDistanceText, setRouteDistanceText] = useState("");

  const loadRide = useCallback(async () => {
    if (!rideId) return;

    try {
      const data = await rideService.getById(rideId);
      setRide(data);

      if (TERMINAL_STATUSES.includes(String(data.status || ""))) {
        if (data.status === "completed") {
          navigation.replace("RideCompleted", {
            rideId: data._id,
            total: data?.pricing?.total,
            pickupAddress: data?.pickup?.address,
            dropoffAddress: data?.dropoff?.address,
            driverName: (data?.driverId as any)?.name,
          });
        } else {
          navigation.reset({ index: 0, routes: [{ name: "Home" }] });
        }
      }
    } catch (error: any) {
      const msg = error?.message || "Nao foi possivel carregar a corrida";
      Toast.show({ type: "error", text1: "Erro", text2: msg });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } finally {
      setLoading(false);
    }
  }, [navigation, rideId]);

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
        text1: "Corrida cancelada",
        text2: payload?.reason ? String(payload.reason) : undefined,
      });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    };

    const onDriverLocation = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverLocation({
          latitude: Number(loc.latitude),
          longitude: Number(loc.longitude),
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
      Toast.show({ type: "info", text1: "Corrida iniciada" });
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
  }, [rideId, loadRide, navigation, currentUserId]);

  const pickupCoord = useMemo(() => {
    if (!ride?.pickup?.latitude || !ride?.pickup?.longitude) return null;
    return {
      latitude: Number(ride.pickup.latitude),
      longitude: Number(ride.pickup.longitude),
    };
  }, [ride?.pickup?.latitude, ride?.pickup?.longitude]);

  const dropoffCoord = useMemo(() => {
    if (!ride?.dropoff?.latitude || !ride?.dropoff?.longitude) return null;
    return {
      latitude: Number(ride.dropoff.latitude),
      longitude: Number(ride.dropoff.longitude),
    };
  }, [ride?.dropoff?.latitude, ride?.dropoff?.longitude]);

  const status = String(ride?.status || "");
  const statusMeta = getStatusMeta(status, ride?.serviceType);
  const canCancel = CANCELLABLE_STATUSES.includes(status);
  const rideLabel =
    ride?.serviceType === "delivery" || ride?.serviceType === "frete"
      ? "Entrega"
      : "Corrida";

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
    const driverName = (ride?.driverId as any)?.name || "motorista";
    Share.share({
      message: `Estou em corrida no Leva Mais com ${driverName}. Pedido ${ride?._id || ""}.`,
    }).catch(() => {});
  };

  const isDriverGoingToPickup = [
    "driver_assigned",
    "accepted",
    "driver_arriving",
  ].includes(status);

  const cancellationFeePreview =
    ["accepted", "driver_arriving", "arrived", "in_progress"].includes(status) &&
    ride?.pricing?.total != null
      ? Number(ride.pricing.total) * 0.3
      : 0;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: pickupCoord?.latitude || -23.5505,
          longitude: pickupCoord?.longitude || -46.6333,
          latitudeDelta: 0.04,
          longitudeDelta: 0.04,
        }}
        customMapStyle={darkMapStyle}
        showsUserLocation
      >
        {routeCoords.length >= 2 ? (
          <Polyline
            coordinates={routeCoords as any}
            strokeWidth={4}
            strokeColor={routeMode === "toPickup" ? "#60a5fa" : "#02de95"}
          />
        ) : routeMode === "toPickup" && driverLocation && pickupCoord ? (
          <Polyline
            coordinates={[driverLocation, pickupCoord] as any}
            strokeWidth={4}
            strokeColor="#60a5fa"
          />
        ) : routeMode === "toDropoff" && toDropoffOrigin && dropoffCoord ? (
          <Polyline
            coordinates={[toDropoffOrigin, dropoffCoord] as any}
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
{!!driverLocation && (
  <Marker coordinate={driverLocation} title="Motorista" tracksViewChanges={false} anchor={{ x: 0.5, y: 1 }}>
    <MapMarker type="driver" />
  </Marker>
)}
      </MapView>

      <View style={[styles.topCard, { top: Math.max(insets.top + 10, spacing.xl) }]}>
        <View style={styles.topHeaderRow}>
          <Text style={styles.stepLabel}>ACOMPANHAMENTO EM TEMPO REAL</Text>
          {(ride?.serviceType === "delivery" || ride?.serviceType === "frete") && (
            <TouchableOpacity
              style={styles.minimizeBtn}
              onPress={() => navigation.navigate("Home")}
            >
              <MaterialIcons name="home" size={14} color={colors.text.primary} />
              <Text style={styles.minimizeText}>Inicio</Text>
            </TouchableOpacity>
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
          <Text style={[styles.statusText, { color: statusMeta.color }]}>{statusMeta.title}</Text>
        </View>
        <Text style={styles.topSubtitle}>{statusMeta.subtitle}</Text>
        {isDriverGoingToPickup && (
          <View style={styles.arrivalCard}>
            <View>
              <Text style={styles.arrivalLabel}>Chegada na coleta</Text>
              <Text style={styles.arrivalValue}>{routeEtaText || "Calculando..."}</Text>
            </View>
            <View style={styles.arrivalDivider} />
            <View>
              <Text style={styles.arrivalLabel}>Distancia</Text>
              <Text style={styles.arrivalValue}>{routeDistanceText || "--"}</Text>
            </View>
          </View>
        )}
      </View>

      <View style={[styles.bottomCard, { bottom: Math.max(insets.bottom + 10, spacing.lg) }]}>
        <Text style={styles.bottomTitle}>
          {status === "in_progress" ? `${rideLabel} em andamento` : "Resumo do pedido"}
        </Text>

        <Text style={styles.addressLine} numberOfLines={1}>
          Coleta: {ride?.pickup?.address || "-"}
        </Text>
        <Text style={styles.addressLine} numberOfLines={1}>
          Destino: {ride?.dropoff?.address || "-"}
        </Text>

        <View style={styles.metaRow}>
          <Text style={styles.metaText}>
            Motorista: {(ride?.driverId as any)?.name || "Aguardando atribuicao"}
          </Text>
          <Text style={styles.metaText}>
            Total: {ride?.pricing?.total != null ? `R$ ${Number(ride.pricing.total).toFixed(2)}` : "-"}
          </Text>
        </View>

        {loading && <Text style={styles.loadingText}>Atualizando dados...</Text>}

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              useChatStore.getState().clearUnread(rideId);
              navigation.navigate("Chat", {
                rideId,
                driverName: (ride?.driverId as any)?.name || "Motorista",
              });
            }}
          >
            <MaterialIcons name="chat-bubble-outline" size={17} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Chat</Text>
            {unreadCount > 0 && (
              <View style={styles.chatBadge}>
                <Text style={styles.chatBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={handleShareRide}>
            <MaterialIcons name="ios-share" size={17} color={colors.text.primary} />
            <Text style={styles.actionBtnText}>Compartilhar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            disabled={!canCancel}
            style={[styles.actionBtnDanger, !canCancel && styles.actionBtnDisabled]}
            onPress={() =>
              navigation.navigate("ClientCancelRide", {
                rideId,
                total: ride?.pricing?.total,
                status,
                estimatedFee: cancellationFeePreview,
              })
            }
          >
            <MaterialIcons name="close" size={17} color="#ef4444" />
            <Text style={styles.actionBtnDangerText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  map: { ...StyleSheet.absoluteFillObject },
  topCard: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(12,25,39,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  stepLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.9,
    marginBottom: spacing.xs,
  },
  topHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.sm,
  },
  minimizeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.08)",
    flexShrink: 0,
  },
  minimizeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  statusBadge: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: fontSize.xs, fontWeight: fontWeight.bold },
  topSubtitle: {
    color: "rgba(255,255,255,0.85)",
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  arrivalCard: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(96,165,250,0.24)",
    backgroundColor: "rgba(96,165,250,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  arrivalLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  arrivalValue: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: 3,
  },
  arrivalDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  bottomCard: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: "rgba(12,25,39,0.96)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
  },
  bottomTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  addressLine: { color: colors.text.secondary, fontSize: fontSize.sm, marginBottom: 4 },
  metaRow: {
    marginTop: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  metaText: { flex: 1, color: colors.text.tertiary, fontSize: fontSize.xs },
  loadingText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  actionsRow: {
    marginTop: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.12)",
  },
  actionBtnText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chatBadge: {
    position: "absolute",
    top: -4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  chatBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: fontWeight.bold,
  },
  actionBtnDanger: {
    flexGrow: 1,
    minWidth: 88,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.45)",
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  actionBtnDangerText: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  actionBtnDisabled: { opacity: 0.45 },
});


