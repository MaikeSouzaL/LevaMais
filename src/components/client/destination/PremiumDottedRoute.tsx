import React, { useEffect, useState, useRef } from "react";
import { View, StyleSheet } from "react-native";
import { Polyline, Marker } from "react-native-maps";
import { MotiView } from "moti";
import { colors } from "@/theme";

interface PremiumDottedRouteProps {
  coordinates: any[];
}

export const PremiumDottedRoute = ({ coordinates }: PremiumDottedRouteProps) => {
  const [glowIndex, setGlowIndex] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!coordinates || coordinates.length === 0) return;

    // Reset and run cycling animation
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    setGlowIndex(0);
    intervalRef.current = setInterval(() => {
      setGlowIndex((prev) => (prev + 1) % coordinates.length);
    }, 80); // Smooth fast micro-motion

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [coordinates]);

  if (!coordinates || coordinates.length === 0) return null;

  const activeCoord = coordinates[glowIndex] || coordinates[0];

  return (
    <>
      {/* A single clean high-contrast solid dark navy line */}
      <Polyline
        coordinates={coordinates}
        strokeColor="#091A2F"
        strokeWidth={4}
        lineCap="round"
        zIndex={20}
      />

      {/* Micro-Pulse iterating along path */}
      <Marker
        coordinate={activeCoord}
        anchor={{ x: 0.5, y: 0.5 }}
        tracksViewChanges={true} // Needed for moving markers
        zIndex={21}
      >
        <View style={styles.glowWrapper}>
          <MotiView
            from={{ scale: 0.8, opacity: 0.4 }}
            animate={{ scale: 1.4, opacity: 1 }}
            transition={{
              type: "timing",
              duration: 300,
              loop: true
            }}
            style={styles.glowBall}
          />
        </View>
      </Marker>
    </>
  );
};

const styles = StyleSheet.create({
  glowWrapper: {
    width: 12,
    height: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  glowBall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 5,
  }
});
