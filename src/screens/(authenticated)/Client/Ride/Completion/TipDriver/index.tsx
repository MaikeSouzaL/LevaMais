import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { LoadingButton, ClientScreenHeader } from "../../../Shared/components";
import { formatBRL } from "@/utils/mappers";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../../types/navigation";

const TIP_OPTIONS = [2, 5, 8, 12, 20];
const CUSTOM_PRESETS = [5, 10, 15, 20, 25, 30, 50];

export default function TipDriverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "TipDriver">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "TipDriver">>();
  const rideId = route.params?.rideId;
  const driverName = route.params?.driverName || "Motorista";

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [customValue, setCustomValue] = useState<number | null>(null);
  const [sending, setSending] = useState(false);

  const tipValue = useMemo(() => selectedTip || customValue || 0, [selectedTip, customValue]);

  async function handleSendTip() {
    if (tipValue <= 0) {
      Toast.show({ type: "error", text1: "Selecione um valor de gorjeta" });
      return;
    }

    setSending(true);
    try {
      await rideService.addTip(rideId, tipValue);
      Toast.show({
        type: "success",
        text1: "Gorjeta enviada!",
        text2: `${formatBRL(tipValue)} para ${driverName}`,
      });
      navigation.reset({ index: 0, routes: [{ name: "Home" }] });
    } catch {
      Toast.show({ type: "error", text1: "Erro ao enviar gorjeta" });
    } finally {
      setSending(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Gorjeta"
        subtitle={`Enviar para ${driverName}`}
        showBack
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.xl) + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroCard}>
          <Icon name="volunteer-activism" size={36} color={colors.primary[500]} />
          <Text style={styles.heroTitle}>Reconheca o bom atendimento</Text>
          <Text style={styles.heroSubtitle}>
            A gorjeta vai 100% para o motorista.
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Valores sugeridos</Text>
        <View style={styles.grid}>
          {TIP_OPTIONS.map((v) => {
            const active = selectedTip === v;
            return (
              <TouchableOpacity
                key={v}
                style={[styles.tipChip, active && styles.tipChipSelected]}
                onPress={() => {
                  setSelectedTip(v);
                  setCustomValue(null);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipChipText, active && styles.tipChipTextSelected]}>
                  {formatBRL(v)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Outro valor</Text>
        <View style={styles.grid}>
          {CUSTOM_PRESETS.map((v) => {
            const active = selectedTip == null && customValue === v;
            return (
              <TouchableOpacity
                key={v}
                style={[styles.tipChip, active && styles.tipChipSelected]}
                onPress={() => {
                  setSelectedTip(null);
                  setCustomValue(v);
                }}
                activeOpacity={0.8}
              >
                <Text style={[styles.tipChipText, active && styles.tipChipTextSelected]}>
                  R$ {v}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.skipLink}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })}
        >
          <Text style={styles.skipText}>Pular gorjeta</Text>
        </TouchableOpacity>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
      >
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Valor da gorjeta</Text>
          <Text style={styles.totalValue}>{tipValue > 0 ? formatBRL(tipValue) : "-"}</Text>
        </View>

        <LoadingButton
          title={tipValue > 0 ? `Enviar ${formatBRL(tipValue)}` : "Selecione um valor"}
          onPress={handleSendTip}
          variant="primary"
          loading={sending}
          disabled={tipValue <= 0 || sending || !rideId}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  heroCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.xl,
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  heroTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tipChip: {
    minWidth: 88,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  tipChipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: "rgba(2,222,149,0.12)",
  },
  tipChipText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  tipChipTextSelected: {
    color: colors.primary[500],
  },
  skipLink: {
    alignSelf: "center",
    marginTop: spacing.sm,
  },
  skipText: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: "rgba(10,25,20,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  totalLabel: { color: colors.text.secondary, fontSize: fontSize.sm },
  totalValue: { color: colors.primary[500], fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
