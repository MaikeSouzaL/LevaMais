import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ArrowLeft, Star, Zap, ShieldCheck, Send } from "lucide-react-native";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";

import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../../types/navigation";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const QUICK_TAGS = [
  { label: "Educado", icon: null },
  { label: "Chegou rápido", icon: Zap },
  { label: "Boa comunicação", icon: null },
  { label: "Dirigiu com cuidado", icon: ShieldCheck },
  { label: "Atendimento excelente", icon: null },
];

const RATING_LABELS: Record<number, string> = {
  1: "MUITO RUIM",
  2: "RUIM",
  3: "REGULAR",
  4: "BOM",
  5: "EXCELENTE",
};

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
      navigation.navigate("Home");
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
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityLabel="Voltar"
          accessibilityRole="button"
        >
          <ArrowLeft size={24} color="#008F60" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Avaliar motorista</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          s.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 24) + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Pergunta */}
        <Text style={s.question}>
          Como foi a {isDelivery ? "entrega" : "corrida"} com {driverName}?
        </Text>

        {/* Card do Motorista */}
        <View style={s.card}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{getInitials(driverName)}</Text>
          </View>
          <Text style={s.driverName}>{driverName}</Text>
          <Text style={s.driverSub}>SEU MOTORISTA PARCEIRO LEVAMAIS</Text>
        </View>

        {/* Card de Avaliação */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250 }}
        >
          <View style={s.card}>
            <Text style={s.cardTitle}>Sua nota</Text>
            <Text style={s.cardSubtitle}>
              Toque nas estrelas para selecionar uma nota de 1 a 5
            </Text>

            {/* Estrelas */}
            <View style={s.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => {
                const active = star <= rating;
                return (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    activeOpacity={0.6}
                    accessibilityLabel={`Avaliar ${star} ${star > 1 ? "estrelas" : "estrela"}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                  >
                    <MotiView
                      animate={{
                        scale: active ? [0.85, 1.12, 1] : 1,
                      }}
                      transition={{ type: "spring", damping: 10 }}
                    >
                      <Star
                        size={42}
                        color={active ? "#00D68F" : "#D1D5DB"}
                        fill={active ? "#00D68F" : "transparent"}
                        strokeWidth={active ? 0 : 1.5}
                      />
                    </MotiView>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Badge */}
            {rating > 0 && (
              <MotiView
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", damping: 14 }}
                style={s.badge}
              >
                <Text style={s.badgeText}>{RATING_LABELS[rating]}</Text>
              </MotiView>
            )}
          </View>
        </MotiView>

        {/* Card de Destaques */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 250, delay: 80 }}
        >
          <View style={s.card}>
            <Text style={s.cardTitle}>Destaques (opcional)</Text>
            <Text style={s.cardSubtitle}>
              O que você mais gostou na experiência com este motorista?
            </Text>

            {/* Chips */}
            <View style={s.chipsWrap}>
              {QUICK_TAGS.map(({ label, icon: Icon }) => {
                const selected = hasTag(label);
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggleTag(label)}
                    style={[s.chip, selected && s.chipSelected]}
                    activeOpacity={0.7}
                    accessibilityLabel={`Tag: ${label}`}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                  >
                    {selected && Icon && (
                      <Icon size={18} color="#008F60" style={{ marginRight: 8 }} />
                    )}
                    <Text style={[s.chipText, selected && s.chipTextSelected]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Textarea */}
            <TextInput
              value={comment}
              onChangeText={setComment}
              placeholder="Deixe um comentário adicional..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={s.textarea}
              accessibilityLabel="Comentário adicional sobre o motorista"
              accessibilityHint="Toque para escrever um comentário opcional"
            />
          </View>
        </MotiView>
      </ScrollView>

      {/* Barra Inferior Fixa */}
      <View style={[s.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={s.footerRow}>
          <TouchableOpacity
            style={s.skipBtn}
            onPress={() => navigation.navigate("Home")}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityLabel="Pular avaliação"
            accessibilityRole="button"
          >
            <Text style={s.skipBtnText}>PULAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.submitBtn, !canSubmit && s.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || loading}
            activeOpacity={0.8}
            accessibilityLabel={loading ? "Enviando avaliação" : "Enviar avaliação"}
            accessibilityRole="button"
            accessibilityState={{ disabled: !canSubmit || loading }}
          >
            <Text style={[s.submitBtnText, !canSubmit && s.submitBtnTextDisabled]}>
              {loading ? "ENVIANDO..." : "ENVIAR AVALIAÇÃO"}
            </Text>
            <Send
              size={18}
              color={!canSubmit ? "#9CA3AF" : "#005A3D"}
              style={{ marginLeft: 8 }}
            />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F5F6F8",
  },
  scrollContent: {
    paddingHorizontal: 24,
  },

  // Header
  header: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#111827",
    fontSize: 32,
    fontWeight: "700",
    fontFamily: undefined, // fallback to system
    marginTop: 16,
  },

  // Question
  question: {
    color: "#4B5563",
    fontSize: 18,
    fontWeight: "400",
    marginTop: 32,
    marginBottom: 24,
  },

  // Card
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 2,
  },

  // Driver card
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 99,
    backgroundColor: "#00D68F",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 16,
  },
  avatarText: {
    color: "#005A3D",
    fontSize: 28,
    fontWeight: "700",
  },
  driverName: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 6,
  },
  driverSub: {
    color: "#596174",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  // Rating card
  cardTitle: {
    color: "#111827",
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 6,
  },
  cardSubtitle: {
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 24,
    lineHeight: 22,
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 16,
    marginBottom: 20,
  },
  badge: {
    alignSelf: "center",
    backgroundColor: "rgba(0,214,143,0.12)",
    height: 38,
    borderRadius: 99,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#008F60",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Chips
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 20,
    backgroundColor: "#F3F4F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  chipSelected: {
    height: 52,
    backgroundColor: "#F4FFF9",
    borderWidth: 2,
    borderColor: "#008F60",
  },
  chipText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "500",
  },
  chipTextSelected: {
    color: "#008F60",
    fontWeight: "600",
  },

  // Textarea
  textarea: {
    backgroundColor: "#EEF2F7",
    borderRadius: 16,
    minHeight: 120,
    padding: 18,
    color: "#111827",
    fontSize: 15,
    lineHeight: 22,
  },

  // Footer
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  footerRow: {
    flexDirection: "row",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  skipBtn: {
    flex: 1,
    height: 60,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  skipBtnText: {
    color: "#111827",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  submitBtn: {
    flex: 2.5,
    height: 60,
    borderRadius: 16,
    backgroundColor: "#00D68F",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  submitBtnDisabled: {
    backgroundColor: "#E5E7EB",
  },
  submitBtnText: {
    color: "#005A3D",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  submitBtnTextDisabled: {
    color: "#9CA3AF",
  },
});
