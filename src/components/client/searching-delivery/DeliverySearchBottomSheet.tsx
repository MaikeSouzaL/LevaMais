import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Image } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { XCircle, Radar, MapPin, Package, DollarSign, Clock, Route, User, Star } from "lucide-react-native";
import { MotiView, AnimatePresence } from "moti";

import { SearchStageIndicator } from "./SearchStageIndicator";
import { AISuggestionCard } from "./AISuggestionCard";
import { NearbyDriver } from "@/hooks/useRealtimeDelivery";

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
  drivers?: NearbyDriver[];
  onBoost: (amount: number) => void;
  onViewOffers?: () => void;
  offersCount?: number;
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
  durationText,
  drivers = [],
  onBoost,
  onViewOffers,
  offersCount = 0,
}: DeliverySearchBottomSheetProps) {
  const safeOfferValue = Number.isFinite(Number(offerValue)) ? Number(offerValue) : 0;

  // Expanded height dynamic snap points for scrolling capability ðŸš€
  const snapPoints = useMemo(() => ["48%", "80%"], []);

  const vehicleLabel = useMemo(() => {
    const map: Record<string, string> = {
      motorcycle: "Motoboy", car: "Carro", van: "Van de Carga", truck: "CaminhÃ£o"
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
        {/* 1. Real-Time Expansion Metrics ðŸ›°ï¸ */}
        <SearchStageIndicator 
          stageLabel={searchState.label} 
          radius={searchState.radius} 
        />

        {/* 2 & 6. CONSOLIDATED ACTIVE NETWORK ROSTER ðŸ“¡ðŸï¸ */}
        <View className="mb-5">
          <View className="mb-1.5">
            <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">
              {vehicleType === "motorcycle" ? "Entregadores no PerÃ­metro" : "Motoristas no PerÃ­metro"}
            </Text>
          </View>

          {/* Live Pulse integrated dynamic text feedback */}
          <AnimatePresence exitBeforeEnter>
            <MotiView
              key={feedMessage}
              from={{ opacity: 0, translateY: 5 }}
              animate={{ opacity: 1, translateY: 0 }}
              exit={{ opacity: 0, translateY: -5 }}
              transition={{ type: "timing", duration: 300 }}
              className="mb-4"
            >
              <Text className="text-white font-bold text-sm opacity-90 leading-tight">
                {feedMessage}
              </Text>
            </MotiView>
          </AnimatePresence>

          {drivers.length > 0 ? (
            drivers.map((driver, index) => (
              <MotiView
                key={driver.id || index}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ delay: index * 80, type: "spring", damping: 15 }}
                className="bg-white/[0.03] border border-white/5 rounded-3xl p-4 w-full flex-row items-center mb-3 shadow-sm"
              >
                {/* 1. Left side: Beautiful Avatar LED Badge */}
                <View className="relative mr-4">
                  {driver.profilePhoto ? (
                    <Image 
                      source={{ uri: driver.profilePhoto }} 
                      className="w-14 h-14 rounded-full border border-white/10" 
                    />
                  ) : (
                    <View className="w-14 h-14 bg-white/10 rounded-full items-center justify-center border border-white/5">
                      <User size={24} color="#FFF" opacity={0.5} />
                    </View>
                  )}
                  {/* Visual status matching map logic */}
                  <View 
                    className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-[#0B1523]"
                    style={{ backgroundColor: driver.isUnavailable ? "#FBBF24" : "#02de95" }}
                  />
                </View>

                {/* 2. Center: Content Info Layer */}
                <View className="flex-1 justify-center">
                  <Text className="text-white font-bold text-base mb-1">
                    {driver.name || "Piloto"}
                  </Text>

                  <View className="flex-row items-center">
                    {/* Star pill */}
                    <View className="flex-row items-center bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 mr-2">
                      <Star size={11} color="#FBBF24" fill="#FBBF24" className="mr-1.5" />
                      <Text className="text-white/80 text-[11px] font-black">
                        {Number(driver.rating || 5.0).toFixed(1)}
                      </Text>
                    </View>

                    {/* Text Pill matching standard colors */}
                    <View 
                      className="px-2.5 py-1 rounded-lg"
                      style={{ backgroundColor: driver.isUnavailable ? "rgba(251,191,36,0.1)" : "rgba(2,222,149,0.1)" }}
                    >
                      <Text 
                        className="text-[9px] font-black uppercase tracking-widest"
                        style={{ color: driver.isUnavailable ? "#FBBF24" : "#02de95" }}
                      >
                        {driver.isUnavailable ? "IndisponÃ­vel" : "DisponÃ­vel"}
                      </Text>
                    </View>
                  </View>
                </View>
              </MotiView>
            ))
          ) : (
            <View className="bg-white/[0.015] border border-dashed border-white/10 rounded-3xl p-6 items-center justify-center mb-2">
              <Radar size={22} color="#02de95" opacity={0.4} />
              <Text className="text-white/30 text-xs font-semibold mt-3 text-center">
                Buscando conexÃµes prÃ³ximas...
              </Text>
            </View>
          )}
        </View>

        {/* 3. Conditional AI Persuasion Engine ðŸ¤–ðŸ’¡ */}
        <AnimatePresence>
           {showAISuggestion && (
             <AISuggestionCard onBoost={onBoost} />
           )}
        </AnimatePresence>

        {/* 4. Core Information Grid */}
        <View className="flex-row gap-3 mb-5 items-stretch h-[64px]">
          <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-3 justify-between">
            <Text className="text-white/40 text-[9px] font-bold uppercase">VeÃ­culo</Text>
            <View className="flex-row items-center">
               <Package size={13} color="#FFF" className="mr-1.5 opacity-70" />
               <Text className="text-white font-bold text-sm" numberOfLines={1}>{vehicleLabel}</Text>
            </View>
          </View>

          <View className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl p-3 justify-between">
            <Text className="text-white/40 text-[9px] font-bold uppercase">Sua Oferta</Text>
            <View className="flex-row items-center">
               <DollarSign size={14} color="#02de95" className="mr-0.5" />
               <Text className="text-[#02de95] font-black text-base">
                 {safeOfferValue.toFixed(0)}
               </Text>
               <Text className="text-[#02de95]/70 font-bold text-[10px] ml-0.5 mt-0.5">,00</Text>
            </View>
          </View>
        </View>

        {/* 5. Compact Route Snapshot ðŸ›£ï¸ */}
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


      </BottomSheetScrollView>

      {/* ðŸ›¡ï¸ FIXED ACTION BAR: Always visible button, no scrolling required */}
      <View className="px-6 pt-2 pb-8 border-t border-white/[0.05] bg-[#0B1523]">
        {offersCount > 0 && onViewOffers && (
          <TouchableOpacity
            onPress={onViewOffers}
            className="bg-amber-500/10 border border-amber-500/30 rounded-2xl h-14 flex-row items-center justify-center mb-3"
          >
            <Text className="text-amber-400 font-black text-base uppercase tracking-wider">
              Ver Propostas ({offersCount})
            </Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={onCancel}
          disabled={cancelling}
          className="bg-red-500/5 border border-red-500/20 rounded-2xl h-14 flex-row items-center justify-center"
        >
          {cancelling ? (
            <ActivityIndicator color="#EF4444" size="small" />
          ) : (
            <>
              <XCircle size={18} color="#EF4444" className="mr-2" opacity={0.8} />
              <Text className="text-red-500/90 font-black text-base uppercase tracking-wider">
                Cancelar Busca
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

