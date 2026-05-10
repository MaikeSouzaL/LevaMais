import React from "react";
import { View } from "react-native";

export const RouteGlowTrail = () => {
  return (
    <View className="opacity-40 scale-75">
      {/* Outer diffused faint decay ball */}
      <View className="w-4 h-4 rounded-full bg-primary/60 blur-md" />
    </View>
  );
};
