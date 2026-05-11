import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { Sparkles, ArrowRight, DollarSign } from "lucide-react-native";

interface AISuggestionCardProps {
  onBoost: () => void;
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
      
      <Text className="text-white/60 text-xs leading-relaxed mb-5">
        Aumentar a oferta em R$ 5,00 prioriza sua entrega no radar de 80% dos motoristas na região.
      </Text>

      <TouchableOpacity 
        onPress={onBoost}
        className="bg-[#02de95] flex-row items-center justify-between h-12 rounded-xl px-5 active:scale-[0.98]"
      >
        <View className="flex-row items-center">
           <DollarSign size={16} color="#091A2F" className="mr-1" strokeWidth={3} />
           <Text className="text-[#091A2F] font-black text-sm">Aumentar R$ 5,00</Text>
        </View>
        <ArrowRight size={16} color="#091A2F" strokeWidth={3} />
      </TouchableOpacity>
    </MotiView>
  );
}
