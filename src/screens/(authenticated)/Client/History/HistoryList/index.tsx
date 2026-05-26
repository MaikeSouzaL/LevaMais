import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  ArrowLeft,
  Package,
  Car,
  Clock,
  MapPin,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  RotateCcw,
  Inbox,
} from "lucide-react-native";

import rideService, { Ride } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { ClientStackParamList } from "../../types/navigation";
import type { RideStatus } from "../../types";

function formatRideDate(ride: Ride): string {
  const value = ride.completedAt || ride.cancelledAt || ride.createdAt;
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Filter = "all" | "completed" | "cancelled" | "active";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "completed", label: "Concluídas" },
  { id: "cancelled", label: "Canceladas" },
  { id: "active", label: "Ativas" },
];

const VALID_RIDE_STATUSES: RideStatus[] = [
  "requesting", "driver_assigned", "accepted", "driver_arriving",
  "arrived", "in_progress", "completed", "cancelled", "cancelled_by_client",
  "cancelled_by_driver", "cancelled_no_driver", "expired", "timeout", "pending", "arriving",
];

function normalizeRideStatus(status?: string): RideStatus {
  return VALID_RIDE_STATUSES.includes(status as RideStatus)
    ? (status as RideStatus)
    : "pending";
}

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  completed:         { label: "Concluída",          color: "#02de95", icon: CheckCircle },
  cancelled:         { label: "Cancelada",           color: "#ef4444", icon: XCircle },
  cancelled_by_client: { label: "Cancelada por você", color: "#ef4444", icon: XCircle },
  cancelled_by_driver: { label: "Cancelada",          color: "#f97316", icon: XCircle },
  cancelled_no_driver: { label: "Sem motorista",      color: "#f97316", icon: AlertCircle },
  expired:           { label: "Expirada",            color: "#f97316", icon: AlertCircle },
  requesting:        { label: "Buscando",            color: "#fbbf24", icon: Clock },
  driver_assigned:   { label: "Motorista alocado",   color: "#60a5fa", icon: Clock },
  accepted:          { label: "A caminho",           color: "#60a5fa", icon: Clock },
  driver_arriving:   { label: "Chegando",            color: "#60a5fa", icon: Clock },
  arrived:           { label: "No local",            color: "#a78bfa", icon: Clock },
  in_progress:       { label: "Em andamento",        color: "#a78bfa", icon: Clock },
};

function StatusPill({ status }: { status: string }) {
  const meta = STATUS_META[status] || { label: status, color: "rgba(255,255,255,0.4)", icon: Clock };
  const Icon = meta.icon;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: meta.color + "18",
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: meta.color + "40",
    }}>
      <Icon size={11} color={meta.color} />
      <Text style={{ color: meta.color, fontSize: 11, fontWeight: "700" }}>{meta.label}</Text>
    </View>
  );
}

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto", car: "Carro", van: "Van", truck: "Caminhão",
};

export default function HistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "History">>();
  const insets = useSafeAreaInsets();

  const [history, setHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const response = await rideService.getHistory({ page: 1, limit: 60 });
      setHistory(response.rides || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const filteredHistory = useMemo(() => {
    if (selectedFilter === "all") return history;
    if (selectedFilter === "completed") return history.filter((r) => String(r.status) === "completed");
    if (selectedFilter === "cancelled") return history.filter((r) => {
      const s = String(r.status);
      return s.startsWith("cancelled") || s === "expired";
    });
    return history.filter((r) =>
      ["requesting","driver_assigned","accepted","driver_arriving","arrived","in_progress"].includes(String(r.status))
    );
  }, [history, selectedFilter]);

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Histórico</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            {history.length > 0 ? `${history.length} registro${history.length !== 1 ? "s" : ""}` : "Suas corridas e entregas"}
          </Text>
        </View>
      </View>

      {/* Filtros */}
      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {FILTERS.map((filter) => {
          const active = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              onPress={() => setSelectedFilter(filter.id)}
              activeOpacity={0.8}
              style={{
                borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
                borderWidth: 1.5,
                borderColor: active ? "#02de95" : "rgba(255,255,255,0.12)",
                backgroundColor: active ? "rgba(2,222,149,0.12)" : "rgba(255,255,255,0.03)",
              }}
            >
              <Text style={{ color: active ? "#02de95" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading && !refreshing ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 14 }}>Carregando histórico...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHistory}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor="#02de95" />
          }
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Inbox size={32} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: "700" }}>
                {selectedFilter === "all" ? "Nenhum registro encontrado" : "Nenhum item nesse filtro"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 6 }}>
                {selectedFilter === "all" ? "Faça sua primeira corrida ou entrega!" : "Tente outro filtro"}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const isDelivery = item.serviceType === "delivery" || item.serviceType === "frete";
            const Icon = isDelivery ? Package : Car;
            const status = String(item.status || "");
            const vehicleLabel = VEHICLE_LABELS[item.vehicleType || ""] || (item.vehicleType || "-").toUpperCase();
            return (
              <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: Math.min(index * 40, 200) }}
              >
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("OrderDetails", { rideId: item._id })}
                  style={{
                    backgroundColor: "#11253E", borderRadius: 18,
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                    overflow: "hidden",
                  }}
                >
                  {/* Top row */}
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(2,222,149,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Icon size={20} color="#02de95" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>
                        {isDelivery ? "Entrega" : "Corrida"} · {vehicleLabel}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                        {formatRideDate(item)}
                      </Text>
                    </View>
                    <StatusPill status={status} />
                  </View>

                  {/* Route */}
                  <View style={{ padding: 14, paddingTop: 12, gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 4 }} />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 }} numberOfLines={1}>
                        {item.pickup?.address || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginTop: 4 }} />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 }} numberOfLines={1}>
                        {item.dropoff?.address || "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Footer */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 }}>
                    <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "600" }}>
                      {item.distance?.text || ""}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#02de95", fontSize: 16, fontWeight: "900" }}>
                        {formatBRL(item.pricing?.total || item.negotiation?.finalAgreedPrice || 0)}
                      </Text>
                      <ChevronRight size={14} color="rgba(255,255,255,0.2)" />
                    </View>
                  </View>
                </TouchableOpacity>
              </MotiView>
            );
          }}
        />
      )}
    </View>
  );
}
