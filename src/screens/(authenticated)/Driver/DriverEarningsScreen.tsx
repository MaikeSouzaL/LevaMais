import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";

import rideService, { Ride } from "../../../services/ride.service";
import { DriverScreen } from "./components/DriverScreen";

const { width } = Dimensions.get("window");

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

// [REMOVED] WEEK_DATA mock

export default function DriverEarningsScreen() {
  const navigation = useNavigation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [period, setPeriod] = useState<"day" | "week" | "month">("week");
  const [chartData, setChartData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [balanceVisible, setBalanceVisible] = useState(true);

  // Filtra corridas completas
  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed"),
    [rides],
  );

  // Calcula total (bruto por enquanto)
  const totalEarnings = useMemo(() => {
    return completed.reduce(
      (sum, r) => sum + ((r as any)?.pricing?.total || 0),
      0,
    );
  }, [completed]);

  // Simula um saldo disponível
  const availableBalance = totalEarnings * 0.8;

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        const [historyRes, chartRes] = await Promise.all([
             rideService.getHistory({ limit: 50, page: 1 }),
             rideService.getEarningsHistory(period)
        ]);
        
        if (!mounted) return;
        setRides(historyRes.rides || []);
        
        if (chartRes && chartRes.length > 0) {
            setChartData(chartRes);
        } else {
             setChartData([]);
        }

      } catch (e: any) {
        // Silent error
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [period]);

  const renderTabs = () => (
      <View style={{ flexDirection: "row", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 12, padding: 4, marginBottom: 16 }}>
          {(['day', 'week', 'month'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPeriod(p)}
                style={{
                    flex: 1,
                    paddingVertical: 8,
                    alignItems: "center",
                    borderRadius: 8,
                    backgroundColor: period === p ? "#02de95" : "transparent"
                }}
              >
                  <Text style={{ 
                      color: period === p ? "#0f231c" : "rgba(255,255,255,0.6)", 
                      fontWeight: "700",
                      fontSize: 13,
                      textTransform: "capitalize"
                  }}>
                      {p === 'day' ? 'Dia' : p === 'week' ? 'Semana' : 'Mês'}
                  </Text>
              </TouchableOpacity>
          ))}
      </View>
  );

  const renderChart = () => {
    if (!chartData || chartData.length === 0) {
        return (
            <View style={{ height: 120, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.3)" }}>Sem dados para este período</Text>
            </View>
        );
    }
    
    // Scale
    const max = Math.max(...chartData.map((d) => d.value), 100); 

    // ScrollView horizontal for "Month" view if too many items
    const isScrollable = chartData.length > 10;
    
    const ChartContent = (
      <View
        style={{
          flexDirection: "row",
          justifyContent: isScrollable ? "flex-start" : "space-between",
          alignItems: "flex-end",
          height: 140,
          marginTop: 20,
          paddingHorizontal: 10,
          gap: isScrollable ? 12 : 0
        }}
      >
        {chartData.map((item, index) => {
          const height = (item.value / max) * 100;
          const isToday = index === chartData.length - 1; // Last one
          
          return (
            <View key={index} style={{ alignItems: "center", gap: 8, minWidth: 20 }}>
              {item.value > 0 && (
                  <Text style={{ color: "#02de95", fontSize: 9, position: 'absolute', top: -16 }}>
                      {Math.round(item.value)}
                  </Text>
              )}
              
              <View
                style={{
                  width: period === "month" ? 8 : 32, // Thinner bars for month
                  height: `${Math.max(height, 5)}%`,
                  backgroundColor: isToday ? "#02de95" : "rgba(255,255,255,0.1)",
                  borderRadius: 6,
                }}
              />
              <Text
                style={{
                  color: isToday ? "#02de95" : "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  fontWeight: "700",
                }}
              >
                {item.label}
              </Text>
            </View>
          );
        })}
      </View>
    );

    if (isScrollable) {
        return (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {ChartContent}
            </ScrollView>
        );
    }

    return ChartContent;
  };


  return (
    <DriverScreen title="Financeiro" scroll>
      {/* 1. Header de Saldo Disponível (Estilo Carteira) */}
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
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: "600", textTransform: 'uppercase', letterSpacing: 1 }}>
              Saldo Disponível
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }}>
              <Text style={{ color: "#fff", fontSize: 32, fontWeight: "900", letterSpacing: -1 }}>
                {balanceVisible ? formatBRL(availableBalance) : "•••••••"}
              </Text>
              <TouchableOpacity onPress={() => setBalanceVisible(!balanceVisible)}>
                <Ionicons name={balanceVisible ? "eye-off" : "eye"} size={22} color="rgba(255,255,255,0.4)" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
          <TouchableOpacity
            onPress={() => (navigation as any).navigate("DriverWithdraw")}
            style={{
              flex: 1,
              backgroundColor: "#02de95",
              paddingVertical: 14,
              borderRadius: 14,
              alignItems: "center",
              flexDirection: "row",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <FontAwesome5 name="money-bill-wave" size={16} color="#0f231c" />
            <Text style={{ color: "#0f231c", fontWeight: "800", fontSize: 15 }}>SACAR</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => (navigation as any).navigate("DriverStatement")}
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
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>Extrato</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* 2. Resumo da Semana e Gráfico */}
      <View style={{ marginTop: 24 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 4, marginBottom: 12 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
              {period === 'day' ? 'Ganhos de Hoje' : period === 'week' ? 'Ganhos da Semana' : 'Ganhos do Mês'}
          </Text>
          <TouchableOpacity 
            onPress={() => (navigation as any).navigate("DriverStatement")} 
            style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
          >
            <Text style={{ color: "#02de95", fontWeight: "700", fontSize: 14 }}>Ver detalhes</Text>
            <MaterialIcons name="chevron-right" size={20} color="#02de95" />
          </TouchableOpacity>
        </View>
        
        {renderTabs()}
        
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, marginTop: 4, paddingHorizontal: 4 }}>
          {/* [NEW] Dynamic Date Range */}
          {(() => {
             const now = new Date();
             const start = now.getDate() - now.getDay(); // Sunday
             const end = start + 6; // Saturday
             const startDate = new Date(now.setDate(start));
             const endDate = new Date(now.setDate(end));
             // Simple formatting to avoid extra deps if possible, or use Intl
             const fmt = (d: Date) => d.toLocaleDateString("pt-BR", { day: '2-digit', month: 'short' }).replace(".", "");
             return `${fmt(startDate)} - ${fmt(endDate)}`;
          })()}
        </Text>

        {/* Gráfico */}
        {renderChart()}

        {/* Stats Grid */}
        <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: "#02de95" }}>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Ganhos</Text>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>{balanceVisible ? formatBRL(totalEarnings) : "---"}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: "#fbbf24" }}>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Corridas</Text>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>{completed.length}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: "#3b82f6" }}>
                <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700", textTransform: "uppercase" }}>Online</Text>
                <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 4 }}>4h 12m</Text>
            </View>
        </View>
      </View>

      {/* 3. Atividades Recentes */}
      <View style={{ marginTop: 32, marginBottom: 40 }}>
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 16, paddingHorizontal: 4 }}>Recentes</Text>

        {loading ? (
          <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 20 }} />
        ) : rides.length === 0 ? (
          <View style={{ padding: 20, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16 }}>
            <MaterialIcons name="history" size={40} color="rgba(255,255,255,0.2)" />
            <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 10 }}>Nenhuma corrida recente</Text>
          </View>
        ) : (
          rides.slice(0, 5).map((ride, i) => (
            <TouchableOpacity
              onPress={() => (navigation as any).navigate("DriverRideDetails", { ride })}
              activeOpacity={0.7}
              key={ride._id || i}
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
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <View style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: ride.status === "completed" ? "rgba(2,222,149,0.15)" : "rgba(239,68,68,0.15)",
                    alignItems: "center",
                    justifyContent: "center"
                }}>
                    <MaterialIcons 
                        name={ride.serviceType === "delivery" ? "local-shipping" : "directions-car"} 
                        size={20} 
                        color={ride.status === "completed" ? "#02de95" : "#ef4444"} 
                    />
                </View>
                <View>
                    <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
                        {ride.dropoff?.address?.split(",")[0] || "Destino desconhecido"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }}>
                        {new Date(ride.createdAt).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </Text>
                </View>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                  <Text style={{ color: ride.status === "completed" ? "#fff" : "#ef4444", fontWeight: "800", fontSize: 15 }}>
                      {ride.status === "completed" ? formatBRL(ride.pricing?.total) : "Cancelado"}
                  </Text>
                  {ride.status === "completed" && (
                     <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Finalizado</Text>
                  )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </DriverScreen>
  );
}
