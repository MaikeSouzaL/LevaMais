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
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Star } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../../types/navigation";

const QUICK_TAGS = [
  "Educado",
  "Chegou rápido",
  "Boa comunicação",
  "Dirigiu com cuidado",
  "Atendimento excelente",
];

export default function RateDriverScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "ClientRateDriver">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "ClientRateDriver">>();
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

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
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

      Toast.show({ type: "success", text1: "Avaliação enviada" });
      navigation.navigate("TipDriver", { rideId, driverName });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar",
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
          padding: spacing.lg,
          paddingBottom: Math.max(insets.bottom, spacing.xl) + 160,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Driver Profile Card */}
        <View style={styles.driverCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(driverName)}</Text>
          </View>
          <Text style={styles.driverNameText}>{driverName}</Text>
          <Text style={styles.driverSubtext}>Seu motorista parceiro LevaMais</Text>
        </View>

        {/* Rating Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sua nota</Text>
          <Text style={styles.cardSubtitle}>
            Toque nas estrelas para selecionar uma nota de 1 a 5
          </Text>

          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((star) => {
              const active = star <= rating;
              return (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                  style={styles.starTouch}
                  accessibilityLabel={`Avaliar ${star} ${star > 1 ? "estrelas" : "estrela"}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Star
                    size={42}
                    color={active ? "#02de95" : "rgba(255, 255, 255, 0.2)"}
                    fill={active ? "#02de95" : "transparent"}
                    strokeWidth={1.5}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {rating > 0 && (
            <View style={styles.ratingBadge}>
              <Text style={styles.ratingBadgeText}>{ratingLabels[rating]}</Text>
            </View>
          )}
        </View>

        {/* Feedback Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Destaques (opcional)</Text>
          <Text style={styles.cardSubtitle}>
            O que você mais gostou na experiência com este motorista?
          </Text>

          <View style={styles.tagsWrap}>
            {QUICK_TAGS.map((tag) => {
              const selected = hasTag(tag);
              return (
                <TouchableOpacity
                  key={tag}
                  onPress={() => toggleTag(tag)}
                  style={[styles.tagChip, selected && styles.tagChipSelected]}
                  activeOpacity={0.8}
                  accessibilityLabel={`Tag: ${tag}`}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityValue={selected ? { text: "selecionado" } : undefined}
                >
                  <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tag}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Deixe um comentário adicional (opcional)"
            placeholderTextColor="rgba(255, 255, 255, 0.35)"
            multiline
            numberOfLines={4}
            style={styles.input}
            accessibilityLabel="Comentário adicional sobre o motorista"
            accessibilityHint="Toque para escrever um comentário opcional"
          />
        </View>
      </ScrollView>

      {/* Modern Fixed Bottom Action Bar */}
      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xs },
        ]}
      >
        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={() => navigation.navigate("Home")}
            disabled={loading}
            accessibilityLabel="Pular avaliação"
            accessibilityRole="button"
          >
            <Text style={styles.skipButtonText}>Pular</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            accessibilityLabel={loading ? "Enviando avaliação" : "Enviar avaliação"}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit || loading }}
          >
            <Text style={[styles.submitButtonText, !canSubmit && styles.submitButtonTextDisabled]}>
              {loading ? "Enviando..." : "Enviar avaliação"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#091A2F",
  },
  driverCard: {
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    borderWidth: 2,
    borderColor: "rgba(2, 222, 149, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: {
    color: "#02de95",
    fontSize: 24,
    fontWeight: "900",
  },
  driverNameText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "900",
    marginBottom: 4,
  },
  driverSubtext: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.12)",
    borderRadius: 24,
    padding: spacing.xl,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 4,
  },
  cardSubtitle: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 12,
    marginBottom: spacing.lg,
    lineHeight: 16,
  },
  stars: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
    marginVertical: spacing.sm,
  },
  starTouch: {
    padding: 4,
  },
  ratingBadge: {
    alignSelf: "center",
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.25)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: spacing.md,
  },
  ratingBadgeText: {
    color: "#02de95",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tagsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tagChip: {
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 44,
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    marginBottom: spacing.xs,
    justifyContent: "center",
  },
  tagChipSelected: {
    borderColor: "#02de95",
    backgroundColor: "rgba(2, 222, 149, 0.12)",
  },
  tagText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "600",
  },
  tagTextSelected: {
    color: "#02de95",
    fontWeight: "800",
  },
  input: {
    minHeight: 100,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    padding: spacing.md,
    color: "#ffffff",
    textAlignVertical: "top",
    fontSize: 13,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: "#091A2F",
    borderTopWidth: 1.5,
    borderTopColor: "rgba(255, 255, 255, 0.05)",
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 12,
  },
  skipButton: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "rgba(255, 255, 255, 0.15)",
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  skipButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  submitButton: {
    flex: 2.2,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  submitButtonDisabled: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    shadowOpacity: 0,
    elevation: 0,
  },
  submitButtonText: {
    color: "#091A2F",
    fontSize: 14,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  submitButtonTextDisabled: {
    color: "rgba(255, 255, 255, 0.25)",
  },
});
