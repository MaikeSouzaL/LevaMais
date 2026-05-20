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
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MotiView } from "moti";
import {
  Package,
  Car,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  Inbox,
} from "lucide-react-native";
import { MaterialIcons } from "@expo/vector-icons";

import rideService, { Ride } from "../../../services/ride.service";
import { useAuthStore } from "../../../context/authStore";
import { formatBRL } from "@/utils/mappers";

type Filter = "all" | "completed" | "cancelled" | "active" | "declined";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "Todos" },
  { id: "completed", label: "Concluídas" },
  { id: "cancelled", label: "Canceladas" },
  { id: "active", label: "Ativas" },
  { id: "declined", label: "Recusadas" },
];

const ACTIVE_STATUSES = ["requesting", "driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress"];

function formatRideDate(ride: any): string {
  const value = ride?.completedAt || ride?.cancelledAt || ride?.updatedAt || ride?.createdAt;
  if (!value) return "-";
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return "-";
  return dt.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusMeta(status: string, declinedByMe: boolean) {
  const map: Record<string, { label: string; color: string; icon: any }> = {
    completed: { label: "Concluída", color: "#02de95", icon: CheckCircle },
    cancelled: { label: "Cancelada", color: "#ef4444", icon: XCircle },
    cancelled_by_client: { label: "Cancelada pelo cliente", color: "#ef4444", icon: XCircle },
    cancelled_by_driver: { label: "Cancelada por você", color: "#f97316", icon: XCircle },
    cancelled_no_driver: { label: "Sem motorista", color: "#f97316", icon: AlertCircle },
    no_drivers_available: { label: "Sem motorista", color: "#f97316", icon: AlertCircle },
    expired: { label: "Expirada", color: "#f97316", icon: AlertCircle },
    requesting: { label: "Buscando", color: "#fbbf24", icon: Clock },
    driver_assigned: { label: "Motorista alocado", color: "#60a5fa", icon: Clock },
    accepted: { label: "A caminho", color: "#60a5fa", icon: Clock },
    driver_arriving: { label: "Chegando", color: "#60a5fa", icon: Clock },
    arrived: { label: "No local", color: "#a78bfa", icon: Clock },
    in_progress: { label: "Em andamento", color: "#a78bfa", icon: Clock },
  };
  const normalized = String(status || "");
  const isFinalCompleted = normalized === "completed";
  const isFinalCancelled = normalized.startsWith("cancelled") || normalized === "expired" || normalized === "no_drivers_available";
  if (declinedByMe && !isFinalCompleted && !isFinalCancelled) {
    return { label: "Recusada por você", color: "#f97316", icon: AlertCircle };
  }
  return map[status] || { label: status || "Status", color: "rgba(255,255,255,0.4)", icon: Clock };
}

function StatusPill({ status, declinedByMe }: { status: string; declinedByMe: boolean }) {
  const meta = statusMeta(status, declinedByMe);
  const Icon = meta.icon;
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        backgroundColor: `${meta.color}18`,
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: `${meta.color}40`,
      }}
    >
      <Icon size={11} color={meta.color} />
      <Text style={{ color: meta.color, fontSize: 11, fontWeight: "700" }}>{meta.label}</Text>
    </View>
  );
}

export default function DriverHistoryScreen() {
  const navigation = useNavigation<any>();
  const driverId = useAuthStore((s) => s.userData?.id);

  const [history, setHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const res = await rideService.getHistory({ page: 1, limit: 80 });
      setHistory(res.rides || []);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadHistory(); }, [loadHistory]));

  const filtered = useMemo(() => {
    return history.filter((r: any) => {
      const status = String(r?.status || "");
      const declinedByMe = Array.isArray(r?.rejectedBy) && r.rejectedBy.some((x: any) => String(x?.driverId?._id || x?.driverId) === String(driverId));
      if (selectedFilter === "all") return true;
      if (selectedFilter === "completed") return status === "completed";
      if (selectedFilter === "cancelled") return status.startsWith("cancelled") || status === "expired" || status === "no_drivers_available";
      if (selectedFilter === "active") return ACTIVE_STATUSES.includes(status);
      if (selectedFilter === "declined") return declinedByMe;
      return true;
    });
  }, [history, selectedFilter, driverId]);

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <View style={{ flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}>
        {FILTERS.map((f) => {
          const active = selectedFilter === f.id;
          return (
            <TouchableOpacity
              key={f.id}
              onPress={() => setSelectedFilter(f.id)}
              activeOpacity={0.8}
              style={{
                borderRadius: 20,
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderWidth: 1.5,
                borderColor: active ? "#02de95" : "rgba(255,255,255,0.12)",
                backgroundColor: active ? "rgba(2,222,149,0.12)" : "rgba(255,255,255,0.03)",
              }}
            >
              <Text style={{ color: active ? "#02de95" : "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "700" }}>
                {f.label}
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
          data={filtered}
          keyExtractor={(item: any, idx) => String(item?._id || idx)}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} tintColor="#02de95" />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", paddingTop: 60 }}>
              <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <Inbox size={32} color="rgba(255,255,255,0.2)" />
              </View>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 15, fontWeight: "700" }}>
                {selectedFilter === "all" ? "Nenhum registro encontrado" : "Nenhum item nesse filtro"}
              </Text>
            </View>
          }
          renderItem={({ item, index }) => {
            const ride = item as any;
            const isDelivery = ride.serviceType === "delivery" || ride.serviceType === "frete";
            const Icon = isDelivery ? Package : Car;
            const status = String(ride.status || "");
            const declinedByMe = Array.isArray(ride?.rejectedBy) && ride.rejectedBy.some((x: any) => String(x?.driverId?._id || x?.driverId) === String(driverId));
            const price = ride?.pricing?.driverValue ?? ride?.pricing?.total ?? ride?.negotiation?.finalAgreedPrice ?? 0;
            const distance = ride?.distance?.text || "";
            return (
              <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ delay: Math.min(index * 40, 200) }}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate("DriverHistoryRideDetails", { rideId: ride._id })}
                  style={{ backgroundColor: "#11253E", borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", overflow: "hidden" }}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", padding: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
                    <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(2,222,149,0.1)", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                      <Icon size={20} color="#02de95" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "800" }}>
                        {isDelivery ? "Entrega" : "Corrida"} · {(ride.vehicleType || "-").toUpperCase()}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                        {formatRideDate(ride)}
                      </Text>
                    </View>
                    <StatusPill status={status} declinedByMe={declinedByMe} />
                  </View>

                  <View style={{ padding: 14, paddingTop: 12, gap: 8 }}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginTop: 4 }} />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 }} numberOfLines={1}>
                        {ride.pickup?.address || "-"}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444", marginTop: 4 }} />
                      <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 }} numberOfLines={1}>
                        {ride.dropoff?.address || "-"}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 }}>
                    <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "600" }}>
                      {distance}
                    </Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={{ color: "#02de95", fontSize: 16, fontWeight: "900" }}>
                        {formatBRL(Number(price || 0))}
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
