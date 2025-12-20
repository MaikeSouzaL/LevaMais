import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface SearchBarProps {
  onPress?: () => void;
}

export function SearchBar({ onPress }: SearchBarProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative group mb-6"
      activeOpacity={0.8}
    >
      {/* Ícone de busca */}
      <View className="absolute inset-y-0 left-0 pl-4 items-center justify-center z-10 pointer-events-none">
        <MaterialIcons name="search" size={28} color="#0f231c" />
      </View>

      {/* Barra de busca */}
      <View className="w-full bg-primary h-14 rounded-full flex-row items-center pl-14 shadow-lg">
        <Text className="text-background-dark font-bold text-lg">
          Para onde vamos?
        </Text>
      </View>
    </TouchableOpacity>
  );
}
