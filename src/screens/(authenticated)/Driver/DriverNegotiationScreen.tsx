import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MotiView, AnimatePresence } from "moti";
import { Easing } from "react-native-reanimated";
import { BlurView } from "expo-blur";
import {
  ArrowLeft,
  DollarSign,
  Check,
  TrendingUp,
  Sparkles,
  Star,
  Route,
  Clock,
  Shield,
  Package,
  AlertTriangle,
  MessageSquare,
  Activity,
  ChevronRight,
} from "lucide-react-native";

const Haptics = {
  ImpactFeedbackStyle: { Light: 0, Medium: 1 },
  NotificationFeedbackType: { Success: 2 },
  impactAsync: async (style: any) => {},
  notificationAsync: async (type: any) => {},
};
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";
import { formatBRL } from "@/utils/mappers";
import webSocketService from "@/services/websocket.service";
import { useAuthStore } from "@/context/authStore";

const { width, height } = Dimensions.get("window");

// ==========================================
// SUB-COMPONENTS
// ==========================================

interface OfferHeaderProps {
  onBack: () => void;
}
function OfferHeader({ onBack }: OfferHeaderProps) {
  return (
    <View className="px-6 pt-4 pb-2 flex-row items-center border-b border-white/5">
      <TouchableOpacity
        onPress={onBack}
        activeOpacity={0.7}
        className="w-11 h-11 rounded-2xl bg-white/5 items-center justify-center border border-white/10 mr-4"
      >
        <ArrowLeft size={20} color="#FFF" />
      </TouchableOpacity>
      <View>
        <Text className="text-white font-black text-xl">Propor nova oferta</Text>
        <Text className="text-white/40 text-xs font-medium">Negocie um valor melhor para esta entrega</Text>
      </View>
    </View>
  );
}

interface TripSummaryCardProps {
  offer: any;
}
function TripSummaryCard({ offer }: TripSummaryCardProps) {
  if (!offer) return null;

  const clientName = offer.client?.name || "Cliente Leva Mais";
  const rating = offer.client?.rating || "5.0";
  const pickupAddress = offer.pickup?.address || "Endereço de Coleta";
  const destAddress = offer.destination?.address || offer.dropoff?.address || "Endereço de Entrega";
  
  const distanceText = offer.distanceKm || offer.distance?.text || "-- km";
  const durationText = offer.estimatedDuration || offer.duration?.text || "-- min";
  const cargoType = offer.cargoType || "Pequeno porte";

  return (
    <MotiView
      from={{ opacity: 0, translateY: 15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: 100 }}
      className="mx-6 my-4 bg-white/[0.03] border border-white/10 rounded-[32px] overflow-hidden"
    >
      <BlurView intensity={20} className="p-5">
        {/* Client Profile Header */}
        <View className="flex-row items-center justify-between pb-4 border-b border-white/5 mb-4">
          <View className="flex-row items-center">
            <View className="w-12 h-12 bg-white/10 rounded-2xl items-center justify-center mr-3 border border-white/10">
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
                <Text className="text-[#fbbf24] font-bold text-xs">{rating}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trajeto Visual Route */}
        <View className="space-y-3 gap-3">
          <View className="flex-row items-start">
            <View className="w-4 items-center mr-3 pt-1">
              <View className="w-2.5 h-2.5 rounded-full border-2 border-[#02de95] bg-[#091A2F]" />
              <View className="w-[1px] h-8 bg-dashed bg-white/10" />
            </View>
            <View className="flex-1">
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-wider mb-0.5">Coleta</Text>
              <Text className="text-white/80 text-sm font-medium leading-5" numberOfLines={1}>{pickupAddress}</Text>
            </View>
          </View>

          <View className="flex-row items-start mt-2">
            <View className="w-4 items-center mr-3 pt-1">
              <View className="w-2.5 h-2.5 rounded-full bg-[#ef4444]" />
            </View>
            <View className="flex-1">
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-wider mb-0.5">Entrega</Text>
              <Text className="text-white/80 text-sm font-medium leading-5" numberOfLines={1}>{destAddress}</Text>
            </View>
          </View>
        </View>

        {/* Quick stats pill row */}
        <View className="flex-row justify-between mt-6 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
          <View className="items-center flex-1">
            <Route size={14} color="rgba(255,255,255,0.4)" className="mb-1" />
            <Text className="text-white font-black text-xs">{distanceText}</Text>
          </View>
          <View className="w-[1px] bg-white/5" />
          <View className="items-center flex-1">
            <Clock size={14} color="rgba(255,255,255,0.4)" className="mb-1" />
            <Text className="text-white font-black text-xs">{durationText}</Text>
          </View>
          <View className="w-[1px] bg-white/5" />
          <View className="items-center flex-1">
            <Package size={14} color="rgba(255,255,255,0.4)" className="mb-1" />
            <Text className="text-white font-black text-[10px]" numberOfLines={1}>{cargoType}</Text>
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
}

interface CurrentOfferCardProps {
  value: number;
}
function CurrentOfferCard({ value }: CurrentOfferCardProps) {
  return (
    <View className="items-center mb-4 mt-2">
      <Text className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Oferta Atual</Text>
      <View className="flex-row items-baseline">
        <Text className="text-[#02de95] font-black text-3xl tracking-tight glow-text shadow-green-500/30 shadow-lg">
          {formatBRL(value)}
        </Text>
      </View>
    </View>
  );
}

interface OfferInputProps {
  value: number;
  onChange: (val: number) => void;
  baseValue: number;
}
function OfferInput({ value, onChange, baseValue }: OfferInputProps) {
  const displayVal = String(value);

  const increase = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onChange(value + 1);
  };

  const decrease = () => {
    if (value > baseValue) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onChange(value - 1);
    }
  };

  return (
    <View className="mx-6 items-center mb-6">
      <View className="bg-white/[0.02] border-2 border-[#02de95]/30 rounded-[36px] p-2 w-full flex-row items-center justify-between shadow-2xl shadow-[#02de95]/10">
        <TouchableOpacity
          onPress={decrease}
          disabled={value <= baseValue}
          className={`w-16 h-16 rounded-[28px] items-center justify-center ${
            value <= baseValue ? "bg-white/5 opacity-40" : "bg-white/5 active:bg-white/10 border border-white/10"
          }`}
        >
          <Text className="text-white font-black text-3xl">-</Text>
        </TouchableOpacity>

        <View className="flex-1 items-center justify-center py-2">
          <Text className="text-white font-black text-5xl tracking-tighter">
            R$ {value.toFixed(2).replace(".", ",")}
          </Text>
          <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-widest mt-1">Sua Proposta</Text>
        </View>

        <TouchableOpacity
          onPress={increase}
          className="w-16 h-16 rounded-[28px] bg-[#02de95] items-center justify-center shadow-xl shadow-[#02de95]/30 active:opacity-80"
        >
          <Text className="text-[#091A2F] font-black text-3xl">+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

interface QuickIncreaseButtonsProps {
  onSelect: (increment: number) => void;
}
function QuickIncreaseButtons({ onSelect }: QuickIncreaseButtonsProps) {
  const options = [1, 2, 5, 10];
  return (
    <View className="flex-row justify-between gap-3 mx-6 mb-6">
      {options.map((val) => (
        <TouchableOpacity
          key={val}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(val);
          }}
          className="flex-1 py-3.5 bg-white/[0.04] border border-white/10 rounded-2xl items-center active:scale-95 transition-transform"
        >
          <Text className="text-white font-black text-sm">+ R$ {val}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

interface SmartSuggestionCardProps {
  value: number;
  currentValue: number;
  onAutoApply: (val: number) => void;
}
function SmartSuggestionCard({ value, currentValue, onAutoApply }: SmartSuggestionCardProps) {
  const diff = value - currentValue;
  
  // Smart calc simulated percentages
  const acceptanceChance = useMemo(() => {
    if (diff <= 2) return 94;
    if (diff <= 5) return 82;
    if (diff <= 10) return 61;
    return 35;
  }, [diff]);

  const suggestionVal = currentValue + 3;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-6 mb-6 bg-[#02de95]/5 border border-[#02de95]/20 rounded-[28px] overflow-hidden"
    >
      <View className="p-5 flex-row">
        <View className="w-10 h-10 bg-[#02de95]/20 rounded-2xl items-center justify-center mr-4">
          <Sparkles size={20} color="#02de95" fill="#02de95" />
        </View>
        <View className="flex-1">
          <View className="flex-row justify-between items-center mb-1.5">
            <Text className="text-white font-extrabold text-sm">Sugestão Inteligente IA</Text>
            <View className="bg-[#02de95]/20 px-2 py-0.5 rounded-full">
              <Text className="text-[#02de95] font-black text-[10px]">{acceptanceChance}% Chance</Text>
            </View>
          </View>
          <Text className="text-white/60 text-xs font-medium leading-5">
            Com a proposta de <Text className="text-white font-bold">{formatBRL(value)}</Text>, suas chances de aceitação imediata são estimadas em <Text className="text-[#02de95] font-extrabold">{acceptanceChance}%</Text> na região atual.
          </Text>
          
          {value !== suggestionVal && (
            <TouchableOpacity
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                onAutoApply(suggestionVal);
              }}
              className="flex-row items-center mt-3"
            >
              <Text className="text-[#02de95] font-black text-[11px] uppercase tracking-widest">Aplicar R$ {suggestionVal.toFixed(2)} (+82% chance)</Text>
              <ChevronRight size={14} color="#02de95" strokeWidth={3} className="ml-1" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </MotiView>
  );
}

interface ProfitCardProps {
  value: number;
  distanceKm: number;
}
function ProfitCard({ value, distanceKm }: ProfitCardProps) {
  const finalKm = Math.max(1, distanceKm);
  const gainPerKm = value / finalKm;

  return (
    <View className="mx-6 mb-6 flex-row gap-3">
      <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <Text className="text-white/30 text-[9px] font-black uppercase tracking-wider mb-1">Ganho Bruto</Text>
        <Text className="text-white font-black text-lg">{formatBRL(value)}</Text>
      </View>
      
      <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <Text className="text-white/30 text-[9px] font-black uppercase tracking-wider mb-1">Lucro/Km</Text>
        <Text className="text-white font-black text-lg">{formatBRL(gainPerKm)}/km</Text>
      </View>

      <View className="flex-1 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
        <Text className="text-white/30 text-[9px] font-black uppercase tracking-wider mb-1">Demanda local</Text>
        <View className="flex-row items-center">
          <Activity size={14} color="#02de95" className="mr-1.5" />
          <Text className="text-[#02de95] font-extrabold text-sm uppercase">ALTA</Text>
        </View>
      </View>
    </View>
  );
}

// ========================================================
// 📡 TACTICAL WAITING SUB-COMPONENTS FOR DRIVER SIDE
// ========================================================

interface LiveNegotiationRadarProps {
  clientName: string;
}
function LiveNegotiationRadar({ clientName }: LiveNegotiationRadarProps) {
  return (
    <View className="w-56 h-56 items-center justify-center mb-6 relative">
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
      <View className="w-24 h-24 rounded-full bg-[#091A2F] border-2 border-[#02de95]/40 items-center justify-center shadow-2xl z-10">
        <MotiView
          from={{ scale: 1, opacity: 0.8 }}
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ loop: true, duration: 2000, type: "timing" }}
          className="absolute w-full h-full rounded-full bg-[#02de95]/10"
        />
        
        <View className="w-16 h-16 rounded-full bg-[#02de95]/20 items-center justify-center border border-[#02de95]/50">
          <Sparkles size={30} color="#02de95" fill="#02de95" className="opacity-90" />
        </View>
        
        <MotiView 
          from={{ opacity: 0.5 }} 
          animate={{ opacity: 1 }} 
          transition={{ loop: true, duration: 1000, type: "timing" }} 
          className="absolute bottom-1 right-1 w-5 h-5 bg-[#02de95] border-4 border-[#091A2F] rounded-full" 
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
      className="flex-row items-center bg-white/[0.03] border border-[#02de95]/20 px-4 py-2.5 rounded-full mb-4"
    >
      <ActivityIndicator size="small" color="#02de95" className="mr-2.5" />
      <Text className="text-[#02de95] font-extrabold text-xs uppercase tracking-widest">{message}</Text>
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
  const profitPerKm = useMemo(() => {
    const distNum = parseFloat(distanceKm.replace(/[^0-9.]/g, ""));
    const safeDist = isNaN(distNum) || distNum === 0 ? 1 : distNum;
    return counterValue / safeDist;
  }, [counterValue, distanceKm]);

  const diff = counterValue - baseValue;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 20 }}
      className="w-full bg-white/[0.02] border border-white/10 rounded-[36px] overflow-hidden mb-6"
    >
      <BlurView intensity={30} className="p-6">
        <View className="flex-row justify-between items-center mb-5 border-b border-white/5 pb-5">
          <View>
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">PROPOSTA ENVIADA</Text>
            <Text className="text-white font-black text-4xl tracking-tighter">{formatBRL(counterValue)}</Text>
          </View>
          <View className="bg-[#02de95]/10 border border-[#02de95]/30 px-3 py-1.5 rounded-2xl items-center">
            <Text className="text-[#02de95] font-black text-xs">+{formatBRL(diff)}</Text>
            <Text className="text-white/50 font-bold text-[8px] uppercase mt-0.5">vs Base</Text>
          </View>
        </View>

        <View className="flex-row justify-between gap-3 mb-5">
          <View className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl items-center justify-center">
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">LUCRO / KM</Text>
            <Text className="text-white font-black text-sm">{formatBRL(profitPerKm)}</Text>
          </View>
          
          <View className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl items-center justify-center">
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">DISTÂNCIA</Text>
            <Text className="text-white font-black text-sm">{distanceKm}</Text>
          </View>

          <View className="flex-1 bg-white/[0.02] border border-white/5 p-3 rounded-2xl items-center justify-center">
            <Text className="text-white/30 text-[8px] font-black uppercase tracking-widest mb-1">DURAÇÃO</Text>
            <Text className="text-white font-black text-sm">{durationText}</Text>
          </View>
        </View>

        <View>
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Sparkles size={10} color="#02de95" fill="#02de95" className="mr-1.5" />
              <Text className="text-white/60 font-extrabold text-[10px] uppercase tracking-wider">CHANCE DE ACEITE POR IA</Text>
            </View>
            <Text className="text-[#02de95] font-black text-xs">{acceptanceChance}%</Text>
          </View>
          
          <View className="w-full h-2.5 bg-white/[0.05] border border-white/10 rounded-full overflow-hidden relative">
             <MotiView
                from={{ width: "0%" }}
                animate={{ width: `${acceptanceChance}%` }}
                transition={{ duration: 1000, type: "timing" }}
                className="h-full bg-[#02de95] rounded-full"
             />
          </View>
        </View>
      </BlurView>
    </MotiView>
  );
}

import { GlobalMap } from "@/components/GlobalMap";

interface TacticalBackgroundProps {
  pickup: { latitude: number; longitude: number };
}
function TacticalBackground({ pickup }: TacticalBackgroundProps) {
  return (
    <View className="absolute inset-0 z-0 overflow-hidden">
      <GlobalMap
        provider="google"
        useDarkStyle={true}
        initialRegion={{
          latitude: pickup?.latitude || -23.5505,
          longitude: pickup?.longitude || -46.6333,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        style={{ width: width, height: height, opacity: 0.4 }}
        scrollEnabled={false}
        zoomEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
      />
      <BlurView intensity={85} tint="dark" className="absolute inset-0" />
      <View className="absolute inset-0 bg-[#091A2F]/70" />
    </View>
  );
}

// ==========================================
// MAIN SCREEN COMPONENT
// ==========================================

export default function DriverNegotiationScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { offer } = route.params || {};

  const baseValue = offer?.offeredValue || offer?.pricing?.total || 0;

  const [counterValue, setCounterValue] = useState(baseValue + 2); // Default boost
  const [message, setMessage] = useState("");
  const [loadingState, setLoadingState] = useState<"idle" | "sending" | "waiting" | "accepted" | "rejected" | "client_countered">("idle");
  const [clientCounterVal, setClientCounterVal] = useState<number>(0);

  // 🚨 Premium Real-time Wait Screen State
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

  // Safe numeric parse for Dynamic stats 📊
  const distanceKm = useMemo(() => {
    const rawText = offer?.distanceKm || offer?.distance?.text || "1";
    const parsed = parseFloat(rawText.replace(/,/g, ".").replace(/[^0-9.]/g, ""));
    return isNaN(parsed) ? 1 : parsed;
  }, [offer]);

  const isOfferTooHigh = useMemo(() => {
    return counterValue >= baseValue * 1.8;
  }, [counterValue, baseValue]);

  // =========================================================
  // 🔄 REAL-TIME ACTIVE SYNC LOOP: WAITING CLIENT APPROVAL
  // =========================================================
  useEffect(() => {
    if (loadingState !== "waiting" || !offer?._id) return;

    let active = true;
    const driverId = useAuthStore.getState().userData?.id;

    const navigateToActiveRide = (rideId: string) => {
      if (!active) return;
      active = false;
      Toast.show({
        type: "success",
        text1: "Proposta Aceita! 🎉",
        text2: "Prepare-se para realizar a coleta."
      });
      navigation.reset({
        index: 0,
        routes: [{ name: "DriverRide", params: { rideId } }],
      });
    };

    const handleOfferRejected = () => {
      if (!active) return;
      active = false;
      setLoadingState("idle");
      Toast.show({
        type: "info",
        text1: "Oferta Recusada",
        text2: "O cliente recusou sua contraproposta."
      });
      navigation.popToTop();
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
      navigation.popToTop();
    };

    // 🛰️ Socket Event Listeners
    const onNewRideReqSocket = (payload: any) => {
      if (payload?.rideId === offer._id) {
        navigateToActiveRide(offer._id);
      }
    };

    const onRejectedSocket = (payload: any) => {
      if (payload?.rideId === offer._id) {
        handleOfferRejected();
      }
    };

    const onCancelledSocket = (payload: any) => {
      if (payload?.rideId === offer._id) {
        handleRideCancelled();
      }
    };

    webSocketService.on("new-ride-request", onNewRideReqSocket);
    webSocketService.on("ride-offer-rejected-by-client", onRejectedSocket);
    webSocketService.on("ride-cancelled", onCancelledSocket);

    // 🔁 High-Availability Rest Polling (Every 3.5 seconds)
    const syncStatusRest = async () => {
      try {
        const ride = await rideService.getById(offer._id);
        if (!active) return;

        const assignedDriver = typeof ride.driverId === "string" ? ride.driverId : ride.driverId?._id;
        const rideStatus = String(ride.status || "");

        // 🎯 Client accepted this specific driver
        if (assignedDriver && driverId && assignedDriver === driverId) {
           if (rideStatus === "payment_pending") {
              setLoadingState("waiting");
              setLiveStatusMessage("Cliente confirmando pagamento...");
              return;
           }
           if (["accepted", "driver_assigned", "driver_arriving", "arrived", "in_progress"].includes(rideStatus)) {
              navigateToActiveRide(ride._id);
              return;
           }
        }

        // ❌ Assigned to someone else OR explicitly rejected
        if (assignedDriver && assignedDriver !== driverId) {
           handleOfferRejected();
           return;
        }

        const myOffer = ride.negotiation?.offers?.find((o: any) => {
           const oDriverId = typeof o.driverId === "string" ? o.driverId : o.driverId?._id;
           return oDriverId && driverId && oDriverId === driverId;
        });

        if (myOffer && myOffer.status === "client_countered") {
           setClientCounterVal(Number(myOffer.amount || 0));
           setLoadingState("client_countered");
        }

        if (myOffer && myOffer.status === "rejected") {
           handleOfferRejected();
           return;
        }

        // 🛑 Ride got terminal cancelled
        if (["cancelled", "cancelled_by_client", "expired"].includes(rideStatus)) {
           handleRideCancelled();
           return;
        }
      } catch {}
    };

    const syncInterval = setInterval(syncStatusRest, 3500);
    syncStatusRest();

    return () => {
      active = false;
      clearInterval(syncInterval);
      webSocketService.off("new-ride-request", onNewRideReqSocket);
      webSocketService.off("ride-offer-rejected-by-client", onRejectedSocket);
      webSocketService.off("ride-cancelled", onCancelledSocket);
    };
  }, [loadingState, offer?._id]);

  const handleSend = async () => {
    if (!offer?._id) return;
    
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLoadingState("sending");

      setTimeout(async () => {
        try {
          await rideService.respondToOffer(offer._id, {
            action: "counter",
            amount: counterValue,
            message: message || "Negociação justa",
          });

          // Transit to persistent waiting state. Sync engine does the rest!
          setLoadingState("waiting");
          
          Toast.show({ 
            type: "success", 
            text1: "Proposta Enviada! 🚀", 
            text2: `Sua oferta de ${formatBRL(counterValue)} foi enviada ao cliente.` 
          });

        } catch (e: any) {
           setLoadingState("idle");
           Toast.show({ type: "error", text1: "Falha ao propor", text2: e?.message || "Tente novamente." });
        }
      }, 1200);

    } catch (error: any) {
      setLoadingState("idle");
      Toast.show({ type: "error", text1: "Erro", text2: error?.message });
    }
  };

  if (loadingState === "client_countered") {
    return (
      <View className="flex-1 bg-[#091A2F] items-center justify-center px-6">
        <StatusBar barStyle="light-content" />
        
        <MotiView
          from={{ scale: 0.8, opacity: 0, translateY: 20 }}
          animate={{ scale: 1, opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 15 }}
          className="w-full bg-white/[0.03] border border-white/10 rounded-[36px] p-6 items-center"
        >
          <View className="w-20 h-20 rounded-full bg-[#02de95]/10 border border-[#02de95]/30 items-center justify-center mb-6 relative">
             <MotiView
              from={{ scale: 1, opacity: 0.5 }}
              animate={{ scale: 1.4, opacity: 0 }}
              transition={{ loop: true, duration: 2000, type: "timing" }}
              className="absolute inset-0 rounded-full bg-[#02de95]/10"
            />
            <DollarSign size={32} color="#02de95" />
          </View>

          <Text className="text-white font-black text-2xl text-center mb-2">
            Contraproposta do Cliente! ⚡
          </Text>
          
          <Text className="text-white/50 text-center text-sm leading-5 mb-6">
            O cliente analisou sua oferta e enviou uma proposta especial para fechar a corrida agora:
          </Text>

          <View className="w-full bg-white/[0.03] border border-white/5 rounded-3xl p-6 items-center justify-center mb-8 shadow-2xl">
             <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">NOVA OFERTA DO CLIENTE</Text>
             <Text className="text-[#02de95] font-black text-5xl tracking-tighter">
               {formatBRL(clientCounterVal)}
             </Text>
          </View>

          <View className="w-full space-y-3 gap-3">
             <TouchableOpacity
                onPress={async () => {
                  try {
                    setLoadingState("sending");
                    await rideService.respondToOffer(offer._id, {
                      action: "accept"
                    });
                    setLoadingState("waiting");
                    setLiveStatusMessage("Cliente confirmando pagamento...");
                    Toast.show({
                      type: "info",
                      text1: "Aguardando pagamento do cliente",
                      text2: "Voce foi selecionado. Aguarde a confirmacao para iniciar.",
                    });
                  } catch (e: any) {
                    setLoadingState("client_countered");
                    Toast.show({ type: "error", text1: "Erro ao aceitar", text2: e?.message });
                  }
                }}
                activeOpacity={0.9}
                className="w-full h-16 bg-[#02de95] rounded-2xl items-center justify-center flex-row shadow-lg shadow-[#02de95]/20"
             >
                <Check size={20} color="#091A2F" className="mr-2" strokeWidth={3} />
                <Text className="text-[#091A2F] font-black text-base uppercase tracking-wider">Aceitar e Iniciar Corrida</Text>
             </TouchableOpacity>

             <TouchableOpacity
                onPress={async () => {
                  try {
                    setLoadingState("sending");
                    await rideService.respondToOffer(offer._id, {
                      action: "reject"
                    });
                    Toast.show({ type: "info", text1: "Oferta recusada", text2: "Você rejeitou a contraproposta do cliente." });
                    navigation.popToTop();
                  } catch (e: any) {
                    setLoadingState("client_countered");
                    Toast.show({ type: "error", text1: "Erro ao recusar", text2: e?.message });
                  }
                }}
                activeOpacity={0.7}
                className="w-full h-14 bg-transparent border border-white/10 rounded-2xl items-center justify-center"
             >
                <Text className="text-red-400 font-bold text-base">Recusar e Voltar</Text>
             </TouchableOpacity>
          </View>
        </MotiView>
      </View>
    );
  }

  if (loadingState !== "idle") {
    if (loadingState === "sending") {
      return (
        <View className="flex-1 bg-[#091A2F] items-center justify-center px-8">
          <StatusBar barStyle="light-content" />
          
          <MotiView
            from={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring" }}
            className="items-center"
          >
            {/* Immersive animated ring */}
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
                  <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-0.5">VALOR ENVIADO</Text>
                  <Text className="text-white font-black text-xl">{formatBRL(counterValue)}</Text>
               </View>
               <ActivityIndicator color="#02de95" size="small" />
            </View>
          </MotiView>
        </View>
      );
    }

    // ========================================================
    // 📱 EXTREME PREMIUM TACTICAL WAITING SCREEN!
    // ========================================================
    return (
      <View className="flex-1 bg-[#091A2F] relative">
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
        <TacticalBackground pickup={offer?.pickup} />
        
        <SafeAreaView className="flex-1 items-center justify-between px-6 py-8 z-10" edges={["top", "bottom"]}>
          
          {/* Realtime Header Indicator */}
          <View className="w-full items-center mt-4">
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              className="flex-row items-center bg-black/40 border border-white/10 px-4 py-2 rounded-2xl mb-2"
            >
              <View className="w-2 h-2 bg-[#02de95] rounded-full mr-2" />
              <Text className="text-white font-black text-[10px] tracking-widest uppercase">Radar de Negociação Ativo</Text>
            </MotiView>
            <Text className="text-white/50 font-extrabold text-xs">
              Expira em: <Text className="text-[#ef4444] font-black text-base">{negotiationTimeLeft}s</Text>
            </Text>
          </View>

          {/* Central Tactical Hub */}
          <View className="flex-1 items-center justify-center w-full">
            <LiveNegotiationRadar clientName={offer?.client?.name || "C"} />
            
            <Text className="text-white font-black text-2xl tracking-tight text-center mb-2">
              Aguardando o Cliente
            </Text>
            
            <AnimatePresence exitBeforeEnter>
              <RealtimeStatusBadge message={liveStatusMessage} />
            </AnimatePresence>
            
            <Text className="text-white/40 text-center text-xs font-medium leading-5 max-w-[280px] mb-6">
              Sua contraproposta foi enviada e está sendo analisada no app do cliente.
            </Text>
          </View>

          {/* Bottom Operational Deck */}
          <View className="w-full items-center">
            <ProposalStatusCard
              counterValue={counterValue}
              baseValue={baseValue}
              distanceKm={offer?.distanceKm || offer?.distance?.text || "-- km"}
              durationText={offer?.estimatedDuration || offer?.duration?.text || "-- min"}
              acceptanceChance={iaAcceptanceChance}
            />
            
            <TouchableOpacity
              onPress={() => navigation.popToTop()}
              activeOpacity={0.7}
              className="px-8 py-4 bg-white/[0.03] border border-white/10 rounded-2xl w-full items-center"
            >
              <Text className="text-white/60 font-black text-xs uppercase tracking-wider">Voltar ao Painel</Text>
            </TouchableOpacity>
          </View>

        </SafeAreaView>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]" edges={["top"]}>
      <StatusBar barStyle="light-content" backgroundColor="#091A2F" />

      <OfferHeader onBack={() => navigation.goBack()} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <TripSummaryCard offer={offer} />

          <CurrentOfferCard value={baseValue} />

          <OfferInput
            value={counterValue}
            onChange={setCounterValue}
            baseValue={baseValue}
          />

          <QuickIncreaseButtons onSelect={(inc) => setCounterValue(baseValue + inc)} />

          <SmartSuggestionCard
            value={counterValue}
            currentValue={baseValue}
            onAutoApply={setCounterValue}
          />

          <ProfitCard value={counterValue} distanceKm={distanceKm} />

          {/* Alert Visual for extremely high pricing thresholds */}
          <AnimatePresence>
            {isOfferTooHigh && (
              <MotiView
                from={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mx-6 mb-6 overflow-hidden"
              >
                <View className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex-row items-center">
                  <AlertTriangle size={18} color="#ef4444" className="mr-3" />
                  <View className="flex-1">
                    <Text className="text-red-400 font-extrabold text-xs mb-0.5">Cuidado com a taxa de recusa</Text>
                    <Text className="text-white/60 text-[10px] leading-4">
                      Valores muito altos reduzem drasticamente suas chances de aceitação imediata pelo cliente.
                    </Text>
                  </View>
                </View>
              </MotiView>
            )}
          </AnimatePresence>

          {/* Optional Custom Note Textbox */}
          <View className="mx-6 mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
            <View className="flex-row items-center mb-2">
              <MessageSquare size={14} color="rgba(255,255,255,0.4)" className="mr-2" />
              <Text className="text-white/30 text-[10px] font-black uppercase tracking-widest">Observação para o cliente</Text>
            </View>
            <TextInput
              placeholder="Ex: Trânsito lento / Alta demanda"
              placeholderTextColor="rgba(255,255,255,0.15)"
              className="text-white font-medium text-sm p-0 py-1"
              value={message}
              onChangeText={setMessage}
              maxLength={60}
            />
          </View>

          {/* ACTION FOOTER */}
          <View className="mx-6 space-y-4 gap-4">
            <TouchableOpacity
              onPress={handleSend}
              activeOpacity={0.9}
              className="w-full h-16 bg-[#02de95] rounded-2xl items-center justify-center shadow-2xl shadow-[#02de95]/30 flex-row relative overflow-hidden"
            >
              <MotiView
                from={{ opacity: 0.5, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1.05 }}
                transition={{ loop: true, duration: 1500, type: "timing" }}
                className="absolute inset-0 bg-emerald-400/20 rounded-2xl"
              />
              <Check size={22} color="#091A2F" className="mr-2 relative z-10" strokeWidth={3} />
              <Text className="text-[#091A2F] font-black text-lg uppercase tracking-widest relative z-10">
                Enviar Proposta
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              className="w-full h-14 bg-transparent border border-white/10 rounded-2xl items-center justify-center"
            >
              <Text className="text-white/60 font-black text-base">Cancelar</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
