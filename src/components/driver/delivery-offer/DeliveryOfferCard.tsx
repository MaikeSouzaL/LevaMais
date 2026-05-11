import React from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Check, MessageSquare, Sparkles, Route, Clock } from "lucide-react-native";
import { DeliveryDetailsSection } from "./DeliveryDetailsSection";
import { formatBRL } from "@/utils/mappers";

interface DeliveryOfferCardProps {
  offer: any;
  onAccept: () => void;
  onNegotiate: () => void;
}

export function DeliveryOfferCard({ offer, onAccept, onNegotiate }: DeliveryOfferCardProps) {
  if (!offer) return null;

  const isRecommended = offer.recommended || true; // Simulate premium UI always recommended
  const value = offer.offeredValue || offer.pricing?.total || 0;

  return (
    <View className="absolute bottom-0 left-0 right-0 bg-[#0B1523] border-t border-white/10 shadow-3xl rounded-t-[40px] h-[70%]">
      
      <View className="w-12 h-1.5 bg-white/10 self-center rounded-full mt-4 mb-2" />

      <BottomSheetScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 50 }}
      >
        {/* 🤖 AI MATCH BADGE */}
        {isRecommended && (
          <View className="self-start bg-[#02de95]/10 border border-[#02de95]/20 px-3 py-1.5 rounded-full flex-row items-center mb-5">
             <Sparkles size={12} color="#02de95" fill="#02de95" className="mr-1.5" />
             <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-wider">ENTREGA RECOMENDADA PELA IA</Text>
          </View>
        )}

        {/* 🤑 BIG FINANCIAL HIGHLIGHT */}
        <View className="mb-6 flex-row items-end justify-between">
           <View>
             <Text className="text-white/40 text-xs font-black uppercase tracking-widest mb-1">Você Recebe</Text>
             <Text className="text-white font-black text-5xl tracking-tight">{formatBRL(value)}</Text>
           </View>
           <View className="bg-[#02de95] w-12 h-12 rounded-2xl items-center justify-center shadow-xl shadow-[#02de95]/30">
              <Check size={28} color="#091A2F" strokeWidth={3} />
           </View>
        </View>

        {/* 📊 FAST KINETICS SUMMARY */}
        <View className="flex-row gap-3 mb-8">
           <View className="bg-white/[0.03] border border-white/5 flex-1 h-16 rounded-2xl items-center justify-center flex-row">
              <Route size={18} color="rgba(255,255,255,0.4)" className="mr-3" />
              <View>
                 <Text className="text-white font-black text-base">{offer.distanceKm || offer.distance?.text || "-- km"}</Text>
                 <Text className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Distância</Text>
              </View>
           </View>
           <View className="bg-white/[0.03] border border-white/5 flex-1 h-16 rounded-2xl items-center justify-center flex-row">
              <Clock size={18} color="rgba(255,255,255,0.4)" className="mr-3" />
              <View>
                 <Text className="text-white font-black text-base">{offer.estimatedDuration || offer.duration?.text || "-- min"}</Text>
                 <Text className="text-white/30 text-[10px] font-bold uppercase tracking-wider">Estimativa</Text>
              </View>
           </View>
        </View>

        {/* 📦 COMPONENT: DETAILS SECTION */}
        <DeliveryDetailsSection 
          pickupAddress={offer.pickup?.address || "Endereço de Coleta"}
          destinationAddress={offer.destination?.address || offer.dropoff?.address || "Endereço de Entrega"}
          cargoType={offer.cargoType || "Encomenda Geral"}
          helperRequired={offer.helperRequired}
          observations={offer.observations}
        />

        {/* 🚀 ACTION FOOTER LOCK */}
        <View className="mt-10 flex-row gap-4">
           
           {/* Counter-Offer Button */}
           <TouchableOpacity
             onPress={onNegotiate}
             activeOpacity={0.8}
             className="flex-1 h-16 bg-white/5 border border-white/10 rounded-2xl items-center justify-center flex-row"
           >
             <MessageSquare size={20} color="rgba(255,255,255,0.7)" className="mr-2" />
             <Text className="text-white/70 font-black text-base tracking-wide">Negociar</Text>
           </TouchableOpacity>

           {/* Acceptance Master Button */}
           <TouchableOpacity
             onPress={onAccept}
             activeOpacity={0.9}
             className="flex-[1.5] h-16 bg-[#02de95] rounded-2xl items-center justify-center shadow-2xl shadow-[#02de95]/30 flex-row"
           >
             <Check size={22} color="#091A2F" className="mr-2" strokeWidth={3} />
             <Text className="text-[#091A2F] font-black text-lg uppercase tracking-widest">Aceitar</Text>
           </TouchableOpacity>

        </View>

      </BottomSheetScrollView>
    </View>
  );
}
