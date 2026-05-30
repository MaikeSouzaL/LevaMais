import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  RefreshControl,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import {
  ArrowLeft,
  FileText,
  Plus,
  Car,
  Wallet,
  ArrowDownLeft,
  ChevronRight,
  ChevronDown,
  Calendar,
  Hash,
  CreditCard,
} from "lucide-react-native";
import { MotiView } from "moti";
import Toast from "react-native-toast-message";

import driverService, { BalanceTransaction } from "../../../services/driver.service";

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
    }).format(Math.abs(value));
  } catch {
    return `R$ ${Math.abs(value || 0).toFixed(2)}`;
  }
}

function checkIsCredit(item: BalanceTransaction) {
  const type = String(item.type || "").toLowerCase();
  if (type === "deposit" || type === "driver_topup") return true;
  if (type === "deduction" || type === "app_fee_debit" || type === "withdrawal") return false;
  return item.amount >= 0;
}

export default function DriverStatementScreen() {
  const navigation = useNavigation<any>();
  const [items, setItems] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  const loadStatement = useCallback(
    async (nextPage = 1, options?: { isRefresh?: boolean; append?: boolean }) => {
      const isRefresh = Boolean(options?.isRefresh);
      const append = Boolean(options?.append);

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await driverService.getBalanceHistory(300);
        const pageSize = 30;
        const start = (nextPage - 1) * pageSize;
        const pageItems = response.slice(start, start + pageSize);
        setHasNext(start + pageSize < response.length);
        setPage(nextPage);
        setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
      } catch (error) {
        console.error("Failed to load statement:", error);
        Toast.show({ type: "error", text1: "Erro ao carregar extrato" });
      } finally {
        setLoading(false);
        setLoadingMore(false);
        setRefreshing(false);
      }
    },
    []
  );

  useFocusEffect(
    useCallback(() => {
      loadStatement(1);
    }, [loadStatement])
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "credit") return items.filter((item) => checkIsCredit(item));
    return items.filter((item) => !checkIsCredit(item));
  }, [items, filter]);

  const summary = useMemo(() => {
    const total = filteredItems.reduce((acc, item) => {
      const isCredit = checkIsCredit(item);
      return acc + (isCredit ? item.amount : -item.amount);
    }, 0);
    return { total, count: filteredItems.length };
  }, [filteredItems]);

  const sections = useMemo(() => {
    const groups: Record<string, BalanceTransaction[]> = {};
    const now = new Date();

    filteredItems.forEach((item) => {
      const date = new Date(item.createdAt);
      if (Number.isNaN(date.getTime())) return;

      let key = date.toLocaleDateString("pt-BR");
      if (date.toDateString() === now.toDateString()) {
        key = "Hoje";
      } else {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        if (date.toDateString() === yesterday.toDateString()) {
          key = "Ontem";
        }
      }

      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    return Object.keys(groups).map((title) => ({
      title,
      data: groups[title],
    }));
  }, [filteredItems]);

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasNext) return;
    loadStatement(page + 1, { append: true });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── TopAppBar ── */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topAppBarTitle}>Ganhos e carteira</Text>
      </View>

      {/* ── Main Content ── */}
      <View style={styles.main}>
        {/* Header Title Section */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <FileText size={20} color={colors.onSurfaceVariant} />
          </View>
          <Text style={styles.headerTitle}>Extrato</Text>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardGlow} />
          <Text style={styles.balanceLabel}>Saldo do Período</Text>
          <Text style={styles.balanceValue}>
            {summary.total < 0 ? "-" : ""}
            {formatBRL(summary.total)}
          </Text>
          <Text style={styles.balanceCount}>
            {summary.count} {summary.count === 1 ? "lançamento" : "lançamentos"}
          </Text>
        </View>

        {/* Filters / Chips */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {([
              { key: "all", label: "Tudo" },
              { key: "credit", label: "Entradas" },
              { key: "debit", label: "Saídas" },
            ] as const).map((option) => {
              const isActive = filter === option.key;
              return (
                <TouchableOpacity
                  key={option.key}
                  onPress={() => setFilter(option.key)}
                  activeOpacity={0.8}
                  style={[
                    styles.chipBtn,
                    isActive && styles.chipBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      isActive && styles.chipTextActive,
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Transactions List */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={colors.secondary} />
          </View>
        ) : (
          <SectionList
            sections={sections}
            stickySectionHeadersEnabled={false}
            keyExtractor={(item) => String(item.id || `${item.createdAt}-${item.amount}`)}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadStatement(1, { isRefresh: true })}
                tintColor={colors.secondary}
                colors={[colors.secondary]}
              />
            }
            renderSectionHeader={({ section: { title } }) => (
              <Text style={styles.sectionHeader}>{title}</Text>
            )}
            renderItem={({ item }) => {
              const isCredit = checkIsCredit(item);
              const formattedTime = new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const formattedDate = new Date(item.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "long",
                year: "numeric",
              });

              // Icon resolution matching spec
              let IconComp = Car;
              if (item.type === "withdrawal") {
                IconComp = ArrowDownLeft;
              } else if (item.type === "deposit" || item.type === "driver_topup") {
                IconComp = Plus;
              }

              const hasRide = !!item.rideId;
              const isExpanded = expandedItemId === item.id;

              const handlePress = () => {
                if (hasRide) {
                  // Navigate to full ride details screen
                  navigation.navigate("DriverRideDetails" as never, { rideId: item.rideId } as never);
                } else {
                  // Toggle inline expanded deposit/topup receipt
                  setExpandedItemId(isExpanded ? null : item.id);
                }
              };

              return (
                <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
                  <MotiView
                    from={{ opacity: 0, translateY: 6 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: "spring", damping: 18 }}
                    style={[styles.itemCard, isCredit && styles.itemCardCredit]}
                  >
                    {/* Left Circle Icon */}
                    <View
                      style={[
                        styles.itemIconCircle,
                        isCredit && styles.itemIconCircleCredit,
                      ]}
                    >
                      <IconComp
                        size={20}
                        color={isCredit ? colors.secondary : colors.onSurfaceVariant}
                      />
                    </View>

                    {/* Middle Info */}
                    <View style={styles.itemMeta}>
                      <Text style={styles.itemTitle} numberOfLines={1}>
                        {item.reason || (isCredit ? "Recarga / Depósito" : "Taxa da plataforma")}
                      </Text>
                      {item.rideId && (
                        <Text style={styles.itemRideId} numberOfLines={1}>
                          {item.rideId}
                        </Text>
                      )}
                      <Text style={styles.itemTime}>{formattedTime}</Text>
                    </View>

                    {/* Right: Price + Chevron */}
                    <View style={{ alignItems: "flex-end", gap: 4 }}>
                      <Text
                        style={[
                          styles.itemPrice,
                          isCredit ? styles.priceCredit : styles.priceDebit,
                        ]}
                      >
                        {isCredit ? "+" : "-"}
                        {formatBRL(item.amount)}
                      </Text>
                      {hasRide ? (
                        <ChevronRight size={14} color={colors.onSurfaceVariant} />
                      ) : (
                        <ChevronDown
                          size={14}
                          color={colors.onSurfaceVariant}
                          style={isExpanded ? { transform: [{ rotate: "180deg" }] } : undefined}
                        />
                      )}
                    </View>
                  </MotiView>

                  {/* Expanded Deposit/Topup Receipt */}
                  {isExpanded && !hasRide && (
                    <MotiView
                      from={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", damping: 20 }}
                      style={styles.receiptCard}
                    >
                      <Text style={styles.receiptTitle}>Comprovante de Recarga</Text>
                      <View style={styles.receiptDivider} />

                      <View style={styles.receiptRow}>
                        <View style={styles.receiptIconWrap}>
                          <CreditCard size={14} color={colors.onSurfaceVariant} />
                        </View>
                        <Text style={styles.receiptLabel}>Tipo</Text>
                        <Text style={styles.receiptValue}>
                          {item.type === "driver_topup" ? "Recarga de saldo" : item.type === "withdrawal" ? "Saque" : "Transação"}
                        </Text>
                      </View>

                      <View style={styles.receiptRow}>
                        <View style={styles.receiptIconWrap}>
                          <Plus size={14} color={colors.secondary} />
                        </View>
                        <Text style={styles.receiptLabel}>Valor</Text>
                        <Text style={[styles.receiptValue, { color: colors.secondary, fontWeight: "700" }]}>
                          +{formatBRL(item.amount)}
                        </Text>
                      </View>

                      <View style={styles.receiptRow}>
                        <View style={styles.receiptIconWrap}>
                          <Calendar size={14} color={colors.onSurfaceVariant} />
                        </View>
                        <Text style={styles.receiptLabel}>Data</Text>
                        <Text style={styles.receiptValue}>{formattedDate}</Text>
                      </View>

                      <View style={styles.receiptRow}>
                        <View style={styles.receiptIconWrap}>
                          <Hash size={14} color={colors.onSurfaceVariant} />
                        </View>
                        <Text style={styles.receiptLabel}>ID</Text>
                        <Text style={[styles.receiptValue, { fontSize: 11 }]} numberOfLines={1}>
                          {item.id}
                        </Text>
                      </View>

                      <View style={styles.receiptRow}>
                        <View style={styles.receiptIconWrap}>
                          <FileText size={14} color={colors.onSurfaceVariant} />
                        </View>
                        <Text style={styles.receiptLabel}>Status</Text>
                        <View style={styles.receiptStatusBadge}>
                          <View style={[styles.receiptStatusDot, { backgroundColor: colors.secondary }]} />
                          <Text style={[styles.receiptValue, { color: colors.secondary }]}>
                            {item.status === "completed" ? "Confirmado" : item.status || "Confirmado"}
                          </Text>
                        </View>
                      </View>
                    </MotiView>
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyView}>
                <FileText size={48} color="rgba(255,255,255,0.15)" />
                <Text style={styles.emptyText}>Nenhuma movimentação encontrada</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? (
                <ActivityIndicator
                  size="small"
                  color={colors.secondary}
                  style={{ marginVertical: 16 }}
                />
              ) : null
            }
          />
        )}
      </View>
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
  },
  backBtn: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 12,
  },
  topAppBarTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  main: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  balanceCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    position: "relative",
    overflow: "hidden",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 30,
    elevation: 3,
    marginBottom: 20,
  },
  cardGlow: {
    position: "absolute",
    inset: 0,
    backgroundColor: colors.surfaceContainerHigh,
    opacity: 0.5,
  },
  balanceLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    zIndex: 10,
  },
  balanceValue: {
    color: colors.onSurface,
    fontSize: 40,
    fontWeight: "800",
    marginTop: 6,
    zIndex: 10,
  },
  balanceCount: {
    color: colors.secondary,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    zIndex: 10,
  },
  filterRow: {
    marginBottom: 16,
    marginHorizontal: -20,
  },
  filterScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chipBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  chipBtnActive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  chipText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
  },
  chipTextActive: {
    color: colors.onSecondary,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionHeader: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingLeft: 4,
    marginTop: 20,
    marginBottom: 12,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    position: "relative",
    overflow: "hidden",
  },
  itemCardCredit: {
    // Subtle credit glow style from HTML
  },
  itemIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceContainerHighest,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  itemIconCircleCredit: {
    borderColor: "rgba(112, 255, 186, 0.2)",
  },
  itemMeta: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "600",
  },
  itemRideId: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    opacity: 0.8,
  },
  itemTime: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  priceCredit: {
    color: colors.secondary,
    fontWeight: "700",
  },
  priceDebit: {
    color: colors.onSurfaceVariant,
  },
  emptyView: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: "500",
  },
  receiptCard: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 12,
    padding: 16,
    marginTop: -4,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(112, 255, 186, 0.1)",
    gap: 12,
  },
  receiptTitle: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "700",
  },
  receiptDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  receiptRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  receiptIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  receiptLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "500",
    minWidth: 50,
  },
  receiptValue: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  receiptStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
    justifyContent: "flex-end",
  },
  receiptStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
