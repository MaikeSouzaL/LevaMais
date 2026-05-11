import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export const RoutePulseIndicator = () => {
  return (
    <View className="w-10 h-10 items-center justify-center">
      {/* Breathing glow outer ring */}
      <MotiView
        from={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 1500,
        }}
        className="absolute w-8 h-8 rounded-full bg-primary/50"
      />
      
      {/* The cute active vehicle icon puck */}
      <View className="w-7 h-7 bg-[#11253E] border-2 border-primary rounded-full items-center justify-center shadow-glow shadow-primary/40 elevation-4">
        <MaterialCommunityIcons name="moped" size={14} color="#02de95" />
      </View>
    </View>
  );
};
