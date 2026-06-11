import React from "react";
import { View, StyleSheet, Text } from "react-native";
import { MapPin } from "lucide-react-native";
import { MotiView } from "moti";

interface PremiumMapMarkerProps {
  type: "origin" | "destination";
  letter?: string;
}

export const PremiumMapMarker = ({ type, letter }: PremiumMapMarkerProps) => {
  const isOrigin = type === "origin";
  const markerColor = isOrigin ? "#02de95" : "#ef4444";
  const shadowColor = isOrigin ? "rgba(2, 222, 149, 0.5)" : "rgba(239, 68, 68, 0.5)";

  return (
    <View style={styles.container}>
      {/* Breathing glow ring beneath the pin */}
      <MotiView
        from={{ scale: 0.5, opacity: 0.6 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{ loop: true, type: "timing", duration: 2000 }}
        style={[styles.pulseRing, { backgroundColor: markerColor }]}
      />

      {/* Pin Head */}
      <View style={[styles.head, { backgroundColor: markerColor, shadowColor }]}>
        <MapPin size={16} color="#FFFFFF" fill="#FFFFFF" />
        {letter && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{letter}</Text>
          </View>
        )}
      </View>

      {/* Pin Stem */}
      <View style={[styles.stem, { backgroundColor: markerColor }]} />

      {/* Base Dot */}
      <View style={[styles.baseDot, { backgroundColor: markerColor }]} />
    </View>
  );
};

const HEAD_SIZE = 34;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    width: HEAD_SIZE + 10,
    height: HEAD_SIZE + 26,
    justifyContent: "flex-start",
  },
  pulseRing: {
    position: "absolute",
    bottom: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  head: {
    width: HEAD_SIZE,
    height: HEAD_SIZE,
    borderRadius: HEAD_SIZE / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -6,
    backgroundColor: "#111827",
    paddingHorizontal: 4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#ffffff",
    zIndex: 20,
  },
  badgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontWeight: "900",
    textAlign: "center",
  },
  stem: {
    width: 3,
    height: 12,
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    marginTop: -2,
    zIndex: 9,
  },
  baseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginTop: -1,
    zIndex: 12,
  },
});
