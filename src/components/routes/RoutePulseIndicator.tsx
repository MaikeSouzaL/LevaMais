import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { Navigation } from "lucide-react-native";

/**
 * RoutePulseIndicator — Animated particle that travels along the route.
 *
 * Premium design: a solid navigation arrow inside a glowing animated disc
 * that breathes and pulses as it traverses the polyline path.
 */
export const RoutePulseIndicator = () => {
  return (
    <View style={{ width: 28, height: 28, alignItems: "center", justifyContent: "center" }}>
      {/* Outer breathing glow ring */}
      <MotiView
        from={{ scale: 0.7, opacity: 0.7 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 1500,
        }}
        style={{
          position: "absolute",
          width: 16,
          height: 16,
          borderRadius: 8,
          backgroundColor: "#02de95",
        }}
      />

      {/* Core indicator */}
      <View
        style={{
          width: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#02de95",
          borderWidth: 2.5,
          borderColor: "#FFFFFF",
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#02de95",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.6,
          shadowRadius: 4,
          elevation: 6,
        }}
      >
        <Navigation size={9} color="#091A2F" fill="#091A2F" />
      </View>
    </View>
  );
};
