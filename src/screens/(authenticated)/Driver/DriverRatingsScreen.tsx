import React, { useMemo, useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { Star, Award, Sparkles, MessageSquare, ThumbsUp, ChevronDown, ChevronUp, Calendar, Truck, Clock } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";
import { useFocusEffect } from "@react-navigation/native";
import { DriverScreen } from "./components/DriverScreen";
import GlassCard from "@/components/driver/cards/GlassCard";
import ProgressBar from "@/components/driver/feedback/ProgressBar";
import { driverColors, driverSpacing, driverRadius } from "@/theme/driverTheme";
import { useAuthStore } from "@/context/authStore";
import rideService from "@/services/ride.service";

function StarRow({ count, size = 14 }: { count: number; size?: number }) {
  return (
    <View style={{ flexDirection: "row", gap: 3 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={size}
          color={i <= count ? "#FBBF24" : "rgba(255,255,255,0.12)"}
          fill={i <= count ? "#FBBF24" : "transparent"}
        />
      ))}
    </View>
  );
}

interface FeedBackItem {
  id: string;
  name: string;
  stars: number;
  comment: string;
  date: string;
  gradient: string[];
  photo?: string;
  vehicleType?: string;
  serviceType?: string;
  totalPrice?: string;
}

export default function DriverRatingsScreen() {
  const { userData } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<"all" | "5" | "4" | "low">("all");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [realReviews, setRealReviews] = useState<FeedBackItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real reviews from completed rides history on screen focus
  useFocusEffect(
    React.useCallback(() => {
      let active = true;
      const fetchHistory = async () => {
        try {
          setLoading(true);
          const history = await rideService.getHistory({ status: "completed", limit: 50 });
          if (!active) return;

          const parsed: FeedBackItem[] = (history?.rides || [])
            .filter((r: any) => r.rating?.clientRating?.stars != null)
            .map((r: any, idx: number) => {
              const gradients = [
                ["#3B82F6", "#1D4ED8"],
                ["#10B981", "#047857"],
                ["#F59E0B", "#B45309"],
                ["#EC4899", "#BE185D"],
                ["#8B5CF6", "#6D28D9"],
              ];
              const grad = gradients[idx % gradients.length];
              const dateVal = r.rating?.clientRating?.createdAt || r.completedAt || r.createdAt;
              const formattedDate = dateVal
                ? new Date(dateVal).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })
                : "Recente";

              return {
                id: r._id || String(idx),
                name: r.clientId?.name || "Cliente LevaMais",
                stars: Number(r.rating.clientRating.stars),
                comment: r.rating.clientRating.comment || "",
                date: formattedDate,
                gradient: grad,
                photo: r.clientId?.profilePhoto || undefined,
                vehicleType: r.vehicleType === "motorcycle" ? "Moto" : r.vehicleType === "car" ? "Carro" : r.vehicleType || "Veículo",
                serviceType: r.serviceType === "delivery" ? "Entrega" : "Corrida",
                totalPrice: r.pricing?.total ? `R$ ${Number(r.pricing.total).toFixed(2)}` : undefined,
              };
            });

          setRealReviews(parsed);
        } catch (e) {
          console.error("Erro ao carregar feedbacks reais:", e);
        } finally {
          if (active) setLoading(false);
        }
      };

      fetchHistory();
      return () => {
        active = false;
      };
    }, [])
  );

  // Load 100% real rating stats from backend database
  const ratingData = useMemo(() => {
    const average = (userData as any)?.ratingStats?.averageStars ?? 5.0;
    const total = (userData as any)?.ratingStats?.totalRatings ?? 0;
    const distribution = (userData as any)?.ratingStats?.starDistribution || { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

    return {
      average,
      total,
      distribution,
      feedbacks: realReviews,
    };
  }, [userData, realReviews]);

  const maxDist = Math.max(
    ...Object.values(ratingData.distribution).map(Number),
    1
  );

  // Dynamic achievements based on average stars
  const achievements = useMemo(() => {
    const score = ratingData.average;
    if (score >= 4.8) {
      return {
        tag: "Lenda das Ruas",
        subtitle: "Excepcional • Top 3% da região",
        color: "#02de95",
        icon: Award,
      };
    } else if (score >= 4.5) {
      return {
        tag: "Super Motorista",
        subtitle: "Excelente • Altamente confiável",
        color: "#3B82F6",
        icon: Sparkles,
      };
    } else {
      return {
        tag: "Profissional Ativo",
        subtitle: "Bom nível de avaliações",
        color: "#FBBF24",
        icon: ThumbsUp,
      };
    }
  }, [ratingData.average]);

  // Real-time filtering
  const filteredFeedbacks = useMemo(() => {
    return ratingData.feedbacks.filter((fb) => {
      if (activeFilter === "all") return true;
      if (activeFilter === "5") return fb.stars === 5;
      if (activeFilter === "4") return fb.stars === 4;
      if (activeFilter === "low") return fb.stars <= 3;
      return true;
    });
  }, [activeFilter, ratingData.feedbacks]);

  // Counts aligned perfectly with the data
  const filterCounts = useMemo(() => {
    const list = ratingData.feedbacks;
    return {
      all: list.length,
      five: list.filter((f) => f.stars === 5).length,
      four: list.filter((f) => f.stars === 4).length,
      low: list.filter((f) => f.stars <= 3).length,
    };
  }, [ratingData.feedbacks]);

  return (
    <DriverScreen title="Avaliações" hideHeader={true} scroll={true}>
      
      {/* ── 🏆 PREMIUM RADIAL DASHBOARD CARD ── */}
      <MotiView
        from={{ opacity: 0, scale: 0.95, translateY: -15 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 14 }}
      >
        <GlassCard variant="accent" padding="lg" style={styles.heroCard}>
          <View style={styles.heroLayout}>
            {/* Radial Score Indicator */}
            <View style={styles.scoreContainer}>
              <View style={[styles.glowRing, { borderColor: achievements.color }]} />
              <View style={styles.ratingCircle}>
                <Text style={styles.ratingValue}>
                  {ratingData.average.toFixed(1)}
                </Text>
                <Text style={styles.ratingMax}>/5.0</Text>
              </View>
            </View>

            {/* Achievements Stats Pod */}
            <View style={styles.heroStats}>
              <View style={[styles.badgeTag, { backgroundColor: achievements.color + "12" }]}>
                <achievements.icon size={12} color={achievements.color} style={{ marginRight: 5 }} />
                <Text style={[styles.badgeTagText, { color: achievements.color }]}>
                  {achievements.tag}
                </Text>
              </View>
              <Text style={styles.achievementTitle}>
                {achievements.subtitle}
              </Text>
              <StarRow count={Math.round(ratingData.average)} size={16} />
              <Text style={styles.totalText}>
                Baseado em {ratingData.total} {ratingData.total === 1 ? "corrida recente" : "corridas recentes"}
              </Text>
            </View>
          </View>

          {/* Inline Encouragement */}
          <View style={styles.feedbackBanner}>
            <Sparkles size={13} color="#02de95" style={{ marginRight: 6 }} />
            <Text style={styles.feedbackBannerText}>
              Seu comportamento exemplar mantém a comunidade LevaMais segura!
            </Text>
          </View>
        </GlassCard>
      </MotiView>

      {/* ── 📊 SLEEK STAR DISTRIBUTION ── */}
      <MotiView
        from={{ opacity: 0, translateY: 15 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: "spring", damping: 15, delay: 100 }}
      >
        <GlassCard variant="default" padding="md" style={styles.distCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Distribuição de Notas</Text>
            <Text style={styles.sectionSublabel}>Resumo das últimas 50 viagens</Text>
          </View>

          {[5, 4, 3, 2, 1].map((star, i) => {
            const count = Number(
              ratingData.distribution[
                String(star) as keyof typeof ratingData.distribution
              ] || 0
            );
            const pct = count / maxDist;
            const barColors = ["#02de95", "#3B82F6", "#FBBF24", "#F97316", "#EF4444"];
            return (
              <MotiView
                key={star}
                from={{ opacity: 0, translateX: -15 }}
                animate={{ opacity: 1, translateX: 0 }}
                transition={{ delay: 150 + i * 60, type: "timing", duration: 400 }}
                style={styles.distRow}
              >
                <View style={styles.starLabelContainer}>
                  <Text style={styles.distStarText}>{star}</Text>
                  <Star size={11} color="#FBBF24" fill="#FBBF24" style={{ marginLeft: 2 }} />
                </View>
                <View style={{ flex: 1, marginHorizontal: 8 }}>
                  <ProgressBar
                    progress={pct}
                    height={7}
                    color={barColors[i]}
                    showGlow={star === 5}
                  />
                </View>
                <Text style={styles.distCount}>{count}</Text>
              </MotiView>
            );
          })}
        </GlassCard>
      </MotiView>

      {/* ── 💬 DYNAMIC FEEDBACK FEED ── */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <MessageSquare size={16} color="#02de95" style={{ marginRight: 6 }} />
            <Text style={styles.sectionLabel}>Comentários dos Clientes</Text>
          </View>
          <Text style={styles.commentCountBadge}>{filteredFeedbacks.length}</Text>
        </View>

        {/* Horizontal Filter Chips Carousel */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          <TouchableOpacity
            onPress={() => setActiveFilter("all")}
            activeOpacity={0.8}
            style={[
              styles.filterChip,
              activeFilter === "all" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "all" && styles.filterChipTextActive,
              ]}
            >
              Todos ({filterCounts.all})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter("5")}
            activeOpacity={0.8}
            style={[
              styles.filterChip,
              activeFilter === "5" && styles.filterChipActive,
            ]}
          >
            <Star size={11} color={activeFilter === "5" ? "#091A2F" : "#FBBF24"} fill="#FBBF24" style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "5" && styles.filterChipTextActive,
              ]}
            >
              Excelentes ({filterCounts.five})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter("4")}
            activeOpacity={0.8}
            style={[
              styles.filterChip,
              activeFilter === "4" && styles.filterChipActive,
            ]}
          >
            <Star size={11} color={activeFilter === "4" ? "#091A2F" : "#FBBF24"} fill="#FBBF24" style={{ marginRight: 4 }} />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "4" && styles.filterChipTextActive,
              ]}
            >
              Bons ({filterCounts.four})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setActiveFilter("low")}
            activeOpacity={0.8}
            style={[
              styles.filterChip,
              activeFilter === "low" && styles.filterChipActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === "low" && styles.filterChipTextActive,
              ]}
            >
              Críticos ({filterCounts.low})
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Feedback Cards List */}
        <AnimatePresence>
          {loading ? (
            <View style={styles.loadingFeed}>
              <ActivityIndicator color="#02de95" size="small" style={{ marginRight: 8 }} />
              <Text style={{ color: driverColors.textSecondary, fontSize: 12, fontWeight: "700" }}>
                Sincronizando avaliações recentes...
              </Text>
            </View>
          ) : filteredFeedbacks.length === 0 ? (
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={styles.emptyContainer}
            >
              <MessageSquare size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyText}>Nenhum comentário nesta categoria.</Text>
            </MotiView>
          ) : (
            filteredFeedbacks.map((fb, i) => {
              const isExpanded = expandedCardId === fb.id;
              return (
                <MotiView
                  key={fb.id}
                  from={{ opacity: 0, translateY: 12 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ type: "spring", damping: 15, delay: i * 80 }}
                >
                  <GlassCard
                    variant="default"
                    padding="md"
                    style={styles.feedbackCard}
                    onPress={() => setExpandedCardId(isExpanded ? null : fb.id)}
                  >
                    {/* Top Row: User details & date */}
                    <View style={styles.feedbackHeader}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {fb.photo ? (
                          <Image source={{ uri: fb.photo }} style={styles.avatarImage} />
                        ) : (
                          <View style={[styles.avatarCircle, { backgroundColor: fb.gradient[0] }]}>
                            <Text style={styles.avatarText}>{fb.name[0]}</Text>
                          </View>
                        )}
                        <View>
                          <Text style={styles.feedbackName}>{fb.name}</Text>
                          <StarRow count={fb.stars} size={11} />
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end", gap: 4 }}>
                        <Text style={styles.feedbackDate}>{fb.date}</Text>
                        {isExpanded ? (
                          <ChevronUp size={14} color={driverColors.textMuted} />
                        ) : (
                          <ChevronDown size={14} color={driverColors.textMuted} />
                        )}
                      </View>
                    </View>

                    {/* Comment body */}
                    {fb.comment && (
                      <View style={styles.commentTextContainer}>
                        <Text style={styles.commentQuote}>“</Text>
                        <Text style={styles.commentBody}>{fb.comment}</Text>
                      </View>
                    )}

                    {/* Expandable detailed metadata section */}
                    <AnimatePresence>
                      {isExpanded && (
                        <MotiView
                          from={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          style={styles.expandedDetails}
                        >
                          <View style={styles.expandedDivider} />
                          <View style={styles.expandedGrid}>
                            <View style={styles.expandedItem}>
                              <Truck size={12} color="#02de95" style={{ marginRight: 5 }} />
                              <Text style={styles.expandedLabel}>
                                {fb.serviceType}: <Text style={styles.expandedVal}>{fb.vehicleType}</Text>
                              </Text>
                            </View>
                            {fb.totalPrice && (
                              <View style={styles.expandedItem}>
                                <Clock size={12} color="#3B82F6" style={{ marginRight: 5 }} />
                                <Text style={styles.expandedLabel}>
                                  Valor: <Text style={styles.expandedVal}>{fb.totalPrice}</Text>
                                </Text>
                              </View>
                            )}
                          </View>
                        </MotiView>
                      )}
                    </AnimatePresence>
                  </GlassCard>
                </MotiView>
              );
            })
          )}
        </AnimatePresence>
      </View>
    </DriverScreen>
  );
}

const styles = StyleSheet.create({
  heroCard: {
    marginBottom: driverSpacing.md,
    borderRadius: driverRadius.xl,
    overflow: "hidden",
  },
  heroLayout: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  scoreContainer: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  glowRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 45,
    borderWidth: 3.5,
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  ratingCircle: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    lineHeight: 30,
  },
  ratingMax: {
    color: "rgba(255, 255, 255, 0.35)",
    fontSize: 9,
    fontWeight: "800",
    marginTop: -2,
    textTransform: "uppercase",
  },
  heroStats: {
    flex: 1,
    marginLeft: 20,
    justifyContent: "center",
  },
  badgeTag: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    marginBottom: 6,
  },
  badgeTagText: {
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  achievementTitle: {
    color: driverColors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 6,
  },
  totalText: {
    color: driverColors.textMuted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 6,
  },
  feedbackBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 222, 149, 0.05)",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderColor: "rgba(2, 222, 149, 0.1)",
  },
  feedbackBannerText: {
    color: "#02de95",
    fontSize: 10.5,
    fontWeight: "700",
    flex: 1,
  },
  distCard: {
    marginBottom: driverSpacing.md,
    borderRadius: driverRadius.xl,
  },
  sectionHeader: {
    marginBottom: 16,
  },
  sectionLabel: {
    color: driverColors.text,
    fontSize: 14.5,
    fontWeight: "900",
  },
  sectionSublabel: {
    color: driverColors.textMuted,
    fontSize: 10.5,
    fontWeight: "700",
    marginTop: 2,
  },
  distRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  starLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: 22,
    justifyContent: "flex-end",
  },
  distStarText: {
    color: driverColors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
  },
  distCount: {
    color: driverColors.textMuted,
    fontSize: 11,
    fontWeight: "700",
    width: 28,
    textAlign: "right",
  },
  commentsSection: {
    marginTop: 4,
  },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  commentCountBadge: {
    backgroundColor: "rgba(255,255,255,0.06)",
    color: driverColors.textSecondary,
    fontSize: 11,
    fontWeight: "900",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.08)",
  },
  filterContainer: {
    marginBottom: 14,
  },
  filterContent: {
    paddingHorizontal: 2,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 0.8,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  filterChipText: {
    color: driverColors.textSecondary,
    fontSize: 11.5,
    fontWeight: "800",
  },
  filterChipTextActive: {
    color: "#091A2F",
    fontWeight: "900",
  },
  feedbackCard: {
    marginBottom: 10,
    borderRadius: driverRadius.xl,
  },
  feedbackHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "900",
  },
  feedbackName: {
    color: driverColors.text,
    fontSize: 12.5,
    fontWeight: "800",
    marginBottom: 2,
  },
  feedbackDate: {
    color: driverColors.textMuted,
    fontSize: 9.5,
    fontWeight: "700",
  },
  commentTextContainer: {
    marginTop: 2,
    paddingLeft: 16,
    position: "relative",
  },
  commentQuote: {
    position: "absolute",
    left: 0,
    top: -5,
    fontSize: 24,
    color: "rgba(2, 222, 149, 0.25)",
    fontWeight: "900",
    fontFamily: "serif",
  },
  commentBody: {
    color: driverColors.textSecondary,
    fontSize: 11.5,
    fontWeight: "600",
    fontStyle: "italic",
    lineHeight: 18,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    backgroundColor: "rgba(255,255,255,0.015)",
    borderRadius: driverRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.03)",
    borderStyle: "dashed",
  },
  emptyText: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: "700",
  },
  loadingFeed: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 30,
  },
  expandedDetails: {
    overflow: "hidden",
  },
  expandedDivider: {
    height: 0.8,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 12,
  },
  expandedGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  expandedItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  expandedLabel: {
    color: driverColors.textMuted,
    fontSize: 10.5,
    fontWeight: "700",
  },
  expandedVal: {
    color: driverColors.textSecondary,
    fontWeight: "800",
  },
});
