import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { Easing } from "react-native-reanimated";
import { Clock, AlertCircle } from "lucide-react-native";

interface RadarAnimationProps {
  allDriversRejected: boolean;
}

export function RadarAnimation({ allDriversRejected }: RadarAnimationProps) {
  const accentColor = allDriversRejected ? "#EF4444" : "#FBBF24";
  const pulseColor = allDriversRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(251, 191, 36, 0.15)";

  return (
    <View className="items-center justify-center mb-6 relative">
      {/* Pulse Layer 1 */}
      <MotiView
        from={{ scale: 1, opacity: 0.8 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{
          type: "timing",
          duration: 2500,
          loop: true,
          easing: Easing.out(Easing.quad),
        }}
        style={{
          position: "absolute",
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: pulseColor,
          borderWidth: 1,
          borderColor: accentColor,
        }}
      />

      {/* Pulse Layer 2 */}
      <MotiView
        from={{ scale: 1, opacity: 0.6 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{
          type: "timing",
          duration: 2000,
          delay: 600,
          loop: true,
          easing: Easing.out(Easing.quad),
        }}
        style={{
          position: "absolute",
          width: 90,
          height: 90,
          borderRadius: 45,
          backgroundColor: pulseColor,
          borderWidth: 1,
          borderColor: accentColor,
        }}
      />

      {/* Rotating Radar Sweep */}
      <MotiView
        from={{ rotate: "0deg" }}
        animate={{ rotate: "360deg" }}
        transition={{
          type: "timing",
          duration: 4000,
          loop: true,
          easing: Easing.linear,
        }}
        style={{
          position: "absolute",
          width: 110,
          height: 110,
          borderRadius: 55,
          borderWidth: 1.5,
          borderStyle: "dashed",
          borderColor: accentColor,
          opacity: 0.3,
        }}
      />

      {/* Core Icon Hub */}
      <View
        style={{ shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 20, elevation: 15 }}
        className={`w-20 h-20 rounded-full items-center justify-center relative bg-[#0F243C] border-2 border-white/10`}
      >
        <View 
          style={{ backgroundColor: accentColor, opacity: 0.08 }} 
          className="absolute inset-0 rounded-full" 
        />
        
        {allDriversRejected ? (
          <AlertCircle size={34} color={accentColor} strokeWidth={2.2} />
        ) : (
          <Clock size={34} color={accentColor} strokeWidth={2.2} />
        )}
      </View>
    </View>
  );
}
