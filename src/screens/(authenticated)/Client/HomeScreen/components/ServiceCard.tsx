import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface ServiceCardProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress?: () => void;
}

export function ServiceCard({
  icon,
  title,
  subtitle,
  onPress,
}: ServiceCardProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="relative overflow-hidden bg-card-dark active:bg-[#151f1b] border border-white/5 rounded-[2rem] p-5 flex-col items-start justify-between h-36"
      activeOpacity={0.9}
    >
      {/* Ícone com fundo */}
      <View className="bg-primary/10 p-3 rounded-2xl">
        <MaterialIcons name={icon} size={30} color="#02de95" />
      </View>

      {/* Textos */}
      <View className="flex-col items-start gap-1 z-10">
        <Text className="text-xl font-bold text-white">{title}</Text>
        <Text className="text-xs text-gray-400">{subtitle}</Text>
      </View>

      {/* Background decoration - ícone gigante opaco */}
      <View
        className="absolute -right-4 -top-4 opacity-[0.03]"
        style={{ transform: [{ rotate: "12deg" }] }}
      >
        <MaterialIcons name={icon} size={120} color="white" />
      </View>
    </TouchableOpacity>
  );
}
