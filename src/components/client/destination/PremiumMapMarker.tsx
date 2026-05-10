import React from "react";
import { View, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { colors } from "@/theme";
import { MapPin } from "lucide-react-native";

interface PremiumMapMarkerProps {
  type: "origin" | "destination";
}

export const PremiumMapMarker = ({ type }: PremiumMapMarkerProps) => {
  const isOrigin = type === "origin";
  const mainColor = isOrigin ? colors.primary[500] : colors.error || "#ef4444";

  return (
    <View style={styles.container}>
      {/* Breath/Pulse Outer Layer */}
      <MotiView
        from={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 2.2, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 2000,
        }}
        style={[styles.pulse, { backgroundColor: mainColor }]}
      />

      {/* Core Marker */}
      <View style={[styles.core, { borderColor: mainColor }]}>
        {isOrigin ? (
          <View style={[styles.dot, { backgroundColor: mainColor }]} />
        ) : (
          <MapPin size={14} color="#fff" fill={mainColor} />
        )}
      </View>
      
      {/* Shadow Base anchor */}
      <View style={styles.shadowBase} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
  },
  pulse: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  core: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#11253E",
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  shadowBase: {
    position: "absolute",
    bottom: 2,
    width: 6,
    height: 3,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 3,
  },
});
