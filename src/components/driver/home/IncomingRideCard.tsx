import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { BlurView } from "expo-blur";
import { MotiView, AnimatePresence } from "moti";
import { Easing } from "react-native-reanimated";
import {
  Check,
  MessageSquare,
  Sparkles,
  Route,
  Clock,
  Shield,
  Star,
  Package,
  AlertTriangle,
  Activity,
  ChevronRight,
  DollarSign,
  Zap,
  CreditCard,
  Wallet,
  Briefcase,
  Users,
  FileText,
  X,
} from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";
import webSocketService from "@/services/websocket.service";
import { useAuthStore } from "@/context/authStore";
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";

// Safe local stub for Haptics
const Haptics = {
  ImpactFeedbackStyle: { Light: 0, Medium: 1 },
  NotificationFeedbackType: { Success: 2 },
  impactAsync: async (style: any) => {},
  notificationAsync: async (type: any) => {},
};

interface IncomingRideCardProps {
  isVisible: boolean;
  request: any;
  countdown: number | null;
  onAccept: () => void;
  onReject: () => void;
  onCounterOffer: (amount: number, message: string) => Promise<void>;
}

// ========================================================
// INTERNAL HELPER MAPS FOR PAYMENT & SERVICES 💎
// ========================================================

function getPaymentInfo(method: string) {
  const key = String(method || "cash").toLowerCase();
  if (key.includes("pix")) {
    return { name: "PIX Instantâneo", icon: Zap, color: "#32BCAD" };
  }
  if (key.includes("card") || key.includes("credit") || key.includes("debit")) {
    return { name: "Cartão no App", icon: CreditCard, color: "#6366F1" };
  }
  if (key.includes("wallet")) {
    return { name: "Carteira Digital", icon: Wallet, color: "#F59E0B" };
  }
  return { name: "Dinheiro / Físico", icon: DollarSign, color: "#10B981" };
}

function getServiceModeName(mode: string, category?: string) {
  const m = String(mode || category || "delivery").toLowerCase();
  if (m === "ride" || m === "transport") return "Transporte Executivo";
  if (m === "frete" || m === "moving") return "Frete e Mudança";
  return "Entrega Expressa Premium";
}

// ========================================================
// 📡 LOCAL TACTICAL WAITING SUB-COMPONENTS FOR BOTTOM SHEET
// ========================================================

interface LiveNegotiationRadarProps {
  clientName: string;
}
function LiveNegotiationRadar({ clientName }: LiveNegotiationRadarProps) {
  return (
    <View className="w-40 h-40 items-center justify-center mb-5 relative">
      {/* Core pulse waves */}
      <MotiView
        from={{ scale: 0.6, opacity: 0.6 }}
        animate={{ scale: 1.5, opacity: 0 }}
        transition={{ loop: true, duration: 3000, type: "timing", easing: Easing.out(Easing.ease) }}
        className="absolute w-full h-full rounded-full bg-[#02de95]/5 border-2 border-[#02de95]/20"
      />
      <MotiView
        from={{ scale: 0.6, opacity: 0.5 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ loop: true, duration: 4000, delay: 1500, type: "timing", easing: Easing.out(Easing.ease) }}
        className="absolute w-full h-full rounded-full bg-[#02de95]/3 border border-[#02de95]/10"
      />
      
      {/* Tactical Radar Ring Grid */}
      <View className="absolute w-full h-full rounded-full border border-white/5 items-center justify-center">
        <View className="w-3/4 h-3/4 rounded-full border border-white/10 items-center justify-center">
          <View className="w-1/2 h-1/2 rounded-full border border-[#02de95]/20 items-center justify-center" />
        </View>
      </View>

      {/* Radar Sweeper Needle Animation */}
      <MotiView
        from={{ rotate: "0deg" }}
        animate={{ rotate: "360deg" }}
        transition={{ loop: true, duration: 6000, easing: Easing.linear, type: "timing" }}
        className="absolute w-full h-full items-center justify-start"
      >
        <View className="w-1 h-1/2 rounded-full opacity-60" style={{ backgroundColor: "#02de95" }} />
      </MotiView>

      {/* Animated Core Hub */}
      <View className="w-20 h-20 rounded-full bg-[#091A2F] border-2 border-[#02de95]/40 items-center justify-center shadow-2xl z-10">
        <MotiView
          from={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ loop: true, duration: 2000, type: "timing" }}
          className="absolute w-full h-full rounded-full bg-[#02de95]/10"
        />
        
        <View className="w-12 h-12 rounded-full bg-[#02de95]/20 items-center justify-center border border-[#02de95]/50">
          <Sparkles size={24} color="#02de95" fill="#02de95" className="opacity-90" />
        </View>
        
        <MotiView 
          from={{ opacity: 0.5 }} 
          animate={{ opacity: 1 }} 
          transition={{ loop: true, duration: 1000, type: "timing" }} 
          className="absolute bottom-1 right-1 w-4 h-4 bg-[#02de95] border-4 border-[#091A2F] rounded-full" 
        />
      </View>
    </View>
  );
}

interface RealtimeStatusBadgeProps {
  message: string;
}
function RealtimeStatusBadge({ message }: RealtimeStatusBadgeProps) {
  return (
    <MotiView
      key={message}
      from={{ opacity: 0, translateY: 10, scale: 0.9 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, translateY: -10, scale: 0.9 }}
      className="flex-row items-center bg-white/[0.03] border border-[#02de95]/20 px-4 py-2 rounded-full mb-3"
    >
      <ActivityIndicator size="small" color="#02de95" className="mr-2 scale-75" />
      <Text className="text-[#02de95] font-extrabold text-[10px] uppercase tracking-widest">{message}</Text>
    </MotiView>
  );
}

interface ProposalStatusCardProps {
  counterValue: number;
  baseValue: number;
  distanceKm: string;
  durationText: string;
  acceptanceChance: number;
}
function ProposalStatusCard({ counterValue, baseValue, distanceKm, durationText, acceptanceChance }: ProposalStatusCardProps) {
  const diff = counterValue - baseValue;
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="w-full bg-white/[0.02] border border-white/10 rounded-[28px] overflow-hidden mb-5"
    >
      <BlurView intensity={30} className="p-5">
        <View className="flex-row justify-between items-center mb-4 border-b border-white/5 pb-4">
          <View>
            <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest mb-0.5">PROPOSTA ENVIADA</Text>
            <Text className="text-white font-black text-3xl tracking-tighter">{formatBRL(counterValue)}</Text>
          </View>
          <View className="bg-[#02de95]/10 border border-[#02de95]/30 px-2.5 py-1 rounded-xl items-center">
            <Text className="text-[#02de95] font-black text-xs">+{formatBRL(diff)}</Text>
            <Text className="text-white/50 font-bold text-[7px] uppercase mt-0.5">vs Base</Text>
          </View>
        </View>

        <View className="flex-row justify-between gap-3 mb-4">
          <View className="flex-1 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl items-center justify-center">
            <Text className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-0.5">DISTÂNCIA</Text>
            <Text className="text-white font-black text-xs">{distanceKm}</Text>
          </View>

          <View className="flex-1 bg-white/[0.02] border border-white/5 p-2.5 rounded-xl items-center justify-center">
            <Text className="text-white/30 text-[7px] font-black uppercase tracking-widest mb-0.5">DURAÇÃO</Text>
            <Text className="text-white font-black text-xs">{durationText}</Text>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
}

export function IncomingRideCard({
  isVisible,
  request,
  onAccept,
  onReject,
  onCounterOffer,
}: IncomingRideCardProps) {
  const sheetRef = useRef<BottomSheet>(null);
  

  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  // Calculate absolute precise pixel dimensions for ultimate lock reliability 📏
  const snapPoints = useMemo(() => ["50%", "86%"], []);

  const offer = request;

  const baseValue = offer?.offeredValue || offer?.pricing?.total || 0;

  // Internal state for direct negotiation within bottom sheet 💰
  const [counterValue, setCounterValue] = useState(baseValue);
  const [message, setMessage] = useState("");
  const [loadingState, setLoadingState] = useState<"idle" | "sending" | "waiting">("idle");

  // 🚨 Premium Waiting Metrics State
  const [negotiationTimeLeft, setNegotiationTimeLeft] = useState(35);
  const [liveStatusMessage, setLiveStatusMessage] = useState("Transmitindo Proposta...");

  const diff = counterValue - baseValue;
  const iaAcceptanceChance = useMemo(() => {
    if (diff <= 0) return 100;
    if (diff <= 2) return 94;
    if (diff <= 5) return 81;
    if (diff <= 10) return 63;
    return 35;
  }, [diff]);

  // 📡 Auto-Snap Sheet Upwards when Negotiation is Active
  useEffect(() => {
    if (loadingState === "waiting") {
      sheetRef.current?.snapToIndex(1);
    }
  }, [loadingState]);

  // 🤖 Animated Status Message Cycler for Tactical Vibe
  useEffect(() => {
    if (loadingState !== "waiting") return;
    
    const messages = [
      "Cliente analisando proposta...",
      "Cliente online agora",
      "Analisando trânsito na rota...",
      "Chance de aceite favorável",
      "Cliente visualizando contraproposta...",
      "Aguardando decisão final..."
    ];
    let index = 0;
    setLiveStatusMessage(messages[0]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setLiveStatusMessage(messages[index]);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [loadingState]);

  // ⏱️ Custom Countdown Timer for Urgency
  useEffect(() => {
    if (loadingState !== "waiting") return;
    
    setNegotiationTimeLeft(35);
    
    const timer = setInterval(() => {
      setNegotiationTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [loadingState]);

  useEffect(() => {
    if (isVisible) {
      // Reset local state whenever visible changes
      setCounterValue(baseValue);
      setMessage("");
      setLoadingState("idle");

      // 🛡️ Safety frame-tick for Android layout engine to securely lock index 0 (55%) upon mount!
      setTimeout(() => {
        sheetRef.current?.snapToIndex(0);
      }, 150);
    }
  }, [isVisible, baseValue]);

  // Re-sync counterValue when offer base changes if it was at base
  useEffect(() => {
    if (baseValue > 0) {
      setCounterValue(baseValue);
    }
  }, [baseValue]);

  // =========================================================
  // 🔄 REAL-TIME ACTIVE SYNC LOOP FOR INCOMING RIDE CARD
  // =========================================================
  useEffect(() => {
    if (loadingState !== "waiting" || !offer?.rideId) return;

    let active = true;
    const driverId = useAuthStore.getState().userData?.id;

    const handleOfferRejected = () => {
      if (!active) return;
      active = false;
      setLoadingState("idle");
      Toast.show({
        type: "info",
        text1: "Oferta Recusada",
        text2: "O cliente recusou sua contraproposta."
      });
      onReject(); // Clears incoming state & closes sheet
    };

    const handleRideCancelled = () => {
      if (!active) return;
      active = false;
      setLoadingState("idle");
      Toast.show({
        type: "error",
        text1: "Corrida Cancelada",
        text2: "Esta solicitação foi cancelada pelo solicitante."
      });
      onReject(); // Clears incoming state & closes sheet
    };

    // 🛰️ WebSocket Realtime Interception
    const onRejectedSocket = (payload: any) => {
      if (payload?.rideId === offer.rideId) {
        handleOfferRejected();
      }
    };

    const onCancelledSocket = (payload: any) => {
      if (payload?.rideId === offer.rideId) {
        handleRideCancelled();
      }
    };

    webSocketService.on("ride-offer-rejected-by-client", onRejectedSocket);
    webSocketService.on("ride-cancelled", onCancelledSocket);

    // 🔁 High-Availability Rest Polling Backup (Every 3.5 seconds)
    const syncInterval = setInterval(async () => {
      try {
        const ride = await rideService.getById(offer.rideId);
        if (!active) return;

        const assignedDriver = typeof ride.driverId === "string" ? ride.driverId : ride.driverId?._id;
        const rideStatus = String(ride.status || "");

        // ❌ Assigned to someone else
        if (assignedDriver && driverId && assignedDriver !== driverId) {
           handleOfferRejected();
           return;
        }

        const myOffer = ride.negotiation?.offers?.find((o: any) => {
           const oDriverId = typeof o.driverId === "string" ? o.driverId : o.driverId?._id;
           return oDriverId && driverId && oDriverId === driverId;
        });

        if (myOffer && myOffer.status === "rejected") {
           handleOfferRejected();
           return;
        }

        // 🛑 Terminal Cancel Status
        if (["cancelled", "cancelled_by_client", "expired"].includes(rideStatus)) {
           handleRideCancelled();
           return;
        }
      } catch {}
    }, 3500);

    return () => {
      active = false;
      clearInterval(syncInterval);
      webSocketService.off("ride-offer-rejected-by-client", onRejectedSocket);
      webSocketService.off("ride-cancelled", onCancelledSocket);
    };
  }, [loadingState, offer?.rideId, onReject]);

  if (!isVisible || !request) return null;

  const hasProposedNewValue = counterValue > baseValue;
  const distanceKm = offer.distanceKm || offer.distance?.text || "-- km";
  const durationText = offer.estimatedDuration || offer.duration?.text || "-- min";
  const clientName = offer.client?.name || "Cliente Leva Mais";
  const clientRating = offer.client?.rating || "5.0";
  const clientRidesCount = offer.client?.ridesCount || 0;
  const cargoType = offer.cargoType || (offer.details?.itemType 
    ? { food: "Entrega de Delivery", doc: "Documentos", market: "Mercado", box: "Caixa/Pacote", material: "Materiais", furniture: "Móveis", moving: "Mudança", other: "Outros" }[offer.details.itemType as string] 
    : "Pequeno Porte");
  
  const helperRequired = offer.helperRequired || offer.details?.helperRequired || false;
  const obs = offer.observations || offer.details?.specialInstructions || "";

  const paymentMethodName = offer.paymentMethod || offer.payment?.method?.type || offer.payment?.method || "cash";
  const payInfo = getPaymentInfo(paymentMethodName);
  const PayIcon = payInfo.icon;
  
  const serviceMode = offer.serviceMode || offer.serviceType || "delivery";
  const serviceName = getServiceModeName(serviceMode, offer.type);

  // Distance Parse for calculations
  const distanceNum = parseFloat(String(distanceKm).replace(/,/g, ".").replace(/[^0-9.]/g, ""));
  const safeDist = isNaN(distanceNum) ? 1 : distanceNum;

  const isOfferTooHigh = counterValue >= baseValue * 1.7;

  // Simulated smart stats 🤖
  const acceptanceChance = (() => {
    const diff = counterValue - baseValue;
    if (diff <= 0) return 100;
    if (diff <= 2) return 94;
    if (diff <= 5) return 81;
    if (diff <= 10) return 63;
    return 35;
  })();

  // Quick suggestion
  const suggestionVal = baseValue + 3;

  const increase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCounterValue((prev: number) => prev + 1);
  };

  const decrease = () => {
    if (counterValue > baseValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setCounterValue((prev: number) => prev - 1);
    }
  };

  const handleMainAction = async () => {
    if (!hasProposedNewValue) {
      // Direct Acceptance
      onAccept();
    } else {
      // Propose new counter-offer
      try {
        setLoadingState("sending");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Visual delay for fintech feel
        setTimeout(async () => {
          try {
            setLoadingState("waiting");
            await onCounterOffer(counterValue, message);
          } catch (e) {
            setLoadingState("idle");
          }
        }, 1000);

      } catch (error) {
        setLoadingState("idle");
      }
    }
  };

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      enableOverDrag={false}
      style={{ zIndex: 9999, elevation: 9999 }}
      backgroundStyle={{ backgroundColor: "#0B1523", borderRadius: 40 }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.15)", width: 36 }}
      animateOnMount={true}
    >
      <View className="flex-1">
        {/* 🔴 CLOSE / REJECT FLOAT ACTION */}
        <TouchableOpacity 
          onPress={onReject}
          activeOpacity={0.7}
          className="absolute top-2 right-5 w-9 h-9 rounded-full bg-white/10 items-center justify-center z-50 border border-white/5"
        >
           <X size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        {/* ==========================================
            FINTECH LOADING STATE OVERLAY (Embedded)
           ========================================== */}
        {loadingState !== "idle" ? (
          loadingState === "sending" ? (
            <View className="flex-1 items-center justify-center px-8 pb-10">
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="items-center w-full"
              >
                <View className="w-24 h-24 rounded-full bg-[#02de95]/10 border border-[#02de95]/30 items-center justify-center mb-8 relative">
                  <MotiView
                    from={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.6, opacity: 0 }}
                    transition={{ loop: true, duration: 2000, type: "timing" }}
                    className="absolute inset-0 rounded-full bg-[#02de95]/10 border border-[#02de95]/40"
                  />
                  <MotiView
                    from={{ rotate: "0deg" }}
                    animate={{ rotate: "360deg" }}
                    transition={{ loop: true, duration: 4000, easing: Easing.linear, type: "timing" }}
                  >
                    <Sparkles size={38} color="#02de95" fill="#02de95" />
                  </MotiView>
                </View>

                <Text className="text-white font-black text-2xl tracking-tight text-center mb-2">
                  Transmitindo Proposta...
                </Text>

                <Text className="text-white/50 text-center text-sm leading-6 mb-8 max-w-[280px]">
                  Alinhando sua oferta com nossa central logística inteligente.
                </Text>

                <View className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex-row items-center justify-between">
                  <View>
                    <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">PROPOSTA ENVIADA</Text>
                    <Text className="text-white font-black text-2xl">{formatBRL(counterValue)}</Text>
                  </View>
                  <ActivityIndicator color="#02de95" size="small" />
                </View>
              </MotiView>
            </View>
          ) : (
            // ========================================================
            // 📡 HIGH END TACTICAL NEGOTIATION HUD (WAITING MODE)
            // ========================================================
            <View className="flex-1 items-center justify-between px-6 pb-8 pt-4">
              {/* Realtime Countdown Header */}
              <View className="w-full items-center">
                <MotiView
                  from={{ opacity: 0, translateY: -10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  className="flex-row items-center bg-black/40 border border-white/10 px-3 py-1.5 rounded-full mb-2"
                >
                  <View className="w-2 h-2 bg-[#02de95] rounded-full mr-2 animate-pulse" />
                  <Text className="text-white font-black text-[9px] tracking-widest uppercase">Radar Ativo</Text>
                </MotiView>
              </View>

              {/* Central Stage Hologram */}
              <View className="items-center justify-center w-full my-4">
                <LiveNegotiationRadar clientName="C" />
                
                <Text className="text-white font-black text-xl tracking-tight text-center mb-1.5">
                  Aguardando Resposta
                </Text>
                
                <AnimatePresence exitBeforeEnter>
                  <RealtimeStatusBadge message={liveStatusMessage} />
                </AnimatePresence>
                
                <Text className="text-white/40 text-center text-[11px] font-medium leading-4 max-w-[260px]">
                  Sua proposta está sob análise no dispositivo do cliente.
                </Text>
              </View>

              {/* Dynamic Stats Dashboard */}
              <View className="w-full">
                <ProposalStatusCard
                  counterValue={counterValue}
                  baseValue={baseValue}
                  distanceKm={offer?.distanceKm || offer?.distance?.text || "-- km"}
                  durationText={offer?.estimatedDuration || offer?.duration?.text || "-- min"}
                  acceptanceChance={iaAcceptanceChance}
                />
                
                <TouchableOpacity
                  onPress={() => {
                    setLoadingState("idle");
                    sheetRef.current?.snapToIndex(0);
                  }}
                  activeOpacity={0.7}
                  className="w-full py-3 bg-white/[0.03] border border-white/10 rounded-xl items-center"
                >
                  <Text className="text-white/60 font-bold text-xs uppercase tracking-widest">Ocultar Detalhes</Text>
                </TouchableOpacity>
              </View>
            </View>
          )
        ) : (
          /* ==========================================
              MAIN UNIFIED INTERFACE SCROLLVIEW
             ========================================== */
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            className="flex-1"
          >
            <BottomSheetScrollView
              contentContainerStyle={{ paddingHorizontal: 24}}
              showsVerticalScrollIndicator={false}
            >
              {/* 👤 CLIENT ACTIVITY BADGE */}
              <View className="self-start bg-white/[0.04] border border-white/10 px-3.5 py-1.5 rounded-full flex-row items-center mb-4 mt-1">
                <Package size={11} color="rgba(255,255,255,0.6)" className="mr-1.5" />
                <Text className="text-white/60 text-[10px] font-black uppercase tracking-wider">
                  {clientRidesCount} {clientRidesCount === 1 ? "ENTREGA REALIZADA" : "ENTREGAS REALIZADAS"}
                </Text>
              </View>

              {/* 👤 CLIENT SUMMARY PROFILE */}
              <View className="flex-row items-center justify-between pb-4 border-b border-white/5 mb-5">
                <View className="flex-row items-center">
                  <View className="w-12 h-12 bg-white/5 rounded-2xl items-center justify-center mr-3 border border-white/10">
                    <Text className="text-white font-black text-lg">{clientName.charAt(0).toUpperCase()}</Text>
                  </View>
                  <View>
                    <View className="flex-row items-center mb-0.5">
                      <Text className="text-white font-bold text-base mr-2">{clientName}</Text>
                      <View className="bg-[#02de95]/10 border border-[#02de95]/30 px-2 py-0.5 rounded-full flex-row items-center">
                        <Shield size={10} color="#02de95" className="mr-1" />
                        <Text className="text-[#02de95] text-[9px] font-black uppercase tracking-wider">Verificado</Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Star size={12} color="#fbbf24" fill="#fbbf24" className="mr-1" />
                      <Text className="text-[#fbbf24] font-bold text-xs">{clientRating}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 🤑 FINANCIAL & NEGOTIATION WIDGET */}
              <View className="mb-6 items-center">
                <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">
                  {hasProposedNewValue ? "Sua Proposta" : "Você Recebe"}
                </Text>
                <View className="flex-row items-baseline">
                  <Text className="text-white font-black text-5xl tracking-tight">
                    R$ {counterValue.toFixed(2).replace(".", ",")}
                  </Text>
                </View>
                {hasProposedNewValue && (
                  <Text className="text-[#02de95]/60 text-[10px] font-medium tracking-wide mt-1">
                    Valor Original: {formatBRL(baseValue)} (+{formatBRL(counterValue - baseValue)})
                  </Text>
                )}
              </View>

              {/* ⚙️ PROPOSAL INPUT (+/-) */}
              <View className="items-center mb-6">
                <View className="bg-white/[0.02] border-2 border-[#02de95]/20 rounded-[32px] p-1.5 w-full flex-row items-center justify-between">
                  <TouchableOpacity
                    onPress={decrease}
                    disabled={counterValue <= baseValue}
                    className={`w-14 h-14 rounded-[24px] items-center justify-center ${
                      counterValue <= baseValue ? "bg-white/5 opacity-30" : "bg-white/5 border border-white/10 active:bg-white/10"
                    }`}
                  >
                    <Text className="text-white font-black text-2xl">-</Text>
                  </TouchableOpacity>

                  <View className="flex-1 items-center justify-center">
                    <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-widest">Ajustar Valor</Text>
                  </View>

                  <TouchableOpacity
                    onPress={increase}
                    className="w-14 h-14 rounded-[24px] bg-[#02de95] items-center justify-center shadow-lg shadow-[#02de95]/20 active:opacity-80"
                  >
                    <Text className="text-[#091A2F] font-black text-2xl">+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* ⚡ QUICK INCREASE PILLS */}
              <View className="flex-row justify-between gap-2 mb-6">
                {[1, 2, 5, 10].map((val) => (
                  <TouchableOpacity
                    key={val}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCounterValue(baseValue + val);
                    }}
                    className="flex-1 py-3 bg-white/[0.03] border border-white/10 rounded-xl items-center active:scale-95"
                  >
                    <Text className="text-white font-black text-xs">+ R$ {val}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* AI SUGGESTION REMOVED */}

              {/* 💎 DYNAMIC LOGISTIC BADGES 💎 */}
              <View className="mb-6 flex-row gap-3">
                {/* Service Type Card */}
                <View className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex-1">
                  <View className="flex-row items-center mb-2">
                    <Briefcase size={14} color="#A78BFA" className="mr-1.5" />
                    <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Serviço</Text>
                  </View>
                  <Text className="text-white font-black text-sm leading-tight" numberOfLines={2}>{serviceName}</Text>
                </View>

                {/* Payment Method Card */}
                <View className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex-1">
                  <View className="flex-row items-center mb-2">
                    <PayIcon size={14} color={payInfo.color} className="mr-1.5" />
                    <Text className="text-white/40 text-[9px] font-black uppercase tracking-widest">Pagamento</Text>
                  </View>
                  <Text className="text-white font-black text-sm leading-tight" numberOfLines={1}>{payInfo.name}</Text>
                </View>
              </View>

              {/* 📍 TRAJETO VISUAL (ROUTE TIMELINE) */}
              <View className="bg-white/[0.02] rounded-3xl border border-white/5 p-4 mb-6">
                <View className="flex-row items-start">
                  <View className="items-center mr-3.5 pt-1">
                    <View className="w-2.5 h-2.5 rounded-full bg-[#02de95]" />
                    <View className="w-[1.5px] h-12 bg-white/10 my-1" />
                    <View className="w-2.5 h-2.5 rounded-full bg-[#EF4444]" />
                  </View>
                  <View className="flex-1">
                    <View className="mb-4">
                      <Text className="text-white/30 text-[9px] font-black uppercase mb-0.5">Coleta</Text>
                      <Text className="text-white/90 font-bold text-[13px]" numberOfLines={1}>{offer.pickup?.address || "Coleta"}</Text>
                    </View>
                    <View>
                      <Text className="text-white/30 text-[9px] font-black uppercase mb-0.5">Entrega</Text>
                      <Text className="text-white/90 font-bold text-[13px]" numberOfLines={1}>{offer.destination?.address || offer.dropoff?.address || "Entrega"}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* 📊 LOGISTICAL SUMMARY (DIST, TIME, CARGO) */}
              <View className="flex-row justify-between mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
                <View className="items-center flex-1">
                  <Route size={15} color="rgba(255,255,255,0.4)" className="mb-1.5" />
                  <Text className="text-white font-black text-[11px]">{distanceKm}</Text>
                  <Text className="text-white/25 text-[8px] font-bold uppercase tracking-wider">KM Total</Text>
                </View>
                <View className="w-[1px] bg-white/5" />
                <View className="items-center flex-1">
                  <Clock size={15} color="rgba(255,255,255,0.4)" className="mb-1.5" />
                  <Text className="text-white font-black text-[11px]">{durationText}</Text>
                  <Text className="text-white/25 text-[8px] font-bold uppercase tracking-wider">Tempo</Text>
                </View>
                <View className="w-[1px] bg-white/5" />
                <View className="items-center flex-1">
                  <Package size={15} color="rgba(255,255,255,0.4)" className="mb-1.5" />
                  <Text className="text-white font-black text-[11px] truncate px-1" numberOfLines={1}>{cargoType}</Text>
                  <Text className="text-white/25 text-[8px] font-bold uppercase tracking-wider">Carga</Text>
                </View>
              </View>

              {/* 👥 OBSERVAÇÃO DO CLIENTE (CONDITIONAL) */}
              {!!obs && (
                <View className="mb-6 w-full">
                  <View className="bg-white/[0.02] border border-white/5 rounded-xl p-3 flex-row items-center">
                    <FileText size={16} color="#02de95" className="mr-2" />
                    <View className="flex-1">
                      <Text className="text-white/30 text-[8px] font-black uppercase tracking-wider">Obs. Cliente</Text>
                      <Text className="text-white/60 text-xs font-extrabold">{obs}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* 📈 PROFIT CARD (DYNAMIC) */}
              <View className="flex-row gap-2.5 mb-6">
                <View className="flex-1 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <Text className="text-white/20 text-[8px] font-black uppercase mb-0.5">Ganho / KM</Text>
                  <Text className="text-white font-bold text-sm">
                    R$ {(counterValue / Math.max(1, safeDist)).toFixed(2).replace(".", ",")}/km
                  </Text>
                </View>
                <View className="flex-1 bg-white/[0.01] border border-white/5 rounded-xl p-3">
                  <Text className="text-white/20 text-[8px] font-black uppercase mb-0.5">Demanda Local</Text>
                  <View className="flex-row items-center">
                    <Activity size={12} color="#02de95" className="mr-1" />
                    <Text className="text-[#02de95] font-black text-[10px] uppercase">ALTA</Text>
                  </View>
                </View>
              </View>

              {/* 🚨 TOO HIGH ALERT */}
              <AnimatePresence>
                {isOfferTooHigh && (
                  <MotiView
                    from={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mb-6 overflow-hidden"
                  >
                    <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3.5 flex-row items-center">
                      <AlertTriangle size={16} color="#ef4444" className="mr-3" />
                      <View className="flex-1">
                        <Text className="text-red-400 font-extrabold text-xs mb-0.5">Proposta Muito Alta</Text>
                        <Text className="text-white/50 text-[10px] leading-4">
                          Valores acima de 70% do preço original reduzem drasticamente sua taxa de aceitação.
                        </Text>
                      </View>
                    </View>
                  </MotiView>
                )}
              </AnimatePresence>

              {/* 💬 MESSAGE TO CLIENT INPUT */}
              {hasProposedNewValue && (
                <View className="mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-3.5">
                  <View className="flex-row items-center mb-1.5">
                    <MessageSquare size={13} color="rgba(255,255,255,0.3)" className="mr-2" />
                    <Text className="text-white/30 text-[9px] font-black uppercase tracking-widest">Nota Opcional</Text>
                  </View>
                  <TextInput
                    placeholder="Ex: Alta demanda / Trânsito intenso"
                    placeholderTextColor="rgba(255,255,255,0.15)"
                    className="text-white font-medium text-xs p-0 py-0.5"
                    value={message}
                    onChangeText={setMessage}
                    maxLength={50}
                  />
                </View>
              )}

            </BottomSheetScrollView>

            {/* 🚀 FIXED PRIMARY ACTION FOOTER (Pinned statically outside ScrollView, exactly like Client!) */}
            <View className="px-6 pt-3 pb-6 border-t border-white/[0.05] bg-[#0B1523]">
              <TouchableOpacity
                onPress={handleMainAction}
                activeOpacity={0.9}
                className="w-full h-16 rounded-2xl items-center justify-center flex-row relative overflow-hidden shadow-2xl bg-[#02de95] shadow-[#02de95]/20"
              >
                {hasProposedNewValue && (
                  <MotiView
                    from={{ opacity: 0.4, scale: 0.9 }}
                    animate={{ opacity: 0.9, scale: 1.05 }}
                    transition={{ loop: true, duration: 1500, type: "timing" }}
                    className="absolute inset-0 bg-emerald-400/20 rounded-2xl"
                  />
                )}
                <Check size={20} color="#091A2F" className="mr-2 relative z-10" strokeWidth={3} />
                <Text className="text-[#091A2F] font-black text-base uppercase tracking-widest relative z-10">
                  {hasProposedNewValue
                    ? `Enviar Proposta de R$ ${counterValue.toFixed(2).replace(".", ",")}`
                    : `Aceitar por R$ ${baseValue.toFixed(2).replace(".", ",")}`}
                </Text>
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        )}
      </View>
    </BottomSheet>
  );
}
