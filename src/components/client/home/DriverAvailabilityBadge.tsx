import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Users } from "lucide-react-native";
import { MotiView } from "moti";
import { colors } from "@/theme";

interface DriverAvailabilityBadgeProps {
  rideDrivers: number;
  deliveryDrivers: number;
  totalNearby: number;
  loading?: boolean;
  error?: string | null;
}

export const DriverAvailabilityBadge = memo(({
  rideDrivers,
  deliveryDrivers,
  totalNearby,
  loading = false,
  error = null,
}: DriverAvailabilityBadgeProps) => {
  if (loading) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.container}
      >
        <View style={styles.loadingPulse} />
        <Text style={styles.loadingText}>Buscando motoristas...</Text>
      </MotiView>
    );
  }

  if (error) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.container, styles.errorContainer]}
      >
        <Text style={styles.errorText}>{error}</Text>
      </MotiView>
    );
  }

  if (totalNearby === 0) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={[styles.container, styles.emptyContainer]}
      >
        <Users size={16} color={colors.text.secondary} />
        <Text style={styles.emptyText}>Sem motoristas próximos</Text>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.container}
    >
      <View style={styles.iconContainer}>
        <Users size={16} color={colors.primary[500]} />
      </View>
      <View style={styles.statsContainer}>
        <Text style={styles.totalText}>
          {totalNearby} {totalNearby === 1 ? "motorista" : "motoristas"} próximos
        </Text>
        <View style={styles.breakdownContainer}>
          {rideDrivers > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideDrivers} corridas</Text>
            </View>
          )}
          {deliveryDrivers > 0 && (
            <View style={[styles.badge, styles.deliveryBadge]}>
              <Text style={styles.badgeText}>{deliveryDrivers} entregas</Text>
            </View>
          )}
        </View>
      </View>
    </MotiView>
  );
});

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: "rgba(15, 25, 40, 0.95)",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 100,
  },
  loadingPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary[500],
    marginRight: 8,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  errorContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    fontWeight: "500",
  },
  emptyContainer: {
    backgroundColor: "rgba(15, 25, 40, 0.9)",
    gap: 8,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  statsContainer: {
    flex: 1,
  },
  totalText: {
    color: colors.text.primary,
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 6,
  },
  breakdownContainer: {
    flexDirection: "row",
    gap: 8,
  },
  badge: {
    backgroundColor: "rgba(16, 185, 129, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveryBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.2)",
  },
  badgeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "600",
  },
});
