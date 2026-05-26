import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Minus, Plus, Sparkles } from "lucide-react-native";

interface DeliveryOfferCardProps {
  value: number;
  suggestedMin: number;
  suggestedMax: number;
  onChange: (val: number) => void;
}

export const DeliveryOfferCard = ({ value, suggestedMin, suggestedMax, onChange }: DeliveryOfferCardProps) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : Number(suggestedMin) || 0;
  const safeMin = Number.isFinite(Number(suggestedMin)) ? Number(suggestedMin) : 0;
  const safeMax = Number.isFinite(Number(suggestedMax)) ? Number(suggestedMax) : Number.MAX_SAFE_INTEGER;
  const isAtMin = safeValue <= safeMin;

  const increment = () => onChange(Math.min(safeMax, safeValue + 1));
  const decrement = () => {
    if (!isAtMin) {
      // Keep the offer inside the backend suggested floor.
      onChange(Math.max(safeMin, safeValue - 1));
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>Valor da Oferta</Text>

          <View style={styles.badge}>
            <Sparkles size={9} color="#02de95" style={styles.badgeIcon} />
            <Text style={styles.badgeText}>Negociavel</Text>
          </View>
        </View>

        <View style={styles.controlsRow}>
          <TouchableOpacity
            onPress={decrement}
            activeOpacity={0.7}
            disabled={isAtMin}
            style={[
              styles.roundButton,
              styles.decrementButton,
              isAtMin ? styles.disabledButton : styles.enabledButton,
            ]}
          >
            <Minus size={20} color={isAtMin ? "#475569" : "#fff"} />
          </TouchableOpacity>

          <View style={styles.valueRow}>
            <Text style={styles.currency}>R$</Text>
            <Text style={styles.value}>{safeValue.toFixed(0)}</Text>
            <Text style={styles.cents}>,00</Text>
          </View>

          <TouchableOpacity
            onPress={increment}
            activeOpacity={0.7}
            style={[styles.roundButton, styles.incrementButton]}
          >
            <Plus size={20} color="#02de95" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(17, 37, 62, 0.8)",
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 32,
    borderWidth: 1,
    elevation: 8,
    overflow: "hidden",
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 20,
  },
  headerRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  label: {
    color: "#94a3b8",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  badge: {
    alignItems: "center",
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    borderColor: "rgba(2, 222, 149, 0.2)",
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    color: "#02de95",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  controlsRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingVertical: 8,
  },
  roundButton: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  decrementButton: {
    marginRight: 24,
  },
  enabledButton: {
    backgroundColor: "#1E2D3D",
    borderColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 4,
  },
  disabledButton: {
    backgroundColor: "rgba(255, 255, 255, 0.01)",
    borderColor: "rgba(255, 255, 255, 0.03)",
    opacity: 0.3,
  },
  valueRow: {
    alignItems: "baseline",
    flexDirection: "row",
  },
  currency: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800",
    marginRight: 4,
  },
  value: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1.5,
  },
  cents: {
    color: "#94a3b8",
    fontSize: 18,
    fontWeight: "800",
    marginLeft: 2,
  },
  incrementButton: {
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    borderColor: "rgba(2, 222, 149, 0.3)",
    marginLeft: 24,
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
});
