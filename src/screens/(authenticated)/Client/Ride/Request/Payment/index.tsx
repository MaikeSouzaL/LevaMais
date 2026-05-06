import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { FlowStepHeader, PaymentMethodCard, LoadingButton } from "../../../Shared/components";
import rideService from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { mapServiceModeToApi, mapVehicleTypeToApi, formatBRL } from "@/utils/mappers";

type FinalOrderSummaryData = any;
type PaymentMethod = "credit_card" | "pix" | "cash";

type Params = {
  Payment: {
    amount: number;
    order?: FinalOrderSummaryData;
  };
};

const PAYMENT_METHODS = [
  {
    id: "credit_card" as PaymentMethod,
    icon: <MaterialIcons name="credit-card" size={24} color={colors.text.primary} />,
    label: "Cartao de credito",
    sublabel: "Pagamento no app",
  },
  {
    id: "pix" as PaymentMethod,
    icon: <MaterialCommunityIcons name="qrcode-scan" size={24} color="#32BCAD" />,
    label: "Pix",
    sublabel: "Aprovacao imediata",
  },
  {
    id: "cash" as PaymentMethod,
    icon: <FontAwesome5 name="money-bill-wave" size={20} color="#85bb65" />,
    label: "Dinheiro",
    sublabel: "Pagar ao motorista",
  },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const detectedCity = useClientCityStore((state) => state.city);
  const route = useRoute<RouteProp<Params, "Payment">>();
  const amount = route.params?.amount || 0;
  const order = route.params?.order;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(
    (order?.paymentMethodRaw as PaymentMethod) || "credit_card",
  );
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [scheduleOffsetMin, setScheduleOffsetMin] = useState(60);
  const [offerEnabled, setOfferEnabled] = useState(false);
  const [offerInput, setOfferInput] = useState(String(Math.round(Number(amount || 0))));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!order) {
      Toast.show({ type: "info", text1: "Finalize o resumo antes do pagamento" });
      navigation.navigate("Home");
    }
  }, [navigation, order]);

  const cityId = useMemo(() => {
    return (detectedCity as any)?._id || (detectedCity as any)?.id || detectedCity?.cityId || undefined;
  }, [detectedCity]);

  const suggestedMinOffer = useMemo(() => Number((Number(amount || 0) * 0.8).toFixed(2)), [amount]);
  const parsedOfferValue = useMemo(
    () => Number(String(offerInput || "").replace(",", ".")),
    [offerInput],
  );

  const handleConfirmPayment = async () => {
    setError(null);

    if (!order) return;

    if (!order.pickupLatLng || !order.dropoffLatLng) {
      setError("Faltam coordenadas de coleta ou destino.");
      return;
    }

    const parsedOffer = parsedOfferValue;

    try {
      setLoading(true);

      const scheduledFor = scheduleEnabled
        ? new Date(Date.now() + scheduleOffsetMin * 60 * 1000).toISOString()
        : undefined;

      const ride = await rideService.create({
        serviceType: mapServiceModeToApi(order.serviceMode),
        vehicleType: mapVehicleTypeToApi(order.vehicleType),
        cityId,
        purposeId: order.purposeId,
        pickup: {
          address: order.pickupAddress,
          latitude: Number(order.pickupLatLng.latitude),
          longitude: Number(order.pickupLatLng.longitude),
        },
        dropoff: {
          address: order.dropoffAddress,
          latitude: Number(order.dropoffLatLng.latitude),
          longitude: Number(order.dropoffLatLng.longitude),
        },
        pricing: {
          basePrice: Number(order.pricing.base || 0),
          distancePrice: Number(order.pricing.distancePrice || 0),
          serviceFee: Number(order.pricing.serviceFee || 0),
          total: Number(order.pricing.total || 0),
          currency: "BRL",
        },
        distance: {
          value: Math.round((Number(order.pricing.distanceKm || 0) || 0) * 1000),
          text: `${Number(order.pricing.distanceKm || 0).toFixed(1)} km`,
        },
        duration: {
          value: (Number(order.etaMinutes || 0) || 0) * 60,
          text: order.etaMinutes ? `${order.etaMinutes} min` : "",
        },
        details: {
          itemType: order.itemType,
          needsHelper: order.helperIncluded,
          insurance: (order.insuranceLevel as any) || "none",
        },
        payment: {
          method: {
            type: selectedMethod,
          },
        },
        scheduledFor,
        negotiation: offerEnabled
          ? {
              enabled: true,
              clientOffer: Number.isFinite(parsedOffer) && parsedOffer > 0 ? parsedOffer : Number(amount || 0),
            }
          : undefined,
      });

      if (ride?.status === "scheduled") {
        Toast.show({
          type: "success",
          text1: "Corrida agendada",
          text2: "Acompanhe o pedido na tela de pedidos ativos.",
        });
        navigation.navigate("ActiveOrders");
        return;
      }

      if (offerEnabled) {
        Toast.show({
          type: "success",
          text1: "Oferta enviada",
          text2: "Agora acompanhe as propostas dos motoristas.",
        });
        navigation.navigate("RideOffersMarketplace", { rideId: ride._id });
        return;
      }

      navigation.navigate("Home", {
        startSearch: true,
        rideId: ride._id,
        searchData: {
          title: "Buscando motorista",
          price: formatBRL(amount),
          eta: order.etaText || "Chegada em ~5 min",
          rideId: ride._id,
        },
      });
    } catch (e: any) {
      const activeRideId = e?.response?.data?.rideId;
      const message = e?.response?.data?.error || e?.message;

      if (activeRideId) {
        setError("Voce ja possui uma corrida ativa. Abrindo acompanhamento...");
        setTimeout(() => {
          navigation.navigate("RideTracking", { rideId: activeRideId });
        }, 700);
        return;
      }

      setError(message || "Falha ao confirmar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlowStepHeader
        title="Pagamento"
        subtitle="Etapa 4: confirme e solicite"
        currentStep={4}
        totalSteps={4}
        onBack={() => navigation.goBack()}
      />

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, spacing.xl) + 170 }]}>
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Total estimado</Text>
          <Text style={styles.totalValue}>{formatBRL(amount)}</Text>
        </View>

        {!!order && (
          <View style={styles.tripCard}>
            <Text style={styles.tripTitle}>Resumo rapido</Text>

            <View style={styles.tripRow}>
              <View style={styles.dotPickup} />
              <Text style={styles.tripText} numberOfLines={1}>{order.pickupAddress || "Origem"}</Text>
            </View>

            <View style={styles.tripDivider} />

            <View style={styles.tripRow}>
              <MaterialIcons name="location-on" size={14} color="#ff6b6b" />
              <Text style={styles.tripText} numberOfLines={1}>{order.dropoffAddress || "Destino"}</Text>
            </View>

            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.adjustBtn}>
              <MaterialIcons name="edit" size={15} color={colors.primary[500]} />
              <Text style={styles.adjustText}>Editar pedido</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.sectionTitle}>Forma de pagamento</Text>

        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            id={method.id}
            icon={method.icon}
            label={method.label}
            sublabel={method.sublabel}
            selected={selectedMethod === method.id}
            onPress={() => setSelectedMethod(method.id)}
          />
        ))}

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>Agendar corrida/entrega</Text>
            <TouchableOpacity
              onPress={() => setScheduleEnabled((prev) => !prev)}
              style={[styles.toggleChip, scheduleEnabled && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleText, scheduleEnabled && styles.toggleTextActive]}>
                {scheduleEnabled ? "Ativado" : "Desativado"}
              </Text>
            </TouchableOpacity>
          </View>

          {scheduleEnabled && (
            <View style={styles.quickChoices}>
              {[30, 60, 120].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setScheduleOffsetMin(minutes)}
                  style={[styles.choiceChip, scheduleOffsetMin === minutes && styles.choiceChipActive]}
                >
                  <Text style={[styles.choiceText, scheduleOffsetMin === minutes && styles.choiceTextActive]}>
                    {minutes < 60 ? `${minutes} min` : `${minutes / 60}h`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.optionCard}>
          <View style={styles.optionHeader}>
            <Text style={styles.optionTitle}>Oferecer um valor</Text>
            <TouchableOpacity
              onPress={() => setOfferEnabled((prev) => !prev)}
              style={[styles.toggleChip, offerEnabled && styles.toggleChipActive]}
            >
              <Text style={[styles.toggleText, offerEnabled && styles.toggleTextActive]}>
                {offerEnabled ? "Ativado" : "Desativado"}
              </Text>
            </TouchableOpacity>
          </View>

          {offerEnabled && (
            <>
              <Text style={styles.helperText}>
                Valor sugerido minimo para motoristas: {formatBRL(suggestedMinOffer)}
              </Text>
              <TextInput
                style={styles.offerInput}
                value={offerInput}
                onChangeText={setOfferInput}
                keyboardType="numeric"
                placeholder="Digite sua oferta"
                placeholderTextColor={colors.text.tertiary}
              />
              <Text style={styles.helperText}>
                Se sua oferta ficar muito abaixo, menos motoristas podem aceitar.
              </Text>
              {Number.isFinite(parsedOfferValue) &&
                parsedOfferValue > 0 &&
                parsedOfferValue < suggestedMinOffer && (
                  <Text style={styles.warningText}>
                    Oferta abaixo do minimo sugerido.
                  </Text>
                )}
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <LoadingButton
          title={loading ? "Confirmando..." : `Confirmar e pedir ${formatBRL(amount)}`}
          onPress={handleConfirmPayment}
          loading={loading}
          variant="primary"
          disabled={loading || !order}
        />

        <Text style={styles.footerNote}>Ao confirmar, iniciaremos a busca do motorista mais proximo.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollContent: { padding: spacing.xl },
  totalCard: {
    backgroundColor: "rgba(17,37,62,0.64)",
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  totalLabel: { color: colors.text.secondary, fontSize: fontSize.sm, marginBottom: spacing.xs },
  totalValue: { color: colors.primary[500], fontSize: 38, fontWeight: fontWeight.bold },
  tripCard: {
    backgroundColor: "rgba(17,37,62,0.64)",
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  tripTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
  },
  tripRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  dotPickup: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary[500], marginLeft: 2 },
  tripText: { flex: 1, color: colors.text.primary, fontSize: fontSize.sm },
  tripDivider: { height: 1, marginVertical: spacing.sm, backgroundColor: colors.border.light },
  adjustBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.08)",
  },
  adjustText: { color: colors.primary[500], fontWeight: fontWeight.semibold, fontSize: fontSize.sm },
  sectionTitle: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  optionCard: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
    gap: spacing.sm,
  },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  optionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
  },
  toggleChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  toggleChipActive: {
    borderColor: "rgba(2,222,149,0.4)",
    backgroundColor: "rgba(2,222,149,0.14)",
  },
  toggleText: { color: colors.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  toggleTextActive: { color: colors.primary[500] },
  quickChoices: { flexDirection: "row", gap: spacing.sm },
  choiceChip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  choiceChipActive: {
    borderColor: "rgba(2,222,149,0.4)",
    backgroundColor: "rgba(2,222,149,0.14)",
  },
  choiceText: { color: colors.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  choiceTextActive: { color: colors.primary[500] },
  helperText: { color: colors.text.tertiary, fontSize: fontSize.xs },
  warningText: { color: "#fbbf24", fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  offerInput: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: "rgba(15,35,28,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  errorContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,75,75,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,75,75,0.25)",
  },
  errorText: { color: "#ffb3b3", fontSize: fontSize.sm },
  footerNote: {
    marginTop: spacing.sm,
    textAlign: "center",
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
});
