import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  StatusBar,
  ActivityIndicator,
  ScrollView,
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
  Layers,
  Play,
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

const FILTERS = [
  { id: "all" as const, label: "Todos", icon: Layers, activeColor: "#02de95" },
  { id: "completed" as const, label: "Concluídas", icon: CheckCircle, activeColor: "#00b578" },
  { id: "cancelled" as const, label: "Canceladas", icon: XCircle, activeColor: "#ef4444" },
  { id: "active" as const, label: "Ativas", icon: Clock, activeColor: "#3b82f6" },
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
  const meta = STATUS_META[status] || { label: status, color: "#888888", icon: Clock };
  const Icon = meta.icon;
  const textColor = meta.color === "#02de95" ? "#00b578" : meta.color;
  return (
    <View style={{
      flexDirection: "row", alignItems: "center", gap: 4,
      backgroundColor: meta.color + "12",
      borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4,
      borderWidth: 1, borderColor: meta.color + "30",
    }}>
      <Icon size={11} color={textColor} />
      <Text style={{ color: textColor, fontSize: 11, fontWeight: "700" }}>{meta.label}</Text>
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
      <View style={{ height: 52, marginVertical: 8 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, alignItems: "center", gap: 8 }}
        >
          {FILTERS.map((filter) => {
            const active = selectedFilter === filter.id;
            const FilterIcon = filter.icon;
            return (
              <TouchableOpacity
                key={filter.id}
                onPress={() => setSelectedFilter(filter.id)}
                activeOpacity={0.85}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 6,
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: active ? filter.activeColor : "rgba(255,255,255,0.05)",
                  borderWidth: 1,
                  borderColor: active ? "transparent" : "rgba(255,255,255,0.03)",
                  shadowColor: active ? filter.activeColor : "#000",
                  shadowOffset: active ? { width: 0, height: 4 } : { width: 0, height: 0 },
                  shadowOpacity: active ? 0.3 : 0,
                  shadowRadius: active ? 6 : 0,
                  elevation: active ? 3 : 0,
                }}
              >
                <FilterIcon size={13} color={active ? "#ffffff" : "rgba(255,255,255,0.5)"} />
                <Text
                  style={{
                    color: active ? "#ffffff" : "rgba(255,255,255,0.6)",
                    fontSize: 12,
                    fontWeight: "800",
                  }}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
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
                    backgroundColor: "#ffffff", borderRadius: 18,
                    borderWidth: 1, borderColor: "rgba(0,0,0,0.06)",
                    overflow: "hidden",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.06,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  {/* Top row */}
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(0,0,0,0.05)" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(0,181,120,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Icon size={20} color="#00b578" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#091A2F", fontSize: 13, fontWeight: "800" }}>
                        {isDelivery ? "Entrega" : "Corrida"} · {vehicleLabel}
                      </Text>
                      <Text style={{ color: "#888888", fontSize: 11, marginTop: 2 }}>
                        {formatRideDate(item)}
                      </Text>
                    </View>
                    <StatusPill status={status} />
                  </View>

                  {/* Route */}
                  <View style={{ padding: 16, paddingTop: 14, paddingBottom: 14, gap: 12, position: "relative" }}>
                    {/* Connector line */}
                    <View style={{ position: "absolute", left: 19, top: 22, bottom: 22, width: 1.5, backgroundColor: "rgba(0,0,0,0.08)", borderRadius: 1 }} />
                    
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#00b578", zIndex: 2 }} />
                      <Text style={{ color: "#4b5563", fontSize: 12, flex: 1, fontWeight: "600" }} numberOfLines={1}>
                        {item.pickup?.address || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", zIndex: 2 }} />
                      <Text style={{ color: "#4b5563", fontSize: 12, flex: 1, fontWeight: "600" }} numberOfLines={1}>
                        {item.dropoff?.address || "-"}
                      </Text>
                    </View>
                  </View>

                  {/* Divider line before footer */}
                  <View style={{ height: 1, backgroundColor: "rgba(0,0,0,0.04)" }} />

                  {/* Footer */}
                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14, paddingHorizontal: 16 }}>
                    {item.distance?.text ? (
                      <View style={{ backgroundColor: "#f3f4f6", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 }}>
                        <Text style={{ color: "#4b5563", fontSize: 10, fontWeight: "800" }}>
                          {item.distance.text}
                        </Text>
                      </View>
                    ) : <View />}
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#00b578", fontSize: 16, fontWeight: "900" }}>
                        {formatBRL(item.pricing?.total || item.negotiation?.finalAgreedPrice || 0)}
                      </Text>
                      <ChevronRight size={14} color="rgba(0,0,0,0.25)" />
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
