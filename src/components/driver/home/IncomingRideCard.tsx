import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MapPin, Check, X, DollarSign, Route, Timer, CreditCard, QrCode, Banknote } from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";

interface IncomingRideCardProps {
  isVisible: boolean;
  request: any;
  countdown: number | null;
  onAccept: () => void;
  onReject: () => void;
  onNegotiate?: () => void;
}

export function IncomingRideCard({
  isVisible,
  request,
  onAccept,
  onReject,
  onNegotiate,
}: IncomingRideCardProps) {
  
  const sheetRef = useRef<BottomSheet>(null);

  // Dynamic height tiers: Minimized (let's see map) / Full Expanded
  const snapPoints = useMemo(() => ["55%", "88%"], []);

  // When mount request toggles, automatically enforce the initial sheet state
  useEffect(() => {
    if (isVisible) {
      sheetRef.current?.snapToIndex(0);
    }
  }, [isVisible]);

  if (!isVisible || !request) return null;

  const isNegotiation = !!request?.negotiation?.enabled;
  
  const displayValue = isNegotiation && request.negotiation.clientOffer != null
    ? Number(request.negotiation.clientOffer)
    : request?.pricing?.total != null
    ? Number(request.pricing.total)
    : 0;

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false} // Requires interaction or timeout to vanish
      backgroundStyle={{ backgroundColor: "#0B1523", borderRadius: 36 }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.25)", width: 40 }}
      animateOnMount={true}
    >
      <BottomSheetScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 4, paddingBottom: 40 }}
      >
        {/* ⚡ Top Status: Negotiation Badge */}
        <View className="flex-row items-center justify-between mb-6 mt-2">
          {isNegotiation ? (
            <View className="bg-[#02de95]/10 border border-[#02de95]/20 px-3 py-1.5 rounded-xl flex-row items-center">
               <DollarSign size={12} color="#02de95" className="mr-1" />
               <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-wider">OFERTA DE CLIENTE</Text>
            </View>
          ) : (
            <View className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-xl flex-row items-center">
               <Route size={12} color="#3b82f6" className="mr-1" />
               <Text className="text-blue-400 text-[10px] font-black uppercase tracking-wider">NOVA ENTREGA</Text>
            </View>
          )}
          {/* Timer strictly removed per user strategic mandate 🚫⏰ */}
        </View>

        {/* 💵 VALUE DISPLAY SECTION */}
        <View className="mb-6 items-center">
          <Text className="text-white/40 text-xs font-medium tracking-widest uppercase mb-1">Ganhos Estimados</Text>
          <Text className="text-white font-black text-4xl">
            {formatBRL(displayValue)}
          </Text>
        </View>

        {/* 📦 SHIPMENT METADATA */}
        {request?.serviceType === "delivery" && (
          <View className="mb-6 flex-row flex-wrap gap-2 px-1 justify-center">
            {/* Tipo do Veículo */}
            <View className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl flex-row items-center">
               <Text className="text-xs">
                 {request.vehicleType === "motorcycle" ? "🛵" : request.vehicleType === "car" ? "🚗" : "🚚"}
               </Text>
               <Text className="text-slate-300 text-[11px] font-black ml-1.5 uppercase">
                 {request.vehicleType === "motorcycle" ? "Moto" : request.vehicleType === "car" ? "Carro" : "Van/Truck"}
               </Text>
            </View>
            
            {/* Categoria da Encomenda */}
            {request.details?.itemType && (
              <View className="bg-[#02de95]/5 border border-[#02de95]/20 px-2.5 py-1.5 rounded-xl">
                 <Text className="text-[#02de95] text-[11px] font-black uppercase">
                    {
                      {
                        food: "Delivery",
                        doc: "Documentos",
                        market: "Mercado",
                        box: "Caixa",
                        material: "Material",
                        furniture: "Móveis",
                        moving: "Mudança",
                        other: "Outros"
                      }[request.details.itemType as string] || request.details.itemType
                    }
                 </Text>
              </View>
            )}

            {/* Badge de Prioridade */}
            <View 
               className={`border px-2.5 py-1.5 rounded-xl ${
                 request.details?.priority === 2 ? "bg-red-500/10 border-red-500/30" :
                 request.details?.priority === 1 ? "bg-[#02de95]/10 border-[#02de95]/30" :
                 "bg-blue-500/10 border-blue-500/30"
               }`}
            >
               <Text className={`text-[11px] font-black uppercase ${
                 request.details?.priority === 2 ? "text-red-400" :
                 request.details?.priority === 1 ? "text-[#02de95]" :
                 "text-blue-400"
               }`}>
                 {
                   request.details?.priority === 2 ? "🚀 Urgente" :
                   request.details?.priority === 1 ? "⚡ Rápido" :
                   "🐢 Econômico"
                 }
               </Text>
            </View>
            {/* Badge de Forma de Pagamento 💰 */}
            <View className="bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-xl flex-row items-center">
               {(() => {
                 const type = request.payment?.method?.type || request.payment?.method || "cash";
                 
                 if (type === "pix") return (
                   <>
                     <QrCode size={11} color="#32BCAD" className="mr-1.5" />
                     <Text className="text-[#32BCAD] text-[11px] font-black uppercase">PIX</Text>
                   </>
                 );
                 if (["card", "credit_card", "debit_card"].includes(type)) return (
                   <>
                     <CreditCard size={11} color="#3b82f6" className="mr-1.5" />
                     <Text className="text-blue-400 text-[11px] font-black uppercase">Cartão</Text>
                   </>
                 );
                 return (
                   <>
                     <Banknote size={11} color="#02de95" className="mr-1.5" />
                     <Text className="text-[#02de95] text-[11px] font-black uppercase">Dinheiro</Text>
                   </>
                 );
               })()}
            </View>
          </View>
        )}

        {/* 📝 Cargo Spec and Instructions */}
        {request.details?.specialInstructions && (
           <View className="bg-white/[0.03] border border-amber-500/20 px-4 py-3 rounded-2xl mb-5 flex-row items-start">
             <Text className="text-base mr-2">💡</Text>
             <View className="flex-1">
               <Text className="text-amber-200/70 text-[10px] font-black uppercase tracking-wider mb-0.5">Instruções / Volume</Text>
               <Text className="text-amber-100 text-xs font-medium">
                 {request.details.specialInstructions}
               </Text>
             </View>
           </View>
        )}

        {/* 📍 LOGISTIC ROUTE SECTION */}
        <View className="bg-white/[0.03] rounded-3xl p-4 mb-6 border border-white/5">
           <View className="flex-row items-center mb-3">
              <View className="w-8 h-8 rounded-full bg-[#02de95]/10 items-center justify-center mr-3">
                 <MapPin size={14} color="#02de95" />
              </View>
              <View className="flex-1">
                 <Text className="text-white/40 text-[10px] font-bold uppercase mb-0.5">Coleta</Text>
                 <Text className="text-white font-bold text-sm" numberOfLines={2}>
                   {request?.pickup?.address || "Endereço não informado"}
                 </Text>
              </View>
           </View>

           <View className="w-[1px] h-3 bg-white/10 ml-[16px] mb-3" />

           <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-red-500/10 items-center justify-center mr-3">
                 <MapPin size={14} color="#EF4444" />
              </View>
              <View className="flex-1">
                 <Text className="text-white/40 text-[10px] font-bold uppercase mb-0.5">Entrega</Text>
                 <Text className="text-white font-bold text-sm" numberOfLines={2}>
                    {request?.dropoff?.address || "Endereço não informado"}
                 </Text>
              </View>
           </View>

           {(request?.distance?.text || request?.duration?.text) && (
              <View className="mt-4 pt-3 border-t border-white/5 flex-row items-center gap-3">
                 {request?.distance?.text && (
                   <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg">
                     <Route size={12} color="rgba(255,255,255,0.6)" className="mr-1.5" />
                     <Text className="text-white/70 text-xs font-bold">{request.distance.text}</Text>
                   </View>
                 )}
                 {request?.duration?.text && (
                   <View className="flex-row items-center bg-white/5 px-2 py-1 rounded-lg">
                     <Timer size={12} color="rgba(255,255,255,0.6)" className="mr-1.5" />
                     <Text className="text-white/70 text-xs font-bold">{request.duration.text}</Text>
                   </View>
                 )}
              </View>
           )}
        </View>

        {/* 🎮 ACTION BUTTONS AREA */}
        <View className="flex-row gap-4 items-center">
          <TouchableOpacity
            onPress={onReject}
            activeOpacity={0.8}
            className="flex-1 h-14 bg-white/5 border border-white/10 rounded-2xl items-center justify-center flex-row"
          >
            <X size={18} color="rgba(255,255,255,0.6)" className="mr-2" />
            <Text className="text-white/60 font-bold text-base">Recusar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.85}
            className="flex-[1.5] h-14 bg-[#02de95] rounded-2xl items-center justify-center flex-row shadow-xl shadow-[#02de95]/20"
          >
            <Check size={20} color="#091A2F" className="mr-2" strokeWidth={3} />
            <Text className="text-[#091A2F] font-black text-base uppercase tracking-wider">
              {isNegotiation ? "ACEITAR OFERTA" : "ACEITAR"}
            </Text>
          </TouchableOpacity>
        </View>

        {isNegotiation && onNegotiate && (
           <TouchableOpacity
             onPress={onNegotiate}
             activeOpacity={0.7}
             className="w-full h-12 mt-4 border border-[#02de95]/30 bg-[#02de95]/5 rounded-2xl items-center justify-center"
           >
             <Text className="text-[#02de95] font-bold text-sm uppercase tracking-wide">
                Contraproposta / Negociar
             </Text>
           </TouchableOpacity>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
