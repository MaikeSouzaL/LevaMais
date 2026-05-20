import React, { useCallback, useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import rideService, { Ride } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { Modal } from "@/components/Modal";
import { Zap, Coins, TrendingDown, Eye, Users, Clock, CheckCircle, AlertCircle } from "lucide-react-native";
import { ClientStackParamList } from "../../types/navigation";

function rideTitle(ride: Ride) {
  return ride.serviceType === "delivery" ? "Entrega" : "Corrida";
}

function mapStatusLabel(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "scheduled") return "agendada";
  if (normalized === "payment_pending") return "aguardando pagamento";
  if (normalized === "driver_assigned") return "motorista selecionado";
  if (normalized === "requesting") return "buscando motoristas";
  return normalized.replaceAll("_", " ");
}

function getStatusColor(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "requesting") return "#F59E0B"; // Amber
  if (normalized === "payment_pending") return "#3B82F6"; // Blue
  if (normalized === "driver_assigned") return "#10B981"; // Green
  return "#6B7280"; // Gray
}

function getStatusIcon(status?: string) {
  const normalized = String(status || "").toLowerCase();
  if (normalized === "requesting") return Clock;
  if (normalized === "payment_pending") return AlertCircle;
  if (normalized === "driver_assigned") return CheckCircle;
  return Clock;
}

export default function ActiveOrdersScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [editingRideId, setEditingRideId] = useState<string | null>(null);
  const [cancellingRideId, setCancellingRideId] = useState<string | null>(null);

  const [adjustingRide, setAdjustingRide] = useState<Ride | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingIncrement, setPendingIncrement] = useState("5");
  const [isSubtractMode, setIsSubtractMode] = useState(false);
  const [isIncreasing, setIsIncreasing] = useState(false);

  const load = useCallback(async () => {
    const res = await rideService.getActiveList();
    setRides(res?.rides || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openConfirmModal = (ride: Ride, val: number) => {
    setAdjustingRide(ride);
    setPendingIncrement(val > 0 ? String(val) : "");
    setIsSubtractMode(false);
    setShowConfirmModal(true);
  };

  const handleConfirmIncrease = async () => {
    if (!adjustingRide) return;
    const cleanVal = pendingIncrement.replace(",", ".");
    let numVal = parseFloat(cleanVal);
    
    if (isNaN(numVal) || numVal <= 0) {
      Toast.show({ type: "error", text1: "Valor inválido", text2: "Informe um valor maior que zero." });
      return;
    }

    if (isSubtractMode) {
       numVal = -numVal;
    }

    const currentBase = Number(adjustingRide.negotiation?.clientOffer || adjustingRide.pricing?.total || 0);
    const minFloor = Number(adjustingRide.negotiation?.suggestedMinPrice || adjustingRide.pricing?.subtotal || 5.0);
    const finalPredict = currentBase + numVal;

    if (finalPredict < minFloor) {
      Toast.show({
        type: "error",
        text1: "Limite Mínimo Atingido",
        text2: `Sua proposta não pode ser menor que o valor inicial de ${formatBRL(minFloor)}.`,
      });
      return;
    }

    setShowConfirmModal(false);
    if (isIncreasing) return;
    setIsIncreasing(true);
    try {
      const res = await rideService.increaseOffer(adjustingRide._id, numVal);
      if (res.success) {
        Toast.show({
          type: "success",
          text1: isSubtractMode ? "Oferta Reduzida! 📉" : "Oferta Aumentada! 🚀",
          text2: `Sua nova oferta agora é ${formatBRL(res.newOffer)}!`,
        });
        await load();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao ajustar",
        text2: e?.response?.data?.error || e?.message || "Tente novamente.",
      });
    } finally {
      setIsIncreasing(false);
      setAdjustingRide(null);
    }
  };

  // Group rides by status
  const requestingRides = rides.filter(r => r.status === "requesting" && (!r.negotiation?.offers || r.negotiation.offers.length === 0));
  const negotiatingRides = rides.filter(r => r.status === "requesting" && r.negotiation?.offers && r.negotiation.offers.length > 0);
  const paymentPendingRides = rides.filter(r => r.status === "payment_pending");
  const otherRides = rides.filter(r => !["requesting", "payment_pending"].includes(r.status || ""));

  const renderRideCard = (ride: Ride) => {
    const offersCount = ride.negotiation?.offers?.length || 0;
    const hasOffers = offersCount > 0;
    const StatusIcon = getStatusIcon(ride.status);
    const statusColor = getStatusColor(ride.status);
    const isRequesting = ride.status === "requesting";
    const isPaymentPending = ride.status === "payment_pending";

    return (
      <MotiView
        key={ride._id}
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "timing", duration: 300 }}
        style={styles.rideCard}
      >
        {/* Header with status */}
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rideType}>{rideTitle(ride)}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
              <StatusIcon size={12} color={statusColor} style={{ marginRight: 4 }} />
              <Text style={[styles.rideStatus, { color: statusColor }]}>
                {mapStatusLabel(ride.status)}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={{ color: colors.primary[500], fontSize: fontSize.xl, fontWeight: fontWeight.black }}>
              {formatBRL(Number(ride.negotiation?.clientOffer || ride.pricing?.total || 0))}
            </Text>
            <Text style={{ color: colors.text.tertiary, fontSize: fontSize.xs }}>
              sua oferta
            </Text>
          </View>
        </View>

        {/* Negotiation status indicator */}
        {isRequesting && (
          <View style={{
            marginTop: spacing.sm,
            padding: spacing.sm,
            backgroundColor: hasOffers ? "rgba(16, 185, 129, 0.1)" : "rgba(245, 158, 11, 0.1)",
            borderRadius: borderRadius.md,
            borderWidth: 1,
            borderColor: hasOffers ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
          }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
                {hasOffers ? (
                  <>
                    <Users size={16} color="#10B981" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#10B981", fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>
                      {offersCount} {offersCount === 1 ? "motorista interessado" : "motoristas interessados"}
                    </Text>
                  </>
                ) : (
                  <>
                    <Eye size={16} color="#F59E0B" style={{ marginRight: 6 }} />
                    <Text style={{ color: "#F59E0B", fontSize: fontSize.sm, fontWeight: fontWeight.bold }}>
                      Aguardando motoristas...
                    </Text>
                  </>
                )}
              </View>
              {hasOffers && (
                <View style={{
                  backgroundColor: "#10B981",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>
                    {offersCount} NOVA{offersCount > 1 ? "S" : ""}
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Addresses */}
        <View style={{ marginTop: spacing.sm }}>
          <Text style={styles.address}>
            <Text style={{ fontWeight: fontWeight.bold }}>Coleta: </Text>
            {ride.pickup?.address || "Não informado"}
          </Text>
          <Text style={styles.address}>
            <Text style={{ fontWeight: fontWeight.bold }}>Entrega: </Text>
            {ride.dropoff?.address || "Não informado"}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.cardActions}>
          {hasOffers && isRequesting && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#10B981" }]}
              onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: ride._id })}
            >
              <Text style={[styles.primaryBtnText, { color: "#fff" }]}>
                🎯 Ver {offersCount} Proposta{offersCount > 1 ? "s" : ""}
              </Text>
            </TouchableOpacity>
          )}

          {isPaymentPending && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: "#3B82F6" }]}
              onPress={() => navigation.navigate("DeliveryPaymentConfirm", { rideId: ride._id })}
            >
              <Text style={[styles.primaryBtnText, { color: "#fff" }]}>
                💳 Confirmar Pagamento
              </Text>
            </TouchableOpacity>
          )}

          {!hasOffers && isRequesting && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => openConfirmModal(ride, 5)}
            >
              <Zap size={16} color={colors.primary[500]} style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Aumentar Oferta</Text>
            </TouchableOpacity>
          )}

          {ride.driverId && !isRequesting && !isPaymentPending && (
            <TouchableOpacity
              style={styles.trackBtn}
              onPress={() => navigation.navigate("RideTracking", { rideId: ride._id })}
            >
              <MaterialIcons name="location-on" size={18} color={colors.text.primary} style={{ marginRight: 6 }} />
              <Text style={styles.trackBtnText}>Rastrear Entrega</Text>
            </TouchableOpacity>
          )}
        </View>
      </MotiView>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pedidos ativos</Text>
          <View style={{ width: 42 }} />
        </View>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={{ color: colors.text.tertiary, marginTop: spacing.md }}>
            Carregando pedidos...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pedidos ativos</Text>
        <View style={{ width: 42 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary[500]} />}
      >
        {rides.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Nenhum pedido ativo</Text>
            <Text style={styles.emptyText}>
              Você não tem pedidos em andamento no momento.
            </Text>
          </View>
        ) : (
          <>
            {/* Section: Em Negociação */}
            {negotiatingRides.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.md,
                  paddingHorizontal: spacing.xs,
                }}>
                  <Users size={18} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: "#10B981",
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    Em Negociação ({negotiatingRides.length})
                  </Text>
                </View>
                <Text style={[styles.subtitle, { marginBottom: spacing.md, paddingHorizontal: spacing.xs }]}>
                  Motoristas estão analisando e fazendo propostas
                </Text>
                {negotiatingRides.map(renderRideCard)}
              </View>
            )}

            {/* Section: Aguardando Motoristas */}
            {requestingRides.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.md,
                  paddingHorizontal: spacing.xs,
                }}>
                  <Clock size={18} color="#F59E0B" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: "#F59E0B",
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    Aguardando Motoristas ({requestingRides.length})
                  </Text>
                </View>
                <Text style={[styles.subtitle, { marginBottom: spacing.md, paddingHorizontal: spacing.xs }]}>
                  Seu pedido foi publicado e está sendo enviado para motoristas próximos
                </Text>
                {requestingRides.map(renderRideCard)}
              </View>
            )}

            {/* Section: Aguardando Pagamento */}
            {paymentPendingRides.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.md,
                  paddingHorizontal: spacing.xs,
                }}>
                  <AlertCircle size={18} color="#3B82F6" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: "#3B82F6",
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    Aguardando Pagamento ({paymentPendingRides.length})
                  </Text>
                </View>
                <Text style={[styles.subtitle, { marginBottom: spacing.md, paddingHorizontal: spacing.xs }]}>
                  Confirme o pagamento para o motorista iniciar a entrega
                </Text>
                {paymentPendingRides.map(renderRideCard)}
              </View>
            )}

            {/* Section: Outros */}
            {otherRides.length > 0 && (
              <View style={{ marginBottom: spacing.lg }}>
                <View style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: spacing.md,
                  paddingHorizontal: spacing.xs,
                }}>
                  <CheckCircle size={18} color="#10B981" style={{ marginRight: 8 }} />
                  <Text style={{
                    color: colors.text.primary,
                    fontSize: fontSize.base,
                    fontWeight: fontWeight.bold,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}>
                    Em Andamento ({otherRides.length})
                  </Text>
                </View>
                {otherRides.map(renderRideCard)}
              </View>
            )}
          </>
        )}
      </ScrollView>

      {/* Modal for adjusting offer */}
      <Modal
        visible={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title={isSubtractMode ? "Reduzir Oferta" : "Aumentar Oferta"}
      >
        <View style={{ gap: spacing.md }}>
          <Text style={{ color: colors.text.secondary, fontSize: fontSize.sm, lineHeight: 20 }}>
            {isSubtractMode
              ? "Reduza sua oferta se achar que está muito alta. Atenção: isso pode diminuir o interesse dos motoristas."
              : "Aumente sua oferta para atrair mais motoristas rapidamente."}
          </Text>

          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <TouchableOpacity
              onPress={() => setIsSubtractMode(false)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                backgroundColor: !isSubtractMode ? colors.primary[500] : "transparent",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <Zap size={14} color={!isSubtractMode ? "#052013" : "rgba(255,255,255,0.5)"} style={{ marginRight: 6 }} />
              <Text style={{ color: !isSubtractMode ? "#052013" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "bold" }}>
                Adicionar (+)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsSubtractMode(true)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 40,
                borderRadius: 8,
                backgroundColor: isSubtractMode ? "#ef4444" : "transparent",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
              }}
            >
              <TrendingDown size={14} color={isSubtractMode ? "#fff" : "rgba(255,255,255,0.5)"} style={{ marginRight: 6 }} />
              <Text style={{ color: isSubtractMode ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "bold" }}>
                Subtrair (-)
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{
            width: "100%",
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255,255,255,0.05)",
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.1)",
            borderRadius: 16,
            paddingHorizontal: 16,
            height: 56,
          }}>
            <Text style={{
              color: !isSubtractMode ? "#02de95" : "#ef4444",
              fontSize: 18,
              fontWeight: "bold",
              marginRight: 8,
            }}>
              {isSubtractMode ? "- R$" : "R$"}
            </Text>
            <TextInput
              value={pendingIncrement}
              onChangeText={setPendingIncrement}
              keyboardType="decimal-pad"
              autoFocus
              style={{
                flex: 1,
                color: "#fff",
                fontSize: 18,
                fontWeight: "bold",
              }}
              placeholder="0,00"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />
          </View>

          <TouchableOpacity
            onPress={handleConfirmIncrease}
            disabled={isIncreasing}
            style={{
              backgroundColor: isSubtractMode ? "#ef4444" : colors.primary[500],
              borderRadius: borderRadius.md,
              paddingVertical: spacing.md,
              alignItems: "center",
              opacity: isIncreasing ? 0.6 : 1,
            }}
          >
            {isIncreasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={{ color: isSubtractMode ? "#fff" : "#052013", fontSize: fontSize.base, fontWeight: fontWeight.bold }}>
                {isSubtractMode ? "Confirmar Redução" : "Confirmar Aumento"}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"], gap: spacing.md },
  subtitle: { color: colors.text.tertiary, fontSize: fontSize.sm, lineHeight: 20 },
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  emptyTitle: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  emptyText: { color: colors.text.tertiary, fontSize: fontSize.sm },
  rideCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: spacing.sm },
  rideType: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.bold },
  rideStatus: { fontSize: fontSize.xs, fontWeight: fontWeight.bold, textTransform: "uppercase" },
  address: { color: colors.text.secondary, fontSize: fontSize.sm, marginBottom: 4 },
  cardActions: { marginTop: spacing.sm, gap: spacing.sm },
  trackBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(2,222,149,0.16)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.4)",
  },
  trackBtnText: { color: colors.text.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
  },
  primaryBtnText: { color: "#052013", fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.08)",
  },
  secondaryBtnText: { color: colors.primary[500], fontSize: fontSize.sm, fontWeight: fontWeight.bold },
});
