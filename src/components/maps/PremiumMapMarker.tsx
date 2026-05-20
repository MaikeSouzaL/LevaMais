import React from "react";
import { View, StyleSheet } from "react-native";
import { MapPin, Flag } from "lucide-react-native";

interface PremiumMapMarkerProps {
  type: "origin" | "destination";
}

export const PremiumMapMarker = ({ type }: PremiumMapMarkerProps) => {
  const isOrigin = type === "origin";
  const markerColor = isOrigin ? "#02de95" : "#ef4444";

  return (
    <View style={styles.container}>
      {/* Halo pulsação de fundo estável de alta visibilidade */}
      <View
        style={[
          styles.pulseCircle,
          {
            backgroundColor: markerColor,
            opacity: 0.22,
          },
        ]}
      />

      {/* Core Hub - Círculo sólido central */}
      <View
        style={[
          styles.coreHub,
          {
            borderColor: markerColor,
          },
        ]}
      >
        {isOrigin ? (
          <Flag size={12} color="#ffffff" fill="#ffffff" />
        ) : (
          <MapPin size={12} color="#ffffff" fill="#ffffff" />
        )}
      </View>

      {/* Base drop perspective shadow anchor */}
      <View style={styles.shadowAnchor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pulseCircle: {
    position: "absolute",
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  coreHub: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: 2,
    backgroundColor: "#11253E",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  shadowAnchor: {
    position: "absolute",
    bottom: 2,
    width: 10,
    height: 3,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    borderRadius: 5,
  },
});
