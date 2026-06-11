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
        <View style={styles.pillContainer}>
          <View style={styles.loadingPulse} />
          <Text style={styles.loadingText}>Buscando motoristas...</Text>
        </View>
      </MotiView>
    );
  }

  if (error) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.container}
      >
        <View style={[styles.pillContainer, styles.errorPill]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </MotiView>
    );
  }

  if (totalNearby === 0) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: -10 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.container}
      >
        <View style={styles.pillContainer}>
          <Users size={12} color="rgba(9, 26, 47, 0.6)" />
          <Text style={styles.emptyText}>Sem motoristas próximos</Text>
        </View>
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.container}
    >
      <View style={styles.pillContainer}>
        {/* Sleek Green Pill Icon */}
        <View style={styles.iconContainer}>
          <Users size={11} color="#091A2F" />
        </View>

        {/* Total Driver Availability Text */}
        <Text style={styles.totalText}>
          {totalNearby} {totalNearby === 1 ? "motorista próximo" : "motoristas próximos"}
        </Text>

        {/* Subtle Vertical Divider */}
        <View style={styles.divider} />

        {/* Compact Badges */}
        <View style={styles.breakdownContainer}>
          {rideDrivers > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{rideDrivers} {rideDrivers === 1 ? "corrida" : "corridas"}</Text>
            </View>
          )}
          {deliveryDrivers > 0 && (
            <View style={[styles.badge, styles.deliveryBadge]}>
              <Text style={styles.badgeText}>{deliveryDrivers} {deliveryDrivers === 1 ? "entrega" : "entregas"}</Text>
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
    top: 14,
    left: 14,
    zIndex: 100,
  },
  pillContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.96)",
    borderRadius: 24,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(9, 26, 47, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
    gap: 8,
  },
  iconContainer: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(2, 222, 149, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  totalText: {
    color: "#091A2F",
    fontSize: 12,
    fontWeight: "700",
  },
  divider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(9, 26, 47, 0.12)",
  },
  breakdownContainer: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  badge: {
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 12,
  },
  deliveryBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.08)",
  },
  badgeText: {
    color: "#091A2F",
    fontSize: 9,
    fontWeight: "800",
  },
  loadingPulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#02de95",
    marginRight: 6,
  },
  loadingText: {
    color: "#091A2F",
    fontSize: 12,
    fontWeight: "700",
  },
  errorPill: {
    backgroundColor: "rgba(254, 226, 226, 0.95)",
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  errorText: {
    color: "#EF4444",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    color: "rgba(9, 26, 47, 0.6)",
    fontSize: 12,
    fontWeight: "700",
  },
});
