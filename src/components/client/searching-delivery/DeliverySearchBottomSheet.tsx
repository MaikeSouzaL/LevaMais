import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { XCircle, Radar, MapPin, Package, DollarSign, Clock, Route } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";

import { SearchStageIndicator } from "./SearchStageIndicator";
import { AISuggestionCard } from "./AISuggestionCard";

interface DeliverySearchBottomSheetProps {
  feedMessage: string;
  offerValue: number;
  vehicleType: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  onCancel: () => void;
  cancelling: boolean;
  searchState: { stage: string; radius: number; label: string };
  secondsElapsed: number;
  distanceText?: string;
  durationText?: string;
}

export function DeliverySearchBottomSheet({
  feedMessage,
  offerValue,
  vehicleType,
  pickupAddress,
  dropoffAddress,
  onCancel,
  cancelling,
  searchState,
  secondsElapsed,
  distanceText,
  durationText
}: DeliverySearchBottomSheetProps) {
  
  // Expanded height dynamic snap points for scrolling capability 🚀
  const snapPoints = useMemo(() => ["40%", "75%"], []);

  const vehicleLabel = useMemo(() => {
    const map: Record<string, string> = {
      motorcycle: "Motoboy", car: "Carro", van: "Van de Carga", truck: "Caminhão"
    };
    return map[vehicleType] || "Entregador";
  }, [vehicleType]);

  const showAISuggestion = secondsElapsed > 35;

  return (
    <BottomSheet
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: "#0B1523", borderRadius: 36 }}
      handleIndicatorStyle={{ backgroundColor: "#ffffff30", width: 40 }}
    >
      <BottomSheetScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 8, paddingBottom: 32 }}
      >
        {/* 1. Real-Time Expansion Metrics 🛰️ */}
        <SearchStageIndicator 
          stageLabel={searchState.label} 
          radius={searchState.radius} 
        />

        {/* 2. Dynamic Live Pulse Banner */}
        <View className="bg-[#02de95]/10 border border-[#02de95]/20 rounded-2xl p-4 flex-row items-center mb-5">
          <View className="w-10 h-10 bg-[#02de95]/20 rounded-full items-center justify-center mr-4">
             <Radar size={20} color="#02de95" />
          </View>
          <View className="flex-1">
            <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-widest mb-1">
              Status da Rede
            </Text>
            <AnimatePresence exitBeforeEnter>
              <MotiView
                key={feedMessage}
                from={{ opacity: 0, translateY: 5 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0, translateY: -5 }}
                transition={{ type: "timing", duration: 300 }}
              >
                <Text className="text-white font-semibold text-sm leading-tight" numberOfLines={1}>
                  {feedMessage}
                </Text>
              </MotiView>
            </AnimatePresence>
          </View>
        </View>

        {/* 3. Conditional AI Persuasion Engine 🤖💡 */}
        <AnimatePresence>
           {showAISuggestion && (
             <AISuggestionCard onBoost={() => console.log("Boost requested")} />
           )}
        </AnimatePresence>

        {/* 4. Core Information Grid */}
        <View className="flex-row space-x-4 mb-5 items-stretch h-[82px]">
          <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 justify-between mr-3">
            <Text className="text-white/40 text-[10px] font-bold uppercase">Veículo</Text>
            <View className="flex-row items-center">
               <Package size={15} color="#FFF" className="mr-2 opacity-70" />
               <Text className="text-white font-bold text-base" numberOfLines={1}>{vehicleLabel}</Text>
            </View>
          </View>

          <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-4 justify-between">
            <Text className="text-white/40 text-[10px] font-bold uppercase">Sua Oferta</Text>
            <View className="flex-row items-center">
               <DollarSign size={16} color="#02de95" className="mr-1" />
               <Text className="text-[#02de95] font-black text-2xl">
                 {offerValue.toFixed(0)}
               </Text>
               <Text className="text-[#02de95]/70 font-bold text-xs ml-0.5 mt-1">,00</Text>
            </View>
          </View>
        </View>

        {/* 5. Compact Route Snapshot 🛣️ */}
        <View className="bg-white/[0.03] rounded-2xl border border-white/10 p-4 mb-6 justify-center">
          <View className="flex-row items-center mb-3">
             <MapPin size={14} color="#02de95" className="mr-3" />
             <Text className="text-white/70 text-xs font-medium flex-1" numberOfLines={1}>
               {pickupAddress || "Local de coleta"}
             </Text>
          </View>
          <View className="w-[1px] h-3 bg-white/10 ml-[6px] mb-3" />
          <View className="flex-row items-center mb-4">
             <MapPin size={14} color="#EF4444" className="mr-3" />
             <Text className="text-white/70 text-xs font-medium flex-1" numberOfLines={1}>
               {dropoffAddress || "Local de entrega"}
             </Text>
          </View>

          <View className="h-[1px] bg-white/[0.05] w-full mb-4" />

          <View className="flex-row gap-3 items-center">
             <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Clock size={12} color="#02de95" className="mr-1.5" />
                <Text className="text-white/80 text-[11px] font-bold">
                  {durationText || "-- min"}
                </Text>
             </View>

             <View className="flex-row items-center bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                <Route size={12} color="#02de95" className="mr-1.5" />
                <Text className="text-white/80 text-[11px] font-bold">
                  {distanceText || "-- km"}
                </Text>
             </View>
          </View>
        </View>

        {/* 6. Major Cancel Call to Action */}
        <TouchableOpacity
          onPress={onCancel}
          disabled={cancelling}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl h-14 flex-row items-center justify-center active:scale-[0.98]"
        >
          {cancelling ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <>
              <XCircle size={18} color="#EF4444" className="mr-2" opacity={0.8} />
              <Text className="text-red-500/90 font-bold text-base">
                Cancelar Solicitação
              </Text>
            </>
          )}
        </TouchableOpacity>

      </BottomSheetScrollView>
    </BottomSheet>
  );
}
