import { View, ActivityIndicator } from "react-native";
import React from "react";
import theme from "../../theme";

export default function Loading() {
  return (
    <View className="flex-1 justify-center items-center bg-gray-800">
      <ActivityIndicator size={theme.FONT_SIZE.EXTRA_LARGE} color={theme.COLORS.BRAND_LIGHT} />
    </View>
  );
}
