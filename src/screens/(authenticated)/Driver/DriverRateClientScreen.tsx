import React, { useMemo, useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MotiView, AnimatePresence } from "moti";
import {
  Star,
  TrendingUp,
  Clock,
  MapPin,
  DollarSign,
  ThumbsUp,
  MessageSquare,
  ChevronRight,
  Sparkles,
  Award,
  CheckCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";
import rideService from "../../../services/ride.service";

const { width } = Dimensions.get("window");

type Params = {
  DriverRateClient: {
    rideId: string;
  };
};

const QUICK_TAGS = [
  { label: "Educado", emoji: "🤝" },
  { label: "Amigável", emoji: "😊" },
  { label: "Pontual", emoji: "⏰" },
  { label: "Ótimo passageiro", emoji: "⭐" },
  { label: "Boa comunicação", emoji: "💬" },
  { label: "Respeitoso", emoji: "🙏" },
];

const RATING_CONFIG: Record<number, { label: string; color: string; emoji: string }> = {
  1: { label: "Péssimo", color: "#ef4444", emoji: "😡" },
  2: { label: "Ruim", color: "#f97316", emoji: "😞" },
  3: { label: "Regular", color: "#eab308", emoji: "😐" },
  4: { label: "Bom", color: "#22c55e", emoji: "😊" },
  5: { label: "Excelente", color: "#02de95", emoji: "🤩" },
};

export default function DriverRateClientScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRateClient">>();
  const rideId = route.params?.rideId;

  const [stars, setStars] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [ride, setRide] = useState<any>(null);
  const [loadingRide, setLoadingRide] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = useMemo(() => {
    return !!rideId && stars >= 1 && stars <= 5;
  }, [rideId, stars]);

  useEffect(() => {
    if (!rideId) return;
    setLoadingRide(true);
    rideService
      .getById(rideId)
      .then((res) => setRide(res))
      .catch(() => {})
      .finally(() => setLoadingRide(false));
  }, [rideId]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const goHome = useCallback(() => {
    try {
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "DriverHome" }],
      });
    } catch {
      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    }
  }, [navigation]);

  async function submit() {
    if (!rideId || !canSubmit) return;

    setLoading(true);
    try {
      const fullComment = [
        ...selectedTags,
        comment.trim(),
      ]
        .filter(Boolean)
        .join("; ");

      await rideService.rateDriverToClient(rideId, {
        stars,
        comment: fullComment || undefined,
      });

      setSubmitted(true);
      Toast.show({ type: "success", text1: "Avaliação enviada com sucesso!" });

      setTimeout(goHome, 2000);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  const isDelivery = ride?.serviceType === "delivery";
  const earnings = Number(
    ride?.pricing?.driverValue ?? ride?.pricing?.total ?? 0
  );
  const ratingConf = RATING_CONFIG[stars] || RATING_CONFIG[5];

  // Success state
  if (submitted) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.successContainer}>
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 10, delay: 100 }}
          >
            <View style={s.successCircle}>
              <CheckCircle size={56} color="#02de95" />
            </View>
          </MotiView>
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 400 }}
          >
            <Text style={s.successTitle}>Avaliação Enviada!</Text>
            <Text style={s.successSub}>Obrigado por avaliar. Voltando à tela inicial...</Text>
          </MotiView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* ═══ Earnings Hero ═══ */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 16 }}
          style={s.heroSection}
        >
          <View style={s.heroIconRow}>
            <MotiView
              from={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", damping: 8, delay: 200 }}
            >
              <View style={s.heroIconBubble}>
                <Award size={28} color="#02de95" />
              </View>
            </MotiView>
          </View>

          <Text style={s.heroLabel}>
            {isDelivery ? "ENTREGA CONCLUÍDA" : "CORRIDA CONCLUÍDA"}
          </Text>

          {loadingRide ? (
            <ActivityIndicator size="small" color="#02de95" style={{ marginTop: 12 }} />
          ) : (
            <>
              <MotiView
                from={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 12, delay: 300 }}
              >
                <Text style={s.heroEarnings}>
                  R$ {earnings.toFixed(2).replace(".", ",")}
                </Text>
              </MotiView>

              {ride && (
                <View style={s.heroStatsRow}>
                  <View style={s.heroStat}>
                    <MapPin size={13} color="rgba(255,255,255,0.4)" />
                    <Text style={s.heroStatValue}>{ride.distance?.text || "—"}</Text>
                  </View>
                  <View style={s.heroStatDivider} />
                  <View style={s.heroStat}>
                    <Clock size={13} color="rgba(255,255,255,0.4)" />
                    <Text style={s.heroStatValue}>{ride.duration?.text || "—"}</Text>
                  </View>
                  <View style={s.heroStatDivider} />
                  <View style={s.heroStat}>
                    <DollarSign size={13} color="rgba(255,255,255,0.4)" />
                    <Text style={s.heroStatValue}>
                      {ride?.payment?.method?.type || ride?.payment?.method || "—"}
                    </Text>
                  </View>
                </View>
              )}
            </>
          )}
        </MotiView>

        {/* ═══ Star Rating ═══ */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          style={s.card}
        >
          <Text style={s.cardTitle}>Como foi a experiência?</Text>

          <View style={s.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setStars(star)}
                activeOpacity={0.7}
                style={s.starTouchable}
              >
                <MotiView
                  key={`star-${star}-${star <= stars ? "filled" : "empty"}`}
                  from={{ scale: 0.6 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", damping: 10, stiffness: 200 }}
                >
                  <Star
                    size={40}
                    color={star <= stars ? ratingConf.color : "rgba(255,255,255,0.12)"}
                    fill={star <= stars ? ratingConf.color : "transparent"}
                    strokeWidth={star <= stars ? 0 : 1.5}
                  />
                </MotiView>
              </TouchableOpacity>
            ))}
          </View>

          <AnimatePresence>
            <MotiView
              key={`label-${stars}`}
              from={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "timing", duration: 200 }}
              style={s.ratingLabelContainer}
            >
              <Text style={s.ratingEmoji}>{ratingConf.emoji}</Text>
              <Text style={[s.ratingLabel, { color: ratingConf.color }]}>
                {ratingConf.label}
              </Text>
            </MotiView>
          </AnimatePresence>
        </MotiView>

        {/* ═══ Quick Tags ═══ */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 350 }}
          style={s.card}
        >
          <View style={s.cardTitleRow}>
            <Sparkles size={16} color="#FBBF24" />
            <Text style={s.cardTitle}>Destaques</Text>
            <Text style={s.cardTitleOptional}>opcional</Text>
          </View>

          <View style={s.tagsGrid}>
            {QUICK_TAGS.map((tag) => {
              const selected = selectedTags.includes(tag.label);
              return (
                <TouchableOpacity
                  key={tag.label}
                  onPress={() => toggleTag(tag.label)}
                  activeOpacity={0.7}
                  style={[s.tagChip, selected && s.tagChipSelected]}
                >
                  <Text style={s.tagEmoji}>{tag.emoji}</Text>
                  <Text style={[s.tagText, selected && s.tagTextSelected]}>
                    {tag.label}
                  </Text>
                  {selected && (
                    <MotiView
                      from={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12 }}
                    >
                      <CheckCircle size={14} color="#02de95" />
                    </MotiView>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </MotiView>

        {/* ═══ Comment ═══ */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 450 }}
          style={s.card}
        >
          <View style={s.cardTitleRow}>
            <MessageSquare size={16} color="rgba(255,255,255,0.4)" />
            <Text style={s.cardTitle}>Comentário</Text>
            <Text style={s.cardTitleOptional}>opcional</Text>
          </View>

          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Conte como foi a experiência..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            multiline
            style={s.textInput}
          />
        </MotiView>
      </ScrollView>

      {/* ═══ CTA Footer ═══ */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 14, delay: 500 }}
        style={s.footer}
      >
        <TouchableOpacity
          onPress={submit}
          disabled={!canSubmit || loading}
          activeOpacity={0.9}
          style={[s.submitBtn, (!canSubmit || loading) && { opacity: 0.5 }]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#091A2F" />
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <ThumbsUp size={18} color="#091A2F" />
              <Text style={s.submitText}>Enviar Avaliação</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goHome}
          disabled={loading}
          activeOpacity={0.7}
          style={s.skipBtn}
        >
          <Text style={s.skipText}>Pular</Text>
          <ChevronRight size={16} color="rgba(255,255,255,0.3)" />
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#091A2F",
    alignItems: "center",
    justifyContent: "center",
  },

  // Success
  successContainer: {
    alignItems: "center",
    padding: 40,
  },
  successCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(2, 222, 149, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  successTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "center",
  },
  successSub: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 8,
  },

  // Hero
  heroSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  heroIconRow: {
    marginBottom: 16,
  },
  heroIconBubble: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    borderWidth: 2,
    borderColor: "rgba(2, 222, 149, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroLabel: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2.5,
  },
  heroEarnings: {
    color: "#02de95",
    fontSize: 44,
    fontWeight: "900",
    marginTop: 6,
    letterSpacing: -1,
  },
  heroStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 16,
  },
  heroStat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroStatValue: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "700",
  },
  heroStatDivider: {
    width: 1,
    height: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  // Cards
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    padding: 20,
  },
  cardTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  cardTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  cardTitleOptional: {
    color: "rgba(255,255,255,0.25)",
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
    marginLeft: "auto",
  },

  // Stars
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 12,
  },
  starTouchable: {
    padding: 4,
  },
  ratingLabelContainer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
  },
  ratingEmoji: {
    fontSize: 20,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: "800",
  },

  // Tags
  tagsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  tagChipSelected: {
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    borderColor: "rgba(2, 222, 149, 0.4)",
  },
  tagEmoji: {
    fontSize: 14,
  },
  tagText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12.5,
    fontWeight: "700",
  },
  tagTextSelected: {
    color: "#02de95",
  },

  // Text Input
  textInput: {
    minHeight: 90,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    borderRadius: 14,
    padding: 14,
    color: "#fff",
    fontSize: 13.5,
    fontWeight: "500",
    textAlignVertical: "top",
    lineHeight: 20,
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "#091A2F",
  },
  submitBtn: {
    height: 56,
    borderRadius: 16,
    backgroundColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#091A2F",
    fontSize: 15,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  skipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 14,
  },
  skipText: {
    color: "rgba(255,255,255,0.35)",
    fontSize: 13,
    fontWeight: "700",
  },
});
