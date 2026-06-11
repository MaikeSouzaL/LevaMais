import React from "react";
import { View, Text } from "react-native";
import { MapPin, Package, Box, Users, FileText } from "lucide-react-native";

interface DeliveryDetailsSectionProps {
  pickupAddress: string;
  destinationAddress: string;
  cargoType: string;
  cargoSize?: string;
  helperRequired?: boolean;
  observations?: string;
}

export function DeliveryDetailsSection({
  pickupAddress,
  destinationAddress,
  cargoType,
  cargoSize,
  helperRequired,
  observations,
}: DeliveryDetailsSectionProps) {
  
  return (
    <View className="w-full">
      
      {/* 📍 ADDRESS TIMELINE */}
      <View className="bg-white/[0.02] rounded-3xl border border-white/5 p-5 mb-5">
         <View className="flex-row items-start">
            <View className="items-center mr-4 pt-1">
               <View className="w-3 h-3 rounded-full bg-[#02de95]" />
               <View className="w-[2px] h-14 bg-white/10 my-1" />
               <View className="w-3 h-3 rounded-full bg-[#EF4444]" />
            </View>
            <View className="flex-1">
               <View className="mb-6">
                 <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Ponto de Coleta</Text>
                 <Text className="text-white font-bold text-[15px]" numberOfLines={2}>{pickupAddress}</Text>
               </View>
               <View>
                 <Text className="text-white/40 text-[10px] font-black uppercase mb-1">Ponto de Entrega</Text>
                 <Text className="text-white font-bold text-[15px]" numberOfLines={2}>{destinationAddress}</Text>
               </View>
            </View>
         </View>
      </View>

      {/* 📦 CARGO SPECIFICATIONS GRID */}
      <View className="flex-row flex-wrap gap-3">
         
         {/* Cargo Type */}
         <View className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex-1 min-w-[140px]">
            <View className="flex-row items-center mb-2">
               <Package size={16} color="#A78BFA" className="mr-2" />
               <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Tipo</Text>
            </View>
            <Text className="text-white font-extrabold text-base">{cargoType || "Geral"}</Text>
         </View>

         {/* Helper Requirement */}
         <View className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 flex-1 min-w-[140px]">
            <View className="flex-row items-center mb-2">
               <Users size={16} color={helperRequired ? "#02de95" : "rgba(255,255,255,0.3)"} className="mr-2" />
               <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Ajudante</Text>
            </View>
            <Text className={`font-extrabold text-base ${helperRequired ? 'text-[#02de95]' : 'text-white/60'}`}>
               {helperRequired ? "Sim, Necessário" : "Não Precisa"}
            </Text>
         </View>
      </View>

      {/* 📝 OBSERVATIONS (Optional) */}
      {!!observations && (
        <View className="mt-4 bg-[#02de95]/5 border border-[#02de95]/10 rounded-2xl p-4 flex-row items-start">
           <FileText size={16} color="#02de95" className="mr-3 mt-0.5" />
           <View className="flex-1">
              <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-widest mb-1">Observações da Carga</Text>
              <Text className="text-white/80 text-sm leading-relaxed italic">"{observations}"</Text>
           </View>
        </View>
      )}

    </View>
  );
}
