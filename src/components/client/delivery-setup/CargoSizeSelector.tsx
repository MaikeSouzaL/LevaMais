import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
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
  const screenWidth = Dimensions.get("window").width - 48;
  const buttonWidth = screenWidth / 3;
  
  const activeIndex = SIZES.findIndex(s => s.id === value);

  return (
    <View className="px-6 mb-6">
      <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2.5">Tamanho do Volume</Text>
      
      <View className="h-12 bg-[#11253E] border border-white/[0.05] rounded-2xl flex-row relative overflow-hidden p-1 shadow-sm">
        {/* High Performance Sliding Rail Indicator */}
        <MotiView
          animate={{
            translateX: activeIndex * (buttonWidth - 2),
          }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="absolute top-0 left-0 bottom-0 bg-[#1E2D3D] border border-white/[0.05] rounded-xl shadow-md m-1"
          style={{ width: buttonWidth - 8 }}
        />

        {SIZES.map((sz) => {
          const isSel = value === sz.id;
          return (
            <TouchableOpacity
              key={sz.id}
              className="flex-1 items-center justify-center z-10 relative"
              onPress={() => onChange(sz.id)}
              activeOpacity={0.8}
            >
              <Text className={`text-xs font-extrabold tracking-wider ${isSel ? 'text-white' : 'text-slate-500'}`}>
                {sz.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};
