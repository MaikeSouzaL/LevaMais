import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Car, Package, Star, TrendingUp, Clock } from "lucide-react-native";
import { OnlineOfflineToggle } from "../../../../components/driver/home/OnlineOfflineToggle";

export type DriverServicePrefs = {
  ride: boolean;
  delivery: boolean;
};

interface DriverBottomSheetProps {
  online: boolean;
  services: DriverServicePrefs;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  snapPoints?: string[];
  vehicleType?: string;
}

export function DriverBottomSheet({
  online,
  services,
  isTogglingOnline,
  onToggleOnline,
  onToggleService,
  snapPoints: userSnapPoints,
  vehicleType,
}: DriverBottomSheetProps) {
  const finalSnapPoints = useMemo(() => userSnapPoints || ["38%", "65%"], [userSnapPoints]);

  const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";

  return (
    <BottomSheet
      index={0}
      snapPoints={finalSnapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: "#0B1A2A", borderRadius: 36 }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.2)", width: 40 }}
    >
      <BottomSheetScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 40 }}
      >
        
        {/* 🚀 HIGH IMPACT CONTROL: GO ONLINE/OFFLINE */}
        <View className="mb-6">
          <OnlineOfflineToggle 
            online={online} 
            loading={!!isTogglingOnline} 
            onToggle={onToggleOnline} 
          />
        </View>

        {/* 📊 OPERATIONAL PERFORMANCE PRESETS */}
        <View className="flex-row items-center justify-between gap-3 mb-6 bg-white/[0.02] border border-white/5 rounded-2xl p-4">
           <View className="items-center flex-1 border-r border-white/10">
              <View className="flex-row items-center mb-1">
                 <Star size={14} color="#FBBF24" fill="#FBBF24" className="mr-1" />
                 <Text className="text-white font-black text-base">4.9</Text>
              </View>
              <Text className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Avaliação</Text>
           </View>
           <View className="items-center flex-1 border-r border-white/10">
              <View className="flex-row items-center mb-1">
                 <TrendingUp size={14} color="#02de95" className="mr-1" />
                 <Text className="text-white font-black text-base">98%</Text>
              </View>
              <Text className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Aceitação</Text>
           </View>
           <View className="items-center flex-1">
              <View className="flex-row items-center mb-1">
                 <Clock size={14} color="#3B82F6" className="mr-1" />
                 <Text className="text-white font-black text-base">4.5h</Text>
              </View>
              <Text className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Online</Text>
           </View>
        </View>

        {/* 🎛️ SERVICE PREFERENCES GRID */}
        <Text className="text-white/50 text-xs font-black uppercase tracking-widest mb-3 px-1">
           Preferências de Serviço
        </Text>

        <View className="flex-row gap-3">
          {/* Option: RIDE */}
          <TouchableOpacity
             onPress={() => canDoRides && onToggleService("ride")}
             activeOpacity={0.8}
             disabled={!canDoRides}
             className={`flex-1 rounded-2xl border-2 p-4 items-center justify-center flex-row ${
                !canDoRides ? 'opacity-40 bg-white/[0.02] border-transparent' :
                services.ride ? 'bg-[#02de95]/10 border-[#02de95]' : 'bg-white/5 border-white/10'
             }`}
          >
             <Car size={20} color={services.ride ? "#02de95" : "rgba(255,255,255,0.5)"} className="mr-3" />
             <Text className={`font-black text-sm ${services.ride ? 'text-white' : 'text-white/50'}`}>
                Corridas
             </Text>
          </TouchableOpacity>

          {/* Option: DELIVERY */}
          <TouchableOpacity
             onPress={() => onToggleService("delivery")}
             activeOpacity={0.8}
             className={`flex-1 rounded-2xl border-2 p-4 items-center justify-center flex-row ${
                services.delivery ? 'bg-[#02de95]/10 border-[#02de95]' : 'bg-white/5 border-white/10'
             }`}
          >
             <Package size={20} color={services.delivery ? "#02de95" : "rgba(255,255,255,0.5)"} className="mr-3" />
             <Text className={`font-black text-sm ${services.delivery ? 'text-white' : 'text-white/50'}`}>
                Entregas
             </Text>
          </TouchableOpacity>
        </View>

        {/* Warnings Area */}
        {!canDoRides && (
           <View className="mt-4 bg-white/[0.02] p-3 rounded-xl border border-white/5">
             <Text className="text-white/40 text-xs text-center">
                💡 Corridas de passageiros bloqueadas para seu tipo de veículo.
             </Text>
           </View>
        )}
        
        {!services.ride && !services.delivery && (
          <View className="mt-4 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
             <Text className="text-amber-500 font-bold text-xs text-center">
                ⚠️ Ative ao menos 1 serviço para receber solicitações.
             </Text>
          </View>
        )}

      </BottomSheetScrollView>
    </BottomSheet>
  );
}
