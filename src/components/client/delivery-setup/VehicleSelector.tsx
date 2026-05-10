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
                  scale: isSelected ? 1.02 : 0.98,
                  borderColor: isSelected ? "#02de95" : "transparent",
                  backgroundColor: isSelected ? "#1E2D3D" : "#11253E",
                  elevation: isSelected ? 8 : 2,
                }}
                transition={{ type: "spring", damping: 18 }}
                className="w-36 p-4 rounded-3xl border-[1.5px] overflow-hidden relative shadow-2xl shadow-black"
              >
                {isSelected && (
                  <MotiView
                    from={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 0.4, scale: 1.2 }}
                    className="absolute top-0 right-0 w-20 h-20 rounded-full bg-primary/10 blur-2xl"
                  />
                )}

                <View className={`w-12 h-12 rounded-2xl items-center justify-center mb-4 border ${isSelected ? 'bg-[#02de95]/10 border-[#02de95]/30' : 'bg-[#1E2D3D] border-white/[0.03]'}`}>
                  <Icon size={24} color={isSelected ? "#02de95" : "#94a3b8"} strokeWidth={isSelected ? 2.5 : 2} />
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
