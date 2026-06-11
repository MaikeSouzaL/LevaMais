import React, { useState, useCallback, useEffect } from "react";
import { View, Text, TouchableOpacity, StatusBar, ScrollView, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { ArrowLeft, Package, Clock, MapPin, DollarSign, ChevronRight, Inbox, Plus, Calendar, Trash2, Route } from "lucide-react-native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { Modal } from "@/components/Modal";

const STATUS_LABELS: Record<string, string> = {
  searching_driver: "Buscando entregadores",
  requesting: "Análise de entregadores",
  offers_received: "Propostas recebidas",
  payment_pending: "Aguardando pagamento",
  driver_assigned: "Entregador confirmado",
  accepted: "Entregador a caminho",
  driver_arriving: "Entregador chegando",
  arrived: "Entregador no local",
  in_progress: "Em andamento",
  scheduled: "Agendada",
  no_drivers_available: "Sem entregadores disponíveis",
  completed: "Entregue com sucesso",
  cancelled: "Cancelado",
  cancelled_by_client: "Cancelado por você",
  cancelled_by_driver: "Cancelado pelo entregador",
  cancelled_no_driver: "Sem entregadores disponíveis",
};

const STATUS_THEMES: Record<string, { color: string; bg: string }> = {
  requesting: { color: "#fbbf24", bg: "bg-amber-500/10" },
  searching_driver: { color: "#fbbf24", bg: "bg-amber-500/10" },
  offers_received: { color: "#38bdf8", bg: "bg-sky-500/10" },
  payment_pending: { color: "#f43f5e", bg: "bg-rose-500/10" },
  driver_assigned: { color: "#02de95", bg: "bg-[#02de95]/10" },
  accepted: { color: "#02de95", bg: "bg-[#02de95]/10" },
  driver_arriving: { color: "#02de95", bg: "bg-[#02de95]/10" },
  arrived: { color: "#02de95", bg: "bg-[#02de95]/10" },
  in_progress: { color: "#a855f7", bg: "bg-purple-500/10" },
  scheduled: { color: "#6366f1", bg: "bg-indigo-500/10" },
  no_drivers_available: { color: "#f43f5e", bg: "bg-rose-500/10" },
  completed: { color: "#02de95", bg: "bg-[#02de95]/10" },
  cancelled: { color: "#f43f5e", bg: "bg-[#f43f5e]/10" },
  cancelled_by_client: { color: "#ef4444", bg: "bg-red-500/10" },
  cancelled_by_driver: { color: "#ef4444", bg: "bg-red-500/10" },
  cancelled_no_driver: { color: "#f59e0b", bg: "bg-amber-500/10" },
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto",
  car: "Carro",
  van: "Van",
  truck: "Caminhão",
};

const OrderCountdown = ({ createdAt, searchTimeoutSeconds, onExpired }: { createdAt?: string; searchTimeoutSeconds?: number; onExpired?: () => void }) => {
  const [text, setText] = React.useState("");
  const expiredRef = React.useRef(false);

  React.useEffect(() => {
    if (!createdAt) return;
    expiredRef.current = false;
    
    const update = () => {
      const timeoutSecs = searchTimeoutSeconds || 300;
      const createdTime = new Date(createdAt).getTime();
      const expireTime = createdTime + timeoutSecs * 1000;
      const diffMs = expireTime - Date.now();
      
      if (diffMs <= 0) {
        setText("00:00");
        if (!expiredRef.current) {
          expiredRef.current = true;
          setTimeout(() => onExpired?.(), 2500);
        }
        return;
      }
      
      const totalSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setText(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [createdAt, searchTimeoutSeconds, onExpired]);

  if (!text) return null;

  const isUrgent = text !== "00:00" && (() => {
    const [m, s] = text.split(":").map(Number);
    return m * 60 + s <= 60;
  })();

  return (
    <Text style={{ color: isUrgent ? "#ef4444" : "#f59e0b", fontSize: 10, fontWeight: "900", marginLeft: 4 }}>
      ⏱️ {text}
    </Text>
  );
};

export default function ActiveOrdersScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [rides, setRides] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // States for Scheduled Ride Detail Modal
  const [selectedScheduledRide, setSelectedScheduledRide] = useState<any>(null);
  const [showScheduledModal, setShowScheduledModal] = useState(false);

  // States for Promoting/Rescheduling to Scheduled
  const [promotingRide, setPromotingRide] = useState<any>(null);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);
  const [selectedTime, setSelectedTime] = useState<string>("");

  // Segment Tab for Client Screen ("Em Andamento", "Negociações", "Agendados")
  const [activeTab, setActiveTab] = useState<"active" | "scheduled">("active");

  const loadRides = useCallback(async () => {
    try {
      const res = await rideService.getActiveList();
      const list = res?.rides || [];
      list.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRides(list);
    } catch {}
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      loadRides();
    }, [loadRides])
  );

  useEffect(() => {
    let mounted = true;
    const pollInterval = setInterval(() => {
      if (mounted) loadRides();
    }, 8000);
    return () => {
      mounted = false;
      clearInterval(pollInterval);
    };
  }, [loadRides]);

  const handleRidePress = (ride: any) => {
    const status = String(ride.status || "");
    if (status === "scheduled") {
      setSelectedScheduledRide(ride);
      setShowScheduledModal(true);
    } else if (["requesting", "searching_driver", "payment_pending", "offers_received", "no_drivers_available", "cancelled_no_driver"].includes(status)) {
      navigation.navigate("RideOffersMarketplace", { rideId: ride._id });
    } else if (status === "completed") {
      navigation.navigate("RideCompleted", {
        rideId: ride._id,
        total: ride?.pricing?.total,
        pickupAddress: ride?.pickup?.address,
        dropoffAddress: ride?.dropoff?.address,
        driverName: typeof ride?.driverId === "string" ? undefined : ride?.driverId?.name,
        driverId: typeof ride?.driverId === "string" ? ride?.driverId : ride?.driverId?._id,
        driverRating: typeof ride?.driverId === "object" ? ride?.driverId?.ratingStats : undefined,
        existingRating: ride?.rating?.clientRating?.stars ? {
          stars: ride.rating.clientRating.stars,
          comment: ride.rating.clientRating.comment,
        } : undefined,
        serviceType: ride?.serviceType,
      });
    } else if (["cancelled", "cancelled_by_client", "cancelled_by_driver"].includes(status)) {
      navigation.navigate("OrderDetails", { rideId: ride._id, order: ride });
    } else {
      // Roteia para a tela de tracking correta baseado no tipo de serviço
      const trackingScreen = ride?.serviceType === "delivery" ? "DeliveryTracking" : "RideTracking";
      navigation.navigate(trackingScreen, { rideId: ride._id });
    }
  };

  const confirmCancelRide = (rideId: string) => {
    Alert.alert(
      "Cancelar Entrega? ⚠️",
      "Tem certeza que deseja cancelar esta entrega? Esta ação não pode ser desfeita.",
      [
        { text: "Não, manter", style: "cancel" },
        { 
          text: "Sim, cancelar", 
          style: "destructive",
          onPress: () => handleCancelRide(rideId)
        }
      ]
    );
  };

  const handleCancelRide = async (rideId: string) => {
    try {
      setLoading(true);
      await rideService.cancel(rideId, "Cancelado pelo cliente.");
      Toast.show({
        type: "success",
        text1: "Pedido Cancelado! 🛑",
        text2: "A entrega foi cancelada com sucesso.",
        position: "top"
      });
      setShowScheduledModal(false);
      setSelectedScheduledRide(null);
      loadRides();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao cancelar",
        text2: e?.message || "Não foi possível cancelar o pedido no momento.",
        position: "top"
      });
      setLoading(false);
    }
  };

  const handlePromoteToScheduled = async () => {
    if (!promotingRide || !selectedTime) return;

    try {
      setLoading(true);
      const now = new Date();
      const targetDate = new Date();
      targetDate.setDate(now.getDate() + selectedDayOffset);
      
      const [hours, minutes] = selectedTime.split(":").map(Number);
      targetDate.setHours(hours, minutes, 0, 0);

      await rideService.promoteToScheduled(promotingRide._id, targetDate.toISOString());

      Toast.show({
        type: "success",
        text1: "Entrega Agendada! 📅",
        text2: `Promovida para agendada com sucesso para ${selectedTime}.`,
        position: "top"
      });

      setShowPromotionModal(false);
      setPromotingRide(null);
      setSelectedTime("");
      setSelectedDayOffset(0);
      
      // Muda a aba ativa para visualizar o agendamento
      setActiveTab("scheduled");
      loadRides();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível agendar",
        text2: e?.message || "Ocorreu um erro ao promover a entrega.",
        position: "top"
      });
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const formatScheduledDate = (scheduledString?: string) => {
    if (!scheduledString) return "";
    try {
      const d = new Date(scheduledString);
      const formatted = d.toLocaleDateString("pt-BR", { 
        weekday: "long",
        day: "2-digit", 
        month: "2-digit", 
        hour: "2-digit", 
        minute: "2-digit" 
      });
      return formatted.charAt(0).toUpperCase() + formatted.slice(1);
    } catch {
      return "";
    }
  };

  const getDayLabel = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    if (offset === 0) return `Hoje (${day}/${month})`;
    if (offset === 1) return `Amanhã (${day}/${month})`;
    const weekday = d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    return `${capitalized} (${day}/${month})`;
  };

  const generateAvailableTimes = (offset: number) => {
    const times = [];
    const startHour = 6;
    const endHour = 23;
    
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    for (let h = startHour; h <= endHour; h++) {
      for (let m = 0; m < 60; m += 30) {
        if (h === endHour && m > 0) continue;
        
        const timeString = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        
        if (offset === 0) {
          // Hoje: apenas horários com pelo menos 30 minutos de antecedência
          const timeMinutes = h * 60 + m;
          const currentMinutes = currentHour * 60 + currentMinute + 30;
          if (timeMinutes > currentMinutes) {
            times.push(timeString);
          }
        } else {
          times.push(timeString);
        }
      }
    }
    return times;
  };

  // Filter rides based on active tab
  const activeRides = rides.filter(
    (r) =>
      r.status !== "scheduled" &&
      !["completed", "cancelled", "cancelled_by_client", "cancelled_by_driver", "cancelled_no_driver", "no_drivers_available"].includes(String(r.status || ""))
  );
  const scheduledRides = rides.filter((r) => r.status === "scheduled");
  const currentList = activeTab === "active" ? activeRides : scheduledRides;

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header Premium */}
      <View
        className="border-b border-white/[0.04] bg-[#091A2F]"
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 24,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.navigate("Home")}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-xl bg-slate-800/70 border border-white/10 items-center justify-center mr-4"
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-white text-xl font-bold tracking-wide">Meus Pedidos</Text>
          <Text className="text-slate-400 text-[11px] font-medium mt-0.5">
            {activeRides.length === 0
              ? "Nenhum chamado ativo no momento"
              : `${activeRides.length} chamado${activeRides.length !== 1 ? "s ativos" : " ativo"}`}
          </Text>
        </View>
      </View>

      {/* Segmented Tabs (ATIVOS, NEGOCIAÇÕES, AGENDADOS) */}
      {!loading && (activeRides.length > 0 || scheduledRides.length > 0) && (
        <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 8, zIndex: 98 }}>
          <View
            style={{
              flexDirection: "row",
              backgroundColor: "rgba(11, 26, 42, 0.5)",
              borderRadius: 20,
              padding: 4,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.05)",
              width: "100%",
            }}
          >
            {([
              { id: "active", label: "Ativos", count: activeRides.length },
              { id: "scheduled", label: "Agendados", count: scheduledRides.length }
            ] as const).map((tab) => {
              const isActive = activeTab === tab.id;
              
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{
                    flex: 1,
                    height: 42,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 16,
                    position: "relative",
                    flexDirection: "row",
                    gap: 6,
                  }}
                  activeOpacity={0.85}
                >
                  {isActive && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: "#02de95",
                        borderRadius: 16,
                        shadowColor: "#02de95",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 6,
                        elevation: 4,
                        zIndex: -1
                      }}
                    />
                  )}
                  
                  <Text
                    style={{
                      color: isActive ? "#091A2F" : "rgba(255, 255, 255, 0.45)",
                      fontWeight: "900",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: 0.2
                    }}
                  >
                    {tab.label}
                  </Text>

                  {tab.count > 0 && (
                    <View 
                      style={{
                        backgroundColor: isActive ? "rgba(9, 26, 47, 0.15)" : "rgba(255, 255, 255, 0.08)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 99,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text 
                        style={{ 
                          color: isActive ? "#091A2F" : "rgba(255,255,255,0.5)", 
                          fontSize: 8.5, 
                          fontWeight: "900" 
                        }}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#02de95" size="large" />
          <Text className="text-slate-400 text-xs mt-3 font-semibold uppercase tracking-wider">Carregando pedidos...</Text>
        </View>
      ) : currentList.length === 0 ? (
        <MotiView 
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex-1 items-center justify-center px-8"
        >
          <View className="w-20 h-20 bg-[#11253E] border border-white/[0.05] rounded-full items-center justify-center mb-6 shadow-xl">
            <Inbox size={36} color="rgba(255,255,255,0.2)" />
          </View>
          <Text className="text-white text-lg font-black text-center">
            {activeTab === "active" ? "Nenhum pedido ativo" : "Nenhum agendamento"}
          </Text>
          <Text className="text-slate-400 text-xs text-center mt-2 max-w-[260px] leading-relaxed">
            {activeTab === "active" ? "Suas encomendas em andamento, aguardando pagamento ou em an??lise aparecer??o aqui." : "Seus pedidos agendados para hor??rios futuros aparecer??o aqui."}
          </Text>
          
          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.8}
            className="mt-8 bg-primary hover:bg-[#00b87c] px-6 py-3.5 rounded-xl flex-row items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus size={16} color="#091A2F" strokeWidth={3} />
            <Text className="text-[#091A2F] font-black text-xs uppercase tracking-widest">
              {activeTab === "active" ? "Solicitar Entrega" : "Agendar Entrega"}
            </Text>
          </TouchableOpacity>
        </MotiView>
      ) : (
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 60 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={() => { setRefreshing(true); loadRides(); }} 
              tintColor="#02de95" 
              colors={["#02de95"]}
            />
          }
        >
          {currentList.map((ride, idx) => {
            const theme = STATUS_THEMES[ride.status] || { color: "#94a3b8", bg: "bg-slate-500/10" };
            const statusLabel = STATUS_LABELS[ride.status] || ride.status;
            
            // Corrida elegível para ser promovida a agendada (não iniciada, sem motorista ativo)
            const canBePromoted = ["requesting", "searching_driver", "offers_received", "payment_pending", "no_drivers_available"].includes(ride.status);

            // Cores de fundo do card para a tab de Negociações
            const negotiationCardColors: Record<string, { bg: string; border: string }> = {
              completed: { bg: "#ffffff", border: "rgba(2, 222, 149, 0.3)" },
              cancelled: { bg: "#ffffff", border: "rgba(239, 68, 68, 0.3)" },
              cancelled_by_client: { bg: "#ffffff", border: "rgba(239, 68, 68, 0.3)" },
              cancelled_by_driver: { bg: "#ffffff", border: "rgba(239, 68, 68, 0.3)" },
              cancelled_no_driver: { bg: "#ffffff", border: "rgba(245, 158, 11, 0.3)" },
              no_drivers_available: { bg: "#ffffff", border: "rgba(251, 191, 36, 0.3)" },
            };
            const cardStyle = negotiationCardColors[ride.status] || { bg: "#ffffff", border: "rgba(9, 26, 47, 0.08)" };
            
            return (
              <MotiView
                key={ride._id || idx}
                from={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "timing", duration: 300, delay: idx * 50 }}
              >
                <TouchableOpacity
                  onPress={() => handleRidePress(ride)}
                  activeOpacity={0.85}
                  style={{
                    backgroundColor: cardStyle.bg,
                    borderRadius: 20,
                    padding: 14,
                    borderWidth: 1,
                    borderColor: cardStyle.border,
                    marginBottom: 14,
                    shadowColor: "#091A2F",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 8,
                    elevation: 2,
                    overflow: "hidden",
                  }}
                >
                  {/* Status Strip (Identical to Driver style) */}
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: theme.color }} />
                    <Text style={{ color: "#091A2F", fontSize: 9.5, fontWeight: "900", letterSpacing: 0.3, textTransform: "uppercase" }}>
                      {statusLabel}{["requesting", "searching_driver", "offers_received", "payment_pending"].includes(ride.status) ? ` (${ride.serviceType === "delivery" ? "Entrega" : "Corrida"})` : ""}
                    </Text>
                    {["requesting", "searching_driver", "payment_pending"].includes(ride.status) && (
                      <OrderCountdown createdAt={ride.createdAt} searchTimeoutSeconds={ride.searchTimeoutSeconds} onExpired={loadRides} />
                    )}
                  </View>

                  {/* Informações do Trajeto compactas (Identical to Driver style) */}
                  <View style={{ gap: 6, marginBottom: 10 }}>
                    {/* Partida */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#02de95" }} />
                      <Text style={{ color: "rgba(9, 26, 47, 0.5)", fontSize: 9.5, fontWeight: "800", width: 45 }}>COLETA</Text>
                      <Text style={{ color: "#091A2F", fontSize: 11.5, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                        {ride.pickup?.address || "Definido no mapa"}
                      </Text>
                    </View>
                    
                    {/* Destino */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#ef4444" }} />
                      <Text style={{ color: "rgba(9, 26, 47, 0.5)", fontSize: 9.5, fontWeight: "800", width: 45 }}>ENTREGA</Text>
                      <Text style={{ color: "#091A2F", fontSize: 11.5, fontWeight: "700", flex: 1 }} numberOfLines={1}>
                        {ride.dropoff?.address || "Definido no mapa"}
                      </Text>
                    </View>
                  </View>

                  {/* Tags e Preço em uma única linha horizontal elegante (Identical to Driver style) */}
                  <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 6, marginBottom: 12 }}>
                    {/* Tag Veículo */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(9, 26, 47, 0.04)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 10.5 }}>{ride.vehicleType === "motorcycle" ? "🛵" : "🚗"}</Text>
                      <Text style={{ color: "#091A2F", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase" }}>
                        {VEHICLE_LABELS[ride.vehicleType] || ride.vehicleType || "Geral"}
                      </Text>
                    </View>

                    {/* Tag Carga */}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(2, 222, 149, 0.08)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                      <Package size={10} color="#00b578" />
                      <Text style={{ color: "#00b578", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase" }}>
                        {ride.serviceType === "delivery" ? "Encomenda" : "Viagem"}
                      </Text>
                    </View>

                    {/* Tag Distância */}
                    {ride.distance?.text && (
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "rgba(59, 130, 246, 0.08)", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6 }}>
                        <Route size={10} color="#3b82f6" />
                        <Text style={{ color: "#3b82f6", fontSize: 9.5, fontWeight: "800" }}>
                          {ride.distance.text}
                        </Text>
                      </View>
                    )}

                    {/* Preço em Destaque no final (Identical to Driver style) */}
                    <View style={{ flex: 1 }} />
                    <View style={{ flexDirection: "row", alignItems: "baseline", backgroundColor: "rgba(245, 158, 11, 0.08)", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: "rgba(245, 158, 11, 0.2)" }}>
                      <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "800", marginRight: 2 }}>R$</Text>
                      <Text style={{ color: "#F59E0B", fontSize: 14.5, fontWeight: "900" }}>
                        {formatBRL(Number(ride.pricing?.total || ride.negotiation?.clientOffer || 0)).replace("R$", "").trim()}
                      </Text>
                    </View>
                  </View>

                  {/* ⚡ Botões de Ação no Rodapé (Idêntico esteticamente ao motorista: CANCELAR e AGENDAR) */}
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {/* Botão Cancelar */}
                    {["scheduled", "requesting", "searching_driver", "offers_received", "payment_pending", "driver_assigned", "accepted", "driver_arriving", "arrived", "no_drivers_available"].includes(ride.status) && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          confirmCancelRide(ride._id);
                        }}
                        style={{
                          flex: 1,
                          height: 38,
                          borderRadius: 10,
                          borderWidth: 1.5,
                          borderColor: "rgba(239, 68, 68, 0.3)",
                          backgroundColor: "rgba(239, 68, 68, 0.02)",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          gap: 4
                        }}
                        activeOpacity={0.7}
                      >
                        <Trash2 size={14} color="#ef4444" />
                        <Text style={{ color: "#ef4444", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>Cancelar</Text>
                      </TouchableOpacity>
                    )}

                    {/* Botão Promover para Agendar */}
                    {canBePromoted && (
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setPromotingRide(ride);
                          setShowPromotionModal(true);
                        }}
                        style={{
                          flex: 1.3,
                          height: 38,
                          borderRadius: 10,
                          backgroundColor: "#F59E0B",
                          alignItems: "center",
                          justifyContent: "center",
                          flexDirection: "row",
                          gap: 6
                        }}
                        activeOpacity={0.7}
                      >
                        <Calendar size={14} color="#091A2F" />
                        <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 11.5, textTransform: "uppercase" }}>Agendar</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          })}
        </ScrollView>
      )}

      {/* Premium Scheduled Ride Detail Modal */}
      <Modal
        visible={showScheduledModal}
        title="Detalhes do Agendamento"
        type="warning"
        confirmText="Voltar"
        onClose={() => {
          setShowScheduledModal(false);
          setSelectedScheduledRide(null);
        }}
      >
        {selectedScheduledRide && (
          <View style={{ width: "100%", marginTop: 12 }}>
            {/* Status Badge */}
            <View style={{ alignItems: "center", marginBottom: 16 }}>
              <View 
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "rgba(99, 102, 241, 0.1)",
                  borderWidth: 1,
                  borderColor: "rgba(99, 102, 241, 0.2)",
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 12,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "#6366f1", marginRight: 6 }} />
                <Text style={{ color: "#6366f1", fontSize: 10, fontWeight: "900", letterSpacing: 0.5, textTransform: "uppercase" }}>
                  Agendada
                </Text>
              </View>
            </View>

            {/* Scheduled Date/Time Box */}
            <View 
              style={{
                backgroundColor: "#0E1D31",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.04)",
                padding: 16,
                borderRadius: 16,
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Calendar size={20} color="#6366f1" style={{ marginBottom: 6 }} />
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                Horário Programado
              </Text>
              <Text style={{ color: "#ffffff", fontSize: 13.5, fontWeight: "900", marginTop: 4, textAlign: "center" }}>
                {formatScheduledDate(selectedScheduledRide.scheduledFor)}
              </Text>
            </View>

            {/* Route Box */}
            <View 
              style={{
                backgroundColor: "#0E1D31",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.04)",
                padding: 16,
                borderRadius: 16,
                marginBottom: 16,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                <View style={{ marginRight: 12, alignItems: "center", paddingTop: 4 }}>
                  <MapPin size={14} color="#02de95" />
                  <View style={{ width: 1, height: 20, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4 }} />
                  <MapPin size={14} color="#ef4444" />
                </View>
                <View style={{ flex: 1, gap: 10 }}>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 8.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      Coleta
                    </Text>
                    <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                      {selectedScheduledRide.pickup?.address}
                    </Text>
                  </View>
                  <View>
                    <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 8.5, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                      Entrega
                    </Text>
                    <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "600" }} numberOfLines={1}>
                      {selectedScheduledRide.dropoff?.address}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Details Box */}
            <View 
              style={{
                backgroundColor: "#0E1D31",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.04)",
                padding: 16,
                borderRadius: 16,
                gap: 10,
                marginBottom: 20,
              }}
            >
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Veículo
                </Text>
                <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900" }}>
                  {VEHICLE_LABELS[selectedScheduledRide.vehicleType] || selectedScheduledRide.vehicleType}
                </Text>
              </View>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)", paddingTop: 10 }}>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.3 }}>
                  Valor Oferecido
                </Text>
                <Text style={{ color: "#02de95", fontSize: 12, fontWeight: "900" }}>
                  {formatBRL(Number(selectedScheduledRide.pricing?.total || selectedScheduledRide.negotiation?.clientOffer || 0))}
                </Text>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              onPress={() => {
                confirmCancelRide(selectedScheduledRide._id);
              }}
              activeOpacity={0.8}
              style={{
                width: "100%",
                height: 48,
                backgroundColor: "rgba(239, 68, 68, 0.08)",
                borderWidth: 1,
                borderColor: "rgba(239, 68, 68, 0.2)",
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Trash2 size={14} color="#ef4444" />
              <Text style={{ color: "#ef4444", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.3 }}>
                Cancelar Entrega Agendada
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </Modal>

      {/* Premium Promote to Scheduled Modal */}
      <Modal
        visible={showPromotionModal}
        title="Promover para Agendada 📅"
        type="warning"
        confirmText="Confirmar Agendamento"
        onClose={() => {
          setShowPromotionModal(false);
          setPromotingRide(null);
          setSelectedTime("");
          setSelectedDayOffset(0);
        }}
        onConfirm={selectedTime ? handlePromoteToScheduled : undefined}
      >
        {promotingRide && (
          <View style={{ width: "100%", marginTop: 12 }}>
            <Text className="text-slate-400 text-xs text-center mb-6 leading-relaxed">
              Você está alterando este chamado ativo para um agendamento futuro. Ele ficará reservado na aba de agendados para os motoristas.
            </Text>

            {/* Day Selector Chips */}
            <Text className="text-white text-[10px] font-black uppercase tracking-widest mb-3">Selecione o Dia</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingBottom: 5 }}
              style={{ marginBottom: 20 }}
            >
              {[0, 1, 2, 3, 4, 5, 6].map((offset) => {
                const isSelected = selectedDayOffset === offset;
                const labelParts = getDayLabel(offset).split(" ");
                const titlePart = labelParts[0];
                const datePart = labelParts[1]?.replace(/[()]/g, "") || "";
                
                return (
                  <TouchableOpacity
                    key={offset}
                    onPress={() => {
                      setSelectedDayOffset(offset);
                      setSelectedTime("");
                    }}
                    activeOpacity={0.8}
                    style={{
                      width: 95,
                      height: 44,
                      borderRadius: 12,
                      backgroundColor: isSelected ? "#fbbf24" : "rgba(255,255,255,0.04)",
                      borderWidth: 1.5,
                      borderColor: isSelected ? "#fbbf24" : "rgba(255,255,255,0.06)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Text
                      style={{
                        color: isSelected ? "#091A2F" : "rgba(255,255,255,0.8)",
                        fontSize: 10,
                        fontWeight: "900",
                        textTransform: "uppercase",
                      }}
                    >
                      {titlePart}
                    </Text>
                    <Text
                      style={{
                        color: isSelected ? "rgba(9,26,47,0.6)" : "rgba(255,255,255,0.45)",
                        fontSize: 8.5,
                        fontWeight: "700",
                        marginTop: 1,
                      }}
                    >
                      {datePart}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Seeker Grid */}
            <Text className="text-white text-[10px] font-black uppercase tracking-widest mb-3">Selecione o Horário</Text>
            <ScrollView 
              style={{ maxHeight: 180 }}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
            >
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, paddingBottom: 10 }}>
                {generateAvailableTimes(selectedDayOffset).map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <TouchableOpacity
                      key={time}
                      onPress={() => setSelectedTime(time)}
                      activeOpacity={0.8}
                      style={{
                        width: "22%",
                        height: 36,
                        borderRadius: 10,
                        backgroundColor: isSelected ? "#02de95" : "rgba(255,255,255,0.03)",
                        borderWidth: 1,
                        borderColor: isSelected ? "#02de95" : "rgba(255,255,255,0.05)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: isSelected ? "#091A2F" : "#ffffff",
                          fontSize: 11,
                          fontWeight: "900",
                        }}
                      >
                        {time}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
                {generateAvailableTimes(selectedDayOffset).length === 0 && (
                  <View style={{ width: "100%", paddingVertical: 20, alignItems: "center" }}>
                    <Text className="text-red-400 text-xs font-semibold text-center">Nenhum horário disponível para hoje.</Text>
                    <Text className="text-slate-500 text-[10px] text-center mt-1">Selecione o dia de amanhã para programar.</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}


