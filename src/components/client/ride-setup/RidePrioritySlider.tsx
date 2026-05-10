import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MotiView } from "moti";

export type PriorityLevel = 0 | 1 | 2; // Econômico, Equilibrado, Prioridade

interface RidePrioritySliderProps {
  level: PriorityLevel;
  onChange: (lvl: PriorityLevel) => void;
}

const LABELS = ["Econômico", "Equilibrado", "Prioridade"];

export const RidePrioritySlider = ({ level, onChange }: RidePrioritySliderProps) => {
  const width = Dimensions.get("window").width - 48; // matches padding
  const itemWidth = width / 3;

  return (
    <View className="px-6 mb-8">
      <View className="mb-2">
        <Text className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Prioridade da Corrida</Text>
      </View>
      
      <View className="h-12 bg-white/5 border border-white/10 rounded-2xl flex-row relative overflow-hidden">
        {/* Sliding Highlight indicator */}
        <MotiView
          animate={{
            translateX: level * itemWidth,
            backgroundColor: level === 2 ? "rgba(245, 158, 11, 0.15)" : "rgba(2, 222, 149, 0.15)",
            borderColor: level === 2 ? "rgba(245, 158, 11, 0.4)" : "rgba(2, 222, 149, 0.4)"
          }}
          transition={{ type: "spring", damping: 20, stiffness: 200 }}
          className="absolute top-0 left-0 bottom-0 border rounded-xl m-1"
          style={{ width: itemWidth - 8 }} // adjustment for margins
        />

        {LABELS.map((label, idx) => {
          const isSelected = level === idx;
          return (
            <TouchableOpacity
              key={idx}
              className="flex-1 items-center justify-center z-10"
              onPress={() => onChange(idx as PriorityLevel)}
              activeOpacity={0.7}
            >
              <Text className={`text-xs font-bold tracking-wide transition-colors ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <MotiView 
        animate={{ opacity: 1 }} 
        key={level} 
        from={{ opacity: 0 }} 
        transition={{ type: "timing", duration: 300 }}
        className="mt-2 flex-row items-center justify-center"
      >
        <Text className="text-[11px] text-slate-400 text-center">
          {level === 0 && "💡 Reduz o preço, pode levar mais tempo."}
          {level === 1 && "🚀 Velocidade normal de aceitação."}
          {level === 2 && "⚡ Envio prioritário aos melhores motoristas."}
        </Text>
      </MotiView>
    </View>
  );
};
