import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";

export type CargoSize = "small" | "medium" | "large";

interface CargoSizeSelectorProps {
  value: CargoSize;
  onChange: (s: CargoSize) => void;
}

const SIZES: { id: CargoSize; label: string }[] = [
  { id: "small", label: "Pequeno" },
  { id: "medium", label: "Médio" },
  { id: "large", label: "Grande" },
];

export const CargoSizeSelector = ({ value, onChange }: CargoSizeSelectorProps) => {
  return (
    <View className="px-6 mb-6">
      <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2.5">Tamanho do Volume</Text>
      
      <View className="h-12 bg-white/5 border border-white/10 rounded-2xl flex-row relative overflow-hidden p-1">
        {SIZES.map((sz) => {
          const isSel = value === sz.id;
          return (
            <TouchableOpacity
              key={sz.id}
              className="flex-1 items-center justify-center z-10 relative"
              onPress={() => onChange(sz.id)}
              activeOpacity={0.8}
            >
              {isSel && (
                <MotiView
                  layout={{ type: "spring", damping: 20 }}
                  className="absolute inset-0 bg-white/10 border border-white/10 rounded-xl"
                />
              )}
              <Text className={`text-xs font-bold ${isSel ? 'text-white' : 'text-slate-500'}`}>
                {sz.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
