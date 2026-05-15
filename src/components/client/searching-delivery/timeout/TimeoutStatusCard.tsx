import React from "react";
import { StyleSheet, View } from "react-native";
import { MotiView } from "moti";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface TimeoutStatusCardProps {
  children: React.ReactNode;
  allDriversRejected: boolean;
}

export function TimeoutStatusCard({ children, allDriversRejected }: TimeoutStatusCardProps) {
  const borderGlow = allDriversRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(255, 255, 255, 0.1)";

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 18 }}
      className="w-full rounded-[36px] overflow-hidden border border-white/10 shadow-2xl relative"
      style={{
        borderColor: borderGlow,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 15 },
        shadowOpacity: 0.4,
        shadowRadius: 25,
      }}
    >
      {/* Absolute Blur Backdrop */}
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFillObject} />
      
      {/* Edge Shine Gradient */}
      <LinearGradient
        colors={["rgba(255,255,255,0.06)", "transparent"]}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      <View className="p-7 items-center relative z-10">
        {children}
      </View>
    </MotiView>
  );
}
