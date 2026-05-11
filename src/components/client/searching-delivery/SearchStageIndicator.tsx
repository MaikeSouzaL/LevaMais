import React from "react";
import { View, Text } from "react-native";
import { MotiView } from "moti";
import { Globe, Map } from "lucide-react-native";

interface SearchStageIndicatorProps {
  stageLabel: string;
  radius: number;
}

export function SearchStageIndicator({ stageLabel, radius }: SearchStageIndicatorProps) {
  return (
    <View className="flex-row items-center justify-between bg-white/[0.03] border border-white/10 rounded-2xl p-3 mb-4">
      <View className="flex-row items-center space-x-2">
        <MotiView
          from={{ rotate: "0deg" }}
          animate={{ rotate: "360deg" }}
          transition={{ loop: true, duration: 5000, type: "timing" }}
          className="mr-2"
        >
          <Globe size={14} color="#FFF" className="opacity-50" />
        </MotiView>
        <Text className="text-white/80 font-bold text-xs tracking-wide">{stageLabel}</Text>
      </View>

      <View className="flex-row items-center bg-[#02de95]/10 px-3 py-1 rounded-full border border-[#02de95]/20 space-x-1.5 ml-2">
        <Map size={10} color="#02de95" fill="#02de95" />
        <Text className="text-[#02de95] font-black text-[10px] uppercase ml-1.5">
          Raio: {radius.toFixed(1)}km
        </Text>
      </View>
    </View>
  );
}
