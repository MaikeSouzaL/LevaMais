import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";

export const RoutePulseIndicator = () => {
  return (
    <View className="w-6 h-6 items-center justify-center">
      {/* Breathing glow outer ring */}
      <MotiView
        from={{ scale: 0.6, opacity: 0.8 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 1500,
        }}
        className="absolute w-4 h-4 rounded-full bg-primary"
      />
      
      {/* Core brilliant particle */}
      <View className="w-2.5 h-2.5 bg-white rounded-full shadow-glow elevation-5" />
    </View>
  );
};
