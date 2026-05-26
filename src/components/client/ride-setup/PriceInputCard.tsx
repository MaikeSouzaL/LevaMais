import React from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import { Plus, Minus, Sparkles } from "lucide-react-native";
import { BlurView } from "expo-blur";

interface PriceInputCardProps {
  value: number;
  onChange: (val: number) => void;
}

export const PriceInputCard = ({ value, onChange }: PriceInputCardProps) => {
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 5;
  const increment = () => onChange(safeValue + 1);
  const decrement = () => {
    if (safeValue > 5) onChange(safeValue - 1);
  };

  return (
    <View className="px-6 mb-4">
      <BlurView intensity={40} tint="dark" className="rounded-3xl bg-slate-900/50 border border-white/10 p-6 relative overflow-hidden elevation-10 shadow-2xl">
        {/* Glowing mesh overlay */}
        <View className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white/60 text-xs font-bold uppercase tracking-widest flex-row items-center">
            Valor da Oferta
          </Text>
          
          <View className="flex-row items-center bg-primary/10 px-2 py-1 rounded-full border border-primary/20">
            <Sparkles size={10} color="#02de95" className="mr-1" />
            <Text className="text-primary text-[10px] font-bold">Negociável</Text>
          </View>
        </View>

        <View className="flex-row items-center justify-center gap-6">
          <TouchableOpacity
            onPress={decrement}
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center"
          >
            <Minus size={20} color="#fff" />
          </TouchableOpacity>

          <View className="items-center flex-row items-baseline">
            <Text className="text-slate-400 text-xl font-bold mr-1.5">R$</Text>
            <Text className="text-white text-5xl font-bold tracking-tighter">
              {safeValue.toFixed(2).replace(".", ",")}
            </Text>
          </View>

          <TouchableOpacity
            onPress={increment}
            activeOpacity={0.7}
            className="w-12 h-12 rounded-full bg-white/5 border border-white/10 items-center justify-center"
          >
            <Plus size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
};
