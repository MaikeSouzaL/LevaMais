import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface MapActionButtonsProps {
  onPressSafety?: () => void;
  onPressLocation?: () => void;
}

export function MapActionButtons({
  onPressSafety,
  onPressLocation,
}: MapActionButtonsProps) {
  return (
    <View className="absolute right-4 bottom-6 flex-col gap-3 z-20">
      {/* Botão de Segurança */}
      <TouchableOpacity
        onPress={onPressSafety}
        className="w-12 h-12 rounded-full bg-surface-dark/90 shadow-lg items-center justify-center border border-white/5 active:bg-[#1f2d29] active:scale-95"
        activeOpacity={0.8}
      >
        <MaterialIcons name="shield" size={24} color="#60A5FA" />
      </TouchableOpacity>

      {/* Botão de Localização */}
      <TouchableOpacity
        onPress={onPressLocation}
        className="w-12 h-12 rounded-full bg-surface-dark/90 shadow-lg items-center justify-center border border-white/5 active:bg-[#1f2d29] active:scale-95"
        activeOpacity={0.8}
      >
        <MaterialIcons name="my-location" size={24} color="#02de95" />
      </TouchableOpacity>
    </View>
  );
}
