import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../../types/navigation";

const QUICK_TAGS = [
  "Educado",
  "Chegou rapido",
  "Boa comunicacao",
  "Dirigiu com cuidado",
  "Atendimento excelente",
];

const ratingLabels: Record<number, string> = {
  1: "Muito ruim",
  2: "Ruim",
  3: "Regular",
  4: "Bom",
  5: "Excelente",
};

export default function RideCompletedScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "RideCompleted">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "RideCompleted">>();
  const rideId = route.params?.rideId;
  const total = route.params?.total;
  const pickupAddress = route.params?.pickupAddress;
  const dropoffAddress = route.params?.dropoffAddress;
  const driverName = route.params?.driverName;
  const serviceType = route.params?.serviceType;
  const isDelivery =
    serviceType === "delivery" || serviceType === "frete";

  // Rating state
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [sendingRating, setSendingRating] = useState(false);

  // Tip state
  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [sendingTip, setSendingTip] = useState(false);

  const canSubmitRating = useMemo(
    () => Boolean(rideId && rating >= 1 && rating <= 5),
    [rideId, rating],
  );

  const toggleTag = (tag: string) => {
    const tags = comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean);
    const exists = tags.includes(tag);
    const next = exists ? tags.filter((t) => t !== tag) : [...tags, tag];
    setComment(next.join("; "));
  };

  const hasTag = (tag: string) =>
    comment
      .split(";")
      .map((t) => t.trim())
      .filter(Boolean)
      .includes(tag);

  const handleSubmitRating = async () => {
    if (!canSubmitRating || !rideId) return;
    setSendingRating(true);
    try {
      await rideService.rateClientToDriver(rideId, {
        stars: rating,
        comment: comment.trim() || undefined,
      });
      Toast.show({ type: "success", text1: "Avaliacao enviada" });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel enviar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setSendingRating(false);
    }
  };

  const handleQuickTip = async (amount: number) => {
    if (!rideId || sendingTip) return;
    setSendingTip(true);
    try {
      await rideService.addTip(rideId, amount);
      setSelectedTip(amount);
      Toast.show({
        type: "success",
        text1: "Gorjeta enviada!",
        text2: `Você enviou R$ ${amount.toFixed(2)} ao motorista. Obrigado!`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar gorjeta",
        text2: err?.message || "Tente novamente",
      });
    } finally {
      setSendingTip(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title={isDelivery ? "Entrega finalizada" : "Corrida finalizada"}
        subtitle="Pedido concluido com sucesso"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Conclusão */}
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={72} color={colors.primary[500]} />
        </View>
        <Text style={styles.title}>Tudo certo!</Text>
        <Text style={styles.subtitle}>Seu pedido foi concluido e registrado no historico.</Text>

        {/* Resumo da corrida */}
        <View style={styles.summaryCard}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View style={styles.driverAvatar}>
              <MaterialIcons name="person" size={24} color={colors.primary[500]} />
            </View>
            <View>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
                {driverName || "Onze Motores App"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Seu Motorista</Text>
            </View>
          </View>

          <View style={styles.dottedDivider} />

          {!!pickupAddress && (
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary[500] }]} />
              <Text style={styles.meta} numberOfLines={1}>Coleta: {pickupAddress}</Text>
            </View>
          )}
          {!!dropoffAddress && (
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: "#ef4444" }]} />
              <Text style={styles.meta} numberOfLines={1}>Destino: {dropoffAddress}</Text>
            </View>
          )}

          <View style={styles.dottedDivider} />

          <View style={styles.totalRow}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "700" }}>Total pago:</Text>
            {typeof total === "number" && (
              <Text style={styles.total}>R$ {Number(total).toFixed(2)}</Text>
            )}
          </View>
        </View>

        {/* Avaliação do motorista */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Avaliar motorista</Text>
          <Text style={styles.sectionSubtitle}>
            Como foi a {isDelivery ? "entrega" : "corrida"} com {driverName}?
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} disabled={sendingRating}>
                <MaterialIcons
                  name={star <= rating ? "star" : "star-border"}
                  size={40}
                  color={colors.primary[500]}
                />
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.ratingLabel}>
            {rating > 0 ? ratingLabels[rating] : "Toque nas estrelas para avaliar"}
          </Text>

          <Text style={[styles.sectionTitle, { marginTop: spacing.md }]}>Destaques (opcional)</Text>
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  activeOpacity={0.8}
                  disabled={sendingRating}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Comentario adicional (opcional)"
            placeholderTextColor={colors.text.tertiary}
            multiline
            style={styles.input}
            editable={!sendingRating}
          />

          {canSubmitRating && !sendingRating && (
            <TouchableOpacity style={styles.sendRatingBtn} onPress={handleSubmitRating}>
              <Text style={styles.sendRatingText}>Enviar avaliacao</Text>
            </TouchableOpacity>
          )}
          {sendingRating && (
            <ActivityIndicator size="small" color={colors.primary[500]} style={{ marginTop: spacing.md }} />
          )}
        </View>

        {/* Gorjeta */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Gorjeta</Text>
          <Text style={styles.sectionSubtitle}>
            Deseja reconhecer o motorista com uma gorjeta?
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: spacing.sm }}>
            {[2, 5, 10].map((val) => {
              const isSelected = selectedTip === val;
              return (
                <TouchableOpacity
                  key={val}
                  disabled={sendingTip || selectedTip !== null}
                  onPress={() => handleQuickTip(val)}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 12,
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary[500] : "rgba(255,255,255,0.1)",
                    backgroundColor: isSelected ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.03)",
                  }}
                >
                  {sendingTip && selectedTip === null ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ color: isSelected ? colors.primary[500] : "#fff", fontSize: 13, fontWeight: "900" }}>
                      + R$ {val},00
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <LoadingButton
          title={canSubmitRating && !sendingRating ? "Pular avaliacao" : "Voltar ao inicio"}
          onPress={() => navigation.navigate("Home")}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scroll: { flex: 1 },
  scrollContent: { padding: spacing.xl, paddingBottom: 140 },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "rgba(2,222,149,0.09)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.28)",
    marginBottom: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    textAlign: "center",
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,37,62,0.62)",
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  driverAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    marginVertical: 10,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  meta: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  total: {
    color: colors.primary[500],
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  sectionSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.md,
  },
  stars: { flexDirection: "row", justifyContent: "center", gap: spacing.sm },
  ratingLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.primary,
  },
  tagChipSelected: {
    borderColor: colors.primary[500],
    backgroundColor: "rgba(2,222,149,0.12)",
  },
  tagText: { color: colors.text.secondary, fontSize: fontSize.sm },
  tagTextSelected: { color: colors.primary[500], fontWeight: fontWeight.semibold },
  input: {
    minHeight: 80,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    textAlignVertical: "top",
  },
  sendRatingBtn: {
    marginTop: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  sendRatingText: {
    color: "#091A2F",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,25,20,0.96)",
  },
});
