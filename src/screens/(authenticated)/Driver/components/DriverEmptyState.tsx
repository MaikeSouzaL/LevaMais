import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { Radar } from "lucide-react-native";

export type DriverEmptyStateProps = {
  title: string;
};

/**
 * DriverEmptyState — Premium glassmorphic empty state container.
 *
 * Implements premium visual design to wow the user when there are no offers:
 * - Animated radar pulse effects in the center.
 * - Solid premium glass container with subtle emerald glowing border.
 * - Auto-running ActivityIndicator in a search capsule.
 */
export function DriverEmptyState({ title }: DriverEmptyStateProps) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.95, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 15 }}
      style={styles.container}
    >
      {/* Animated Glowing Radar Pulse */}
      <View style={styles.iconContainer}>
        <MotiView
          from={{ scale: 0.8, opacity: 0.5 }}
          animate={{ scale: 1.4, opacity: 0 }}
          transition={{
            loop: true,
            duration: 2200,
            type: "timing",
          }}
          style={styles.pulseCircle}
        />
        <MotiView
          from={{ scale: 0.9, opacity: 0.3 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{
            loop: true,
            duration: 2200,
            delay: 600,
            type: "timing",
          }}
          style={styles.pulseCircle}
        />
        <View style={styles.iconWrapper}>
          <Radar size={30} color="#02de95" strokeWidth={2} />
        </View>
      </View>

      {/* Main Status Title */}
      <Text style={styles.title}>{title}</Text>

      {/* High-fidelity Subtext */}
      <Text style={styles.description}>
        Sua conexão está ativa e sua localização está sendo monitorada em tempo real pela central de operações Leva Mais.
      </Text>

      {/* Status Capsule Pod */}
      <View style={styles.statusCapsule}>
        <ActivityIndicator size="small" color="#02de95" style={{ marginRight: 8 }} />
        <Text style={styles.statusText}>Aguardando novos pedidos...</Text>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(17, 37, 62, 0.85)",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.15)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 15,
    elevation: 8,
    marginTop: 20,
    marginHorizontal: 4,
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 16,
  },
  pulseCircle: {
    position: "absolute",
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "rgba(2, 222, 149, 0.25)",
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(2, 222, 149, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  title: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  description: {
    color: "rgba(255, 255, 255, 0.55)",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    paddingHorizontal: 8,
    marginBottom: 18,
    fontWeight: "600",
  },
  statusCapsule: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  statusText: {
    color: "#02de95",
    fontSize: 10.5,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
