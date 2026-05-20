import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StatusBar, ScrollView, TextInput, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, RefreshCw, TrendingUp, Zap, TrendingDown, Trash2 } from "lucide-react-native";

import rideService, { RideOffer } from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { Audio } from "expo-av";
import { formatBRL } from "@/utils/mappers";

// Custom Premium Hooks & Components ✨
import { Modal } from "@/components/Modal";
import { MarketplaceHeader } from "@/components/client/offers/MarketplaceHeader";
import { DriverOfferListItem } from "@/components/client/offers/DriverOfferListItem";

import { GlobalMap } from "@/components/GlobalMap";

const { width, height } = Dimensions.get("window");

async function playOfferReceivedSound() {
  try {
    const { sound } = await Audio.Sound.createAsync(
      require("../../../../../assets/sound/Meniza.wav"),
      { shouldPlay: true, volume: 1 }
    );
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch (error) {
    console.log("[RideOffersMarketplace] Falha ao reproduzir Meniza.wav:", error);
  }
}

interface TacticalBackgroundProps {
  pickup?: { latitude: number; longitude: number };
}
function TacticalBackground({ pickup }: TacticalBackgroundProps) {
  return (
    <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0, overflow: "hidden" }}>
      <GlobalMap
        provider="google"
        useDarkStyle={true}
        initialRegion={{
          latitude: pickup?.latitude || -23.5505,
          longitude: pickup?.longitude || -46.6333,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        style={{ width: width, height: height, opacity: 0.6 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />
      <BlurView intensity={40} tint="dark" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} />
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(9, 26, 47, 0.45)" }} />
    </View>
  );
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
    } catch (e) {}
  }, [rideId]);

  const loadOffers = useCallback(async () => {
    if (!rideId) return;
    try {
      const data = await rideService.getOffers(rideId);
      setNegotiation(data.negotiation);
      const filtered = (data.offers || []).filter((o) => o.status !== "rejected");
      
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

  useEffect(() => {
    if (String(rideDetails?.status || "") === "driver_assigned" && rideId) {
      navigation.replace("DeliveryPaymentConfirm", { rideId });
    }
  }, [navigation, rideDetails?.status, rideId]);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await loadOffers();
      } catch (e: any) {
        if (mounted) {
          Toast.show({ type: "error", text1: "Erro", text2: "Falha ao atualizar propostas." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    init();

    const onOffersUpdated = (data: any) => {
      if (mounted && data?.rideId === rideId) {
        loadOffers().catch(() => {});
        loadRideDetails().catch(() => {});
      }
    };

    const onStatusChanged = (data: any) => {
      if (mounted && data?.rideId === rideId) {
        loadRideDetails().catch(() => {});
        loadOffers().catch(() => {});
      }
    };

    webSocketService.on("ride-offers-updated", onOffersUpdated);
    webSocketService.on("ride-status-changed", onStatusChanged);

    const interval = setInterval(() => {
      loadOffers().catch(() => {});
      loadRideDetails().catch(() => {});
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(interval);
      webSocketService.off("ride-offers-updated", onOffersUpdated);
      webSocketService.off("ride-status-changed", onStatusChanged);
    };
  }, [loadOffers, loadRideDetails]);

  const sortedOffers = useMemo(() => {
    return [...offers].sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [offers]);

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
        text2: "Entregador selecionado! Confirme a forma de pagamento.",
      });
      navigation.replace("DeliveryPaymentConfirm", { rideId });
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
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#091A2F", position: "relative" }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 📡 Operational Blurred Tactical Background */}
      <TacticalBackground pickup={rideDetails?.pickup} />

      {/* 👑 Premium Top Inset & HUD Header */}
      <View style={{ height: insets.top + 80, backgroundColor: "transparent", zIndex: 10 }}>
        <MarketplaceHeader 
          onBack={() => navigation.navigate("Home")} 
          offerCount={sortedOffers.length} 
          useDarkMap={true}
        />
      </View>

      {/* 💰 Sua Proposta Base with Semi-Translucence */}
      <View style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", backgroundColor: "rgba(11, 26, 42, 0.7)", zIndex: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <View>
          <Text className="text-white/40 text-[10px] font-black uppercase tracking-wider mb-0.5">
            Sua Proposta Base
          </Text>
          <Text className="text-white font-black text-3xl">
            {formatBRL(Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0))}
          </Text>
        </View>

        {!["no_drivers_available", "cancelled_no_driver"].includes(rideDetails?.status || "") && (
          <TouchableOpacity
            onPress={() => setShowIncreaseModal(true)}
            className="flex-row items-center gap-2 bg-amber-500/10 border border-amber-500/30 px-4 py-2.5 rounded-xl"
            activeOpacity={0.8}
          >
            <TrendingUp size={14} color="#FBBF24" />
            <Text className="text-amber-400 font-black text-xs uppercase tracking-wider">Aumentar</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 🧬 Scrollable Vertical Matrix of Counter-Offers */}
      <ScrollView 
        style={{ flex: 1, backgroundColor: "transparent", zIndex: 10 }} 
        contentContainerStyle={{ padding: 24, paddingBottom: 150 }}
      >
        {/* 💡 Accelerate Advice Indicator */}
        {!loading && sortedOffers.length === 0 && !["no_drivers_available", "cancelled_no_driver"].includes(rideDetails?.status || "") && (
          <MotiView 
            from={{ opacity: 0, translateY: -10 }} 
            animate={{ opacity: 1, translateY: 0 }}
            className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 flex-row items-center"
          >
            <View className="w-9 h-9 rounded-full bg-amber-500/20 items-center justify-center mr-3 flex-shrink-0">
               <AlertCircle size={18} color="#FBBF24" />
            </View>
            <View className="flex-1">
               <Text className="text-amber-500/90 text-[11px] font-bold leading-relaxed">
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
          ) : ["no_drivers_available", "cancelled_no_driver"].includes(rideDetails?.status || "") ? (
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              style={{
                backgroundColor: "rgba(17, 37, 62, 0.94)",
                borderWidth: 1.5,
                borderColor: "rgba(239, 68, 68, 0.35)",
                borderRadius: 24,
                padding: 24,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 16,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.4,
                shadowRadius: 16,
                elevation: 10,
              }}
            >
              <View style={{
                width: 56,
                height: 56,
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.3)",
                borderRadius: 28,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}>
                <AlertCircle size={26} color="#EF4444" />
              </View>
              <Text style={{
                color: "#fff",
                fontWeight: "900",
                fontSize: 20,
                marginBottom: 10,
                textAlign: "center",
                letterSpacing: -0.3,
              }}>
                Sem Entregadores Disponíveis
              </Text>
              <Text style={{
                color: "rgba(255, 255, 255, 0.65)",
                textAlign: "center",
                fontSize: 13.5,
                lineHeight: 20,
                marginBottom: 20,
              }}>
                Todos os motoristas online e ativos recusaram o valor de <Text style={{ color: "#FBBF24", fontWeight: "900" }}>{formatBRL(Number(negotiation?.clientOffer || rideDetails?.pricing?.total || 0))}</Text>. Para reativar a busca por motoristas, melhore o valor da sua proposta:
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
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 4,
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
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    paddingVertical: 13,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#fff", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Outro Valor</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setShowCancelModal(true)}
                  style={{
                    flex: 1,
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    borderWidth: 1,
                    borderColor: "rgba(239, 68, 68, 0.3)",
                    paddingVertical: 13,
                    borderRadius: 16,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={{ color: "#ff6b6b", fontWeight: "900", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          ) : sortedOffers.length === 0 ? (
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 items-center justify-center mt-6"
            >
              <View className="w-16 h-16 bg-amber-500/10 border border-amber-500/10 rounded-full items-center justify-center mb-5">
                 <AlertCircle size={28} color="#FBBF24" />
              </View>
              <Text className="text-white font-black text-xl mb-2">
                Aguardando Propostas
              </Text>
              <Text className="text-white/40 text-center text-sm leading-relaxed">
                Os motoristas da região receberam seu chamado e estão preparando as ofertas. Em breve as propostas aparecerão abaixo.
              </Text>
            </MotiView>
          ) : (
            <View className="gap-4">
              {sortedOffers.map((offer, idx) => {
                const dId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id || `${idx}`;
                return (
                  <DriverOfferListItem
                    key={`${dId}-${idx}`}
                    offer={offer}
                    clientBudget={Number(negotiation?.clientOffer || 0)}
                    loading={selectingId === dId}
                    onSelect={handleSelectOffer}
                    onDecline={handleDeclineOffer}
                    onCounter={handleOpenCounterModal}
                  />
                );
              })}
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
          backgroundColor: "transparent",
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
               backgroundColor: "rgba(255, 255, 255, 0.03)",
               borderWidth: 1,
               borderColor: "rgba(255, 255, 255, 0.08)",
            }}
         >
            <Trash2 size={14} color="rgba(255,255,255,0.35)" style={{ marginRight: 8 }} />
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11.5, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" }}>
               Cancelar Solicitação
            </Text>
         </TouchableOpacity>
      </View>

    </GestureHandlerRootView>
  );
}
