import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { Car, Bike, Truck, Container } from "lucide-react-native";
import configService from "@/services/config.service";

export type LogisticsVehicleType = "motorcycle" | "car" | "van" | "truck";

interface VehicleTypeConfig {
  id: LogisticsVehicleType;
  label: string;
  desc: string;
  cap: string;
  icon: any;
}

const ICON_MAP: Record<string, any> = {
  motorcycle: Bike,
  car: Car,
  van: Truck,
  truck: Container,
};

const DEFAULT_VEHICLES: VehicleTypeConfig[] = [
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
  const [vehicles, setVehicles] = useState<VehicleTypeConfig[]>(DEFAULT_VEHICLES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        const res = await configService.getDeliveryVehicles();
        
        // 🛡️ Robust unwrap of data body (handles raw arrays and {success, data} wrappers)
        const data = Array.isArray(res) ? res : (res as any)?.data;
        
        if (!Array.isArray(data) || data.length === 0) {
          setVehicles(DEFAULT_VEHICLES);
          return;
        }

        const formattedVehicles: VehicleTypeConfig[] = data.map((v: any) => {
          // 🛠️ Map common backend spelling overrides to standard LogisticsVehicleType
          let rawId = String(v.id || v._id || '').toLowerCase();
          let normalizedId: LogisticsVehicleType = "motorcycle";
          
          if (rawId.includes('moto')) normalizedId = "motorcycle";
          else if (rawId.includes('car')) normalizedId = "car";
          else if (rawId.includes('van')) normalizedId = "van";
          else if (rawId.includes('truck') || rawId.includes('caminh')) normalizedId = "truck";
          else normalizedId = rawId as LogisticsVehicleType; // Fallback

          const defaultMatch = DEFAULT_VEHICLES.find(d => d.id === normalizedId);

          return {
            id: normalizedId,
            label: v.label || v.name || defaultMatch?.label || "",
            desc: v.description || v.desc || defaultMatch?.desc || "",
            cap: v.capacity || v.cap || defaultMatch?.cap || "",
            icon: ICON_MAP[normalizedId] || defaultMatch?.icon || Car,
          };
        });
        
        setVehicles(formattedVehicles.length > 0 ? formattedVehicles : DEFAULT_VEHICLES);
      } catch (error) {
        setVehicles(DEFAULT_VEHICLES);
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []);

  if (loading) {
    return (
      <View className="mb-6 mt-2 items-center py-4">
        <ActivityIndicator size="small" color="#02de95" />
      </View>
    );
  }

  return (
    <View className="mb-6 mt-2">
      <View className="px-6 mb-3 flex-row items-center justify-between">
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Selecione o Veículo</Text>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 12, gap: 10 }}
      >
        {vehicles.map((vehicle) => {
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
                }}
                transition={{ type: "spring", damping: 18 }}
                className={`w-[108px] p-3 rounded-2xl border-[1.5px] overflow-hidden relative shadow-lg shadow-black ${
                  isSelected ? "border-[#02de95] bg-[#1E2D3D]" : "border-transparent bg-[#11253E]"
                }`}
              >
                <View className={`w-10 h-10 rounded-xl items-center justify-center mb-3 border ${isSelected ? 'bg-[#02de95]/10 border-[#02de95]/30' : 'bg-[#1E2D3D] border-white/[0.03]'}`}>
                  <Icon size={20} color={isSelected ? "#02de95" : "#94a3b8"} strokeWidth={isSelected ? 2.5 : 2} />
                </View>

                <Text className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {vehicle.label}
                </Text>
                <Text className="text-[9px] text-slate-500 font-medium mb-1.5 leading-tight" numberOfLines={1}>
                  {vehicle.desc}
                </Text>

                <View className={`self-start px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-primary/20' : 'bg-white/10'}`}>
                  <Text className={`text-[8.5px] font-bold ${isSelected ? 'text-primary' : 'text-slate-400'}`}>
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
