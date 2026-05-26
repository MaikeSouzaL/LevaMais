import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, TouchableOpacity, StatusBar } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  ArrowLeft,
  MapPin,
  User,
  Package,
  Car,
  Banknote,
  Clock,
  RotateCcw,
  Home,
  CheckCircle,
  XCircle,
  AlertCircle,
  Route,
  CalendarClock,
  Hash,
  DollarSign,
} from "lucide-react-native";

import rideService, { Ride } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { ClientStackParamList } from "../../types/navigation";

function formatDateTime(value?: string): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function formatDistance(distance?: Ride["distance"]): string {
  if (!distance) return "-";
  return distance.text || `${((distance.value || 0) / 1000).toFixed(1)} km`;
}

function formatDuration(duration?: Ride["duration"]): string {
  if (!duration) return "-";
  return duration.text || `${Math.ceil((duration.value || 0) / 60)} min`;
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  completed:           { label: "Concluída",          color: "#02de95", icon: CheckCircle },
  cancelled:           { label: "Cancelada",          color: "#ef4444", icon: XCircle },
  cancelled_by_client: { label: "Cancelada por você", color: "#ef4444", icon: XCircle },
  cancelled_by_driver: { label: "Cancelada",          color: "#f97316", icon: XCircle },
  cancelled_no_driver: { label: "Sem motorista",      color: "#f97316", icon: AlertCircle },
  expired:             { label: "Expirada",           color: "#f97316", icon: AlertCircle },
  requesting:          { label: "Buscando",           color: "#fbbf24", icon: Clock },
  in_progress:         { label: "Em andamento",       color: "#a78bfa", icon: Clock },
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto", car: "Carro", van: "Van", truck: "Caminhão",
};

const SERVICE_LABELS: Record<string, string> = {
  delivery: "Entrega", frete: "Frete", ride: "Corrida",
};

function SectionCard({ title, icon: Icon, iconColor, children }: { title: string; icon: any; iconColor: string; children: React.ReactNode }) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={{
        backgroundColor: "#11253E", borderRadius: 20, borderWidth: 1,
        borderColor: "rgba(255,255,255,0.06)", marginBottom: 14, overflow: "hidden",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconColor + "18", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={iconColor} />
        </View>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2 }}>{title}</Text>
      </View>
      <View style={{ padding: 16, paddingTop: 14, gap: 10 }}>{children}</View>
    </MotiView>
  );
}

function InfoRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, flex: 1 }}>{label}</Text>
      <Text style={{
        color: highlight ? "#02de95" : "#fff",
        fontSize: highlight ? 15 : 13,
        fontWeight: highlight ? "900" : "600",
        textAlign: "right", flex: 1,
        fontVariant: mono ? ["tabular-nums"] : undefined,
      }}>
        {value}
      </Text>
    </View>
  );
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "OrderDetails">>();
  const route = useRoute<RouteProp<ClientStackParamList, "OrderDetails">>();
  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const rideIdFromParams = useMemo(() => {
    const params = route.params || {};
    if (params.rideId) return String(params.rideId);
    if (params.order?._id) return String(params.order._id);
    if (params.order?.id) return String(params.order.id);
    return "";
  }, [route.params]);

  useEffect(() => {
    let mounted = true;
    const loadRide = async () => {
      if (!rideIdFromParams) { setRide(null); setLoading(false); return; }
      try {
        setLoading(true);
        const data = await rideService.getById(rideIdFromParams);
        if (mounted) setRide(data);
      } catch {
        if (mounted) setRide(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadRide();
    return () => { mounted = false; };
  }, [rideIdFromParams]);

  const handleRebook = () => {
    if (!ride) { navigation.navigate("Home"); return; }
    navigation.navigate("DestinationSearch", {
      pickup: {
        address: ride.pickup?.address,
        latitude: Number(ride.pickup?.latitude),
        longitude: Number(ride.pickup?.longitude),
      },
      dropoff: {
        address: ride.dropoff?.address,
        latitude: Number(ride.dropoff?.latitude),
        longitude: Number(ride.dropoff?.longitude),
      },
    });
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#02de95" />
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 14 }}>Carregando detalhes...</Text>
      </View>
    );
  }

  if (!ride) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <AlertCircle size={48} color="rgba(255,255,255,0.2)" />
        <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, marginTop: 16, fontWeight: "600" }}>Pedido não encontrado</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" }}>
          <Text style={{ color: "#fff", fontWeight: "700" }}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const driverName =
    (typeof ride.driverId === "string"
      ? undefined
      : ride.driverId?.name ||
        (ride.driverId && typeof ride.driverId === "object" && "nome" in ride.driverId
          ? String((ride.driverId as Record<string, unknown>).nome || "")
          : undefined)) || "Não atribuído";

  const isDelivery = ride.serviceType === "delivery" || ride.serviceType === "frete";
  const status = String(ride.status || "");
  const statusMeta = STATUS_META[status] || { label: status, color: "#fff", icon: Clock };
  const StatusIcon = statusMeta.icon;
  const ServiceIcon = isDelivery ? Package : Car;
  const vehicleLabel = VEHICLE_LABELS[ride.vehicleType || ""] || (ride.vehicleType || "-").toUpperCase();

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
            {isDelivery ? "Detalhes da Entrega" : "Detalhes da Corrida"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            ID: #{String(ride._id).slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={{
          flexDirection: "row", alignItems: "center", gap: 5,
          backgroundColor: statusMeta.color + "18", borderRadius: 20,
          paddingHorizontal: 10, paddingVertical: 5,
          borderWidth: 1, borderColor: statusMeta.color + "40",
        }}>
          <StatusIcon size={12} color={statusMeta.color} />
          <Text style={{ color: statusMeta.color, fontSize: 11, fontWeight: "700" }}>{statusMeta.label}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Hero card */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 24, padding: 20,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", marginBottom: 14,
            flexDirection: "row", alignItems: "center", gap: 16,
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(2,222,149,0.1)", borderWidth: 1, borderColor: "rgba(2,222,149,0.2)", alignItems: "center", justifyContent: "center" }}>
            <ServiceIcon size={26} color="#02de95" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              {SERVICE_LABELS[ride.serviceType || ""] || "Pedido"} · {vehicleLabel}
            </Text>
            <Text style={{ color: "#02de95", fontSize: 26, fontWeight: "900" }}>
              {formatBRL(ride.negotiation?.finalAgreedPrice || ride.pricing?.total || 0)}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 12, marginTop: 2 }}>
              {formatDateTime(ride.completedAt || ride.cancelledAt || ride.createdAt)}
            </Text>
          </View>
        </MotiView>

        {/* Rota */}
        <SectionCard title="Rota" icon={Route} iconColor="#60a5fa">
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
            <View style={{ alignItems: "center", gap: 3, paddingTop: 3 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#02de95" }} />
              <View style={{ width: 2, height: 24, backgroundColor: "rgba(255,255,255,0.1)" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 3 }}>Coleta</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 18 }}>{ride.pickup?.address || "-"}</Text>
              </View>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700", textTransform: "uppercase", marginBottom: 3 }}>Entrega</Text>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", lineHeight: 18 }}>{ride.dropoff?.address || "-"}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, paddingTop: 4, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>Distância</Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 4 }}>{formatDistance(ride.distance)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, fontWeight: "700", textTransform: "uppercase" }}>Tempo est.</Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 4 }}>{formatDuration(ride.duration)}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Serviço */}
        <SectionCard title="Serviço" icon={ServiceIcon} iconColor="#a78bfa">
          <InfoRow label="Tipo de serviço" value={SERVICE_LABELS[ride.serviceType || ""] || (ride.serviceType || "-")} />
          <InfoRow label="Veículo" value={vehicleLabel} />
          <InfoRow label={isDelivery ? "Entregador" : "Motorista"} value={driverName} />
          {ride.scheduledFor && (
            <InfoRow label="Agendada para" value={formatDateTime(ride.scheduledFor)} />
          )}
        </SectionCard>

        {/* Financeiro */}
        <SectionCard title="Financeiro" icon={DollarSign} iconColor="#02de95">
          {ride.negotiation?.enabled && (
            <InfoRow label="Oferta do cliente" value={formatBRL(ride.negotiation?.clientOffer || 0)} mono />
          )}
          {ride.negotiation?.enabled && ride.negotiation?.finalAgreedPrice && (
            <InfoRow label="Preço fechado" value={formatBRL(ride.negotiation?.finalAgreedPrice || 0)} mono />
          )}
          {ride.pricing?.basePrice ? (
            <InfoRow label="Tarifa base" value={formatBRL(ride.pricing?.basePrice || 0)} mono />
          ) : null}
          {ride.pricing?.distancePrice ? (
            <InfoRow label="Por distância" value={formatBRL(ride.pricing?.distancePrice || 0)} mono />
          ) : null}
          {ride.pricing?.serviceFee ? (
            <InfoRow label="Taxa de serviço" value={formatBRL(ride.pricing?.serviceFee || 0)} mono />
          ) : null}
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)" }} />
          <InfoRow label="Total pago" value={formatBRL(ride.pricing?.total || ride.negotiation?.finalAgreedPrice || 0)} highlight />
          {ride.payment?.method?.type && (
            <InfoRow label="Método de pagamento" value={ride.payment.method.type === "pix" ? "Pix" : ride.payment.method.type === "cash" ? "Dinheiro" : "Cartão"} />
          )}
        </SectionCard>

        {/* Datas */}
        <SectionCard title="Datas e Horários" icon={CalendarClock} iconColor="#fbbf24">
          <InfoRow label="Solicitado em" value={formatDateTime(ride.requestedAt || ride.createdAt)} />
          {ride.completedAt && <InfoRow label="Concluído em" value={formatDateTime(ride.completedAt)} />}
          {ride.cancelledAt && <InfoRow label="Cancelado em" value={formatDateTime(ride.cancelledAt)} />}
        </SectionCard>

        {/* Ações */}
        <View style={{ gap: 10, marginTop: 4 }}>
          <TouchableOpacity
            onPress={handleRebook}
            activeOpacity={0.85}
            style={{
              height: 54, borderRadius: 16, backgroundColor: "#02de95",
              alignItems: "center", justifyContent: "center",
              flexDirection: "row", gap: 10,
            }}
          >
            <RotateCcw size={18} color="#091A2F" />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
              Pedir Novamente
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
            style={{
              height: 50, borderRadius: 16,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: "rgba(255,255,255,0.03)",
              alignItems: "center", justifyContent: "center",
              flexDirection: "row", gap: 10,
            }}
          >
            <Home size={16} color="rgba(255,255,255,0.45)" />
            <Text style={{ color: "rgba(255,255,255,0.45)", fontWeight: "700", fontSize: 14 }}>
              Voltar ao Início
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
