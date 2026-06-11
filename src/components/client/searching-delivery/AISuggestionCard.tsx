import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Sparkles, ArrowRight, DollarSign } from "lucide-react-native";

interface AISuggestionCardProps {
  onBoost: (amount: number) => void;
}

export function AISuggestionCard({ onBoost }: AISuggestionCardProps) {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20, scale: 0.95 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{ type: "spring", delay: 500 }}
      className="bg-[#02de95]/5 border border-[#02de95]/20 rounded-2xl p-5 my-4 shadow-xl"
    >
      <View className="flex-row items-center mb-3">
        <View className="bg-[#02de95]/20 p-2 rounded-full mr-3">
          <Sparkles size={16} color="#02de95" fill="#02de95" />
        </View>
        <Text className="text-[#02de95] font-black text-xs uppercase tracking-widest">
          Sugestão Inteligente
        </Text>
      </View>

      <Text className="text-white font-bold text-base mb-1.5">
        Deseja atrair entregadores mais rápido?
      </Text>
      
      <Text className="text-white/60 text-xs leading-relaxed mb-4">
        Adicione um incentivo extra para priorizar sua entrega instantaneamente no radar dos entregadores da região.
      </Text>

      {/* ⚡ QUICK ACTION BOOST PILLS Matrix (Identical to Driver console!) */}
      <View className="flex-row justify-between gap-2 mt-1">
        {[1, 2, 5, 10].map((val) => (
          <TouchableOpacity
            key={val}
            onPress={() => onBoost(val)}
            className="bg-white/[0.04] border border-white/10 rounded-xl py-3 flex-1 items-center justify-center"
          >
            <Text className="text-white font-black text-xs tracking-wider">+ R$ {val}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </MotiView>
  );
}
