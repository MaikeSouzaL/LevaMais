import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  SectionList,
  Animated,
  RefreshControl,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { DriverScreen } from "./components/DriverScreen";
import driverService, { BalanceTransaction } from "../../../services/driver.service";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

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

export default function DriverStatementScreen() {
  const [items, setItems] = useState<BalanceTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "credit" | "debit">("all");
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(1));

  const loadStatement = useCallback(async (nextPage = 1, options?: { isRefresh?: boolean; append?: boolean }) => {
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
       const pageSize = 30; const start = (nextPage - 1) * pageSize; const pageItems = response.slice(start, start + pageSize); setHasNext(start + pageSize < response.length);
       setPage(nextPage);
       setItems((prev) => (append ? [...prev, ...pageItems] : pageItems));
     } catch (error) {
       console.error('Failed to load statement:', error);
       Toast.show({ type: "error", text1: "Erro ao carregar extrato" });
     } finally {
      setLoading(false);
      setLoadingMore(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadStatement(1);
    }, [loadStatement]),
  );

  const filteredItems = useMemo(() => {
    if (filter === "all") return items;
    if (filter === "credit") return items.filter((item) => item.amount >= 0);
    return items.filter((item) => item.amount < 0);
  }, [items, filter]);

  const summary = useMemo(() => {
    const total = filteredItems.reduce((acc, item) => acc + item.amount, 0);
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

    return Object.keys(groups).map((title) => ({ title, data: groups[title] }));
  }, [filteredItems]);

  const handleFilterChange = (next: typeof filter) => {
    if (next === filter) return;

    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();

    setFilter(next);
  };

  const handleLoadMore = () => {
    if (loading || loadingMore || refreshing || !hasNext) return;
    loadStatement(page + 1, { append: true });
  };

  return (
    <DriverScreen title="Extrato">
      <View style={{ marginBottom: 20 }}>
        <LinearGradient
          colors={["#11253E", "#091A2F"]}
          style={{
            padding: 20,
            borderRadius: 24,
            borderWidth: 1,
            borderColor: filter === "all" ? "rgba(2,222,149,0.2)" : "rgba(255,255,255,0.05)",
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: "700",
            }}
          >
            {filter === "all" ? "Saldo do periodo" : filter === "credit" ? "Total entradas" : "Total saidas"}
          </Text>
          <Text style={{ color: "#fff", fontSize: 36, fontWeight: "800", marginTop: 4 }}>
            {formatBRL(summary.total)}
          </Text>
          <View style={{ flexDirection: "row", marginTop: 12, alignItems: "center", gap: 6 }}>
            <MaterialIcons name="receipt" size={16} color="#02de95" />
            <Text style={{ color: "#02de95", fontWeight: "600" }}>{summary.count} lancamentos</Text>
          </View>
        </LinearGradient>

        <View style={{ flexDirection: "row", gap: 10 }}>
          {([
            { key: "all", label: "Tudo" },
            { key: "credit", label: "Entradas" },
            { key: "debit", label: "Saidas" },
          ] as const).map((option) => (
            <TouchableOpacity
              key={option.key}
              onPress={() => handleFilterChange(option.key)}
              style={{
                paddingVertical: 10,
                paddingHorizontal: 20,
                borderRadius: 30,
                backgroundColor: filter === option.key ? "#02de95" : "transparent",
                borderWidth: 1,
                borderColor: filter === option.key ? "#02de95" : "rgba(255,255,255,0.15)",
              }}
            >
              <Text
                style={{
                  color: filter === option.key ? "#091A2F" : "rgba(255,255,255,0.7)",
                  fontWeight: "700",
                  fontSize: 13,
                }}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 40 }} />
      ) : (
        <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
          <SectionList
            sections={sections}
            stickySectionHeadersEnabled={false}
            keyExtractor={(item) => String(item.id || `${item.createdAt}-${item.amount}`)}
            contentContainerStyle={{ paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => loadStatement(1, { isRefresh: true })}
                tintColor="#02de95"
              />
            }
            onEndReachedThreshold={0.3}
            onEndReached={handleLoadMore}
            renderSectionHeader={({ section: { title } }) => (
              <View style={{ backgroundColor: "#091A2F", paddingVertical: 12, marginTop: 8 }}>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.4)",
                    fontWeight: "700",
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {title}
                </Text>
              </View>
            )}
            renderItem={({ item }) => {
              const isCredit = item.amount >= 0;
              const time = new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <LinearGradient
                  colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: 16,
                    borderRadius: 20,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.05)",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isCredit ? "rgba(2,222,149,0.1)" : "rgba(239,68,68,0.1)",
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1,
                        borderColor: isCredit ? "rgba(2,222,149,0.2)" : "rgba(239,68,68,0.2)",
                      }}
                    >
                      <MaterialIcons
                        name={item.type === "withdrawal" ? "account-balance-wallet" : "directions-car"}
                        size={22}
                        color={isCredit ? "#02de95" : "#ef4444"}
                      />
                    </View>
                    <View>
                      <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>{item.reason || "Transação"}</Text>
                      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{time}</Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      color: isCredit ? "#02de95" : "#fff",
                      fontWeight: "900",
                      fontSize: 18,
                    }}
                  >
                    {isCredit ? "+" : ""}
                    {formatBRL(item.amount)}
                  </Text>
                </LinearGradient>
              );
            }}
            ListEmptyComponent={
              <View style={{ alignItems: "center", marginTop: 40, opacity: 0.5 }}>
                <MaterialIcons name="receipt-long" size={64} color="#fff" />
                <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>Nenhuma movimentacao</Text>
              </View>
            }
            ListFooterComponent={
              loadingMore ? <ActivityIndicator size="small" color="#02de95" style={{ marginVertical: 16 }} /> : null
            }
          />
        </Animated.View>
      )}
    </DriverScreen>
  );
}
