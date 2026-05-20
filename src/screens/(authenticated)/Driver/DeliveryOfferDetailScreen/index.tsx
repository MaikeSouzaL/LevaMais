import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  MapPin,
  Package,
  Clock,
  Route,
  Star,
  DollarSign,
  Zap,
  CreditCard,
  Wallet,
  ChevronRight,
  Minus,
  Plus,
  Send,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import walletService from "@/services/wallet.service";
import { useAuthStore } from "@/context/authStore";
import { formatBRL } from "@/utils/mappers";
import { DeliveryOfferMap } from "@/components/driver/delivery-offer/DeliveryOfferMap";

// ─── Payment display helper ───────────────────────────────────────────────────
function getPaymentDisplay(method: string, isNegotiating = false) {
  if (isNegotiating) return { label: "A definir pelo cliente", color: "#9CA3AF" };
  const k = String(method || "cash").toLowerCase();
  if (k.includes("pix")) return { label: "PIX", color: "#32BCAD" };
  if (k.includes("card") || k.includes("credit") || k.includes("debit")) return { label: "Cartão no App", color: "#6366F1" };
  if (k.includes("wallet")) return { label: "Carteira Digital", color: "#F59E0B" };
  return { label: "Dinheiro / Físico", color: "#10B981" };
}

// ─── Info row ─────────────────────────────────────────────────────────────────
function InfoRow({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }}>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: valueColor || "rgba(255,255,255,0.9)", fontSize: 12, fontWeight: "700", maxWidth: "60%", textAlign: "right" }}>
        {value}
      </Text>
    </View>
  );
}

// ─── Address block ────────────────────────────────────────────────────────────
function AddressBlock({ label, address, color }: { label: string; address: string; color: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 12 }}>
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: color, marginTop: 3, marginRight: 10 }} />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, marginBottom: 2, textTransform: "uppercase" }}>{label}</Text>
        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "600", lineHeight: 18 }}>{address}</Text>
      </View>
    </View>
  );
}

export default function DeliveryOfferDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { userData } = useAuthStore();

  // The full offer payload is passed as a route param from DriverHomeScreen
  const offer = route.params?.offer as any;
  const onAccept = route.params?.onAccept as (() => void) | undefined;
  const onReject = route.params?.onReject as (() => void) | undefined;

  const pickup = useMemo(() => offer?.pickup || { latitude: 0, longitude: 0, address: "" }, [offer]);
  const destination = useMemo(() => offer?.dropoff || offer?.destination || { latitude: 0, longitude: 0, address: "" }, [offer]);

  const baseValue = Number(offer?.negotiation?.clientOffer ?? offer?.pricing?.total ?? 0);

  const [counterValue, setCounterValue] = useState<number>(baseValue);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [rejecting, setRejecting] = useState(false);

  const distanceKm = offer?.distanceToPickup
    ? `${(offer.distanceToPickup / 1000).toFixed(1)} km (até coleta)`
    : offer?.distance?.text || "-- km";
  const durationText = offer?.duration?.text || "-- min";
  const clientName = offer?.client?.name || "Cliente Leva+";
  const clientRating = Number(offer?.client?.rating || 5).toFixed(1);
  const cargoSize = (offer?.details?.cargoSize as string | undefined) || "small";
  const sizeLabels: Record<string, string> = { small: "Pequeno", medium: "Médio", large: "Grande" };
  const cargoLabel = sizeLabels[cargoSize] || "Pequeno";
  const obs = offer?.details?.specialInstructions || "";
  const isNegotiating = !offer?.payment?.status || offer?.payment?.status === "not_selected";
  const payDisplay = getPaymentDisplay(offer?.payment?.method?.type || offer?.paymentMethod || "cash", isNegotiating);
  const driverEarnings = useMemo(() => {
    const fee = Number(offer?.financialRisk?.estimatedPlatformFee || baseValue * 0.2);
    return Math.max(0, counterValue - fee);
  }, [counterValue, offer?.financialRisk?.estimatedPlatformFee, baseValue]);

  const step = 1;
  const decrement = () => setCounterValue(v => Math.max(baseValue, Math.round((v - step) * 100) / 100));
  const increment = () => setCounterValue(v => Math.round((v + step) * 100) / 100);

  const handleAccept = async () => {
    if (!offer?.rideId) return;
    setAccepting(true);
    try {
      const balance = await walletService.getBalance();
      if (balance.available <= 0) {
        Toast.show({ type: "error", text1: "Saldo insuficiente", text2: "Adicione saldo para aceitar." });
        return;
      }
      await rideService.respondToOffer(offer.rideId, { action: "accept" });
      Toast.show({ type: "success", text1: "Aceite enviado!", text2: "Aguardando confirmação do cliente." });
      onAccept?.();
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao aceitar", text2: e?.response?.data?.error || e?.message });
    } finally {
      setAccepting(false);
    }
  };

  const handleReject = async () => {
    if (!offer?.rideId) return;
    setRejecting(true);
    try {
      await rideService.reject(offer.rideId, "driver_rejected");
      onReject?.();
      navigation.goBack();
    } catch {
      navigation.goBack();
    } finally {
      setRejecting(false);
    }
  };

  const handleSendCounter = async () => {
    if (!offer?.rideId || counterValue <= 0) return;
    setSending(true);
    try {
      await rideService.respondToOffer(offer.rideId, {
        action: "counter",
        amount: counterValue,
        message: message || "Proposta justa",
      });
      Toast.show({ type: "success", text1: "Proposta enviada! 🚀", text2: `R$ ${counterValue.toFixed(2).replace(".", ",")} enviado ao cliente.` });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Falha ao propor", text2: e?.response?.data?.error || e?.message });
    } finally {
      setSending(false);
    }
  };

  if (!offer) {
    return (
      <View style={{ flex: 1, backgroundColor: "#091A2F", alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: "rgba(255,255,255,0.5)" }}>Oferta não encontrada.</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingBottom: 14,
          paddingHorizontal: 20,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#0D1F35",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginRight: 14 }}>
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, flex: 1 }}>Detalhes da Oferta</Text>
        <View style={{ backgroundColor: "rgba(2,222,149,0.15)", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 }}>
          <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>{formatBRL(baseValue)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 180 }}>

        {/* Mini Mapa de Rota Integrado no Topo */}
        {pickup.latitude && destination.latitude ? (
          <View 
            style={{ 
              height: 165, 
              width: "100%", 
              borderRadius: 16, 
              overflow: "hidden", 
              marginBottom: 14, 
              borderWidth: 1.5, 
              borderColor: "rgba(255,255,255,0.08)",
              backgroundColor: "#11253E"
            }}
          >
            <DeliveryOfferMap pickup={pickup} destination={destination} isSmall />
          </View>
        ) : null}

        {/* Client */}
        <View style={{ backgroundColor: "#11253E", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
            <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 16 }}>{clientName.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>{clientName}</Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 2 }}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "700", marginLeft: 4 }}>{clientRating}</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginLeft: 6 }}>
                  · {offer?.client?.ridesCount || 0} entregas
                </Text>
              </View>
            </View>
          </View>

          {/* Addresses */}
          <AddressBlock label="Coleta" address={offer?.pickup?.address || "--"} color="#02de95" />
          <AddressBlock label="Entrega" address={offer?.dropoff?.address || "--"} color="#EF4444" />
        </View>

        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
          {[
            { icon: <Route size={16} color="#02de95" />, label: distanceKm, sub: "Distância" },
            { icon: <Clock size={16} color="#F59E0B" />, label: durationText, sub: "Tempo" },
            { icon: <Package size={16} color="#6366F1" />, label: cargoLabel, sub: "Carga" },
          ].map((item, idx) => (
            <View key={idx} style={{ flex: 1, backgroundColor: "#11253E", borderRadius: 12, padding: 12, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
              {item.icon}
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12, marginTop: 6, textAlign: "center" }}>{item.label}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>{item.sub}</Text>
            </View>
          ))}
        </View>

        {/* Details */}
        <View style={{ backgroundColor: "#11253E", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>Detalhes</Text>
          <InfoRow label="Pagamento" value={payDisplay.label} valueColor={payDisplay.color} />
          <InfoRow label="Serviço" value={offer?.serviceType === "delivery" ? "Entrega" : offer?.serviceType || "Entrega"} />
          <InfoRow label="Veículo" value={offer?.vehicleType || "Moto"} />
          {offer?.details?.needsHelper && <InfoRow label="Ajudante" value="Sim" valueColor="#F59E0B" />}
          {obs ? <InfoRow label="Obs." value={obs} /> : null}
        </View>

        {/* Financial risk */}
        <View style={{ backgroundColor: "rgba(239,68,68,0.06)", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginBottom: 12 }}>Financeiro</Text>
          <InfoRow label="Oferta do cliente" value={formatBRL(baseValue)} valueColor="#02de95" />
          <InfoRow label="Taxa da plataforma (~20%)" value={`− ${formatBRL(Number(offer?.financialRisk?.estimatedPlatformFee || baseValue * 0.2))}`} valueColor="#EF4444" />
          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 8 }} />
          <InfoRow label="Seu ganho estimado" value={formatBRL(Math.max(0, baseValue - Number(offer?.financialRisk?.estimatedPlatformFee || baseValue * 0.2)))} valueColor="#02de95" />
        </View>

        {/* Counter offer adjuster */}
        <View style={{ backgroundColor: "#11253E", borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13, marginBottom: 4 }}>Ajustar Valor da Proposta</Text>
          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, marginBottom: 14 }}>
            Você pode aceitar o valor base ou propor um valor diferente
          </Text>

          {/* Value adjuster */}
          <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#0D1F35", borderRadius: 14, padding: 6, marginBottom: 12 }}>
            <TouchableOpacity onPress={decrement} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
              <Minus size={16} color="#fff" />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ color: "#02de95", fontSize: 24, fontWeight: "900" }}>{formatBRL(counterValue)}</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 2 }}>Você receberá ≈ {formatBRL(driverEarnings)}</Text>
            </View>
            <TouchableOpacity onPress={increment} style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: "#02de95", alignItems: "center", justifyContent: "center" }}>
              <Plus size={16} color="#091A2F" />
            </TouchableOpacity>
          </View>

          {/* Quick add buttons */}
          <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
            {[1, 2, 5, 10].map(v => (
              <TouchableOpacity
                key={v}
                onPress={() => setCounterValue(cv => Math.round((cv + v) * 100) / 100)}
                style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingVertical: 8, alignItems: "center" }}
              >
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "700" }}>+R${v}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Message */}
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Mensagem opcional (ex: Tráfego intenso)"
            placeholderTextColor="rgba(255,255,255,0.25)"
            style={{
              backgroundColor: "#0D1F35",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
              padding: 12,
              color: "#fff",
              fontSize: 13,
            }}
          />
        </View>
      </ScrollView>

      {/* Bottom action bar */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingTop: 14,
          paddingHorizontal: 20,
          backgroundColor: "#0D1F35",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.06)",
          gap: 10,
        }}
      >
        {/* Send proposal button */}
        <TouchableOpacity
          onPress={handleSendCounter}
          disabled={sending}
          style={{
            height: 52,
            borderRadius: 14,
            backgroundColor: "#02de95",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
            gap: 8,
          }}
          activeOpacity={0.85}
        >
          {sending ? (
            <ActivityIndicator color="#091A2F" />
          ) : (
            <>
              <Send size={18} color="#091A2F" />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14 }}>
                {counterValue === baseValue ? `Aceitar por ${formatBRL(counterValue)}` : `Propor ${formatBRL(counterValue)}`}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Reject */}
        <TouchableOpacity
          onPress={handleReject}
          disabled={rejecting}
          style={{
            height: 44,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(239,68,68,0.35)",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.8}
        >
          {rejecting ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <Text style={{ color: "#EF4444", fontWeight: "700", fontSize: 13 }}>Recusar Oferta</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
