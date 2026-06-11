import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View, TouchableOpacity, StatusBar, Modal, TextInput } from "react-native";
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
  FileText,
  X,
} from "lucide-react-native";

import rideService, { Ride } from "@/services/ride.service";
import disputeService, { DisputeCategory } from "@/services/dispute.service";
import Toast from "react-native-toast-message";
import { formatBRL } from "@/utils/mappers";
import { getPaymentLabel } from "@/utils/payment";
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
        backgroundColor: "#ffffff", borderRadius: 22, borderWidth: 1,
        borderColor: "rgba(0,0,0,0.06)", marginBottom: 14, overflow: "hidden",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" }}>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: iconColor + "15", alignItems: "center", justifyContent: "center" }}>
          <Icon size={16} color={iconColor} />
        </View>
        <Text style={{ color: "#091A2F", fontSize: 11, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1.5 }}>{title}</Text>
      </View>
      <View style={{ padding: 16, paddingTop: 14, gap: 11 }}>{children}</View>
    </MotiView>
  );
}

function InfoRow({ label, value, highlight, mono }: { label: string; value: string; highlight?: boolean; mono?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
      <Text style={{ color: "#555555", fontSize: 13, fontWeight: "600", flex: 1 }}>{label}</Text>
      <Text style={{
        color: highlight ? "#00b578" : "#111111",
        fontSize: highlight ? 15 : 13,
        fontWeight: highlight ? "900" : "700",
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
  const [nfse, setNfse] = useState<any>(null);
  const [showReceipt, setShowReceipt] = useState(false);
  const [loadingNfse, setLoadingNfse] = useState(false);

  const [showDispute, setShowDispute] = useState(false);
  const [disputeCategory, setDisputeCategory] = useState<DisputeCategory>("payment");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const submitDispute = async () => {
    if (!ride?._id || disputeDesc.trim().length < 5) {
      Toast.show({ type: "error", text1: "Descreva o problema (mín. 5 caracteres)." });
      return;
    }
    setSubmittingDispute(true);
    try {
      await disputeService.create({
        rideId: String(ride._id),
        category: disputeCategory,
        description: disputeDesc.trim(),
      });
      setShowDispute(false);
      setDisputeDesc("");
      Toast.show({ type: "success", text1: "Disputa aberta", text2: "Nossa equipe vai analisar e responder." });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Não foi possível abrir", text2: e?.message || "Tente novamente" });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const openReceipt = async () => {
    if (!ride?._id) return;
    setShowReceipt(true);
    if (nfse) return;
    setLoadingNfse(true);
    try {
      const data = await rideService.getRideNfse(String(ride._id));
      setNfse(data);
    } catch {
      // mantém modal aberto mostrando indisponível
    } finally {
      setLoadingNfse(false);
    }
  };

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
    
    const isDelivery = ride.serviceType === "delivery" || ride.serviceType === "frete";
    
    if (isDelivery) {
      const pickupProfile = {
        address: ride.pickup?.address || "",
        addressCoords: {
          latitude: Number(ride.pickup?.latitude || 0),
          longitude: Number(ride.pickup?.longitude || 0),
        },
        details: ride.details?.pickupComplement || "",
        contactName: "",
        contactPhone: "",
      };

      const dropoffProfile = {
        address: ride.dropoff?.address || "",
        addressCoords: {
          latitude: Number(ride.dropoff?.latitude || 0),
          longitude: Number(ride.dropoff?.longitude || 0),
        },
        details: ride.details?.dropoffComplement || "",
        contactName: ride.details?.recipientName || "",
        contactPhone: ride.details?.recipientPhone || "",
      };

      const vehicleType = (["motorcycle", "car", "van", "truck"].includes(String(ride.vehicleType))
        ? ride.vehicleType
        : "motorcycle") as any;

      navigation.navigate("DeliveryDetails", {
        flow: "send",
        vehicleType,
        pickupProfile,
        dropoffProfile,
        stops: [],
      });
    } else {
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
    }
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
            backgroundColor: "#ffffff", borderRadius: 24, padding: 22,
            borderWidth: 1, borderColor: "rgba(0,0,0,0.06)", marginBottom: 14,
            flexDirection: "row", alignItems: "center", gap: 16,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <View style={{ width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(0,181,120,0.1)", borderWidth: 1, borderColor: "rgba(0,181,120,0.2)", alignItems: "center", justifyContent: "center" }}>
            <ServiceIcon size={26} color="#00b578" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "#555555", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1.2, marginBottom: 4 }}>
              {SERVICE_LABELS[ride.serviceType || ""] || "Pedido"} · {vehicleLabel}
            </Text>
            <Text style={{ color: "#00b578", fontSize: 28, fontWeight: "900" }}>
              {formatBRL(ride.negotiation?.finalAgreedPrice || ride.pricing?.total || 0)}
            </Text>
            <Text style={{ color: "#888888", fontSize: 12, fontWeight: "600", marginTop: 2 }}>
              {formatDateTime(ride.completedAt || ride.cancelledAt || ride.createdAt)}
            </Text>
          </View>
        </MotiView>

        {/* Rota */}
        <SectionCard title="Rota" icon={Route} iconColor="#3b82f6">
          <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
            <View style={{ alignItems: "center", gap: 3, paddingTop: 3 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#00b578" }} />
              <View style={{ width: 2, height: 24, backgroundColor: "rgba(0,0,0,0.08)" }} />
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444" }} />
            </View>
            <View style={{ flex: 1, gap: 12 }}>
              <View>
                <Text style={{ color: "#888888", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 3 }}>Coleta</Text>
                <Text style={{ color: "#111111", fontSize: 14, fontWeight: "700", lineHeight: 18 }}>{ride.pickup?.address || "-"}</Text>
                {ride.details?.pickupComplement ? (
                  <Text style={{ color: "#555555", fontSize: 12, marginTop: 3, fontWeight: "600" }}>
                    Comp.: {ride.details.pickupComplement}
                  </Text>
                ) : null}
              </View>
              <View>
                <Text style={{ color: "#888888", fontSize: 10, fontWeight: "800", textTransform: "uppercase", marginBottom: 3 }}>Entrega</Text>
                <Text style={{ color: "#111111", fontSize: 14, fontWeight: "700", lineHeight: 18 }}>{ride.dropoff?.address || "-"}</Text>
                {ride.details?.dropoffComplement ? (
                  <Text style={{ color: "#555555", fontSize: 12, marginTop: 3, fontWeight: "600" }}>
                    Comp.: {ride.details.dropoffComplement}
                  </Text>
                ) : null}
              </View>
            </View>
          </View>
          <View style={{ flexDirection: "row", gap: 12, paddingTop: 6, borderTopWidth: 1, borderTopColor: "rgba(0,0,0,0.06)" }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#888888", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>Distância</Text>
              <Text style={{ color: "#111111", fontSize: 15, fontWeight: "800", marginTop: 4 }}>{formatDistance(ride.distance)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#888888", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>Tempo est.</Text>
              <Text style={{ color: "#111111", fontSize: 15, fontWeight: "800", marginTop: 4 }}>{formatDuration(ride.duration)}</Text>
            </View>
          </View>
        </SectionCard>

        {/* Dados da Encomenda */}
        {isDelivery && ride.details && (
          <SectionCard title="Dados da Encomenda" icon={Package} iconColor="#02de95">
            {ride.details.itemType ? (
              <InfoRow label="O que está enviando" value={ride.details.itemType} />
            ) : null}
            {ride.details.recipientName ? (
              <InfoRow label="Destinatário" value={ride.details.recipientName} />
            ) : null}
            {ride.details.recipientPhone ? (
              <InfoRow label="Telefone do destinatário" value={ride.details.recipientPhone} />
            ) : null}
            {ride.details.recipientInstructions ? (
              <InfoRow label="Instruções de entrega" value={ride.details.recipientInstructions} />
            ) : null}
            {ride.details.pickupPin ? (
              <InfoRow label="PIN de Coleta" value={ride.details.pickupPin} />
            ) : null}
            {ride.details.deliveryPin ? (
              <InfoRow label="PIN de Entrega" value={ride.details.deliveryPin} />
            ) : null}
            {ride.details.isFragile !== undefined ? (
              <InfoRow label="É frágil?" value={ride.details.isFragile ? "Sim" : "Não"} />
            ) : null}
            {ride.details.approximateWeightKg ? (
              <InfoRow label="Peso estimado" value={`${ride.details.approximateWeightKg} kg`} />
            ) : null}
          </SectionCard>
        )}

        {/* Serviço */}
        <SectionCard title="Serviço" icon={ServiceIcon} iconColor="#a78bfa">
          <InfoRow label="Tipo de serviço" value={SERVICE_LABELS[ride.serviceType || ""] || (ride.serviceType || "-")} />
          <InfoRow label="Veículo" value={vehicleLabel} />
          <InfoRow label={isDelivery ? "Entregador" : "Motorista"} value={driverName} />
          {ride.scheduledFor && (
            <InfoRow label="Agendada para" value={formatDateTime(ride.scheduledFor)} />
          )}
        </SectionCard>

        {/* Resumo do Pagamento */}
        <SectionCard title="Resumo do Pagamento" icon={DollarSign} iconColor="#02de95">
          {ride.payment?.method && (
            <InfoRow
              label="Método de pagamento"
              value={getPaymentLabel(ride.payment)}
            />
          )}
          <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)", marginVertical: 6 }} />
          <InfoRow label="Total pago" value={formatBRL(ride.pricing?.total || ride.negotiation?.finalAgreedPrice || 0)} highlight />
        </SectionCard>

        {/* Datas */}
        <SectionCard title="Datas e Horários" icon={CalendarClock} iconColor="#fbbf24">
          <InfoRow label="Solicitado em" value={formatDateTime(ride.requestedAt || ride.createdAt)} />
          {ride.completedAt && <InfoRow label="Concluído em" value={formatDateTime(ride.completedAt)} />}
          {ride.cancelledAt && <InfoRow label="Cancelado em" value={formatDateTime(ride.cancelledAt)} />}
        </SectionCard>

        {/* Ações */}
        <View style={{ gap: 11, marginTop: 10 }}>
          <TouchableOpacity
            onPress={handleRebook}
            activeOpacity={0.85}
            style={{
              height: 56, borderRadius: 18, backgroundColor: "#02de95",
              alignItems: "center", justifyContent: "center",
              flexDirection: "row", gap: 10,
              shadowColor: "#02de95",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <RotateCcw size={18} color="#091A2F" />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.8 }}>
              Pedir Novamente
            </Text>
          </TouchableOpacity>

          {ride.status === "completed" && (
            <TouchableOpacity
              onPress={() => navigation.navigate("RouteAudit", { rideId: String(ride._id) })}
              activeOpacity={0.85}
              style={{
                height: 54, borderRadius: 18,
                borderWidth: 1.5, borderColor: "rgba(2,222,149,0.35)",
                backgroundColor: "rgba(2,222,149,0.08)",
                alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 10,
              }}
            >
              <Route size={16} color="#02de95" />
              <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 14 }}>
                Ver trajeto percorrido
              </Text>
            </TouchableOpacity>
          )}

          {ride.status === "completed" && (
            <TouchableOpacity
              onPress={openReceipt}
              activeOpacity={0.85}
              style={{
                height: 54, borderRadius: 18,
                borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
                backgroundColor: "rgba(255,255,255,0.04)",
                alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 10,
              }}
            >
              <FileText size={16} color="rgba(255,255,255,0.85)" />
              <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "800", fontSize: 14 }}>
                Recibo / Nota fiscal
              </Text>
            </TouchableOpacity>
          )}

          {["completed", "cancelled", "cancelled_by_client", "cancelled_by_driver", "delivery_failed"].includes(String(ride.status)) && (
            <TouchableOpacity
              onPress={() => setShowDispute(true)}
              activeOpacity={0.85}
              style={{
                height: 54, borderRadius: 18,
                borderWidth: 1.5, borderColor: "rgba(239,68,68,0.30)",
                backgroundColor: "rgba(239,68,68,0.06)",
                alignItems: "center", justifyContent: "center",
                flexDirection: "row", gap: 10,
              }}
            >
              <AlertCircle size={16} color="#f87171" />
              <Text style={{ color: "#f87171", fontWeight: "800", fontSize: 14 }}>
                Contestar / Abrir disputa
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.85}
            style={{
              height: 54, borderRadius: 18,
              borderWidth: 1.5, borderColor: "rgba(255,255,255,0.15)",
              backgroundColor: "rgba(255,255,255,0.04)",
              alignItems: "center", justifyContent: "center",
              flexDirection: "row", gap: 10,
            }}
          >
            <Home size={16} color="rgba(255,255,255,0.75)" />
            <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800", fontSize: 14 }}>
              Voltar ao Início
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal Recibo / NFS-e (documento simulado por enquanto) */}
      <Modal visible={showReceipt} transparent animationType="slide" onRequestClose={() => setShowReceipt(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "85%", paddingBottom: insets.bottom + 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>Recibo / Nota fiscal</Text>
              <TouchableOpacity onPress={() => setShowReceipt(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, gap: 8 }}>
              {loadingNfse ? (
                <View style={{ padding: 24, alignItems: "center" }}>
                  <ActivityIndicator color="#02de95" />
                </View>
              ) : nfse ? (
                <>
                  <View style={{ backgroundColor: "#FFFBEB", borderWidth: 1, borderColor: "#FDE68A", borderRadius: 12, padding: 10 }}>
                    <Text style={{ color: "#B45309", fontSize: 11, fontWeight: "700" }}>
                      Documento simulado (não fiscal). Emissão fiscal oficial será integrada.
                    </Text>
                  </View>
                  <ReceiptRow label="Número" value={nfse.number} />
                  <ReceiptRow label="Cód. verificação" value={nfse.verificationCode} />
                  <ReceiptRow label="Emitido em" value={nfse.issuedAt} />
                  <ReceiptRow label="Status" value={nfse.status} />
                  <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 6 }} />
                  <ReceiptRow label="Prestador" value={nfse.provider?.name} />
                  <ReceiptRow label="Tomador" value={nfse.taker?.name} />
                  <View style={{ height: 1, backgroundColor: "#F1F5F9", marginVertical: 6 }} />
                  <ReceiptRow label="Valor total" value={formatBRL(Number(nfse.financial?.totalValue || 0))} />
                  <ReceiptRow label={`ISS (${nfse.financial?.issRate || 0}%)`} value={formatBRL(Number(nfse.financial?.issValue || 0))} />
                  <ReceiptRow label="Valor líquido" value={formatBRL(Number(nfse.financial?.netValue || 0))} highlight />
                  <Text style={{ color: "#64748B", fontSize: 12, marginTop: 10, lineHeight: 18 }}>{nfse.serviceDescription}</Text>
                </>
              ) : (
                <Text style={{ color: "#64748B", padding: 12 }}>Recibo indisponível para esta corrida.</Text>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Abrir Disputa / Contestar */}
      <Modal visible={showDispute} transparent animationType="slide" onRequestClose={() => setShowDispute(false)}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" }}>
          <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: insets.bottom + 16 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "#F1F5F9" }}>
              <Text style={{ fontSize: 16, fontWeight: "900", color: "#0F172A" }}>Abrir disputa</Text>
              <TouchableOpacity onPress={() => setShowDispute(false)} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: "#F1F5F9", alignItems: "center", justifyContent: "center" }}>
                <X size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16, gap: 12 }}>
              <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700" }}>Motivo</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {([
                  { id: "payment", label: "Cobrança" },
                  { id: "cancellation_fee", label: "Taxa cancelamento" },
                  { id: "safety", label: "Segurança" },
                  { id: "delivery_problem", label: "Entrega" },
                  { id: "route", label: "Rota" },
                  { id: "behavior", label: "Conduta" },
                  { id: "other", label: "Outro" },
                ] as { id: DisputeCategory; label: string }[]).map((c) => {
                  const sel = disputeCategory === c.id;
                  return (
                    <TouchableOpacity
                      key={c.id}
                      onPress={() => setDisputeCategory(c.id)}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999,
                        backgroundColor: sel ? "#02de95" : "#F1F5F9",
                      }}
                    >
                      <Text style={{ color: sel ? "#0F172A" : "#475569", fontWeight: "800", fontSize: 12 }}>{c.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={{ color: "#64748B", fontSize: 12, fontWeight: "700", marginTop: 4 }}>Descrição</Text>
              <TextInput
                value={disputeDesc}
                onChangeText={setDisputeDesc}
                placeholder="Conte o que aconteceu..."
                placeholderTextColor="#94A3B8"
                multiline
                style={{ minHeight: 96, borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 14, padding: 12, color: "#0F172A", textAlignVertical: "top" }}
              />
              <TouchableOpacity
                onPress={submitDispute}
                disabled={submittingDispute}
                activeOpacity={0.9}
                style={{ height: 52, borderRadius: 16, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center", marginTop: 4 }}
              >
                {submittingDispute ? (
                  <ActivityIndicator color="#0F172A" />
                ) : (
                  <Text style={{ color: "#0F172A", fontWeight: "900", fontSize: 14 }}>Enviar disputa</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ReceiptRow({ label, value, highlight }: { label: string; value?: string; highlight?: boolean }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 4 }}>
      <Text style={{ color: "#64748B", fontSize: 13 }}>{label}</Text>
      <Text style={{ color: highlight ? "#047857" : "#0F172A", fontSize: 13, fontWeight: highlight ? "900" : "700", maxWidth: "60%", textAlign: "right" }} numberOfLines={2}>
        {value || "-"}
      </Text>
    </View>
  );
}
