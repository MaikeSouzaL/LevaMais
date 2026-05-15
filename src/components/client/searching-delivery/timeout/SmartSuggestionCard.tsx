import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Sparkles, TrendingUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export function SmartSuggestionCard() {
  return (
    <View style={styles.card}>
      {/* Accent Glow */}
      <LinearGradient
        colors={["rgba(2, 222, 149, 0.1)", "rgba(2, 222, 149, 0.02)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <View style={styles.pill}>
          <Sparkles size={12} color="#02de95" fill="#02de95" style={styles.pillIcon} />
          <Text style={styles.pillText}>
            Sugestão Inteligente
          </Text>
        </View>
        <TrendingUp size={15} color="rgba(255, 255, 255, 0.5)" />
      </View>

      <Text style={styles.bodyText}>
        Viagens com incentivo extra possuem até{" "}
        <Text style={styles.boldHighlight}>83% mais chances</Text> de aceite imediato pelos motoristas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    position: "relative",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  pill: {
    backgroundColor: "rgba(2, 222, 149, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 100,
    flexDirection: "row",
    alignItems: "center",
    marginRight: 8,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    color: "#02de95",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bodyText: {
    color: "rgba(255, 255, 255, 0.85)",
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "500",
    paddingRight: 4,
  },
  boldHighlight: {
    color: "#02de95",
    fontWeight: "900",
  },
});
