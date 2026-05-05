import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { LoadingButton, EmptyState } from "../../../Shared/components";
import { formatBRL } from "@/utils/mappers";

type FinalOrderSummaryData = {
  vehicleType: string;
  serviceMode?: "delivery" | "ride" | "frete";
  purposeId?: string;
  pickupAddress: string;
  pickupLatLng?: { latitude: number; longitude: number };
  dropoffAddress: string;
  dropoffLatLng?: { latitude: number; longitude: number };
  etaMinutes?: number;
  etaText?: string;
  servicePurposeLabel?: string;
  insuranceLevel: string;
  paymentMethodRaw?: "credit_card" | "pix" | "cash";
  pricing: {
    base: number;
    distancePrice: number;
    serviceFee: number;
    total: number;
    distanceKm: number;
  };
};

type Params = { FinalOrderSummary: { data: FinalOrderSummaryData } };

const VEHICLE_META: Record<
  string,
  { icon: string; label: string; iconLib: "MaterialCommunityIcons" | "MaterialIcons" }
> = {
  moto: { icon: "motorbike", label: "Moto", iconLib: "MaterialCommunityIcons" },
  motorcycle: { icon: "motorbike", label: "Moto", iconLib: "MaterialCommunityIcons" },
  car: { icon: "directions-car", label: "Carro", iconLib: "MaterialIcons" },
  van: { icon: "local-shipping", label: "Van", iconLib: "MaterialIcons" },
  truck: { icon: "truck", label: "Caminhao", iconLib: "MaterialCommunityIcons" },
};

const SERVICE_MODE_LABEL: Record<string, string> = {
  ride: "Transporte de passageiro",
  delivery: "Entrega",
  frete: "Frete",
};

export default function OrderSummaryScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<Params, "FinalOrderSummary">>();
  const navigation = useNavigation<any>();
  const data = route.params?.data;

  const vehicle = useMemo(
    () => VEHICLE_META[String(data?.vehicleType || "").toLowerCase()] || VEHICLE_META.car,
    [data?.vehicleType],
  );

  const handleContinue = () => {
    if (!data) return;
    navigation.navigate("Payment", {
      amount: data.pricing.total,
      order: data,
    });
  };

  if (!data) {
    return (
      <EmptyState
        icon="receipt"
        title="Sem dados do pedido"
        description="Nao foi possivel carregar os dados do pedido"
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo do pedido</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="edit" size={20} color={colors.primary[500]} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, spacing.xl) + 140 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rota confirmada</Text>
          <View style={styles.addressCard}>
            <View style={styles.addressRow}>
              <View style={styles.pickupDot} />
              <Text style={styles.addressLabel}>Coleta</Text>
            </View>
            <Text style={styles.addressText}>{data.pickupAddress}</Text>

            <View style={styles.addressDivider} />

            <View style={styles.addressRow}>
              <MaterialIcons name="location-on" size={14} color="#ff6b6b" />
              <Text style={styles.addressLabel}>Destino</Text>
            </View>
            <Text style={styles.addressText}>{data.dropoffAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servico selecionado</Text>
          <View style={styles.serviceCard}>
            <View style={styles.vehicleIconBg}>
              {vehicle.iconLib === "MaterialCommunityIcons" ? (
                <MaterialCommunityIcons name={vehicle.icon as any} size={30} color={colors.primary[500]} />
              ) : (
                <MaterialIcons name={vehicle.icon as any} size={30} color={colors.primary[500]} />
              )}
            </View>
            <View style={{ flex: 1, marginLeft: spacing.lg }}>
              <Text style={styles.serviceName}>
                {SERVICE_MODE_LABEL[data.serviceMode || "delivery"] || data.servicePurposeLabel}
              </Text>
              <Text style={styles.serviceVehicle}>{vehicle.label}</Text>
            </View>
            {!!data.etaMinutes && (
              <View style={styles.etaBadge}>
                <Text style={styles.etaBadgeValue}>{data.etaMinutes} min</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detalhamento de valores</Text>
          <View style={styles.pricingCard}>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Tarifa base</Text>
              <Text style={styles.priceValue}>{formatBRL(data.pricing.base)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Distancia ({data.pricing.distanceKm.toFixed(1)} km)</Text>
              <Text style={styles.priceValue}>{formatBRL(data.pricing.distancePrice)}</Text>
            </View>
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Taxa de servico</Text>
              <Text style={styles.priceValue}>{formatBRL(data.pricing.serviceFee)}</Text>
            </View>
            <View style={styles.priceDivider} />
            <View style={styles.priceRow}>
              <Text style={styles.totalLabel}>Total estimado</Text>
              <Text style={styles.totalValue}>{formatBRL(data.pricing.total)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm }]}>
        <View style={styles.footerTotal}>
          <Text style={styles.footerTotalLabel}>Total estimado</Text>
          <Text style={styles.footerTotalValue}>{formatBRL(data.pricing.total)}</Text>
        </View>
        <LoadingButton title="Confirmar" onPress={handleContinue} variant="primary" />
      </View>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  headerTitle: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  scroll: { flex: 1 },
  section: { paddingHorizontal: spacing.xl, paddingTop: spacing.xl },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: 12,
    fontWeight: fontWeight.bold,
    letterSpacing: 1.1,
    marginBottom: spacing.md,
    textTransform: "uppercase",
  },
  addressCard: {
    backgroundColor: "rgba(17,37,62,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  addressRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs },
  pickupDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary[500] },
  addressLabel: { color: colors.text.tertiary, fontSize: fontSize.xs, textTransform: "uppercase" },
  addressText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    marginTop: 4,
  },
  addressDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: spacing.md },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(17,37,62,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  vehicleIconBg: {
    width: 62,
    height: 62,
    borderRadius: 18,
    backgroundColor: "rgba(2,222,149,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  serviceName: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  serviceVehicle: { color: colors.text.tertiary, fontSize: fontSize.sm, marginTop: 2 },
  etaBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(2,222,149,0.16)",
  },
  etaBadgeValue: { color: colors.primary[500], fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  pricingCard: {
    backgroundColor: "rgba(17,37,62,0.64)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  priceLabel: { color: colors.text.secondary, fontSize: fontSize.base },
  priceValue: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  priceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: spacing.md },
  totalLabel: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: fontWeight.bold },
  totalValue: { color: colors.primary[500], fontSize: 22, fontWeight: fontWeight.bold },
  footer: {
    backgroundColor: "rgba(10,25,20,0.97)",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  footerTotal: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md },
  footerTotalLabel: { color: colors.text.secondary, fontSize: fontSize.sm },
  footerTotalValue: { color: colors.primary[500], fontSize: 22, fontWeight: fontWeight.bold },
});
