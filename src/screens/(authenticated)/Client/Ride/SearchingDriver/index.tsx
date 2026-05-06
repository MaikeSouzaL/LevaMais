import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";

const SEARCH_TIME = 60;
const TERMINAL_CANCEL_STATUSES = [
  "cancelled",
  "cancelled_by_client",
  "cancelled_by_driver",
  "cancelled_no_driver",
  "expired",
];

export default function SearchingDriverScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = route.params?.rideId || "";

  const [secondsLeft, setSecondsLeft] = useState(SEARCH_TIME);
  const [timeout, setTimeoutState] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkUnstable, setNetworkUnstable] = useState(false);
  const [searchCycle, setSearchCycle] = useState(0);

  const intervalRef = useRef<any>(null);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const doneRef = useRef(false);

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const driverFoundCallback = useCallback(
    (data: any) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cleanup();
      const foundRideId = data?.rideId || data?.ride?._id || rideId;
      navigation.reset({
        index: 0,
        routes: [{ name: "RideTracking", params: { rideId: foundRideId } }],
      });
    },
    [navigation, rideId],
  );

  const rideExpiredCallback = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setTimeoutState(true);
  }, []);

  const rideCancelledCallback = useCallback(
    (data: any) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cleanup();
      Toast.show({
        type: "info",
        text1: "Corrida cancelada",
        text2: data?.reason || "Nenhum motorista disponivel",
      });
      navigation.goBack();
    },
    [navigation],
  );

  const connectAndSearch = useCallback(async () => {
    if (!rideId) return;
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    setError(null);
    setNetworkUnstable(false);

    try {
      await webSocketService.connect();
      webSocketService.waitingDriver(rideId);
      webSocketService.onDriverFound(driverFoundCallback);
      webSocketService.onRideExpired(rideExpiredCallback);
      webSocketService.onRideCancelled(rideCancelledCallback);
    } catch (e: any) {
      setError("Conexao instavel. Mantendo busca pelo servidor.");
      console.log("WS connect error:", e?.message);
    }

    let pollFailures = 0;
    const pollInterval = setInterval(async () => {
      if (doneRef.current) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const ride = await rideService.getById(rideId);
        pollFailures = 0;
        setNetworkUnstable(false);
        if (!ride || doneRef.current) {
          clearInterval(pollInterval);
          return;
        }

        if (
          ride.driverId &&
          ["accepted", "driver_arriving", "arrived", "in_progress"].includes(
            ride.status,
          )
        ) {
          doneRef.current = true;
          clearInterval(pollInterval);
          driverFoundCallback({ rideId: ride._id, ride });
          return;
        }

        if (TERMINAL_CANCEL_STATUSES.includes(String(ride.status || ""))) {
          doneRef.current = true;
          clearInterval(pollInterval);
          if (String(ride.status) === "cancelled_no_driver") {
            rideExpiredCallback();
            return;
          }
          rideCancelledCallback({ reason: "Corrida encerrada", status: ride.status });
        }
      } catch {
        pollFailures += 1;
        if (pollFailures >= 2) {
          setNetworkUnstable(true);
          setError("Conexao instavel. Tentando reconectar automaticamente...");
        }
      }
    }, 4000);

    intervalRef.current = pollInterval;
  }, [rideId, driverFoundCallback, rideExpiredCallback, rideCancelledCallback]);

  useEffect(() => {
    connectAndSearch();
    return () => {
      cleanup();
      webSocketService.off("driver-found", driverFoundCallback);
      webSocketService.off("ride-expired", rideExpiredCallback);
      webSocketService.off("ride-cancelled", rideCancelledCallback);
    };
  }, [connectAndSearch, driverFoundCallback, rideCancelledCallback, rideExpiredCallback]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!doneRef.current) {
            doneRef.current = true;
            cleanup();
            setTimeoutState(true);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchCycle]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.14,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 850,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );

    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    try {
      await rideService.cancel(rideId, "Cancelado pelo cliente durante busca");
      doneRef.current = true;
      cleanup();
      Toast.show({ type: "info", text1: "Corrida cancelada" });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Falha ao cancelar" });
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    if (!rideId) return;
    setTimeoutState(false);
    setSecondsLeft(SEARCH_TIME);
    doneRef.current = false;
    setSearchCycle((prev) => prev + 1);
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    await connectAndSearch();
  };

  const handleAdjustRequest = async () => {
    if (!rideId || adjusting) return;
    setAdjusting(true);
    try {
      const ride = await rideService.getById(rideId);
      try {
        await rideService.cancel(rideId, "Ajuste de pedido pelo cliente");
      } catch {}

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "ServicePurpose",
            params: {
              vehicleType: ride?.vehicleType,
              initialPurposeId:
                typeof (ride as any)?.purposeId === "string"
                  ? (ride as any).purposeId
                  : (ride as any)?.purposeId?._id,
              pickup: {
                address: ride?.pickup?.address,
                latitude: ride?.pickup?.latitude,
                longitude: ride?.pickup?.longitude,
              },
              dropoff: {
                address: ride?.dropoff?.address,
                latitude: ride?.dropoff?.latitude,
                longitude: ride?.dropoff?.longitude,
              },
            },
          },
        ],
      });
    } catch {
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } finally {
      setAdjusting(false);
    }
  };

  if (timeout) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.timeoutCard}>
          <View style={styles.timeoutIconWrap}>
            <MaterialIcons name="person-search" size={48} color="#fbbf24" />
          </View>
          <Text style={styles.timeoutTitle}>Nao encontramos motorista</Text>
          <Text style={styles.timeoutSub}>
            Nenhum motorista aceitou o pedido nesse momento. Voce pode tentar novamente ou ajustar o pedido.
          </Text>

          <TouchableOpacity style={styles.retryButton} onPress={handleRetry} activeOpacity={0.85}>
            <MaterialIcons name="refresh" size={20} color={colors.background.primary} />
            <Text style={styles.retryText}>Buscar novamente</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.adjustButton}
            onPress={handleAdjustRequest}
            activeOpacity={0.85}
            disabled={adjusting}
          >
            <MaterialIcons name="tune" size={18} color={colors.text.primary} />
            <Text style={styles.adjustText}>{adjusting ? "Abrindo ajustes..." : "Ajustar pedido"}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelLink} onPress={handleCancel} activeOpacity={0.85}>
            <Text style={styles.cancelLinkText}>Cancelar e voltar para inicio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepLabel}>ETAPA 4 DE 4</Text>

        <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
          <MaterialIcons name="local-taxi" size={46} color={colors.primary[500]} />
        </Animated.View>

        <Text style={styles.title}>Buscando motorista</Text>
        <Text style={styles.subtitle}>Estamos notificando os motoristas mais proximos.</Text>

        <View style={styles.timerCard}>
          <Text style={styles.timerHint}>Tempo de busca</Text>
          <View style={styles.timerRow}>
            <Text style={styles.timerValue}>{secondsLeft}</Text>
            <Text style={styles.timerUnit}>s</Text>
          </View>
        </View>

        {!!error && (
          <View style={styles.errorRow}>
            <MaterialIcons name="info-outline" size={16} color="#fbbf24" />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {networkUnstable && (
          <TouchableOpacity style={styles.reconnectBtn} onPress={handleRetry} activeOpacity={0.85}>
            <MaterialIcons name="wifi" size={16} color={colors.text.primary} />
            <Text style={styles.reconnectText}>Tentar reconectar agora</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.cancelFab} onPress={handleCancel} disabled={cancelling} activeOpacity={0.85}>
          <Text style={styles.cancelFabText}>{cancelling ? "Cancelando..." : "Cancelar busca"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  stepLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 1,
    marginBottom: spacing.lg,
  },
  pulseCircle: {
    width: 108,
    height: 108,
    borderRadius: 54,
    backgroundColor: "rgba(2,222,149,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
    borderWidth: 2,
    borderColor: "rgba(2,222,149,0.25)",
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  timerCard: {
    width: "100%",
    maxWidth: 260,
    alignItems: "center",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.24)",
    backgroundColor: "rgba(2,222,149,0.08)",
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  timerHint: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginBottom: 2,
  },
  timerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  timerValue: {
    color: colors.primary[500],
    fontSize: 34,
    fontWeight: fontWeight.bold,
  },
  timerUnit: {
    color: colors.primary[500],
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  errorText: { color: "#fbbf24", fontSize: fontSize.sm, textAlign: "center" },
  cancelFab: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    backgroundColor: "rgba(239,68,68,0.08)",
  },
  reconnectBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  reconnectText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  cancelFabText: {
    color: "#ef4444",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  timeoutCard: {
    flex: 1,
    margin: spacing.lg,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12,25,39,0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
  },
  timeoutIconWrap: {
    width: 86,
    height: 86,
    borderRadius: 43,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(251,191,36,0.12)",
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.32)",
    marginBottom: spacing.lg,
  },
  timeoutTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    textAlign: "center",
  },
  timeoutSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    textAlign: "center",
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  retryButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  retryText: {
    color: colors.background.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  adjustButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  adjustText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  cancelLink: {
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  cancelLinkText: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
