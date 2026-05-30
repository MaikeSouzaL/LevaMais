import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const RoutePulseIndicator = () => {
  return (
    <View className="w-6 h-6 items-center justify-center">
      {/* Breathing glow outer ring */}
      <MotiView
        from={{ scale: 0.8, opacity: 0.8 }}
        animate={{ scale: 1.6, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 1500,
        }}
        className="absolute w-5 h-5 rounded-full bg-[#02de95]/40"
      />
      
      {/* The micro package indicator */}
      <View className="w-4.5 h-4.5 bg-[#091A2F] border-[1.5px] border-[#02de95] rounded-full items-center justify-center shadow-md elevation-2">
        <MaterialCommunityIcons name="package-variant-closed" size={9} color="#02de95" />
      </View>
    </View>
  );
};
