import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Dimensions, ActivityIndicator, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, RefreshCw, TrendingUp, Zap, TrendingDown, Trash2, ChevronLeft } from "lucide-react-native";

import rideService, { RideOffer } from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { Audio } from "expo-av";
import { formatBRL } from "@/utils/mappers";

// Custom Premium Hooks & Components ✨
import { Modal } from "@/components/Modal";
import { DriverOfferListItem } from "@/components/client/offers/DriverOfferListItem";

// GlobalMap removed to improve performance

const { width, height } = Dimensions.get("window");

async function playOfferReceivedSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../../../assets/sound/notificationProposta.mp3"),
      { shouldPlay: true, volume: 1 }
    );
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log("[RideOffersMarketplace] Falha ao reproduzir notificationProposta.mp3:", error);
  }
}

function TacticalBackground() {
  return null;
}

export default function RideOffersMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");
  
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [isIncreasing, setIsIncreasing] = useState(false);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingIncrement, setPendingIncrement] = useState("5");
  const [targetOfferForCounter, setTargetOfferForCounter] = useState<RideOffer | null>(null);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const [rideDetails, setRideDetails] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [allRejected, setAllRejected] = useState(false);

  // States for General Increase Offer Flow (when all driver reject)
  const [showIncreaseModal, setShowIncreaseModal] = useState(false);
  const [customIncreaseAmount, setCustomIncreaseAmount] = useState("5");
  const [isSubmittingIncrease, setIsSubmittingIncrease] = useState(false);

  const handleOpenCounterModal = (offer: RideOffer) => {
    setTargetOfferForCounter(offer);
    setPendingIncrement(String(offer.amount));
    setShowConfirmModal(true);
  };

  const handleConfirmClientCounter = async () => {
    const cleanVal = pendingIncrement.replace(",", ".");
    const numVal = parseFloat(cleanVal);
    
    if (isNaN(numVal) || numVal <= 0) {
      Toast.show({
        type: "error",
        text1: "Valor inválido",
        text2: "Por favor, informe um valor maior que zero.",
      });
      return;
    }

    if (!targetOfferForCounter || !rideId) return;
    
    const driverId = typeof targetOfferForCounter.driverId === "string" 
      ? targetOfferForCounter.driverId 
      : targetOfferForCounter.driverId?._id;

    if (!driverId) return;

    setShowConfirmModal(false);
    if (isIncreasing) return;
    setIsIncreasing(true);

    try {
      await rideService.clientCounterOffer(rideId, driverId, numVal);
      Toast.show({
        type: "success",
        text1: "Contraproposta enviada! 🚀",
        text2: `Você ofereceu ${formatBRL(numVal)} ao entregador. Aguardando resposta...`,
      });
      await loadOffers();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao enviar contraproposta",
        text2: e?.response?.data?.error || e?.message || "Tente novamente.",
      });
    } finally {
      setIsIncreasing(false);
      setTargetOfferForCounter(null);
    }
  };

  const loadRideDetails = useCallback(async () => {
    try {
      const details = await rideService.getById(rideId);
      setRideDetails(details);
      return details;
    } catch (e) {}
    return null;
  }, [rideId]);

  const loadOffers = useCallback(async () => {
    if (!rideId) return;
    try {
      const data = await rideService.getOffers(rideId);
      setNegotiation(data.negotiation);
      const filtered = (data.offers || []).filter((o) => o.status !== "rejected");
      
      if (filtered.length > 0) {
        setAllRejected(false);
      } else if (data.allRejected === true) {
        setAllRejected(true);
      } else {
        setAllRejected(false);
      }
      
      setOffers((prev) => {
        // Play sound if number of active offers increased
        if (filtered.length > prev.length) {
          playOfferReceivedSound().catch(() => {});
        }
        return filtered;
      });
    } catch (e) {}
  }, [rideId]);

  // Handle Quick & Custom Increment actions
  const handleIncreaseOffer = async (amount: number) => {
    if (isSubmittingIncrease) return;
    setIsSubmittingIncrease(true);
    try {
      await rideService.increaseOffer(rideId, amount);
      Toast.show({
        type: "success",
        text1: "Oferta Aumentada! 🚀",
        text2: `A proposta base foi aumentada em +${formatBRL(amount)} com sucesso!`,
      });
      setShowIncreaseModal(false);
      setAllRejected(false);
      await loadRideDetails();
      await loadOffers();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao aumentar",
        text2: e?.response?.data?.error || e?.message || "Não foi possível aumentar a oferta.",
      });
    } finally {
      setIsSubmittingIncrease(false);
    }
  };

  const handleCustomIncrease = async () => {
    const cleanVal = customIncreaseAmount.replace(",", ".");
    const numVal = parseFloat(cleanVal);
    if (isNaN(numVal) || numVal <= 0) {
      Toast.show({
        type: "error",
        text1: "Valor inválido",
        text2: "Por favor, digite um valor de aumento maior que zero.",
      });
      return;
    }
    await handleIncreaseOffer(numVal);
  };

  useEffect(() => {
    loadRideDetails();
  }, [loadRideDetails]);

  // Redireciona para tracking assim que a corrida tiver motorista comprometido.
  // Inclui todos os status pós-aceite para garantir que o marketplace nunca
  // apareça com entrega/corrida já em andamento.
  useEffect(() => {
    const currentStatus = String(rideDetails?.status || "");
    const activeStatuses = [
      "driver_assigned",
      "accepted",
      "driver_arriving",
      "arrived",
      "in_progress",
    ];
    if (rideId && activeStatuses.includes(currentStatus)) {
      const trackingScreen =
        rideDetails?.serviceType === "delivery" ? "DeliveryTracking" : "RideTracking";
      navigation.navigate(trackingScreen, { rideId });
    }
  }, [navigation, rideDetails?.status, rideDetails?.serviceType, rideId]);


  useEffect(() => {
    let mounted = true;
    let prevOfferCount = 0;
    
    const init = async () => {
      try {
        await loadOffers();
        // loadRideDetails retorna os dados frescos — não ler rideDetails (state) aqui
        // pois o React ainda não re-renderizou com o novo valor.
        const freshDetails = await loadRideDetails();
        const activeStatuses = [
          "driver_assigned",
          "accepted",
          "driver_arriving",
          "arrived",
          "in_progress",
        ];
        const freshStatus = String(freshDetails?.status || "");
        if (rideId && activeStatuses.includes(freshStatus)) {
          const trackingScreen =
            freshDetails?.serviceType === "delivery" ? "DeliveryTracking" : "RideTracking";
          navigation.navigate(trackingScreen, { rideId });
          return;
        }
      } catch (e: any) {
        if (mounted) {
          Toast.show({ type: "error", text1: "Erro", text2: "Falha ao atualizar propostas." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    init();

    const onOffersUpdated = async (data: any) => {
      if (mounted && data?.rideId === rideId) {
        if (data?.reason === "driver_rejected_some") {
          setAllRejected(true);
        } else {
          setAllRejected(false);
        }
        // Capture count before reload
        const countBefore = prevOfferCount;
        await loadOffers().catch(() => {});
        await loadRideDetails().catch(() => {});
        // After reload, we compare via state setter callback
        setOffers((current) => {
          const countAfter = current.length;
          if (countAfter < countBefore && countBefore > 0) {
            // A driver declined/withdrew their offer
            Toast.show({
              type: "info",
              text1: "Um entregador recusou sua oferta ⚠️",
              text2: "Outros parceiros ainda podem aceitar. Tente aumentar o valor para atrair mais interessados!",
              visibilityTime: 5000,
            });
          }
          prevOfferCount = countAfter;
          return current;
        });
      }
    };

    // Also init prevOfferCount after first load
    setOffers((current) => {
      prevOfferCount = current.length;
      return current;
    });

    const onStatusChanged = (data: any) => {
      if (mounted && data?.rideId === rideId) {
        loadRideDetails().catch(() => {});
        loadOffers().catch(() => {});
      }
    };

    webSocketService.on("ride-offers-updated", onOffersUpdated);
    webSocketService.on("ride-status-updated", onStatusChanged);

    const interval = setInterval(() => {
      loadOffers().catch(() => {});
      loadRideDetails().catch(() => {});
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(interval);
      webSocketService.off("ride-offers-updated", onOffersUpdated);
      webSocketService.off("ride-status-updated", onStatusChanged);
    };
  }, [loadOffers, loadRideDetails]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [offers]);

  // Oferta recomendada (melhor custo-benefício): menor score combinando preço e ETA.
  // Considera apenas ofertas selecionáveis (não as contrapropostas aguardando o motorista).
  const recommendedDriverId = useMemo(() => {
    const selectable = sortedOffers.filter((o) => o.status !== "client_countered");
    if (selectable.length === 0) return null;
    const prices = selectable.map((o) => Number(o.amount || 0));
    const etas = selectable.map((o) => Number(o.etaMinutes || 0));
    const maxPrice = Math.max(...prices, 1);
    const maxEta = Math.max(...etas, 1);
    const relOf = (o: RideOffer) => {
      const r = typeof o.driverId === "string" ? null : o.driverId?.reliabilityPct;
      return r == null ? 90 : Number(r); // sem histórico = neutro (90%)
    };
    let bestId: string | null = null;
    let bestScore = Infinity;
    for (const o of selectable) {
      const id = typeof o.driverId === "string" ? o.driverId : o.driverId?._id || null;
      if (!id) continue;
      // Menor = melhor: 60% preço + 25% ETA + 15% (1 - confiança). Tudo normalizado.
      const score =
        0.6 * (Number(o.amount || 0) / maxPrice) +
        0.25 * (Number(o.etaMinutes || 0) / maxEta) +
        0.15 * (1 - relOf(o) / 100);
      if (score < bestScore) {
        bestScore = score;
        bestId = id;
      }
    }
    return bestId;
  }, [sortedOffers]);

  // Ordena exibição: oferta recomendada primeiro, depois por preço (já vem ordenado).
  const displayOffers = useMemo(() => {
    if (!recommendedDriverId) return sortedOffers;
    const idOf = (o: RideOffer) => (typeof o.driverId === "string" ? o.driverId : o.driverId?._id);
    const rec = sortedOffers.filter((o) => idOf(o) === recommendedDriverId);
    const rest = sortedOffers.filter((o) => idOf(o) !== recommendedDriverId);
    return [...rec, ...rest];
  }, [sortedOffers, recommendedDriverId]);

  // Relógio compartilhado (1s) para os contadores "expira em" dos cards.
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isDeliveryFlow =
    rideDetails?.serviceType === "delivery" || rideDetails?.serviceType === "frete";

  const handleSelectOffer = async (offer: RideOffer) => {
    const driverId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id;
    if (!driverId) return;

    setSelectingId(driverId);
    try {
      await rideService.selectOffer(rideId, driverId);
      Toast.show({
        type: "success",
        text1: "Proposta aceita! 🎉",
        text2: "Entregador selecionado com sucesso!",
      });
      navigation.navigate("DeliveryTracking", { rideId });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao selecionar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
      setSelectingId(null);
    }
  };

  const handleDeclineOffer = async (offer: RideOffer) => {
    const driverId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id;
    if (!driverId) return;

    setSelectingId(driverId);
    try {
      await rideService.declineOffer(rideId, driverId);
      Toast.show({
        type: "info",
        text1: "Oferta Recusada",
        text2: "A proposta do entregador foi removida da lista.",
      });
      await loadOffers();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao recusar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
    } finally {
      setSelectingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!rideId || isCancelling) return;
    setIsCancelling(true);
    try {
      await rideService.cancel(rideId, "Cancelado pelo cliente no painel de ofertas.");
      setShowCancelModal(false);
      Toast.show({
        type: "success",
        text1: isDeliveryFlow ? "Entrega cancelada" : "Corrida cancelada",
        text2: isDeliveryFlow
          ? "A solicitacao de entrega foi encerrada com sucesso."
          : "O chamado foi encerrado com sucesso.",
      });
      navigation.navigate("Home");
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao cancelar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#F8FAFC", position: "relative" }}>
      <StatusBar barStyle="dark-content" translucent backgroundColor="transparent" />

      {/* 📡 Operational Blurred Tactical Background */}
      <TacticalBackground />

      {/* 🟢 Gorgeous Curved Green Top Header Block */}
      <View 
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: insets.top + 145,
          backgroundColor: "#FFFFFF",
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          borderBottomWidth: 1.5,
          borderColor: "rgba(0, 0, 0, 0.06)",
          zIndex: 40,
          paddingHorizontal: 20,
          paddingTop: insets.top + 12,
          shadowColor: "#000000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 5,
        }}
      >
        {/* Navigation Row */}
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          {/* Back Chevron */}
          <TouchableOpacity 
            onPress={() => navigation.navigate("Home")}
            style={{
              height: 44,
              width: 44,
              alignItems: "center",
              justifyContent: "center",
            }}
            activeOpacity={0.7}
          >
            <ChevronLeft color="#0F172A" size={28} strokeWidth={3} />
          </TouchableOpacity>

          {/* Center Title Pill */}
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 16, letterSpacing: 0.5 }}>
              Escolher Entregador
            </Text>
          </View>

          {/* Right Spacer for Perfect Centering */}
          <View style={{ width: 44 }} />
        </View>

        {/* Row 2: Proposal Info directly integrated into Header (no nested card!) */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", duration: 800 }}
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 8,
            paddingHorizontal: 4,
          }}
        >
          <View>
            <Text style={{ color: "#64748B", fontSize: 10, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
              Sua Proposta Base
            </Text>
            <Text style={{ color: "#0F172A", fontSize: 26, fontWeight: "900" }}>
              {formatBRL(Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0))}
            </Text>
          </View>


        </MotiView>
      </View>

      {/* 🧬 Scrollable Vertical Matrix of Counter-Offers */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: "transparent", zIndex: 10 }} 
        contentContainerStyle={{ paddingTop: insets.top + 160, paddingHorizontal: 12, paddingBottom: 150 }}
      >
        {/* 💡 Accelerate Advice Indicator */}
        {!loading && sortedOffers.length === 0 && !["no_drivers_available", "cancelled_no_driver"].includes(rideDetails?.status || "") && !allRejected && (
          <MotiView 
            from={{ opacity: 0, translateY: -10 }} 
            animate={{ opacity: 1, translateY: 0 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFBEB",
              borderWidth: 1.2,
              borderColor: "#FCD34D",
              borderRadius: 20,
              padding: 16,
              marginBottom: 20,
              shadowColor: "#D97706",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.05,
              shadowRadius: 10,
              elevation: 2,
            }}
          >
            <View style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "#FEF3C7",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
              flexShrink: 0,
            }}>
               <AlertCircle size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
               <Text style={{ color: "#92400E", fontSize: 11.5, fontWeight: "800", lineHeight: 18 }}>
                 Caso esteja demorando muito, tente aumentar a sua oferta acima para que o seu pedido seja aceito mais rapidamente pelos motoristas!
               </Text>
            </View>
          </MotiView>
        )}

        <AnimatePresence>
          {loading ? (
            <MotiView 
              from={{ opacity: 0 }} animate={{ opacity: 1 }} 
              className="py-16 items-center justify-center"
            >
              <RefreshCw size={28} color="#02de95" className="animate-spin" />
              <Text className="text-white/60 text-sm font-semibold mt-5">
                Sincronizando propostas...
              </Text>
            </MotiView>
          ) : ["no_drivers_available", "cancelled_no_driver"].includes(rideDetails?.status || "") || allRejected ? (
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.15)",
                borderRadius: 24,
                padding: 24,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 4,
              }}
            >
              <View style={{
                width: 56,
                height: 56,
                backgroundColor: "rgba(239, 68, 68, 0.06)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.12)",
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <AlertCircle size={26} color="#EF4444" />
              </View>
              <Text style={{
                color: "#0F172A",
                fontWeight: "900",
                fontSize: 20,
                marginBottom: 10,
                textAlign: "center",
                letterSpacing: -0.3,
              }}>
                Sem Entregadores Disponíveis
              </Text>
              <Text style={{
                color: "#475569",
                textAlign: "center",
                fontSize: 13.5,
                lineHeight: 20,
                marginBottom: 20,
              }}>
                Todos os motoristas online e ativos recusaram o valor de <Text style={{ color: "#D97706", fontWeight: "900" }}>{formatBRL(Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0))}</Text>. Para reativar a busca por motoristas, melhore o valor da sua proposta:
              </Text>

              {/* Quick Increment Chips */}
              <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%", gap: 10, marginBottom: 20 }}>
                {[2, 5, 10].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => handleIncreaseOffer(val)}
                    style={{
                      flex: 1,
                      backgroundColor: "#FBBF24",
                      paddingVertical: 14,
                      borderRadius: 16,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: "#FBBF24",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.15,
                      shadowRadius: 6,
                      elevation: 3,
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 13.5 }}>+{formatBRL(val)}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Action Buttons Grid */}
              <View style={{ flexDirection: "row", gap: 12, width: "100%" }}>
                <TouchableOpacity
                  onPress={() => setShowIncreaseModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(9, 26, 47, 0.04)",
                    borderWidth: 1,
                    borderColor: "rgba(9, 26, 47, 0.08)",
                    paddingVertical: 13,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Outro Valor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCancelModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(239, 68, 68, 0.06)",
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.12)",
                    paddingVertical: 13,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#EF4444", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          ) : sortedOffers.length === 0 ? (
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", duration: 800 }}
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "rgba(9, 26, 47, 0.06)",
                borderRadius: 24,
                padding: 32,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 24,
                overflow: "hidden",
                shadowColor: "#091A2F",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.06,
                shadowRadius: 16,
                elevation: 4,
              }}
            >
              {/* 📡 Radar Sonar Animation (Hologram Neon Effect) */}
              <View style={{ width: 80, height: 80, alignItems: "center", justifyContent: "center", position: "relative", marginBottom: 20 }}>
                {/* Outer expanding ripple 1 */}
                <MotiView
                  from={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{
                    loop: true,
                    type: "timing",
                    duration: 2000,
                  }}
                  style={{
                    position: "absolute",
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 1.5,
                    borderColor: "rgba(2, 222, 149, 0.4)",
                    backgroundColor: "rgba(2, 222, 149, 0.05)",
                  }}
                />
                
                {/* Outer expanding ripple 2 */}
                <MotiView
                  from={{ scale: 0.6, opacity: 0.8 }}
                  animate={{ scale: 2.0, opacity: 0 }}
                  transition={{
                    loop: true,
                    type: "timing",
                    duration: 2000,
                    delay: 1000,
                  }}
                  style={{
                    position: "absolute",
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 1.5,
                    borderColor: "rgba(2, 222, 149, 0.4)",
                    backgroundColor: "rgba(2, 222, 149, 0.05)",
                  }}
                />
                
                {/* Rotating holographic scanner line */}
                <MotiView
                  from={{ rotate: "0deg" }}
                  animate={{ rotate: "360deg" }}
                  transition={{
                    loop: true,
                    type: "timing",
                    duration: 3000,
                  }}
                  style={{
                    position: "absolute",
                    width: 70,
                    height: 70,
                    borderRadius: 35,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.05)",
                    justifyContent: "flex-start",
                    alignItems: "center",
                  }}
                >
                  <View style={{ width: 1.5, height: 35, backgroundColor: "#02de95", opacity: 0.5 }} />
                </MotiView>

                {/* Inner active core */}
                <View 
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 24,
                    backgroundColor: "#091A2F",
                    borderWidth: 2,
                    borderColor: "#02de95",
                    alignItems: "center",
                    justifyContent: "center",
                    shadowColor: "#02de95",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 6,
                    elevation: 6,
                    zIndex: 10,
                    position: "absolute",
                  }}
                >
                  <MotiView
                    animate={{
                      scale: [1, 1.15, 1],
                    }}
                    transition={{
                      loop: true,
                      type: "timing",
                      duration: 1500,
                    }}
                  >
                    <Zap size={20} color="#02de95" />
                  </MotiView>
                </View>
              </View>
              
              <MotiView
                from={{ opacity: 0.6 }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ loop: true, duration: 1800, type: "timing" }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(2, 222, 149, 0.08)",
                  borderWidth: 1.2,
                  borderColor: "rgba(2, 222, 149, 0.2)",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 12,
                  marginBottom: 16,
                  alignSelf: "center",
                }}
              >
                <ActivityIndicator size="small" color="#02de95" style={{ marginRight: 6 }} />
                <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Buscando entregadores...
                </Text>
              </MotiView>

              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 18, marginBottom: 8, textAlign: "center" }}>
                Aguardando Propostas...
              </Text>
              
              <Text style={{ color: "rgba(9, 26, 47, 0.6)", textAlign: "center", fontSize: 13, lineHeight: 20, maxWidth: 280 }}>
                Os entregadores parceiros mais próximos da sua região já receberam o alerta. Em breve as propostas aparecerão abaixo!
              </Text>
            </MotiView>
          ) : (
            <View style={{ flex: 1 }}>
              <View style={{ marginBottom: 20, paddingHorizontal: 4 }}>
                <Text style={{ color: "#0F172A", fontSize: 22, fontWeight: "800", marginBottom: 6 }}>
                  Ofertas Disponíveis
                </Text>
                <Text style={{ color: "#64748B", fontSize: 14, fontWeight: "500", lineHeight: 20 }}>
                  Selecione o entregador que melhor atende às suas necessidades de tempo e valor.
                </Text>
              </View>
              <View className="gap-4">
                {displayOffers.map((offer, idx) => {
                  const dId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id || `${idx}`;
                  return (
                    <DriverOfferListItem
                      key={`${dId}-${idx}`}
                      offer={offer}
                      clientBudget={Number(negotiation?.clientOffer || 0)}
                      loading={selectingId === dId}
                      recommended={!!recommendedDriverId && dId === recommendedDriverId && displayOffers.length > 1}
                      nowTs={nowTs}
                      onSelect={handleSelectOffer}
                      onDecline={handleDeclineOffer}
                      onCounter={handleOpenCounterModal}
                    />
                  );
                })}
              </View>
            </View>
          )}
        </AnimatePresence>
      </ScrollView>

      {/* 💎 Ajustar Contraproposta Modal */}
      <Modal
        visible={showConfirmModal}
        title="Contrapropor Entregador"
        type="info"
        confirmText="Enviar Contraproposta"
        onClose={() => {
          setShowConfirmModal(false);
          setTargetOfferForCounter(null);
        }}
        onConfirm={handleConfirmClientCounter}
      >
         <View style={{ width: "100%", marginTop: 12, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16, textAlign: "center", lineHeight: 18 }}>
               Envie uma nova proposta diretamente para o entregador <Text style={{ color: "#fff", fontWeight: "bold" }}>{typeof targetOfferForCounter?.driverId === "string" ? "Parceiro" : targetOfferForCounter?.driverId?.name || "Parceiro"}</Text>. A oferta atual dele é de <Text style={{ color: "#fbbf24", fontWeight: "bold" }}>{formatBRL(Number(targetOfferForCounter?.amount || 0))}</Text>.
            </Text>

            <View style={{
               width: "100%",
               flexDirection: "row",
               alignItems: "center",
               backgroundColor: "rgba(255,255,255,0.05)",
               borderWidth: 1,
               borderColor: "rgba(255, 255, 255, 0.1)",
               borderRadius: 16,
               paddingHorizontal: 16,
               height: 64,
               marginBottom: 8
            }}>
               <Text style={{ 
                  color: "#02de95", 
                  fontSize: 22, 
                  fontWeight: "900", 
                  marginRight: 8 
               }}>
                  R$
               </Text>
               <TextInput
                  value={pendingIncrement}
                  onChangeText={setPendingIncrement}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={{
                     flex: 1,
                     color: "#fff",
                     fontSize: 24,
                     fontWeight: "900",
                  }}
                  placeholder="0,00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
               />
            </View>
         </View>
      </Modal>

      {/* 💸 Aumentar Oferta Base Modal */}
      <Modal
        visible={showIncreaseModal}
        title="Melhorar Oferta"
        type="warning"
        confirmText={isSubmittingIncrease ? "Ajustando..." : "Confirmar Aumento"}
        onClose={() => !isSubmittingIncrease && setShowIncreaseModal(false)}
        onConfirm={handleCustomIncrease}
      >
         <View style={{ width: "100%", marginTop: 12, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 16, textAlign: "center", lineHeight: 18 }}>
               Melhore o valor da sua proposta base. Ao aumentar a sua oferta, todos os motoristas ativos na cidade receberão seu chamado novamente!
            </Text>

            <View style={{
               width: "100%",
               flexDirection: "row",
               alignItems: "center",
               backgroundColor: "rgba(255,255,255,0.05)",
               borderWidth: 1,
               borderColor: "rgba(255, 255, 255, 0.1)",
               borderRadius: 16,
               paddingHorizontal: 16,
               height: 64,
               marginBottom: 8
            }}>
               <Text style={{ 
                  color: "#fbbf24", 
                  fontSize: 22, 
                  fontWeight: "900", 
                  marginRight: 8 
               }}>
                  + R$
               </Text>
               <TextInput
                  value={customIncreaseAmount}
                  onChangeText={setCustomIncreaseAmount}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={{
                     flex: 1,
                     color: "#fff",
                     fontSize: 24,
                     fontWeight: "900",
                  }}
                  placeholder="0,00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
               />
            </View>

            {/* 💰 Live Financial Calculation Panel */}
            <View style={{
               width: "100%",
               backgroundColor: "rgba(255, 255, 255, 0.03)",
               borderWidth: 1,
               borderColor: "rgba(255, 255, 255, 0.06)",
               borderRadius: 16,
               padding: 14,
               marginTop: 12,
               gap: 8
            }}>
               <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "600" }}>Valor Atual</Text>
                  <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                     {formatBRL(Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0))}
                  </Text>
               </View>

               <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "rgba(255, 255, 255, 0.4)", fontSize: 12, fontWeight: "600" }}>Aumento Proposto</Text>
                  <Text style={{ color: "#fbbf24", fontSize: 13, fontWeight: "900" }}>
                     + {formatBRL(Number(customIncreaseAmount.replace(",", ".")) || 0)}
                  </Text>
               </View>

               {/* Divider */}
               <View style={{ height: 1, backgroundColor: "rgba(255, 255, 255, 0.08)", marginVertical: 4 }} />

               <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <Text style={{ color: "rgba(255, 255, 255, 0.6)", fontSize: 13, fontWeight: "700" }}>Novo Total da Proposta</Text>
                  <Text style={{ color: "#02de95", fontSize: 16, fontWeight: "900" }}>
                     {formatBRL(
                        Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0) +
                        (Number(customIncreaseAmount.replace(",", ".")) || 0)
                     )}
                  </Text>
               </View>
            </View>
         </View>
      </Modal>

      {/* 🛑 Luxury Cancel Modal */}
      <Modal
        visible={showCancelModal}
        title="Cancelar Pedido?"
        type="error"
        confirmText={isCancelling ? "Cancelando..." : "Confirmar"}
        onClose={() => !isCancelling && setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      >
         <View style={{ width: "100%", marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 18 }}>
               Tem certeza que deseja cancelar a sua solicitação? O chamado será encerrado e todos os entregadores próximos deixarão de ver o seu pedido.
            </Text>
         </View>
      </Modal>

      {/* 🛑 Discreet Root-Level Cancel Action */}
      <View
        style={{ 
          position: "absolute", 
          bottom: 0, 
          left: 0, 
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: 12,
          backgroundColor: "#F8FAFC",
          borderTopWidth: 1,
          borderTopColor: "rgba(0, 0, 0, 0.05)",
          zIndex: 9999,
        }}
      >
         <TouchableOpacity 
            onPress={() => setShowCancelModal(true)}
            activeOpacity={0.85}
            style={{ 
               flexDirection: "row", 
               alignItems: "center", 
               justifyContent: "center", 
               width: "100%",
               height: 48,
               borderRadius: 16,
               backgroundColor: "#FEF2F2",
               borderWidth: 1.2,
               borderColor: "rgba(239, 68, 68, 0.15)",
               shadowColor: "#EF4444",
               shadowOffset: { width: 0, height: 2 },
               shadowOpacity: 0.03,
               shadowRadius: 6,
               elevation: 2,
            }}
         >
            <Trash2 size={14} color="#EF4444" style={{ marginRight: 8 }} />
            <Text style={{ color: "#EF4444", fontSize: 11.5, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" }}>
               Cancelar Solicitação
            </Text>
         </TouchableOpacity>
      </View>

    </GestureHandlerRootView>
  );
}

