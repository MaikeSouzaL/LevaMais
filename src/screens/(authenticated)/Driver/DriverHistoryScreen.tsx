import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

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

function statusColor(status: string) {
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
      title="Historico"
      scroll={false}
      headerRight={<Text style={{ color: "rgba(255,255,255,0.72)", fontWeight: "800" }}>{rides.length}</Text>}
    >
      {loading ? (
        <View style={{ paddingTop: 40, alignItems: "center", gap: 12 }}>
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>Carregando corridas...</Text>
        </View>
      ) : rides.length === 0 ? (
        <View
          style={{
            marginTop: 12,
            backgroundColor: "rgba(17,37,62,0.64)",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: 18,
            alignItems: "center",
            gap: 8,
          }}
        >
          <MaterialIcons name="history" size={34} color="rgba(255,255,255,0.32)" />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontWeight: "700" }}>Sem corridas no historico</Text>
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
          {rides.map((ride) => (
            <TouchableOpacity
              key={ride._id}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate("DriverFinance", {
                  screen: "DriverRideDetails",
                  params: { rideId: ride._id },
                })
              }
              style={{
                backgroundColor: "rgba(17,37,62,0.64)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
                borderRadius: 16,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {formatBRL((ride as any)?.pricing?.total ?? 0)}
                </Text>
                <View
                  style={{
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    backgroundColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text style={{ color: statusColor(ride.status), fontWeight: "800", fontSize: 12 }}>
                    {mapStatus(ride.status)}
                  </Text>
                </View>
              </View>

              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 10 }} numberOfLines={1}>
                Coleta: {ride.pickup?.address || "-"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.72)", marginTop: 4 }} numberOfLines={1}>
                Destino: {ride.dropoff?.address || "-"}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </DriverScreen>
  );
}
