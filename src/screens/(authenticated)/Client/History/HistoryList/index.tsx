import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import rideService, { Ride } from "@/services/ride.service";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, EmptyState, StatusBadge } from "../../Shared/components";
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
  { id: "completed", label: "Concluidas" },
  { id: "cancelled", label: "Canceladas" },
  { id: "active", label: "Ativas" },
];

const VALID_RIDE_STATUSES: RideStatus[] = [
  "requesting",
  "driver_assigned",
  "accepted",
  "driver_arriving",
  "arrived",
  "in_progress",
  "completed",
  "cancelled",
  "cancelled_by_client",
  "cancelled_by_driver",
  "cancelled_no_driver",
  "expired",
  "timeout",
  "pending",
  "arriving",
];

function normalizeRideStatus(status?: string): RideStatus {
  return VALID_RIDE_STATUSES.includes(status as RideStatus)
    ? (status as RideStatus)
    : "pending";
}

export default function HistoryScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "History">
  >();
  const [history, setHistory] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<Filter>("all");

  const loadHistory = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await rideService.getHistory({ page: 1, limit: 40 });
      setHistory(response.rides || []);
    } catch {
      setHistory([]);
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

  const filteredHistory = useMemo(() => {
    if (selectedFilter === "all") return history;

    if (selectedFilter === "completed") {
      return history.filter((ride) => String(ride.status) === "completed");
    }

    if (selectedFilter === "cancelled") {
      return history.filter((ride) => {
        const status = String(ride.status);
        return status.startsWith("cancelled") || status === "expired";
      });
    }

    return history.filter((ride) =>
      ["requesting", "driver_assigned", "accepted", "driver_arriving", "arrived", "in_progress"].includes(
        String(ride.status),
      ),
    );
  }, [history, selectedFilter]);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Historico"
          subtitle="Suas corridas recentes"
        />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando historico...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (history.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Historico"
          subtitle="Suas corridas recentes"
        />
        <EmptyState
          icon="history"
          title="Nenhuma corrida"
          description="Seu historico de corridas aparecera aqui."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Historico"
        subtitle="Suas corridas recentes"
      />

      <View style={styles.filtersWrap}>
        {FILTERS.map((filter) => {
          const active = selectedFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setSelectedFilter(filter.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredHistory}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadHistory(true)}
            tintColor={colors.primary[500]}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyFilterWrap}>
            <MaterialIcons name="filter-alt-off" size={24} color={colors.text.tertiary} />
            <Text style={styles.emptyFilterText}>Nenhum item nesse filtro</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("OrderDetails", { rideId: item._id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{formatRideDate(item)}</Text>
              <StatusBadge status={normalizeRideStatus(String(item.status || ""))} />
            </View>

            <View style={styles.addressGroup}>
              <Text style={styles.addressLabel}>Origem</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {item.pickup?.address || "-"}
              </Text>
            </View>

            <View style={styles.addressGroup}>
              <Text style={styles.addressLabel}>Destino</Text>
              <Text style={styles.addressText} numberOfLines={1}>
                {item.dropoff?.address || "-"}
              </Text>
            </View>

            <View style={styles.footerRow}>
              <Text style={styles.cardVehicle}>{String(item.vehicleType || "-").toUpperCase()}</Text>
              <Text style={styles.cardPrice}>{formatBRL(item.pricing?.total || 0)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  filtersWrap: {
    flexDirection: "row",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background.secondary,
  },
  filterChipActive: {
    borderColor: colors.primary[500],
    backgroundColor: "rgba(2,222,149,0.12)",
  },
  filterChipText: { color: colors.text.secondary, fontSize: fontSize.sm },
  filterChipTextActive: { color: colors.primary[500], fontWeight: fontWeight.semibold },
  list: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  emptyFilterWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing["2xl"],
    gap: spacing.sm,
  },
  emptyFilterText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  card: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  addressGroup: {
    gap: spacing.xs,
  },
  addressLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  addressText: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardVehicle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  cardPrice: {
    color: colors.primary[500],
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
});
