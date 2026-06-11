import React from "react";
import { View, Text } from "react-native";
import { MapPin, Navigation, Clock, Route } from "lucide-react-native";
import { BlurView } from "expo-blur";

interface RideSummaryCardProps {
  originAddress: string;
  dropoffAddress: string;
  distance?: string;
  duration?: string;
}

export const RideSummaryCard = ({ 
  originAddress, 
  dropoffAddress, 
  distance, 
  duration 
}: RideSummaryCardProps) => {
  return (
    <BlurView intensity={50} tint="dark" className="rounded-2xl bg-slate-900/40 border border-white/5 p-4 shadow-xl mx-6 mb-4">
      <View className="flex-row mb-3">
        {/* Visual Line Connector */}
        <View className="items-center mr-3 pt-1">
          <View className="w-2.5 h-2.5 rounded-full bg-primary" />
          <View className="w-[1px] h-7 border border-dashed border-white/20 my-0.5" />
          <MapPin size={14} color="#ef4444" />
        </View>

        {/* Texts */}
        <View className="flex-1 justify-between py-0.5">
          <Text className="text-white/80 text-xs font-medium" numberOfLines={1}>
            {originAddress || "Origem..."}
          </Text>
          <Text className="text-white text-sm font-bold" numberOfLines={1}>
            {dropoffAddress || "Destino..."}
          </Text>
        </View>
      </View>

      {/* Small stats divider row */}
      <View className="h-[1px] bg-white/5 w-full mb-3" />

      <View className="flex-row gap-4">
        <View className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <Clock size={12} color="#94a3b8" className="mr-1.5" />
          <Text className="text-slate-200 text-xs font-bold">{duration || "Calculando"}</Text>
        </View>
        <View className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <Route size={12} color="#94a3b8" className="mr-1.5" />
          <Text className="text-slate-200 text-xs font-bold">{distance || "-- km"}</Text>
        </View>
      </View>
    </BlurView>
  );
};
