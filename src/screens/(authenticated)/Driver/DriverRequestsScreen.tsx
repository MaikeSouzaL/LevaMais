import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Linking, ActivityIndicator, ScrollView, Alert, Dimensions, StatusBar } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import { 
  Layers, 
  Package, 
  Shield, 
  TrendingUp, 
  Clock, 
  DollarSign, 
  MapPin, 
  Activity, 
  ChevronLeft, 
  Menu, 
  RefreshCw, 
  Sparkles,
  AlertTriangle,
  Check
} from "lucide-react-native";

import webSocketService from "../../../services/websocket.service";
import { useAuthStore } from "../../../context/authStore";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import driverService from "../../../services/driver.service";
import Toast from "react-native-toast-message";
import { DriverScreen } from "./components/DriverScreen";
import { DriverEmptyState } from "./components/DriverEmptyState";
import { DriverRequestCard } from "./components/DriverRequestCard";
import { Modal } from "../../../components/Modal";
import { formatBRL } from "@/utils/mappers";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { GlobalMap } from "@/components/GlobalMap";
const { width, height } = Dimensions.get("window");

interface OperationalBackgroundProps {
  currentLoc?: { latitude: number; longitude: number };
}
function OperationalBackground({ currentLoc }: OperationalBackgroundProps) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
      <GlobalMap
        provider="google"
        useDarkStyle={true}
        initialRegion={{
          latitude: currentLoc?.latitude || -23.5505,
          longitude: currentLoc?.longitude || -46.6333,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        style={{ width: width, height: height, opacity: 0.55 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />
      <BlurView intensity={35} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9, 26, 47, 0.55)" }} />
    </View>
  );
}

type RideRequestItem = {
  rideId: string;
  pickup?: { address?: string; latitude?: number; longitude?: number };
  dropoff?: { address?: string; latitude?: number; longitude?: number };
  pricing?: { total?: number; platformFee?: number; serviceFee?: number };
  distance?: { text?: string };
  duration?: { text?: string };
  serviceType?: string;
  vehicleType?: string;
  payment?: {
    method?: {
      type?: string;
    } | string;
  };
  financialRisk?: {
    requiredBalance?: number;
    estimatedPlatformFee?: number;
  };
  driverBalance?: number;
  details?: {
    itemType?: string;
    priority?: number;
    specialInstructions?: string;
  };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    myOffer?: {
      amount: number;
      driverAmount?: number;
      status: string;
    } | null;
  };
  isWaitingInQueue?: boolean;
};

export default function DriverRequestsScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Ã°Å¸â€Â Lock native header to implement premium transparent operational HUD
  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const currentDriverId = useAuthStore((s) => s.userData?.id);
  const [requests, setRequests] = useState<RideRequestItem[]>([]);
  const [driverFilterInfo, setDriverFilterInfo] = useState<{
    status?: string;
    vehicleType?: string;
    serviceTypes: string[];
  }>({ serviceTypes: [] });
  
  const requestedInitialTab = route.params?.initialTab || "realtime";
  const [activeTab, setActiveTab] = useState<"realtime" | "negotiation" | "scheduled">(
    requestedInitialTab as any
  );
  const [pendingNegotiations, setPendingNegotiations] = useState<RideRequestItem[]>([]);
  const [scheduledRides, setScheduledRides] = useState<any[]>([]);
  const [scheduledFilterInfo, setScheduledFilterInfo] = useState<{
    vehicleType?: string;
    serviceTypes: string[];
  }>({ serviceTypes: [] });
  const [loadingScheduled, setLoadingScheduled] = useState(false);
  const [showNoBalanceModal, setShowNoBalanceModal] = useState(false);
  const [driverBalance, setDriverBalance] = useState<number>(0);

  const loadDriverBalance = async (): Promise<number> => {
    try {
      const balanceData = await driverService.getBalance();
      const nextBalance = Number(balanceData?.balance || 0);
      setDriverBalance(nextBalance);
      return nextBalance;
    } catch {
      setDriverBalance(0);
      return 0;
    }
  };

  const loadPendingNegotiations = async (balanceSnapshot?: number) => {
    const effectiveBalance =
      typeof balanceSnapshot === "number" ? balanceSnapshot : driverBalance;
    try {
      const res = await rideService.getPendingNegotiations();
      setPendingNegotiations(
        (res?.requests || []).map((item: any) => ({
          rideId: item.rideId,
          pickup: item.pickup,
          dropoff: item.dropoff,
          pricing: item.pricing,
          distance: item.distance,
          duration: item.duration,
          serviceType: item.serviceType,
          vehicleType: item.vehicleType,
          payment: item.payment,
          financialRisk: item.financialRisk,
          driverBalance: effectiveBalance,
          details: item.details,
          negotiation: {
            enabled: item?.negotiation?.enabled,
            clientOffer: item?.negotiation?.clientOffer,
            suggestedMinPrice: item?.negotiation?.suggestedMinPrice,
            myOffer: item?.negotiation?.myOffer,
          },
        })),
      );
    } catch {
      setPendingNegotiations([]);
    }
  };

  const loadScheduledRides = async () => {
    try {
      setLoadingScheduled(true);
      const [res, me] = await Promise.all([
        rideService.getAvailableScheduledRides(),
        driverLocationService.getMe().catch(() => null),
      ]);
      setScheduledRides(res?.rides || []);
      setScheduledFilterInfo({
        vehicleType: me?.vehicleType,
        serviceTypes: Array.isArray(me?.serviceTypes) ? me.serviceTypes : [],
      });
    } catch (e) {
      setScheduledRides([]);
      setScheduledFilterInfo({ serviceTypes: [] });
    } finally {
      setLoadingScheduled(false);
    }
  };

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
          setDriverFilterInfo({
            status: me?.status,
            vehicleType: me?.vehicleType,
            serviceTypes: Array.isArray(me?.serviceTypes) ? me.serviceTypes : [],
          });
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

      // Sempre recarrega os agendamentos quando focar a tela
      loadDriverBalance().then((balance) => {
        loadPendingNegotiations(balance);
      });
      loadScheduledRides();

      return () => {
        active = false;
      };
    }, [navigation]),
  );

  useEffect(() => {
    let mounted = true;
    const syncAvailableRequests = async () => {
      try {
        const balanceSnapshot = await loadDriverBalance();
        const available = await rideService.getAvailableRequests();
        const me = await driverLocationService.getMe().catch(() => null);
        if (me) {
          setDriverFilterInfo({
            status: me?.status,
            vehicleType: me?.vehicleType,
            serviceTypes: Array.isArray(me?.serviceTypes) ? me.serviceTypes : [],
          });
        }
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
            payment: item.payment,
            financialRisk: item.financialRisk,
            driverBalance: balanceSnapshot,
            details: item.details,
            isWaitingInQueue: item.isWaitingInQueue,
            negotiation: item.negotiation,
          })),
        );
        await loadPendingNegotiations(balanceSnapshot);
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
            type: "error",
            text1: "Fique online para receber solicitações",
            text2: "Você precisa iniciar seu turno para responder às ofertas.",
          });

          try {
            (navigation as any).navigate("DriverHome");
          } catch {}
          return;
        }

        await syncAvailableRequests();
      } catch {
        Toast.show({
          type: "error",
          text1: "Atualize sua localização primeiro",
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
        payment: payload?.payment,
        financialRisk: payload?.financialRisk,
        driverBalance,
        details: payload?.details,
        isWaitingInQueue: payload?.isWaitingInQueue,
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
        console.error("Error starting driver alert service:", e);
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

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      const cancelledId = payload?.rideId;
      if (!cancelledId) return;
      setRequests((prev) => prev.filter((r) => r.rideId !== cancelledId));
    };

    const onRideOfferIncreased = async (payload: any) => {
      if (!mounted) return;
      const increasedId = payload?.rideId;
      if (!increasedId) return;

      await syncAvailableRequests().catch(() => {});
      setActiveTab("realtime");

      try {
        await driverAlertService.start();
      } catch (e) {
        console.error("Error playing driver alert:", e);
      }
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
        webSocketService.on("ride-cancelled", onRideCancelled);
        webSocketService.on("queue-ride-offer-increased", onRideOfferIncreased);
       } catch (e) {
        console.error("Error connecting to websocket:", e);
      }
    })();

    const pollInterval = setInterval(() => {
      if (mounted) {
        syncAvailableRequests().catch(() => {});
      }
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(pollInterval);
      webSocketService.off("new-ride-request", onNewRide);
      webSocketService.off("ride-taken", onRideTaken);
      webSocketService.off("ride-expired", onRideExpired);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("queue-ride-offer-increased", onRideOfferIncreased);
      webSocketService.off("connect", onSocketConnected);
      driverAlertService.stop().catch(() => {});
    };
  }, [navigation]);

  useEffect(() => {
    if (requests.length === 0) {
      driverAlertService.stop();
    }
  }, [requests.length]);

  const handleOpenDetail = (item: any) => {
    (navigation as any).navigate("DeliveryOfferDetail", {
      offer: {
        rideId: item.rideId,
        pickup: item.pickup,
        dropoff: item.dropoff,
        pricing: item.pricing,
        distance: item.distance,
        duration: item.duration,
        serviceType: item.serviceType,
        vehicleType: item.vehicleType,
        payment: item.payment,
        details: item.details,
        negotiation: item.negotiation,
      },
      onAccept: () => accept(item.rideId),
      onReject: () => reject(item.rideId),
    });
  };

  const accept = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId);
    const baseValue = Number(
      request?.negotiation?.clientOffer ??
        request?.pricing?.total ??
        0,
    );
    const requiredBalance = Number(
      request?.financialRisk?.requiredBalance ?? Number((baseValue * 0.2).toFixed(2)),
    );
    const currentBalance = Number(driverBalance || 0);
    if (currentBalance < requiredBalance) {
      setShowNoBalanceModal(true);
      return;
    }
    if (request?.negotiation?.enabled) {
      let sent = false;
      try {
        await rideService.respondToOffer(rideId, { action: "accept" });
        sent = true;
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
        if (sent) {
          const updatedReq = {
            ...request,
            negotiation: {
              ...request.negotiation,
              myOffer: { amount: Number(request.negotiation.clientOffer || request.pricing?.total || 0), status: 'pending' }
            }
          };
          setPendingNegotiations((prev) => {
            if (prev.some(p => p.rideId === rideId)) return prev;
            return [updatedReq as any, ...prev];
          });
          setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
          setActiveTab("negotiation");
          driverAlertService.stop().catch(() => {});
        }
      }
      return;
    }

    try {
      const rideValue = request?.pricing?.total || 0;
      
      const canAccept = await driverService.canAcceptRide(rideValue);
      if (!canAccept) {
        setShowNoBalanceModal(true);
        return;
      }

      const ride = await rideService.accept(rideId);
      await driverAlertService.stop();
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
      const currentRideId = e?.response?.data?.currentRideId;
      const msg = e?.response?.data?.error || e?.message;

      
      if (currentRideId) {
        try {
          (navigation as any).navigate("DriverRide", { rideId: currentRideId });
        } catch {}
        setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
        driverAlertService.stop().catch(() => {});
        return;
      }

      const normalizedMsg = String(msg || "").toLowerCase();
      const shouldRemoveRequest =
        normalizedMsg.includes("nao esta mais disponivel") ||
        normalizedMsg.includes("não está mais disponível") ||
        normalizedMsg.includes("corrida nao encontrada") ||
        normalizedMsg.includes("corrida não encontrada");
      if (shouldRemoveRequest) {
        setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
        driverAlertService.stop().catch(() => {});
      }
    }
  };

  const counterOffer = async (rideId: string) => {
    const request = requests.find((item) => item.rideId === rideId) || pendingNegotiations.find((item) => item.rideId === rideId);
    if (!request) return;
    if (!request?.negotiation?.enabled) return;
    const baseValue = Number(
      request?.negotiation?.clientOffer ??
        request?.pricing?.total ??
        0,
    );
    const requiredBalance = Number(
      request?.financialRisk?.requiredBalance ?? Number((baseValue * 0.2).toFixed(2)),
    );
    const currentBalance = Number(driverBalance || 0);
    if (currentBalance < requiredBalance) {
      setShowNoBalanceModal(true);
      return;
    }

    // Navegar para a tela de negociação para ajustar o valor
    const offerParam = {
      _id: request.rideId,
      offeredValue: request.negotiation?.clientOffer || request.pricing?.total || 0,
      pickup: request.pickup,
      destination: request.dropoff,
      dropoff: request.dropoff,
      distance: request.distance,
      duration: request.duration,
      pricing: request.pricing,
      client: {
        name: "Cliente Leva Mais",
        rating: "5.0"
      },
      cargoType: {
        food: "Delivery",
        doc: "Documentos",
        market: "Mercado",
        box: "Caixa",
        material: "Material",
        furniture: "Móveis",
        moving: "Mudança",
        other: "Outros"
      }[request.details?.itemType as string] || "Encomenda"
    };

    (navigation as any).navigate("DriverNegotiation", {
      offer: offerParam
    });
  };

  const reject = async (rideId: string) => {
    try {
      await rideService.reject(rideId, "driver_rejected");
      await driverAlertService.stop();
      Toast.show({
        type: "success",
        text1: "Proposta cancelada! 🛑",
        text2: "Sua oferta foi cancelada com sucesso.",
        position: "top"
      });
    } catch (e) {
      console.error("Error rejecting ride:", e);
    } finally {
      setRequests((prev) => prev.filter((r) => r.rideId !== rideId));
      setPendingNegotiations((prev) => prev.filter((r) => r.rideId !== rideId));
    }
  };

  const handleAcceptScheduled = async (rideId: string) => {
    Alert.alert(
      "Aceitar Agendamento",
      "Deseja aceitar este agendamento antecipadamente? Ele ficará reservado para você no horário programado.",
      [
        { text: "Não", style: "cancel" },
        {
          text: "Aceitar",
          style: "default",
          onPress: async () => {
            try {
              const ride = scheduledRides.find((r) => String(r._id) === String(rideId));
              const rideValue = Number(ride?.pricing?.total || 0);
              const requiredBalance = Number(
                ride?.financialRisk?.requiredBalance ?? Number((rideValue * 0.2).toFixed(2)),
              );
              const currentBalance = Number(driverBalance || 0);
              if (currentBalance < requiredBalance) {
                Toast.show({
                  type: "error",
                  text1: "Saldo insuficiente",
                  text2: `Necessario: ${formatBRL(requiredBalance)} - Saldo atual: ${formatBRL(currentBalance)}`,
                });
                return;
              }

              const canAccept = await driverService.canAcceptRide(rideValue);
              if (!canAccept) {
                Toast.show({
                  type: "error",
                  text1: "Saldo insuficiente",
                  text2: "Voce precisa recarregar seu saldo para aceitar um agendamento.",
                });
                return;
              }

              await rideService.acceptScheduledRide(rideId);
              Toast.show({
                type: "success",
                text1: "Agendamento reservado!",
                text2: "Este agendamento agora é seu. Fique online próximo ao horário!",
              });
              await loadScheduledRides();
            } catch (err: any) {
              Toast.show({
                type: "error",
                text1: "Não foi possível aceitar",
                text2: err?.message || "Tente novamente",
              });
            }
          },
        },
      ]
    );
  };

  const handleOpenMap = (pickup: any, dropoff: any) => {
    if (!pickup?.latitude || !dropoff?.latitude) return;
    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  // Ã°Å¸â€â‚¬ Advanced Operational Filtration System
  const pendingIds = new Set(pendingNegotiations.map((n) => n.rideId));
  const activeRequests = requests.filter((r) => !pendingIds.has(r.rideId));

  const currentTabCount =
    activeTab === "realtime"
      ? activeRequests.length
      : activeTab === "negotiation"
      ? pendingNegotiations.length
      : scheduledRides.length;

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Ã°Å¸â€œÂ¡ Live Operational Ground Control Map */}
      <OperationalBackground />

      {/* Ã°Å¸â€ºÂ¡Ã¯Â¸Â Premium HUD Top Command Terminal */}
      <View 
        style={{ 
          paddingTop: Math.max(insets.top, 16),
          paddingHorizontal: 24,
          paddingBottom: 16,
          backgroundColor: "transparent",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255, 255, 255, 0.04)",
          zIndex: 99,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={{
                width: 44,
                height: 44,
                borderRadius: 16,
                backgroundColor: "rgba(255, 255, 255, 0.04)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.06)",
                alignItems: "center",
                justifyContent: "center"
              }}
              activeOpacity={0.7}
            >
              <ChevronLeft size={22} color="#ffffff" />
            </TouchableOpacity>
            <View>
              <Text style={{ color: "#ffffff", fontSize: 22, fontWeight: "900", letterSpacing: -0.5 }}>
                Solicitações
              </Text>
              <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 11, fontWeight: "700", letterSpacing: 0.3, textTransform: "uppercase", marginTop: 1 }}>
                Central de Negociação Realtime
              </Text>
            </View>
          </View>

          {/* Ã°Å¸Å¸Â¢ Live Operations Active Capsule Pod */}
          <MotiView
            from={{ scale: 0.95, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ loop: true, duration: 3000, type: "timing" }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "rgba(2, 222, 149, 0.08)",
              borderWidth: 1,
              borderColor: "rgba(2, 222, 149, 0.2)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
            }}
          >
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#02de95", marginRight: 6 }} />
            <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
              {currentTabCount} ATIVAS
            </Text>
          </MotiView>
        </View>
      </View>

      {/* Ã°Å¸Â§Â¬ Glassmorphic Operational Tabs Matrix */}
      <View style={{ paddingHorizontal: 16, marginTop: 16, zIndex: 98 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: "row",
            backgroundColor: "rgba(11, 26, 42, 0.4)",
            borderRadius: 20,
            padding: 5,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.05)",
            gap: 4
          }}
        >
          {(["realtime", "negotiation", "scheduled"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const tabLabels = {
              realtime: "Ofertas",
              negotiation: "Negociações",
              scheduled: "Agendados",
            };
            const tabCounts = {
              realtime: activeRequests.length,
              negotiation: pendingNegotiations.length,
              scheduled: scheduledRides.length,
            };

            const isClientCounteredTab = tab === "negotiation" && pendingNegotiations.some((item: any) => 
              item.negotiation?.offers?.some((o: any) => 
                o.driverId?.toString() === currentDriverId && o.status === "client_countered"
              )
            );

            const getLabelColor = () => {
              if (isActive) return "#091A2F";
              if (isClientCounteredTab) return "#F59E0B";
              return "rgba(255, 255, 255, 0.45)";
            };

            return (
              <TouchableOpacity
                key={tab}
                onPress={() => {
                  setActiveTab(tab);
                  if (tab === "negotiation") loadPendingNegotiations();
                  if (tab === "scheduled") loadScheduledRides();
                }}
                style={{
                  paddingHorizontal: 16,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 16,
                  position: "relative",
                  overflow: "hidden",
                }}
                activeOpacity={0.85}
              >
                {isActive && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: isClientCounteredTab ? "#F59E0B" : "#02de95",
                      borderRadius: 16,
                      shadowColor: isClientCounteredTab ? "#F59E0B" : "#02de95",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 6,
                      zIndex: -1
                    }}
                  />
                )}
                
                {/* Small pulsing indicator dot on non-active countered tab */}
                {!isActive && isClientCounteredTab && (
                  <MotiView
                    from={{ scale: 0.5, opacity: 0.5 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                      type: "timing",
                      duration: 1000,
                      loop: true,
                    }}
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 8,
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      backgroundColor: "#F59E0B",
                    }}
                  />
                )}

                <Text
                  style={{
                    color: getLabelColor(),
                    fontWeight: "900",
                    fontSize: 10.5,
                    textTransform: "uppercase",
                    letterSpacing: 0.3
                  }}
                  numberOfLines={1}
                >
                  {tabLabels[tab]} ({tabCounts[tab]}){isClientCounteredTab ? " Ã°Å¸â€â€" : ""}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>



      {/* Ã°Å¸Â§Â¬ Main Dynamic Operations Feed Scroll Matrix */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 120, gap: 16, paddingTop: 8 }}
      >
        <AnimatePresence exitBeforeEnter>
          {activeTab === "realtime" && (
            activeRequests.length === 0 ? (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DriverEmptyState title="Nenhuma oferta no momento." />
              </MotiView>
            ) : (
              activeRequests.map((r, i) => (
                <MotiView key={r.rideId} from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 80 }}>
                  <DriverRequestCard item={r} onAccept={accept} onReject={reject} onCounterOffer={counterOffer} onOpenDetail={handleOpenDetail} />
                </MotiView>
              ))
            )
          )}

          {activeTab === "negotiation" && (
            pendingNegotiations.length === 0 ? (
              <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <DriverEmptyState title="Nenhuma negociação ativa pendente." />
              </MotiView>
            ) : (
              pendingNegotiations.map((r, i) => (
                <MotiView key={r.rideId} from={{ opacity: 0, translateY: 15 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: i * 80 }}>
                  <DriverRequestCard item={r} onAccept={accept} onReject={reject} onCounterOffer={counterOffer} onOpenDetail={handleOpenDetail} />
                </MotiView>
              ))
            )
          )}

          {activeTab === "scheduled" && (
            loadingScheduled ? (
              <View style={{ padding: 60, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#02de95" />
                <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 16, fontWeight: "700", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Acessando Banco de Reservas...
                </Text>
              </View>
            ) : scheduledRides.length === 0 ? (
              <DriverEmptyState title="Nenhum agendamento pendente." />
            ) : (
              scheduledRides.map((ride, i) => (
                <MotiView
                  key={ride._id}
                  from={{ opacity: 0, translateY: 15 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ delay: i * 80 }}
                  style={{
                    backgroundColor: "#11253E",
                    borderRadius: 24,
                    padding: 20,
                    borderWidth: 1,
                    borderColor: "rgba(2,222,149,0.1)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 6,
                  }}
                >
                  {(() => {
                    const rideValue = Number(ride?.pricing?.total || 0);
                    const requiredBalance = Number(
                      ride?.financialRisk?.requiredBalance ?? Number((rideValue * 0.2).toFixed(2)),
                    );
                    const estimatedPlatformFee = Number(
                      ride?.financialRisk?.estimatedPlatformFee ??
                        ride?.pricing?.platformFee ??
                        ride?.pricing?.serviceFee ??
                        Number((rideValue * 0.2).toFixed(2)),
                    );
                    const currentBalance = Number(driverBalance || 0);
                    const hasEnoughBalance = currentBalance >= requiredBalance;

                    return (
                      <>
                  <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(2, 222, 149, 0.1)", alignItems: "center", justifyContent: "center" }}>
                         <Package size={16} color="#02de95" />
                      </View>
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14, letterSpacing: -0.3 }}>
                        {ride.serviceType === "delivery" ? "Entrega Agendada" : "Corrida Agendada"}
                      </Text>
                    </View>
                    <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 18 }}>
                      {formatBRL(ride.pricing?.total || 0)}
                    </Text>
                  </View>

                  {/* Schedule Horário Badge */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, marginBottom: 16 }}>
                    <Clock size={14} color="#02de95" />
                    <Text style={{ color: "rgba(255, 255, 255, 0.8)", fontWeight: "800", fontSize: 12 }}>
                      Execução: {new Date(ride.scheduledFor).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                    </Text>
                  </View>

                  {/* Timeline Route */}
                  <View style={{ gap: 12, marginBottom: 18, paddingLeft: 4 }}>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center", paddingTop: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", shadowColor: "#02de95", shadowOpacity: 0.6, shadowRadius: 4 }} />
                        <View style={{ width: 0, flex: 1, borderLeftWidth: 1.5, borderColor: "rgba(255, 255, 255, 0.15)", borderStyle: "dashed", marginVertical: 4 }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5 }}>PARTIDA (COLETA)</Text>
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 2 }}>{ride.pickup?.address}</Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ alignItems: "center", paddingTop: 4 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 9.5, fontWeight: "800", letterSpacing: 0.5 }}>DESTINO (ENTREGA)</Text>
                        <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", marginTop: 2 }}>{ride.dropoff?.address}</Text>
                      </View>
                    </View>
                  </View>

                  <View
                    style={{
                      backgroundColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.08)" : "rgba(239, 68, 68, 0.12)",
                      borderRadius: 14,
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      borderWidth: 1,
                      borderColor: hasEnoughBalance ? "rgba(2, 222, 149, 0.2)" : "rgba(239, 68, 68, 0.3)",
                      marginBottom: 14,
                    }}
                  >
                    <Text style={{ color: hasEnoughBalance ? "#86efac" : "#fca5a5", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Risco Financeiro
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 12, marginTop: 3 }}>
                      Taxa estimada plataforma: {formatBRL(estimatedPlatformFee)}
                    </Text>
                    <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
                      Saldo necessario: {formatBRL(requiredBalance)}
                    </Text>
                    <Text style={{ color: hasEnoughBalance ? "#86efac" : "#fca5a5", fontSize: 12, marginTop: 2, fontWeight: "700" }}>
                      Saldo atual: {formatBRL(currentBalance)}
                    </Text>
                  </View>

                  {/* Actions Buttons */}
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <TouchableOpacity
                      onPress={() => handleOpenMap(ride.pickup, ride.dropoff)}
                      style={{
                        flex: 1,
                        height: 48,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: "rgba(255,255,255,0.08)",
                        backgroundColor: "rgba(255,255,255,0.02)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8
                      }}
                      activeOpacity={0.8}
                    >
                      <MaterialCommunityIcons name="map-marker-distance" size={18} color="rgba(255,255,255,0.6)" />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "800", fontSize: 12, textTransform: "uppercase" }}>Ver rota</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleAcceptScheduled(ride._id)}
                      disabled={!hasEnoughBalance}
                      style={{
                        flex: 1.3,
                        height: 48,
                        borderRadius: 14,
                        backgroundColor: hasEnoughBalance ? "#02de95" : "rgba(2,222,149,0.28)",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "row",
                        gap: 8,
                        shadowColor: "#02de95",
                        shadowOpacity: 0.3,
                        shadowRadius: 6,
                        elevation: 4,
                        opacity: hasEnoughBalance ? 1 : 0.7,
                      }}
                      activeOpacity={0.8}
                    >
                      <Check size={18} color="#091A2F" strokeWidth={3} />
                      <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 12, textTransform: "uppercase" }}>
                        {hasEnoughBalance ? "Reservar" : "Saldo insuficiente"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                      </>
                    );
                  })()}
                </MotiView>
              ))
            )
          )}
        </AnimatePresence>
      </ScrollView>

      {/* Ã¢Å¡Â Ã¯Â¸Â No Balance Modal Wrapper */}
      <Modal
        visible={showNoBalanceModal}
        title="Saldo Insuficiente"
        message="Você precisa adicionar saldo para aceitar esta corrida. Acesse a tela de Ganhos e Carteira para recarregar."
        type="error"
        confirmText="Ir para Recarga"
        onClose={() => setShowNoBalanceModal(false)}
        onConfirm={() => {
          setShowNoBalanceModal(false);
          (navigation as any).navigate("DriverFinance", { screen: "DriverEarnings" });
        }}
      />
    </View>
  );
}

