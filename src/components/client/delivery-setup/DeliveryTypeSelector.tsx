import React, { useMemo } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { LogisticsVehicleType } from "./VehicleSelector";

export type DeliveryType = 
  | "doc" | "box" | "market" | "food" 
  | "furniture" | "material" | "moving" | "other";

interface TypeOption {
  id: DeliveryType;
  label: string;
  vehicles: LogisticsVehicleType[];
}

const ALL_TYPES: TypeOption[] = [
  { id: "doc", label: "Documento", vehicles: ["motorcycle", "car"] },
  { id: "food", label: "Alimentos", vehicles: ["motorcycle", "car"] },
  { id: "market", label: "Mercado", vehicles: ["motorcycle", "car", "van"] },
  { id: "box", label: "Caixa", vehicles: ["motorcycle", "car", "van", "truck"] },
  { id: "material", label: "Material", vehicles: ["car", "van", "truck"] },
  { id: "furniture", label: "Móveis", vehicles: ["van", "truck"] },
  { id: "moving", label: "Mudança", vehicles: ["van", "truck"] },
  { id: "other", label: "Outros", vehicles: ["motorcycle", "car", "van", "truck"] },
];

interface DeliveryTypeSelectorProps {
  selected: DeliveryType;
  onSelect: (id: DeliveryType) => void;
  vehicleType: LogisticsVehicleType;
}

export const DeliveryTypeSelector = ({ 
  selected, 
  onSelect, 
  vehicleType 
}: DeliveryTypeSelectorProps) => {
  // Dynamically filter supported categories instantly on swap
  const visibleTypes = useMemo(() => {
    return ALL_TYPES.filter(t => t.vehicles.includes(vehicleType));
  }, [vehicleType]);

  // Auto-correction callback if selection becomes invalid after filtering
  React.useEffect(() => {
    const isValid = visibleTypes.some(t => t.id === selected);
    if (!isValid && visibleTypes.length > 0) {
      onSelect(visibleTypes[0].id); // Auto-snap to first valid option
    }
  }, [visibleTypes]);

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
        {visibleTypes.map((item) => {
          const isSelected = selected === item.id;
          return (
            <TouchableOpacity
              key={item.id}
              onPress={() => onSelect(item.id)}
              activeOpacity={0.8}
              className={`px-5 py-2.5 rounded-full border shadow-md ${
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
