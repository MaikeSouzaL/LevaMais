import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import rideService, { Ride } from "../../../services/ride.service";
import walletService, { Balance } from "../../../services/wallet.service";
import websocketService from "../../../services/websocket.service";
import { DriverScreen } from "./components/DriverScreen";
import { DriverDepositModal } from "@/components/DriverDepositModal";

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

function mapStatus(status: string) {
  const mapping: Record<string, string> = {
    completed: "Finalizado",
    in_progress: "Em andamento",
    accepted: "Aceita",
    requesting: "Solicitacao",
    cancelled: "Cancelada",
    cancelled_by_client: "Cancelada pelo cliente",
    cancelled_by_driver: "Cancelada por voce",
  };

  return mapping[status] || status;
}

export default function DriverEarningsScreen() {
  const navigation = useNavigation<any>();
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showDepositModal, setShowDepositModal] = useState(false);

  const [balance, setBalance] = useState<Balance>({
    available: 0,
    totalEarnings: 0,
    totalWithdrawn: 0,
  });
  const [driverStats, setDriverStats] = useState({ earnings: 0, rides: 0, goal: 10, bonus: 0 });
  const [rides, setRides] = useState<Ride[]>([]);
  const [chartData, setChartData] = useState<{ label: string; value: number; count?: number }[]>([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [balanceRes, statsRes, historyRes, chartRes] = await Promise.all([
        walletService.getBalance(),
        rideService.getDriverStats(),
        rideService.getHistory({ limit: 20, page: 1 }),
        rideService.getEarningsHistory(period),
      ]);

      setBalance(balanceRes);
      setDriverStats(statsRes);
      setRides(historyRes.rides || []);
       setChartData((chartRes || []).map((item) => ({ label: item.label, value: item.value || 0, count: item.count || 0 })));
     } catch (error) {
       console.error('Failed to load earnings data:', error);
       setChartData([]);
     } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  useEffect(() => {
    const handleBalanceUpdate = (data: any) => {
      console.log("✅ WebSocket balance updated received", data);
      loadData(true); // reload data silently
    };

    websocketService.on("balance_updated", handleBalanceUpdate);

    return () => {
      websocketService.off("balance_updated", handleBalanceUpdate);
    };
  }, [loadData]);

  const completedCount = useMemo(
    () => rides.filter((ride) => ride.status === "completed").length,
    [rides],
  );

  const periodTotals = useMemo(() => {
    return chartData.reduce(
      (acc, item) => {
        acc.earnings += item.value || 0;
        acc.rides += item.count || 0;
        return acc;
      },
      { earnings: 0, rides: 0 }
    );
  }, [chartData]);

  const goalProgress = useMemo(() => {
    const goal = Math.max(1, Number(driverStats.goal || 0));
    const ridesDone = Number(driverStats.rides || 0);
    return Math.min(100, Math.round((ridesDone / goal) * 100));
  }, [driverStats.goal, driverStats.rides]);

  const renderTabs = () => (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
      }}
    >
      {(["day", "week", "month"] as const).map((current) => (
        <TouchableOpacity
          key={current}
          onPress={() => setPeriod(current)}
          style={{
            flex: 1,
            paddingVertical: 8,
            alignItems: "center",
            borderRadius: 8,
            backgroundColor: period === current ? "#02de95" : "transparent",
          }}
        >
          <Text
            style={{
              color: period === current ? "#091A2F" : "rgba(255,255,255,0.6)",
              fontWeight: "700",
              fontSize: 13,
            }}
          >
            {current === "day" ? "Dia" : current === "week" ? "Semana" : "Mes"}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChart = () => {
    if (!chartData.length) {
      return (
        <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
          <Text style={{ color: "rgba(255,255,255,0.3)" }}>Sem dados para este periodo</Text>
        </View>
      );
    }

    const max = Math.max(...chartData.map((item) => item.value), 1);
    const isScrollable = chartData.length > 10;

    const content = (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isScrollable ? "flex-start" : "space-between",
          alignItems: "flex-end",
          height: 140,
          marginTop: 20,
          paddingHorizontal: 10,
          gap: isScrollable ? 12 : 0,
        }}
      >
        {chartData.map((item, index) => {
          const height = (item.value / max) * 100;
          return (
            <View key={`${item.label}-${index}`} style={{ alignItems: "center", gap: 8, minWidth: 20 }}>
              {item.value > 0 && (
                <Text style={{ color: "#02de95", fontSize: 9, position: "absolute", top: -16 }}>
                  {Math.round(item.value)}
                </Text>
              )}
              <View
                style={{
                  width: period === "month" ? 8 : 28,
                  height: `${Math.max(height, 5)}%`,
                  backgroundColor: "#02de95",
                  borderRadius: 6,
                }}
              />
              <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700" }}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );

    if (isScrollable) {
      return <ScrollView horizontal showsHorizontalScrollIndicator={false}>{content}</ScrollView>;
    }

    return content;
  };

  return (
    <DriverScreen title="Financeiro" scroll hideHeader={true}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadData(true)}
            tintColor="#02de95"
          />
        }
      >
        <LinearGradient
          colors={["#1b2723", "#111816"]}
          style={{
            margin: 1,
            borderRadius: 24,
            padding: 20,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 13,
              fontWeight: "600",
              textTransform: "uppercase",
              letterSpacing: 1,
            }}
          >
            Saldo disponivel
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
            <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -1 }}>
              {balanceVisible ? formatBRL(balance.available) : "*******"}
            </Text>
            <TouchableOpacity onPress={() => setBalanceVisible((prev) => !prev)}>
              <Ionicons
                name={balanceVisible ? "eye-off" : "eye"}
                size={22}
                color="rgba(255,255,255,0.4)"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setShowDepositModal(true)}
            style={{
              backgroundColor: "#02de95",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
              marginTop: 24,
            }}
          >
            <FontAwesome5 name="plus-circle" size={16} color="#091A2F" />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15 }}>DEPOSITAR / RECARREGAR</Text>
          </TouchableOpacity>

          <View style={{ flexDirection: "row", gap: 12, marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverWithdraw")}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <FontAwesome5 name="money-bill-wave" size={16} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>SACAR</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate("DriverStatement")}
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.06)",
                paddingVertical: 14,
                borderRadius: 14,
                alignItems: "center",
                flexDirection: "row",
                justifyContent: "center",
                gap: 8,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
              }}
            >
              <MaterialIcons name="history" size={20} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>EXTRATO</Text>
            </TouchableOpacity>
          </View>


        </LinearGradient>

        <View style={{ marginTop: 24 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              paddingHorizontal: 4,
              marginBottom: 12,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
              {period === "day" ? "Ganhos do dia" : period === "week" ? "Ganhos da semana" : "Ganhos do mes"}
            </Text>
            <TouchableOpacity
              onPress={() => navigation.navigate("DriverStatement")}
              style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
            >
              <Text style={{ color: "#02de95", fontWeight: "700", fontSize: 14 }}>Ver detalhes</Text>
              <MaterialIcons name="chevron-right" size={20} color="#02de95" />
            </TouchableOpacity>
          </View>

          {renderTabs()}
          {renderChart()}

          <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.03)",
                padding: 16,
                borderRadius: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#02de95",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                Total ganho
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>
                {balanceVisible ? formatBRL(periodTotals.earnings) : "---"}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.03)",
                padding: 16,
                borderRadius: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#fbbf24",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                Corridas concluidas
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>
                {periodTotals.rides}
              </Text>
            </View>

            <View
              style={{
                flex: 1,
                backgroundColor: "rgba(255,255,255,0.03)",
                padding: 16,
                borderRadius: 16,
                borderLeftWidth: 3,
                borderLeftColor: "#3b82f6",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                Meta diaria
              </Text>
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>
                {goalProgress}%
              </Text>
            </View>
          </View>

          <View
            style={{
              marginTop: 12,
              backgroundColor: "rgba(255,255,255,0.03)",
              borderRadius: 12,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.08)",
            }}
          >
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>
              Meta: {driverStats.rides}/{driverStats.goal} corridas • Bonus: {formatBRL(driverStats.bonus || 0)}
            </Text>
          </View>
        </View>

        <View style={{ marginTop: 32, marginBottom: 40 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 16, paddingHorizontal: 4 }}>
            Recentes
          </Text>

          {loading ? (
            <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 20 }} />
          ) : rides.length === 0 ? (
            <View
              style={{
                padding: 20,
                alignItems: "center",
                backgroundColor: "rgba(255,255,255,0.03)",
                borderRadius: 16,
              }}
            >
              <MaterialIcons name="history" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 10 }}>Nenhuma corrida recente</Text>
            </View>
          ) : (
            rides.slice(0, 5).map((ride) => (
              <TouchableOpacity
                onPress={() => navigation.navigate("DriverRideDetails", { rideId: ride._id })}
                activeOpacity={0.7}
                key={ride._id}
                style={{
                  backgroundColor: "rgba(255,255,255,0.03)",
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 10,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.03)",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
                  <View
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 21,
                      backgroundColor: ride.status === "completed" ? "rgba(2,222,149,0.15)" : "rgba(239,68,68,0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <MaterialIcons
                      name={ride.serviceType === "delivery" ? "local-shipping" : "directions-car"}
                      size={20}
                      color={ride.status === "completed" ? "#02de95" : "#ef4444"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }} numberOfLines={1}>
                      {ride.dropoff?.address || "Destino desconhecido"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                      {mapStatus(ride.status)}
                    </Text>
                  </View>
                </View>

                <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
                  <Text
                    style={{
                      color: ride.status === "completed" ? "#fff" : "#ef4444",
                      fontWeight: "800",
                      fontSize: 15,
                    }}
                  >
                    {ride.status === "completed"
                      ? formatBRL(ride.pricing?.driverValue ?? (ride.pricing?.total || 0) * 0.8)
                      : "--"}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
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
    </DriverScreen>
  );
}
