import React from "react";
import { View, Text } from "react-native";
import { MapPin, Package, Clock, Route } from "lucide-react-native";
import { BlurView } from "expo-blur";

interface DeliverySummaryCardProps {
  originAddress: string;
  dropoffAddress: string;
  distance?: string;
  duration?: string;
}

export const DeliverySummaryCard = ({ 
  originAddress, 
  dropoffAddress, 
  distance, 
  duration 
}: DeliverySummaryCardProps) => {
  return (
    <View className="bg-[#11253E] border border-white/[0.05] rounded-3xl p-5 shadow-2xl shadow-black mx-6 mb-4 elevation-5">
      <View className="flex-row mb-4">
        <View className="items-center mr-3.5 pt-1.5">
          <View className="w-3 h-3 rounded-full bg-primary shadow-glow" />
          <View className="w-[1px] h-8 border border-dashed border-white/20 my-1" />
          <MapPin size={16} color="#ef4444" />
        </View>

        <View className="flex-1 justify-between gap-2.5">
          <View>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Local de Coleta</Text>
            <Text className="text-white/90 text-sm font-medium" numberOfLines={1}>
              {originAddress || "Definindo origem..."}
            </Text>
          </View>
          <View>
            <Text className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-0.5">Destino da Entrega</Text>
            <Text className="text-white text-sm font-bold" numberOfLines={1}>
              {dropoffAddress || "Definindo destino..."}
            </Text>
          </View>
        </View>
      </View>

      <View className="h-[1px] bg-white/5 w-full mb-4" />

      <View className="flex-row gap-3">
        <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <Clock size={14} color="#02de95" className="mr-2" />
          <Text className="text-slate-200 text-xs font-bold">{duration || "-- min"}</Text>
        </View>
        <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
          <Route size={14} color="#02de95" className="mr-2" />
          <Text className="text-slate-200 text-xs font-bold">{distance || "-- km"}</Text>
        </View>
      </View>
    </View>
  );
};
