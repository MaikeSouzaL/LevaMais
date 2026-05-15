import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import rideService from "@/services/ride.service";

type Params = {
  ClientRateDriver: {
    rideId: string;
    driverName?: string;
    serviceType?: string;
  };
};

const QUICK_TAGS = [
  "Educado",
  "Chegou rapido",
  "Boa comunicacao",
  "Dirigiu com cuidado",
  "Atendimento excelente",
];

export default function RateDriverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, "ClientRateDriver">>();
  const rideId = route.params?.rideId;
  const driverName = route.params?.driverName || "Motorista";
  const serviceType = route.params?.serviceType;
  const isDelivery = serviceType === "delivery" || serviceType === "frete";

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(
    () => Boolean(rideId && rating >= 1 && rating <= 5),
    [rideId, rating],
  );

  const ratingLabels: Record<number, string> = {
    1: "Muito ruim",
    2: "Ruim",
    3: "Regular",
    4: "Bom",
    5: "Excelente",
  };

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

  const handleSubmit = async () => {
    if (!canSubmit || !rideId) return;

    setLoading(true);
    try {
      await rideService.rateClientToDriver(rideId, {
        stars: rating,
        comment: comment.trim() || undefined,
      });

      Toast.show({ type: "success", text1: "Avaliacao enviada" });
      navigation.navigate("TipDriver", { rideId, driverName });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel enviar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Avaliar motorista"
        subtitle={`Como foi a ${isDelivery ? "entrega" : "corrida"} com ${driverName}?`}
        showBack
      />

      <ScrollView
        contentContainerStyle={{
          padding: spacing.xl,
          paddingBottom: Math.max(insets.bottom, spacing.xl) + 140,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Sua nota</Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <MaterialIcons
                  name={star <= rating ? "star" : "star-border"}
                  size={48}
                  color={colors.primary[500]}
                />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.ratingLabel}>
            {rating > 0 ? ratingLabels[rating] : "Toque nas estrelas para avaliar"}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Destaques (opcional)</Text>
          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  activeOpacity={0.8}
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
          />
        </View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
      >
        <LoadingButton
          title="Pular"
          onPress={() => navigation.navigate("Home")}
          variant="ghost"
          disabled={loading}
        />
        <LoadingButton
          title="Enviar avaliacao"
          onPress={handleSubmit}
          variant="primary"
          loading={loading}
          disabled={!canSubmit || loading}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  card: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    textAlign: "center",
    marginBottom: spacing.md,
  },
  stars: { flexDirection: "row", justifyContent: "center", gap: spacing.md },
  ratingLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: "center",
    marginTop: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
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
    minHeight: 110,
    backgroundColor: colors.background.primary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.text.primary,
    textAlignVertical: "top",
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
});
