import React from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";

export type DeliveryType = "doc" | "box" | "market" | "material" | "moving" | "other";

interface TypeOption {
  id: DeliveryType;
  label: string;
}

const TYPES: TypeOption[] = [
  { id: "doc", label: "Documento" },
  { id: "box", label: "Caixa" },
  { id: "market", label: "Mercado" },
  { id: "material", label: "Material" },
  { id: "moving", label: "Mudança" },
  { id: "other", label: "Outros" },
];

interface DeliveryTypeSelectorProps {
  selected: DeliveryType;
  onSelect: (id: DeliveryType) => void;
}

export const DeliveryTypeSelector = ({ selected, onSelect }: DeliveryTypeSelectorProps) => {
  return (
    <View className="mb-6">
      <View className="px-6 mb-3">
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">O que você vai enviar?</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 8 }}
      >
        {TYPES.map((item) => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.8}
              className={`px-5 py-2.5 rounded-full border transition-colors shadow-md ${
                isSelected 
                ? 'bg-primary border-primary shadow-primary/20' 
                : 'bg-[#11253E] border-white/[0.05]'
              }`}
            >
              <Text className={`text-xs font-extrabold tracking-wide ${isSelected ? 'text-slate-950' : 'text-slate-300'}`}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
