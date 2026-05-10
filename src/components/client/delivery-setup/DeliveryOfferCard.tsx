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
  const increment = () => onChange(value + 2);
  const decrement = () => value > 5 && onChange(value - 2);

  return (
    <View className="px-6 mb-6">
      <BlurView intensity={40} tint="dark" className="rounded-3xl bg-slate-900/50 border border-white/10 p-6 shadow-2xl elevation-10 relative overflow-hidden">
        <View className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-4">Quanto deseja pagar?</Text>

        <View className="flex-row items-center justify-center gap-6 mb-4">
          <TouchableOpacity
            onPress={decrement}
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center active:bg-white/10"
          >
            <Minus size={22} color="#fff" />
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

        <View className="items-center border-t border-white/5 pt-4 mt-2">
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full">
            <Zap size={12} color="#fbbf24" fill="#fbbf24" className="mr-1.5" />
            <Text className="text-slate-400 text-xs font-medium mr-1">Faixa sugerida:</Text>
            <Text className="text-white text-xs font-bold">
               R$ {suggestedMin.toFixed(0)} - R$ {suggestedMax.toFixed(0)}
            </Text>
          </MotiView>
        </View>
      </BlurView>
    </View>
  );
};
