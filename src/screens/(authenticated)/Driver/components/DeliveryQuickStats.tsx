import React from "react";
import { View, Text } from "react-native";

type DeliveryQuickStatsProps = {
  distance?: string;
  duration?: string;
  earnings?: number;
};

export function DeliveryQuickStats({
  distance = "9,2 km",
  duration = "15 min",
  earnings = 11.16,
}: DeliveryQuickStatsProps) {
  return (
    <View className="flex-row gap-2 mb-3.5">
      {/* Distancia */}
      <View className="flex-1 bg-[#1E2D3D] border border-white/[0.04] rounded-2xl px-3 py-3 items-center">
        <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">
          Distância
        </Text>
        <Text className="text-white text-sm font-black">{distance}</Text>
      </View>

      {/* Tempo */}
      <View className="flex-1 bg-[#1E2D3D] border border-white/[0.04] rounded-2xl px-3 py-3 items-center">
        <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">
          Tempo
        </Text>
        <Text className="text-white text-sm font-black">{duration}</Text>
      </View>

      {/* Ganho */}
      <View className="flex-1 bg-[#1E2D3D] border border-[#02de95]/35 rounded-2xl px-3 py-3 items-center">
        <Text className="text-[#02de95]/80 text-[9px] font-black uppercase tracking-wider mb-0.5">
          Ganho
        </Text>
        <Text className="text-[#02de95] text-sm font-black">
          R$ {Number(earnings).toFixed(2).replace(".", ",")}
        </Text>
      </View>
    </View>
  );
}
