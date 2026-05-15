import React from "react";
import { View, Text } from "react-native";
import { Sparkles, TrendingUp } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export function SmartSuggestionCard() {
  return (
    <View className="w-full bg-white/[0.03] border border-white/10 rounded-2xl p-4 mb-6 relative overflow-hidden">
      {/* Accent Glow */}
      <LinearGradient
        colors={["rgba(2, 222, 149, 0.08)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      />
      
      <View className="flex-row items-center mb-2">
        <View className="bg-[#02de95]/10 border border-[#02de95]/20 px-2.5 py-1 rounded-full flex-row items-center mr-2">
          <Sparkles size={12} color="#02de95" fill="#02de95" className="mr-1" />
          <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-wider">
            Sugestão Inteligente
          </Text>
        </View>
        <TrendingUp size={14} color="rgba(255,255,255,0.4)" />
      </View>

      <Text className="text-white/80 text-sm leading-relaxed pr-2">
        Viagens com incentivo extra possuem até{" "}
        <Text className="text-[#02de95] font-black">83% mais chances</Text> de aceite imediato pelos motoristas.
      </Text>
    </View>
  );
}
