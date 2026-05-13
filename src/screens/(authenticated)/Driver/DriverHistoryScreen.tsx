import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";

import rideService, { Ride } from "../../../services/ride.service";
import { DriverScreen } from "./components/DriverScreen";

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
  const labels: Record<string, string> = {
    requesting: "Procurando",
    driver_assigned: "Atribuida",
    accepted: "Aceita",
    arrived: "Cheguei",
    in_progress: "Em andamento",
    completed: "Finalizada",
    cancelled: "Cancelada",
    cancelled_by_client: "Cancelada pelo cliente",
    cancelled_by_driver: "Cancelada por voce",
    cancelled_no_driver: "Sem motorista",
  };

  return labels[status] || status;
}

function getHistoryStatusColor(status: string) {
  if (status === "completed") return "#02de95";
  if (status.startsWith("cancelled")) return "#ef4444";
  if (status === "in_progress") return "#60a5fa";
  return "#fbbf24";
}

export default function DriverHistoryScreen() {
  const navigation = useNavigation<any>();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const res = await rideService.getHistory({ limit: 50, page: 1 });
      setRides(res.rides || []);
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel carregar historico",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory]),
  );

  return (
    <DriverScreen
      title="Histórico"
      scroll={false}
      hideHeader={true}
      headerRight={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(2,222,149,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 }}>
          <MaterialIcons name="history" size={16} color="#02de95" />
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 13 }}>
            {rides.length}
          </Text>
        </View>
      }
    >
      {loading ? (
        <View style={{ flex: 1, paddingTop: 60, alignItems: "center", gap: 16 }}>
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
            Carregando histórico de corridas...
          </Text>
        </View>
      ) : rides.length === 0 ? (
        <View style={{ flex: 1, paddingTop: 60, alignItems: "center", gap: 16 }}>
          <View
            style={{
              width: 100,
              height: 100,
              borderRadius: 50,
              backgroundColor: "rgba(2,222,149,0.1)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "rgba(2,222,149,0.2)",
            }}
          >
            <MaterialIcons name="history" size={48} color="rgba(255,255,255,0.3)" />
          </View>
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "700", fontSize: 16 }}>
            Nenhuma corrida no histórico
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, textAlign: "center", paddingHorizontal: 20 }}>
            Suas corridas concluídas aparecerão aqui
          </Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadHistory(true)}
              tintColor="#02de95"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          {rides.map((ride, index) => {
            const rideStatusColor = getHistoryStatusColor(ride.status);
            const statusLabel = mapStatus(ride.status);
            const isCompleted = ride.status === "completed";

            return (
              <TouchableOpacity
                key={ride._id}
                activeOpacity={0.85}
                onPress={() =>
                  navigation.navigate("DriverFinance", {
                    screen: "DriverRideDetails",
                    params: { rideId: ride._id },
                  })
                }
              >
                <LinearGradient
                  colors={
                    isCompleted
                      ? ["rgba(2,222,149,0.08)", "rgba(2,222,149,0.03)"]
                      : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{
                    borderRadius: 16,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isCompleted ? "rgba(2,222,149,0.2)" : "rgba(255,255,255,0.08)",
                    overflow: "hidden",
                  }}
                >
                  <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 12 }}>
                    {/* Icon */}
                    <LinearGradient
                      colors={
                        isCompleted
                          ? ["rgba(2,222,149,0.15)", "rgba(2,222,149,0.08)"]
                          : ["rgba(239,68,68,0.15)", "rgba(239,68,68,0.08)"]
                      }
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <MaterialIcons
                        name={ride.serviceType === "delivery" ? "local-shipping" : "directions-car"}
                        size={24}
                        color={isCompleted ? "#02de95" : "#ef4444"}
                      />
                    </LinearGradient>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15 }} numberOfLines={1}>
                            {ride.dropoff?.address || "Destino desconhecido"}
                          </Text>
                        </View>
                        <View
                          style={{
                            backgroundColor: rideStatusColor === "#02de95" ? "rgba(2,222,149,0.15)" : "rgba(239,68,68,0.15)",
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            borderRadius: 8,
                          }}
                        >
                          <Text
                            style={{
                              color: rideStatusColor,
                              fontWeight: "800",
                              fontSize: 11,
                            }}
                          >
                            {statusLabel}
                          </Text>
                        </View>
                      </View>

                      <View style={{ gap: 4 }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <MaterialIcons name="location-on" size={14} color="rgba(255,255,255,0.5)" />
                          <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }} numberOfLines={1}>
                            Origem: {ride.pickup?.address || "Desconhecida"}
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <MaterialCommunityIcons name="map-marker-distance" size={14} color="rgba(255,255,255,0.5)" />
                          <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
                            Distância desconhecida
                          </Text>
                        </View>

                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <MaterialIcons name="access-time" size={14} color="rgba(255,255,255,0.5)" />
                          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>
                            {new Date(ride.createdAt || ride.createdAt).toLocaleDateString("pt-BR")}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Footer */}
                  <View
                    style={{
                      marginTop: 12,
                      paddingTop: 10,
                      borderTopWidth: 1,
                      borderTopColor: "rgba(255,255,255,0.05)",
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <MaterialIcons name="attach-money" size={16} color="#02de95" />
                      <Text style={{ color: "#fff", fontWeight: "900", fontSize: 14 }}>
                        {formatBRL((ride as any)?.pricing?.total ?? 0)}
                      </Text>
                    </View>

                    <MaterialIcons name="chevron-right" size={20} color="rgba(2,222,149,0.5)" />
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </DriverScreen>
  );
}
