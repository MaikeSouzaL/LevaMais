import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus, Minus, Sparkles } from "lucide-react-native";

interface DeliveryOfferCardProps {
  value: number;
  suggestedMin: number;
  suggestedMax: number;
  onChange: (val: number) => void;
}

export const DeliveryOfferCard = ({ value, suggestedMin, suggestedMax, onChange }: DeliveryOfferCardProps) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : Number(suggestedMin) || 0;
  const safeMin = Number.isFinite(Number(suggestedMin)) ? Number(suggestedMin) : 0;
  const safeMax = Number.isFinite(Number(suggestedMax)) ? Number(suggestedMax) : Number.MAX_SAFE_INTEGER;
  const isAtMin = safeValue <= safeMin;
  
  const increment = () => onChange(Math.min(safeMax, safeValue + 1));
  const decrement = () => {
    if (!isAtMin) {
      // Auto-clamp to minimum never exceeding visual floor
      onChange(Math.max(safeMin, safeValue - 1));
    }
  };

  return (
    <View className="px-6 mb-4">
      <View className="rounded-[32px] bg-[#11253E]/80 border border-white/[0.06] p-6 shadow-2xl elevation-8 relative overflow-hidden">
        
        {/* Header Section */}
        <View className="flex-row items-center justify-between mb-5">
          <Text className="text-slate-400 text-[10px] font-extrabold uppercase tracking-[2px]">
            Valor da Oferta
          </Text>
          
          <View className="flex-row items-center bg-[#02de95]/10 px-2.5 py-1 rounded-full border border-[#02de95]/20">
            <Sparkles size={9} color="#02de95" className="mr-1" />
            <Text className="text-[#02de95] text-[9px] font-extrabold uppercase tracking-wide">
              Negociável
            </Text>
          </View>
        </View>

        {/* Input Controls Row */}
        <View className="flex-row items-center justify-center gap-6 py-2">
          {/* Decrement Button */}
          <TouchableOpacity
            onPress={decrement}
            activeOpacity={0.7}
            disabled={isAtMin}
            className={`w-14 h-14 rounded-full border items-center justify-center ${
              isAtMin 
              ? 'bg-white/[0.01] border-white/[0.03] opacity-30' 
              : 'bg-[#1E2D3D] border-white/[0.08] shadow-sm'
            }`}
          >
            <Minus size={20} color={isAtMin ? "#475569" : "#fff"} />
          </TouchableOpacity>

          {/* Value Display */}
          <View className="items-center flex-row items-baseline">
            <Text className="text-slate-400 text-lg font-extrabold mr-1">R$</Text>
            <Text className="text-white text-5xl font-black tracking-tighter">
              {safeValue.toFixed(0)}
            </Text>
            <Text className="text-slate-400 text-lg font-extrabold ml-0.5">,00</Text>
          </View>

          {/* Increment Button */}
          <TouchableOpacity
            onPress={increment}
            activeOpacity={0.7}
            className="w-14 h-14 rounded-full bg-[#02de95]/10 border border-[#02de95]/30 items-center justify-center shadow-md shadow-[#02de95]/5"
          >
            <Plus size={20} color="#02de95" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
