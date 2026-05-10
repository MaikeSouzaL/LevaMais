import React from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { MotiView } from "moti";
import { Car, Bike, Truck, Container } from "lucide-react-native";

export type LogisticsVehicleType = "motorcycle" | "car" | "van" | "truck";

interface VehicleTypeConfig {
  id: LogisticsVehicleType;
  label: string;
  desc: string;
  cap: string;
  icon: any;
}

const VEHICLES: VehicleTypeConfig[] = [
  { id: "motorcycle", label: "Moto", desc: "Entregas rápidas", cap: "Até 20kg", icon: Bike },
  { id: "car", label: "Carro", desc: "Pequenos volumes", cap: "Até 100kg", icon: Car },
  { id: "van", label: "Van", desc: "Cargas médias", cap: "Até 800kg", icon: Truck },
  { id: "truck", label: "Caminhão", desc: "Grandes fretes", cap: "Até 3 ton", icon: Container },
];

interface VehicleSelectorProps {
  selected: LogisticsVehicleType;
  onSelect: (id: LogisticsVehicleType) => void;
}

export const VehicleSelector = ({ selected, onSelect }: VehicleSelectorProps) => {
  return (
    <View className="mb-6 mt-2">
      <View className="px-6 mb-3 flex-row items-center justify-between">
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Selecione o Veículo</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 14 }}
      >
        {VEHICLES.map((vehicle) => {
          const isSelected = selected === vehicle.id;
          const Icon = vehicle.icon;

          return (
            <TouchableOpacity
              key={vehicle.id}
              activeOpacity={0.85}
              onPress={() => onSelect(vehicle.id)}
            >
              <MotiView
                animate={{
                  scale: isSelected ? 1.04 : 0.98,
                  borderColor: isSelected ? "rgba(2, 222, 149, 0.45)" : "rgba(255, 255, 255, 0.08)",
                  backgroundColor: isSelected ? "rgba(2, 222, 149, 0.12)" : "rgba(255, 255, 255, 0.03)"
                }}
                transition={{ type: "spring", damping: 15 }}
                className="w-36 p-4 rounded-[24px] border overflow-hidden relative"
              >
                {isSelected && (
                  <MotiView
                    from={{ opacity: 0.2, scale: 0.6 }}
                    animate={{ opacity: 0.5, scale: 1.2 }}
                    className="absolute top-0 right-0 w-16 h-16 rounded-full bg-primary/25 blur-2xl"
                  />
                )}

                <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 border ${isSelected ? 'bg-primary/20 border-primary/40' : 'bg-white/5 border-white/10'}`}>
                  <Icon size={24} color={isSelected ? "#02de95" : "#cbd5e1"} strokeWidth={isSelected ? 2.5 : 2} />
                </View>

                <Text className={`text-base font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {vehicle.label}
                </Text>
                <Text className="text-[10px] text-slate-500 font-medium mb-2 leading-tight">
                  {vehicle.desc}
                </Text>

                <View className={`self-start px-2 py-0.5 rounded-md ${isSelected ? 'bg-primary/20' : 'bg-white/10'}`}>
                  <Text className={`text-[9px] font-bold ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
                    {vehicle.cap}
                  </Text>
                </View>
              </MotiView>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};
