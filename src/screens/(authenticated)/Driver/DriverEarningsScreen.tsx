import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  TrendingUp,
  Car,
  Flag,
  ChevronRight,
  Plus,
  Eye,
  EyeOff,
  History,
  ArrowUpRight,
  Menu,
  Wallet,
  ArrowLeft,
} from "lucide-react-native";
import { MotiView } from "moti";

import rideService, { Ride } from "../../../services/ride.service";
import driverService from "../../../services/driver.service";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "../../../context/authStore";
import { DriverScreen } from "./components/DriverScreen";
import { DriverDepositModal } from "@/components/DriverDepositModal";
import GlassCard from "@/components/driver/cards/GlassCard";
import HistoryRideCard from "@/components/driver/cards/HistoryRideCard";

// Spec-defined colors matching Tailwind Config from HTML
const colors = {
  background: "#051424",
  onSurface: "#d4e4fa",
  onSurfaceVariant: "#c5c6cd",
  secondary: "#70ffba",
  onSecondary: "#003822",
  secondaryFixed: "#4dffb1",
  surfaceContainerHigh: "#1c2b3c",
  surfaceContainerHighest: "#273647",
  surfaceContainer: "#122131",
  surface: "#051424",
  surfaceContainerLow: "#0d1c2d",
  outlineVariant: "#45474d",
  tertiary: "#b0c9e8",
  primary: "#bbc6e3",
  error: "#ffb4ab",
  errorContainer: "#93000a",
};

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverEarningsScreen() {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [availableBalance, setAvailableBalance] = useState(0);
  const [driverStats, setDriverStats] = useState({
    earnings: 0,
    rides: 0,
    goal: 10,
    bonus: 0,
  });
  const [rides, setRides] = useState<Ride[]>([]);
  const [chartData, setChartData] = useState<
    { label: string; value: number; count?: number }[]
  >([]);

  const loadData = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [balanceRes, statsRes, historyRes, chartRes] = await Promise.all([
          driverService.getBalance(),
          rideService.getDriverStats(),
          rideService.getHistory({ limit: 20, page: 1 }),
          rideService.getEarningsHistory(period),
        ]);

        setAvailableBalance(Number(balanceRes?.balance || 0));
        setDriverStats(statsRes);
        setRides(historyRes.rides || []);
        setChartData(
          (chartRes || []).map((item: any) => ({
            label: item.label,
            value: item.value || 0,
            count: item.count || 0,
          }))
        );
      } catch (error) {
        console.error("Failed to load earnings data:", error);
        setChartData([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period]
  );

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const userId = useAuthStore.getState().userData?.id;
    if (!userId) return;

    const channel = supabase
      .channel(`earnings-balance:${userId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
          filter: `id=eq.${userId}`,
        },
        () => {
          loadData(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadData]);

  // Summation of chart data for the period cards
  const periodTotals = useMemo(() => {
    let totalEarnings = 0;
    let totalRides = 0;
    for (const item of chartData) {
      totalEarnings += item.value || 0;
      totalRides += item.count || 0;
    }
    return { earnings: totalEarnings, rides: totalRides };
  }, [chartData]);

  const goalProgress = useMemo(() => {
    const goal = Math.max(1, Number(driverStats.goal || 0));
    return Math.min(1, Number(driverStats.rides || 0) / goal);
  }, [driverStats.goal, driverStats.rides]);

  const periodLabel =
    period === "day"
      ? "de hoje"
      : period === "week"
      ? "da semana"
      : "do mês";

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── TopAppBar ── */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.menuBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topAppBarTitle}>Ganhos e carteira</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor={colors.secondary}
            colors={[colors.secondary]}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Header Title & Subtitle ── */}
        <View style={styles.headerTextSec}>
          <Text style={styles.screenTitle}>Ganhos e carteira</Text>
          <Text style={styles.screenSubtitle}>
            Acompanhe seu progresso e saldo financeiro
          </Text>
        </View>

        {/* ── Main Balance Card ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceCardHeader}>
            <View>
              <Text style={styles.balanceLabel}>SALDO DISPONÍVEL</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceValue}>
                  {balanceVisible ? formatBRL(availableBalance) : "••••••••"}
                </Text>
                <TouchableOpacity
                  onPress={() => setBalanceVisible((p) => !p)}
                  style={styles.eyeBtn}
                  activeOpacity={0.7}
                >
                  {balanceVisible ? (
                    <EyeOff size={20} color={colors.onSurfaceVariant} />
                  ) : (
                    <Eye size={20} color={colors.secondary} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            <Wallet size={28} color={colors.secondary} style={styles.walletIcon} />
          </View>

          <TouchableOpacity
            onPress={() => setShowDepositModal(true)}
            activeOpacity={0.85}
            style={styles.depositBtn}
          >
            <Plus size={18} color={colors.onSecondary} strokeWidth={3} />
            <Text style={styles.depositBtnText}>DEPOSITAR / RECARREGAR</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverWithdraw")}
              activeOpacity={0.8}
              style={styles.actionBtn}
            >
              <ArrowUpRight size={16} color={colors.onSurface} />
              <Text style={styles.actionBtnText}>SACAR</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverStatement")}
              activeOpacity={0.8}
              style={styles.actionBtn}
            >
              <History size={16} color={colors.onSurface} />
              <Text style={styles.actionBtnText}>EXTRATO</Text>
            </TouchableOpacity>
          </View>
        </MotiView>

        {/* ── Time Filter Tabs ── */}
        <View style={styles.tabsContainer}>
          {(["day", "week", "month"] as const).map((p) => {
            const isActive = period === p;
            return (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                activeOpacity={0.85}
                style={[
                  styles.tabItem,
                  isActive && styles.tabItemActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    isActive && styles.tabTextActive,
                  ]}
                >
                  {p === "day" ? "Dia" : p === "week" ? "Semana" : "Mês"}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Weekly Earnings & Chart ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ganhos {periodLabel}</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("DriverStatement")}
            activeOpacity={0.7}
            style={styles.verExtratoBtn}
          >
            <Text style={styles.verExtratoText}>Ver extrato</Text>
            <ChevronRight size={14} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={styles.chartCard}
        >
          {chartData.length === 0 ? (
            <View style={styles.emptyChart}>
              <ActivityIndicator size="small" color={colors.secondary} />
            </View>
          ) : (
            <View style={styles.chartWrapper}>
              {/* Target Line */}
              <View style={styles.chartAxis}>
                <View style={styles.dashedLine} />
                <Text style={styles.goalIndicator}>Meta R$ 150</Text>
              </View>

              {/* Bars */}
              <View style={styles.barsContainer}>
                {chartData.map((item, idx) => {
                  const maxVal = Math.max(...chartData.map((c) => c.value), 150);
                  const percent = Math.max(5, (item.value / maxVal) * 100);

                  return (
                    <View key={idx} style={styles.barColumn}>
                      <View style={styles.barTrack}>
                        <MotiView
                          from={{ height: "0%" }}
                          animate={{ height: `${percent}%` }}
                          transition={{ type: "spring", damping: 15, delay: idx * 40 }}
                          style={styles.barFill}
                        />
                      </View>
                      <Text style={styles.barLabel}>{item.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </MotiView>

        {/* ── Stats Grid (3 Columns) ── */}
        <View style={styles.statsGrid}>
          {/* Card 1: Total ganho */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: "rgba(112, 255, 186, 0.1)" }]}>
              <TrendingUp size={16} color={colors.secondary} />
            </View>
            <Text style={styles.statVal} numberOfLines={1}>
              {balanceVisible
                ? formatBRL(period === "day" ? driverStats.earnings : periodTotals.earnings)
                : "---"}
            </Text>
            <Text style={styles.statLabel}>Total ganho</Text>
          </View>

          {/* Card 2: Concluídas */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: "rgba(176, 201, 232, 0.1)" }]}>
              <Car size={16} color={colors.tertiary} />
            </View>
            <Text style={styles.statVal}>
              {period === "day" ? driverStats.rides : periodTotals.rides}
            </Text>
            <Text style={styles.statLabel}>Concluídas</Text>
          </View>

          {/* Card 3: Meta */}
          <View style={styles.statCard}>
            <View style={[styles.statIconWrapper, { backgroundColor: "rgba(187, 198, 227, 0.1)" }]}>
              <Flag size={16} color={colors.primary} />
            </View>
            <Text style={styles.statVal}>
              {Math.round(goalProgress * 100)}%
            </Text>
            <Text style={styles.statLabel}>
              {driverStats.rides}/{driverStats.goal} cor.
            </Text>
          </View>
        </View>

        {/* ── Daily Goal Progress ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 150 }}
          style={styles.goalCard}
        >
          <View style={styles.goalTextRow}>
            <Text style={styles.goalLabelText}>Progresso da meta diária</Text>
            <Text style={styles.goalValueText}>
              {driverStats.rides}/{driverStats.goal} corridas
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${goalProgress * 100}%` }]} />
          </View>
        </MotiView>

        {/* ── Recent Rides ── */}
        <View style={styles.recentSection}>
          <Text style={styles.recentSectionTitle}>Corridas recentes</Text>
          {loading ? (
            <ActivityIndicator
              size="large"
              color={colors.secondary}
              style={{ marginTop: 20 }}
            />
          ) : rides.length === 0 ? (
            <View style={styles.emptyHistory}>
              <History size={36} color="rgba(255,255,255,0.15)" />
              <Text style={styles.emptyHistoryText}>
                Nenhuma corrida recente registrada.
              </Text>
            </View>
          ) : (
            rides
              .slice(0, 5)
              .map((ride: any, idx: number) => {
                const isCompleted = ride.status === "completed";
                const total = ride.pricing?.total ?? 0;
                const sideColor = isCompleted ? colors.secondary : colors.error;

                return (
                  <MotiView
                    key={ride._id}
                    from={{ opacity: 0, translateY: 8 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", damping: 15, delay: idx * 40 }}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() =>
                        navigation.navigate("DriverRideDetails", {
                          rideId: ride._id,
                        })
                      }
                      style={[styles.rideCard, { borderLeftColor: sideColor }]}
                    >
                      {/* Top Row: status + date */}
                      <View style={styles.rideCardTop}>
                        <View
                          style={[
                            styles.statusPill,
                            {
                              backgroundColor: isCompleted
                                ? "rgba(112,255,186,0.1)"
                                : "rgba(255,180,171,0.1)",
                              borderColor: isCompleted
                                ? "rgba(112,255,186,0.3)"
                                : "rgba(255,180,171,0.3)",
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.statusDot,
                              { backgroundColor: isCompleted ? colors.secondary : colors.error },
                            ]}
                          />
                          <Text
                            style={[
                              styles.statusText,
                              { color: isCompleted ? colors.secondary : colors.error },
                            ]}
                          >
                            {isCompleted ? "CONCLUÍDA" : "CANCELADA"}
                          </Text>
                        </View>
                        <Text style={styles.rideDate}>
                          {ride.completedAt || ride.cancelledAt || ride.createdAt
                            ? new Date(
                                ride.completedAt || ride.cancelledAt || ride.createdAt
                              ).toLocaleString("pt-BR", {
                                day: "2-digit",
                                month: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                            : "-"}
                        </Text>
                      </View>

                      {/* Addresses */}
                      <View style={styles.rideCardMiddle}>
                        <View style={styles.routeLine} />
                        {ride.pickup?.address && (
                          <View style={styles.addressRow}>
                            <View style={[styles.addressDot, { backgroundColor: colors.secondary }]} />
                            <Text style={styles.addressText} numberOfLines={1}>
                              {ride.pickup.address}
                            </Text>
                          </View>
                        )}
                        {ride.dropoff?.address && (
                          <View style={styles.addressRow}>
                            <View style={[styles.addressDot, { backgroundColor: colors.error }]} />
                            <Text style={styles.addressText} numberOfLines={1}>
                              {ride.dropoff.address}
                            </Text>
                          </View>
                        )}
                      </View>

                      {/* Bottom Row */}
                      <View style={styles.rideCardBottom}>
                        <View style={styles.metaRow}>
                          {ride.vehicleType === "motorcycle" ? (
                            <Text style={{ fontSize: 16, marginRight: 2 }}>🏍</Text>
                          ) : (
                            <Car size={16} color={colors.onSurfaceVariant} />
                          )}
                          <Text style={styles.metaText}>
                            {ride.serviceType === "delivery" ? "Entrega" : "Corrida"}
                            {ride.distance?.text ? ` · ${ride.distance.text}` : ""}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.ridePrice,
                            { color: isCompleted ? colors.secondary : colors.onSurfaceVariant },
                          ]}
                        >
                          {formatBRL(total)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  </MotiView>
                );
              })
          )}
        </View>
      </ScrollView>

      <DriverDepositModal
        visible={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        onSuccess={() => {
          setShowDepositModal(false);
          loadData(true);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(69, 71, 77, 0.1)",
  },
  menuBtn: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 16,
  },
  topAppBarTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerTextSec: {
    marginBottom: 24,
  },
  screenTitle: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: "700",
  },
  screenSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 30,
    elevation: 6,
  },
  balanceCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  balanceLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  balanceValue: {
    color: colors.secondary,
    fontSize: 40,
    fontWeight: "800",
  },
  eyeBtn: {
    padding: 4,
  },
  walletIcon: {
    opacity: 0.5,
    marginTop: 4,
  },
  depositBtn: {
    backgroundColor: colors.secondary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 16,
  },
  depositBtnText: {
    color: colors.onSecondary,
    fontWeight: "700",
    fontSize: 16,
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.3)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 4,
  },
  actionBtnText: {
    color: colors.onSurface,
    fontWeight: "500",
    fontSize: 14,
  },
  tabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceContainer,
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    gap: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  tabText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
  },
  tabTextActive: {
    color: colors.onSecondary,
    fontWeight: "700",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  verExtratoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  verExtratoText: {
    color: colors.secondary,
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
    borderRadius: 16,
    padding: 16,
  },
  emptyChart: {
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  chartWrapper: {
    position: "relative",
    height: 160,
    justifyContent: "flex-end",
  },
  chartAxis: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 70,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 1,
    borderColor: "rgba(176, 201, 232, 0.3)",
    borderStyle: "dashed",
  },
  goalIndicator: {
    color: colors.tertiary,
    fontSize: 10,
    marginLeft: 6,
  },
  barsContainer: {
    flexDirection: "row",
    height: 128,
    alignItems: "flex-end",
    justifyContent: "space-between",
    zIndex: 2,
  },
  barColumn: {
    flex: 1,
    alignItems: "center",
  },
  barTrack: {
    width: 12,
    height: 128,
    backgroundColor: "rgba(5, 17, 38, 0.6)",
    borderRadius: 9999,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  barFill: {
    width: "100%",
    backgroundColor: colors.secondary,
    borderTopLeftRadius: 9999,
    borderTopRightRadius: 9999,
  },
  barLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 8,
    marginTop: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  statVal: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
  },
  goalCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
    marginTop: 20,
  },
  goalTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: 8,
  },
  goalLabelText: {
    color: colors.onSurfaceVariant,
    fontWeight: "700",
    fontSize: 14,
  },
  goalValueText: {
    color: colors.secondary,
    fontWeight: "700",
    fontSize: 14,
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 9999,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: colors.secondary,
    borderRadius: 9999,
  },
  recentSection: {
    marginTop: 24,
  },
  recentSectionTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
  },
  emptyHistory: {
    alignItems: "center",
    paddingVertical: 30,
    gap: 8,
  },
  emptyHistoryText: {
    color: colors.onSurfaceVariant,
    fontWeight: "500",
    fontSize: 14,
  },
  rideCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
    borderLeftWidth: 4,
    marginBottom: 8,
    gap: 8,
    position: "relative",
    overflow: "hidden",
  },
  rideCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  rideDate: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  rideCardMiddle: {
    position: "relative",
    gap: 6,
    marginTop: 4,
  },
  routeLine: {
    position: "absolute",
    left: 3,
    top: 14,
    bottom: 14,
    width: 1,
    backgroundColor: "rgba(69, 71, 77, 0.3)",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
  },
  addressText: {
    flex: 1,
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  rideCardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  ridePrice: {
    fontSize: 20,
    fontWeight: "700",
  },
});
