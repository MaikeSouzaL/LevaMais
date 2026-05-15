import React, { useMemo } from "react";
import { View, Text, TouchableOpacity, Image, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { Star, Package, Clock, Check, MessageCircle, User, MessageSquare } from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";
import { RideOffer } from "@/services/ride.service";

interface DriverOfferListItemProps {
  offer: RideOffer;
  clientBudget: number;
  onSelect: (offer: RideOffer) => void;
  onDecline: (offer: RideOffer) => void;
  onCounter: (offer: RideOffer) => void;
  loading: boolean;
}

export function DriverOfferListItem({ offer, clientBudget, onSelect, onDecline, onCounter, loading }: DriverOfferListItemProps) {
  
  const driverName = useMemo(() => {
    if (typeof offer.driverId === "string") return "Entregador Parceiro";
    return offer.driverId?.name || "Entregador Parceiro";
  }, [offer.driverId]);

  // Check relationship between current offer and budget 📉
  const isCheaperOrEqual = Number(offer.amount) <= clientBudget;
  const isCounterOffer = offer.status !== "accepted";
  const isPendingDriver = offer.status === "client_countered";

  // Simulated metrics (since database does not pass complete stats yet) 📈
  const rating = useMemo(() => (4.7 + Math.random() * 0.3).toFixed(1), []);
  const deliveryCount = useMemo(() => Math.floor(500 + Math.random() * 2000), []);
  const eta = useMemo(() => Math.floor(3 + Math.random() * 8), []);

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.92, translateY: 15 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: "spring", damping: 16 }}
      className="w-full bg-white/[0.03] border border-white/10 rounded-3xl p-5 mb-4 shadow-2xl overflow-hidden"
    >
      
      {/* "Melhor Escolha" AI Badge 🤖 */}
      {isCheaperOrEqual && !isCounterOffer && (
        <View className="absolute top-0 right-0 bg-[#02de95] px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl flex-row items-center z-10">
          <Star size={10} color="#091A2F" fill="#091A2F" className="mr-1" />
          <Text className="text-[#091A2F] text-[10px] font-black uppercase tracking-wider">
            MELHOR ESCOLHA
          </Text>
        </View>
      )}

      {/* Top Row: User Identity Info */}
      <View className="flex-row items-center justify-between mb-5">
        <View className="flex-row items-center flex-1">
          {/* User Avatar Frame */}
          <View className="w-14 h-14 rounded-2xl bg-[#091A2F] border border-white/10 items-center justify-center mr-4 overflow-hidden">
            <View className="w-full h-full bg-white/5 items-center justify-center">
               <User size={24} color="rgba(255,255,255,0.4)" />
            </View>
          </View>
          
          <View className="flex-1">
            <Text className="text-white font-bold text-lg" numberOfLines={1}>
              {driverName}
            </Text>
            <View className="flex-row items-center mt-1 space-x-3">
              <View className="flex-row items-center">
                <Star size={13} color="#FBBF24" fill="#FBBF24" className="mr-1" />
                <Text className="text-white/90 font-bold text-sm">{rating}</Text>
              </View>
              <View className="w-1 h-1 bg-white/20 rounded-full mx-2" />
              <View className="flex-row items-center">
                <Package size={13} color="#FFF" className="mr-1 opacity-60" />
                <Text className="text-white/60 text-xs">{deliveryCount} entregas</Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Mid Section: Core Negotiation Metrics Grid */}
      <View className="flex-row items-center justify-between bg-[#091A2F]/60 border border-white/[0.05] rounded-2xl p-4 mb-4">
        
        {/* Dynamic ETA */}
        <View>
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
            Chega em
          </Text>
          <View className="flex-row items-center">
            <Clock size={16} color="#FFF" className="mr-1.5 opacity-80" />
            <Text className="text-white font-bold text-base">{eta} min</Text>
          </View>
        </View>

        <View className="w-[1px] h-8 bg-white/10" />

        {/* Dynamic Value Display with Color Intelligence 🎨 */}
        <View className="items-end">
          <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-1">
            {isPendingDriver ? "Sua Contraproposta" : (offer.amount > clientBudget ? "Contraproposta" : "Valor da Proposta")}
          </Text>
          <View className="flex-row items-center">
             {!isPendingDriver && offer.amount > clientBudget && (
                <View className="bg-amber-500/10 px-2 py-0.5 rounded-full mr-2 border border-amber-500/20">
                   <Text className="text-amber-500 font-black text-[10px]">+{formatBRL(offer.amount - clientBudget)}</Text>
                </View>
             )}
             <Text 
               className={`font-black text-2xl ${isPendingDriver ? 'text-[#00E5FF]' : (isCheaperOrEqual ? 'text-[#02de95]' : 'text-amber-400')}`}
             >
               {formatBRL(Number(offer.amount))}
             </Text>
          </View>
        </View>
      </View>

      {/* 💬 Optional Driver Direct Message */}
      {!!offer.message && !isPendingDriver && (
         <View className="flex-row items-start bg-white/[0.03] border border-white/5 p-3 rounded-xl mb-5">
             <MessageSquare size={14} color="rgba(255,255,255,0.6)" className="mr-2 mt-0.5" />
             <Text className="text-white/70 text-xs italic flex-1">"{offer.message}"</Text>
         </View>
      )}

      {/* ⌛ Pending Driver Indicator */}
      {isPendingDriver && (
        <View className="flex-row items-center bg-[#00E5FF]/10 border border-[#00E5FF]/20 p-3.5 rounded-2xl mb-5">
          <ActivityIndicator size="small" color="#00E5FF" style={{ marginRight: 10 }} />
          <Text className="text-[#00E5FF] text-xs font-bold flex-1">
            Aguardando o entregador responder à sua contraproposta de {formatBRL(Number(offer.amount))}.
          </Text>
        </View>
      )}

      {/* Bottom Actions Area 🚀 */}
      {isPendingDriver ? (
        <TouchableOpacity
          onPress={() => onDecline(offer)}
          disabled={loading}
          activeOpacity={0.7}
          className="w-full h-14 flex-row items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20"
        >
          <Text className="text-red-400 font-bold text-base">
            Retirar Proposta / Recusar
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="space-y-3 gap-3">
          {/* Secondary Actions Row */}
          <View className="flex-row items-center">
            {/* Decline Action */}
            <TouchableOpacity
              onPress={() => onDecline(offer)}
              disabled={loading}
              activeOpacity={0.7}
              className="flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 mr-3"
            >
              <Text className="text-red-400 font-bold text-sm">
                Recusar
              </Text>
            </TouchableOpacity>

            {/* Counter Offer Action */}
            <TouchableOpacity
              onPress={() => onCounter(offer)}
              disabled={loading}
              activeOpacity={0.7}
              className="flex-1 h-12 flex-row items-center justify-center rounded-2xl bg-white/5 border border-white/10"
            >
              <MessageCircle size={15} color="#FFF" style={{ marginRight: 6 }} />
              <Text className="text-white font-bold text-sm">
                Contrapropor
              </Text>
            </TouchableOpacity>
          </View>

          {/* Accept Main Action - Full Width */}
          <TouchableOpacity
            onPress={() => onSelect(offer)}
            disabled={loading}
            activeOpacity={0.85}
            className={`w-full h-14 flex-row items-center justify-center rounded-2xl shadow-lg ${isCheaperOrEqual ? 'bg-[#02de95]' : 'bg-white'}`}
          >
            {loading ? (
              <ActivityIndicator color="#091A2F" />
            ) : (
              <>
                <Check size={18} color="#091A2F" className="mr-2" strokeWidth={3} />
                <Text className="text-[#091A2F] font-black text-base">
                  Aceitar Oferta do Entregador
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

    </MotiView>
  );
}
