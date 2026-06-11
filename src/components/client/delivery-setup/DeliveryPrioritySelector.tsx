import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { MotiView } from "moti";

export type DeliveryPriority = 0 | 1 | 2; // Econômico, Rápido, Urgente

interface DeliveryPrioritySelectorProps {
  value: DeliveryPriority;
  onChange: (lvl: DeliveryPriority) => void;
}

const LABELS = ["Econômico", "Rápido", "Urgente"];

export const DeliveryPrioritySelector = ({ value, onChange }: DeliveryPrioritySelectorProps) => {
  const screenWidth = Dimensions.get("window").width - 48;
  const buttonWidth = screenWidth / 3;

  return (
    <View className="px-6 mb-8">
      <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest mb-2.5">Prioridade da Entrega</Text>
      
      <View className="h-12 bg-[#1E2D3D] border border-white/[0.03] rounded-2xl flex-row relative overflow-hidden p-1 shadow-sm">
        <MotiView
          animate={{
            translateX: value * (buttonWidth - 2),
            backgroundColor: value === 2 ? "rgba(239, 68, 68, 0.15)" : value === 1 ? "rgba(2, 222, 149, 0.15)" : "#11253E",
            borderColor: value === 2 ? "#ef4444" : value === 1 ? "#02de95" : "rgba(255,255,255,0.1)"
          }}
          transition={{ type: "spring", damping: 22, stiffness: 200 }}
          className="absolute top-0 left-0 bottom-0 border rounded-xl m-1"
          style={{ width: buttonWidth - 8 }}
        />

        {LABELS.map((label, idx) => {
          const isSelected = value === idx;
          return (
            <TouchableOpacity
              key={idx}
              className="flex-1 items-center justify-center z-10"
              onPress={() => onChange(idx as DeliveryPriority)}
              activeOpacity={0.7}
            >
              <Text className={`text-xs font-bold tracking-wide ${isSelected ? 'text-white' : 'text-slate-500'}`}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      
      <MotiView 
        animate={{ opacity: 1 }} 
        key={value} 
        from={{ opacity: 0 }} 
        className="mt-2.5 flex-row items-center justify-center"
      >
        <Text className="text-[11px] text-slate-400 text-center font-medium italic">
          {value === 0 ? "🐢 Menor custo, maior janela de entrega." :
           value === 1 ? "📦 Equilíbrio ideal para o dia a dia." :
           value === 2 ? "🚀 Alerta máximo, coleta imediata." : ""}
        </Text>
      </MotiView>
    </View>
  );
};
