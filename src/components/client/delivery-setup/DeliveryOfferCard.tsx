import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Plus, Minus, Zap } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { MotiView } from "moti";

interface DeliveryOfferCardProps {
  value: number;
  suggestedMin: number;
  suggestedMax: number;
  onChange: (val: number) => void;
}

export const DeliveryOfferCard = ({ value, suggestedMin, suggestedMax, onChange }: DeliveryOfferCardProps) => {
  const isAtMin = value <= suggestedMin;
  
  const increment = () => onChange(value + 1);
  const decrement = () => {
    if (!isAtMin) {
      // Auto-clamp to minimum never exceeding visual floor
      onChange(Math.max(suggestedMin, value - 1));
    }
  };

  return (
    <View className="px-6 mb-6">
      <View className="rounded-3xl bg-[#11253E] border border-white/[0.05] p-6 shadow-2xl shadow-black elevation-10 relative overflow-hidden">
        <View className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Quanto deseja pagar?</Text>

        <View className="flex-row items-center justify-center gap-6 mb-4">
          <TouchableOpacity
            onPress={decrement}
            activeOpacity={0.7}
            disabled={isAtMin}
            className={`w-12 h-12 rounded-full border items-center justify-center ${
              isAtMin 
              ? 'bg-white/[0.02] border-white/[0.03] opacity-40' 
              : 'bg-white/5 border-white/10 active:bg-white/10'
            }`}
          >
            <Minus size={22} color={isAtMin ? "#64748b" : "#fff"} />
          </TouchableOpacity>

          <View className="items-center flex-row items-baseline">
            <Text className="text-slate-400 text-xl font-bold mr-2">R$</Text>
            <Text className="text-white text-5xl font-bold tracking-tighter">
              {value.toFixed(0)}
            </Text>
            <Text className="text-slate-400 text-xl font-bold ml-1">,00</Text>
          </View>

          <TouchableOpacity
            onPress={increment}
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center active:bg-white/10"
          >
            <Plus size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
