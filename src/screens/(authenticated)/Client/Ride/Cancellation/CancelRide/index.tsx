import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  Package,
  Car,
  HeadphonesIcon,
  DollarSign,
  Info,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { estimateCancellationFee } from "@/utils/cancellationFee";
import { ClientStackParamList } from "../../../types/navigation";

const CANCEL_REASONS = [
  { id: "changed_mind",   label: "Mudei de ideia",              emoji: "??" },
  { id: "driver_late",    label: "Motorista demorou muito",      emoji: "?" },
  { id: "other_option",   label: "Encontrei outra opção",        emoji: "??" },
  { id: "high_price",     label: "Preço muito alto",             emoji: "??" },
  { id: "wrong_address",  label: "Endereço incorreto",           emoji: "??" },
  { id: "other",          label: "Outro motivo",                  emoji: "??" },
];

export default function CancelRideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "ClientCancelRide">>();
  const route = useRoute<RouteProp<ClientStackParamList, "ClientCancelRide">>();
  const insets = useSafeAreaInsets();

  const rideId = route.params?.rideId;
  const total = route.params?.total;
  const initialStatus = route.params?.status;
  const initialEstimatedFee = route.params?.estimatedFee;

  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState(initialStatus || "");
  const [rideTotal, setRideTotal] = useState(typeof total === "number" ? total : undefined);
  const [serviceType, setServiceType] = useState<string>("");
  const [computedFee, setComputedFee] = useState<number>(
    typeof initialEstimatedFee === "number" ? initialEstimatedFee : 0,
  );

  const canSubmit = useMemo(() => Boolean(rideId && selectedReason), [rideId, selectedReason]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;
    rideService.getById(rideId).then((ride) => {
      if (!mounted) return;
      setRideStatus(String(ride?.status || ""));
      setServiceType(String(ride?.serviceType || ""));
      if (ride?.pricing?.total != null) setRideTotal(Number(ride.pricing.total));
      // Estimativa real da taxa (mesma regra do backend: janela 2 min / 20%).
      setComputedFee(estimateCancellationFee(ride as any));
    }).catch(() => {});
    return () => { mounted = false; };
  }, [rideId]);

  const feeStatusApplies = ["accepted", "driver_arriving", "arrived", "in_progress"].includes(rideStatus);
  const isDelivery = serviceType === "delivery" || serviceType === "frete";
  const isPackageCollected = isDelivery && rideStatus === "in_progress";
  const isBeforeDriverAccepted = ["requesting", "driver_assigned", "payment_pending"].includes(rideStatus);
  const isDriverOnTheWay = ["accepted", "driver_arriving"].includes(rideStatus);
  const isDriverAtPickup = rideStatus === "arrived";

  // Usa a estimativa calculada pela regra (já trata janela grátis e fase); fallback no param.
  const effectiveEstimatedFee = computedFee > 0 ? computedFee : (feeStatusApplies ? Number(initialEstimatedFee || 0) : 0);

  const warningConfig = useMemo(() => {
    if (isPackageCollected) {
      return {
        color: "#f97316",
        bg: "rgba(249,115,22,0.08)",
        border: "rgba(249,115,22,0.25)",
        icon: AlertTriangle,
        title: "Pacote já coletado",
        message: "O entregador já está com seu pacote. Ao cancelar agora será cobrada uma taxa de retorno e o entregador levará o item de volta ao endereço de origem.",
        blocked: false,
      };
    }
    if (isDriverAtPickup) return {
      color: "#f97316", bg: "rgba(249,115,22,0.08)", border: "rgba(249,115,22,0.25)", icon: AlertTriangle,
      title: "Motorista no local",
      message: "O motorista já chegou ao ponto de coleta. O cancelamento pode gerar uma taxa.",
      blocked: false,
    };
    if (isDriverOnTheWay) return {
      color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.25)", icon: AlertTriangle,
      title: "Motorista a caminho",
      message: "O motorista já aceitou e está em deslocamento. O cancelamento pode gerar taxa.",
      blocked: false,
    };
    return {
      color: "#60a5fa", bg: "rgba(96,165,250,0.06)", border: "rgba(96,165,250,0.2)", icon: Info,
      title: "Ainda em fase inicial",
      message: "Seu pedido ainda não foi atribuído a um motorista. O cancelamento será aplicado sem cobrança.",
      blocked: false,
    };
  }, [isBeforeDriverAccepted, isDriverAtPickup, isDriverOnTheWay, isPackageCollected]);

  const handleCancel = async () => {
    if (!canSubmit || !rideId) return;
    setLoading(true);
    try {
      const reasonLabel = CANCEL_REASONS.find((r) => r.id === selectedReason)?.label || selectedReason;
      const response: any = await rideService.cancel(rideId, reasonLabel);
      const chargedFee = Number(response?.cancellationFee ?? response?.data?.cancellationFee ?? effectiveEstimatedFee) || 0;
      Toast.show({ type: "success", text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada" });
      if (chargedFee > 0) {
        navigation.navigate("CancelFee", { rideId, fee: chargedFee, total: rideTotal, serviceType });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Não foi possível cancelar", text2: error?.message || "Tente novamente" });
    } finally {
      setLoading(false);
    }
  };

  const WarnIcon = warningConfig.icon;

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
            {isDelivery ? "Cancelar Entrega" : "Cancelar Corrida"}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            Revise com atenção antes de confirmar
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>

        {/* Warning card */}
        <MotiView
          from={{ opacity: 0, translateY: -6 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            flexDirection: "row", alignItems: "flex-start", gap: 12,
            backgroundColor: warningConfig.bg, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: warningConfig.border, marginBottom: 20,
          }}
        >
          <View style={{ width: 36, height: 36, borderRadius: 11, backgroundColor: warningConfig.color + "20", alignItems: "center", justifyContent: "center" }}>
            <WarnIcon size={18} color={warningConfig.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: warningConfig.color, fontSize: 13, fontWeight: "800", marginBottom: 4 }}>
              {warningConfig.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, lineHeight: 18 }}>
              {warningConfig.message}
            </Text>
          </View>
        </MotiView>

        {/* Taxa prevista */}
        {effectiveEstimatedFee > 0 && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 60 }}
            style={{
              flexDirection: "row", alignItems: "center", justifyContent: "space-between",
              backgroundColor: "rgba(249,115,22,0.08)", borderRadius: 16, padding: 16,
              borderWidth: 1, borderColor: "rgba(249,115,22,0.25)", marginBottom: 20,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <DollarSign size={18} color="#f97316" />
              <View>
                <Text style={{ color: "#f97316", fontSize: 12, fontWeight: "700" }}>Taxa de cancelamento prevista</Text>
                <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Cobre deslocamento do motorista</Text>
              </View>
            </View>
            <Text style={{ color: "#f97316", fontSize: 18, fontWeight: "900" }}>{formatBRL(effectiveEstimatedFee)}</Text>
          </MotiView>
        )}

        {/* Motivos — bloqueado se pacote coletado */}
        {warningConfig.blocked ? (
          <MotiView
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 80 }}
            style={{
              backgroundColor: "#11253E", borderRadius: 20, padding: 20,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", alignItems: "center", gap: 16,
            }}
          >
            <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: "rgba(239,68,68,0.1)", alignItems: "center", justifyContent: "center" }}>
              <HeadphonesIcon size={26} color="#ef4444" />
            </View>
            <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800", textAlign: "center" }}>
              Suporte necessário
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 13, textAlign: "center", lineHeight: 20 }}>
              Como o pacote já foi coletado, o cancelamento precisa de análise do suporte.
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("SupportCenter")}
              activeOpacity={0.85}
              style={{
                width: "100%", height: 52, borderRadius: 16, backgroundColor: "#02de95",
                alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
              }}
            >
              <HeadphonesIcon size={18} color="#091A2F" />
              <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                Falar com Suporte
              </Text>
            </TouchableOpacity>
          </MotiView>
        ) : (
          <View style={{ gap: 10 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
              Motivo do cancelamento
            </Text>
            {CANCEL_REASONS.map((reason, index) => {
              const selected = selectedReason === reason.id;
              return (
                <MotiView
                  key={reason.id}
                  from={{ opacity: 0, translateX: -10 }}
                  animate={{ opacity: 1, translateX: 0 }}
                  transition={{ delay: 80 + index * 40 }}
                >
                  <TouchableOpacity
                    onPress={() => setSelectedReason(reason.id)}
                    activeOpacity={0.8}
                    style={{
                      flexDirection: "row", alignItems: "center", gap: 14,
                      backgroundColor: selected ? "rgba(2,222,149,0.10)" : "#11253E",
                      borderRadius: 16, padding: 16,
                      borderWidth: 1.5,
                      borderColor: selected ? "#02de95" : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <Text style={{ fontSize: 22 }}>{reason.emoji}</Text>
                    <Text style={{ flex: 1, color: selected ? "#02de95" : "#fff", fontSize: 14, fontWeight: selected ? "800" : "600" }}>
                      {reason.label}
                    </Text>
                    {selected && <CheckCircle size={18} color="#02de95" />}
                  </TouchableOpacity>
                </MotiView>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Botão fixo de confirmação */}
      {!warningConfig.blocked && (
        <View style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          paddingHorizontal: 20, paddingBottom: insets.bottom + 16, paddingTop: 12,
          backgroundColor: "rgba(9,26,47,0.97)",
          borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)",
        }}>
          <TouchableOpacity
            onPress={handleCancel}
            disabled={!canSubmit || loading}
            activeOpacity={0.85}
            style={{
              height: 56, borderRadius: 18,
              backgroundColor: canSubmit && !loading ? "rgba(239,68,68,0.85)" : "rgba(239,68,68,0.2)",
              alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 10,
              borderWidth: 1.5,
              borderColor: canSubmit && !loading ? "rgba(239,68,68,0.6)" : "rgba(239,68,68,0.15)",
            }}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : effectiveEstimatedFee > 0 ? (
              <>
                <DollarSign size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15, textTransform: "uppercase" }}>
                  Cancelar e pagar {formatBRL(effectiveEstimatedFee)}
                </Text>
              </>
            ) : (
              <>
                <AlertTriangle size={18} color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 15, textTransform: "uppercase" }}>
                  Confirmar Cancelamento
                </Text>
              </>
            )}
          </TouchableOpacity>
          {!canSubmit && !loading && (
            <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, textAlign: "center", marginTop: 8 }}>
              Selecione um motivo para continuar
            </Text>
          )}
        </View>
      )}
    </View>
  );
}
