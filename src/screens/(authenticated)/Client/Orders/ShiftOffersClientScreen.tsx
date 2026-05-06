import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import shiftOfferService, { ShiftOffer } from "@/services/shiftOffer.service";
import { formatBRL } from "@/utils/mappers";

function statusLabel(status: string) {
  const map: Record<string, string> = {
    open: "Aberto",
    accepted: "Aceito",
    completed: "Concluido",
    cancelled: "Cancelado",
    expired: "Expirado",
  };
  return map[String(status || "").toLowerCase()] || status;
}

export default function ShiftOffersClientScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [offers, setOffers] = useState<ShiftOffer[]>([]);

  const [title, setTitle] = useState("Plantao motoboy");
  const [description, setDescription] = useState("");
  const [dailyAmount, setDailyAmount] = useState("180");
  const [fuelIncluded, setFuelIncluded] = useState(false);
  const [startOffsetMin, setStartOffsetMin] = useState(60);
  const [durationHours, setDurationHours] = useState(8);

  const startAtISO = useMemo(
    () => new Date(Date.now() + startOffsetMin * 60 * 1000).toISOString(),
    [startOffsetMin],
  );
  const endAtISO = useMemo(
    () =>
      new Date(
        new Date(startAtISO).getTime() + durationHours * 60 * 60 * 1000,
      ).toISOString(),
    [startAtISO, durationHours],
  );

  const load = useCallback(async () => {
    const list = await shiftOfferService.listClientOffers();
    setOffers(list || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Erro ao carregar plantoes",
          text2: e?.message || "Tente novamente",
        });
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

  const createOffer = async () => {
    const amount = Number(String(dailyAmount || "").replace(",", "."));
    if (!Number.isFinite(amount) || amount <= 0) {
      Toast.show({ type: "error", text1: "Valor da diaria invalido" });
      return;
    }

    setSaving(true);
    try {
      await shiftOfferService.create({
        title: title.trim(),
        description: description.trim(),
        vehicleType: "motorcycle",
        dailyAmount: amount,
        fuelIncluded,
        startAt: startAtISO,
        endAt: endAtISO,
      });

      Toast.show({ type: "success", text1: "Plantao publicado" });
      await load();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao publicar plantao",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary[500]}
          />
        }
      >
        <Text style={styles.title}>Plantoes de motoboy</Text>
        <Text style={styles.subtitle}>
          Publique uma diaria para restaurante/lanchonete e aguarde aceite.
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Criar proposta</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Titulo"
            placeholderTextColor={colors.text.tertiary}
          />
          <TextInput
            style={[styles.input, styles.multiline]}
            value={description}
            onChangeText={setDescription}
            placeholder="Detalhes da rotina, local, etc."
            placeholderTextColor={colors.text.tertiary}
            multiline
          />
          <TextInput
            style={styles.input}
            value={dailyAmount}
            onChangeText={setDailyAmount}
            keyboardType="numeric"
            placeholder="Valor da diaria"
            placeholderTextColor={colors.text.tertiary}
          />

          <View style={styles.row}>
            <Text style={styles.label}>Gasolina inclusa</Text>
            <TouchableOpacity
              onPress={() => setFuelIncluded((prev) => !prev)}
              style={[styles.chip, fuelIncluded && styles.chipActive]}
            >
              <Text
                style={[styles.chipText, fuelIncluded && styles.chipTextActive]}
              >
                {fuelIncluded ? "Sim" : "Nao"}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.smallLabel}>Inicio em</Text>
          <View style={styles.rowWrap}>
            {[30, 60, 120].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                onPress={() => setStartOffsetMin(minutes)}
                style={[
                  styles.choice,
                  startOffsetMin === minutes && styles.choiceActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    startOffsetMin === minutes && styles.choiceTextActive,
                  ]}
                >
                  {minutes < 60 ? `${minutes} min` : `${minutes / 60}h`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.smallLabel}>Duracao</Text>
          <View style={styles.rowWrap}>
            {[4, 6, 8, 10, 12].map((hours) => (
              <TouchableOpacity
                key={hours}
                onPress={() => setDurationHours(hours)}
                style={[styles.choice, durationHours === hours && styles.choiceActive]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    durationHours === hours && styles.choiceTextActive,
                  ]}
                >
                  {hours}h
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.preview}>
            Inicio: {new Date(startAtISO).toLocaleString("pt-BR")}{"\n"}
            Fim: {new Date(endAtISO).toLocaleString("pt-BR")}
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            disabled={saving}
            onPress={createOffer}
          >
            <Text style={styles.primaryBtnText}>
              {saving ? "Publicando..." : "Publicar plantao"}
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Seus plantoes</Text>
        {loading ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Carregando...</Text>
          </View>
        ) : offers.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>Nenhum plantao publicado ainda.</Text>
          </View>
        ) : (
          offers.map((offer) => (
            <View key={offer._id} style={styles.offerCard}>
              <View style={styles.offerTop}>
                <Text style={styles.offerTitle}>{offer.title}</Text>
                <Text style={styles.offerValue}>{formatBRL(offer.dailyAmount)}</Text>
              </View>
              <Text style={styles.offerMeta}>
                {statusLabel(offer.status)} ·{" "}
                {offer.fuelIncluded ? "Com gasolina" : "Sem gasolina"}
              </Text>
              <Text style={styles.offerMeta}>
                {new Date(offer.startAt).toLocaleString("pt-BR")} ate{" "}
                {new Date(offer.endAt).toLocaleString("pt-BR")}
              </Text>
              {typeof offer.acceptedBy === "object" && offer.acceptedBy?.name && (
                <View style={styles.acceptedLine}>
                  <MaterialIcons name="check-circle" size={16} color={colors.primary[500]} />
                  <Text style={styles.acceptedText}>
                    Aceito por {offer.acceptedBy.name}
                  </Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing["3xl"] },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  subtitle: { color: colors.text.tertiary, fontSize: fontSize.sm, lineHeight: 20 },
  card: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  cardTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  input: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.primary,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: fontSize.base,
  },
  multiline: { minHeight: 80, textAlignVertical: "top" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  label: { color: colors.text.secondary, fontSize: fontSize.sm },
  chip: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: { borderColor: "rgba(2,222,149,0.35)", backgroundColor: "rgba(2,222,149,0.12)" },
  chipText: { color: colors.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  chipTextActive: { color: colors.primary[500] },
  smallLabel: { color: colors.text.tertiary, fontSize: fontSize.xs, marginTop: spacing.xs },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  choice: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.border.light,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  choiceActive: { borderColor: "rgba(2,222,149,0.35)", backgroundColor: "rgba(2,222,149,0.12)" },
  choiceText: { color: colors.text.secondary, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
  choiceTextActive: { color: colors.primary[500] },
  preview: { color: colors.text.tertiary, fontSize: fontSize.xs, lineHeight: 18 },
  primaryBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary[500],
  },
  primaryBtnText: { color: "#052013", fontWeight: fontWeight.bold },
  sectionTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  emptyCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  emptyText: { color: colors.text.tertiary, fontSize: fontSize.sm },
  offerCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: 4,
  },
  offerTop: { flexDirection: "row", justifyContent: "space-between", gap: spacing.sm },
  offerTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, flex: 1 },
  offerValue: { color: colors.primary[500], fontWeight: fontWeight.bold },
  offerMeta: { color: colors.text.tertiary, fontSize: fontSize.xs },
  acceptedLine: { flexDirection: "row", alignItems: "center", gap: spacing.xs, marginTop: 4 },
  acceptedText: { color: colors.primary[500], fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});
