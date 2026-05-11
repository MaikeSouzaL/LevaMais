import React, { useMemo, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Image, ScrollView } from "react-native";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { MotiView } from "moti";
import { 
  MapPin, Check, X, DollarSign, Route, Timer, CreditCard, 
  QrCode, Banknote, User, Star, ShieldCheck, TrendingUp, Zap, Package 
} from "lucide-react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
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
  const snapPoints = useMemo(() => ["60%", "90%"], []);

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

  const getSmartInsight = () => {
    const distValue = request.distance?.value || 0;
    const price = displayValue || 1;
    const pricePerKm = price / (distValue / 1000 || 1);
    
    if (pricePerKm > 2.5) return { text: "Lucro/km acima da média", icon: <TrendingUp size={12} color="#02de95" /> };
    if (request.details?.priority === 2) return { text: "Prioridade máxima / Taxa extra", icon: <Zap size={12} color="#F59E0B" /> };
    return { text: "Rota de alta demanda", icon: <TrendingUp size={12} color="#02de95" /> };
  };

  const insight = getSmartInsight();

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{ backgroundColor: "#091A2F", borderRadius: 40 }}
      handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.15)", width: 36 }}
      animateOnMount={true}
    >
      <BottomSheetScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        
        {/* 🎬 1. TOP OPERATIONAL HEADER */}
        <View className="flex-row items-center justify-between mb-6">
          {isNegotiation ? (
            <MotiView 
              from={{ opacity: 0.6 }}
              animate={{ opacity: 1 }}
              transition={{ loop: true, type: "timing", duration: 1500, repeatReverse: true }}
              className="bg-[#02de95]/10 border border-[#02de95]/20 px-3 py-1.5 rounded-full flex-row items-center"
            >
               <DollarSign size={11} color="#02de95" className="mr-1.5" />
               <Text className="text-[#02de95] text-[9px] font-black uppercase tracking-wider">Oferta Negociável</Text>
            </MotiView>
          ) : (
            <View className="bg-blue-500/10 border border-blue-500/20 px-3 py-1.5 rounded-full flex-row items-center">
               <Route size={11} color="#3b82f6" className="mr-1.5" />
               <Text className="text-blue-400 text-[9px] font-black uppercase tracking-wider">Nova Solicitação</Text>
            </View>
          )}
          
          <View className="bg-white/[0.05] border border-white/[0.1] rounded-full px-3 py-1.5 flex-row items-center">
            {insight.icon}
            <Text className="text-white/70 text-[9px] font-bold uppercase ml-1.5 tracking-wider">{insight.text}</Text>
          </View>
        </View>

        {/* 🏦 2. FINANCIAL HERO SECTION */}
        <View className="items-center mb-8 relative">
          {/* REMOVED BREAKING MOTIVIEW BG BLUR */}
          <Text className="text-white/40 text-[10px] font-black tracking-[3px] uppercase mb-2 text-center">Valor Proposto</Text>
          <Text className="text-white font-black text-5xl tracking-tighter text-center">
            {formatBRL(displayValue)}
          </Text>
        </View>

        {/* 🤵 3. CLIENT PROFILE */}
        {!!request.client?.name && (
          <View 
            className="bg-white/[0.03] rounded-[24px] px-4 py-3.5 flex-row items-center mb-6"
          >
             <View className="relative">
               {request.client.profilePhoto ? (
                  <Image 
                    source={{ uri: request.client.profilePhoto }} 
                    className="w-12 h-12 rounded-xl bg-[#0A121C] border border-white/[0.1]" 
                  />
               ) : (
                  <View className="w-12 h-12 rounded-xl bg-white/5 items-center justify-center border border-white/10">
                     <User size={22} color="rgba(255,255,255,0.3)" />
                  </View>
               )}
               <View className="absolute -bottom-1 -right-1 bg-[#070D15] rounded-full">
                 <ShieldCheck size={16} color="#02de95" fill="#091A2F" />
               </View>
             </View>

             <View className="ml-3 flex-1">
                <Text className="text-white font-bold text-base" numberOfLines={1}>{request.client.name}</Text>
                <Text className="text-white/40 text-[10px] font-medium uppercase tracking-wider mt-0.5">Verificado</Text>
             </View>

             <View className="bg-amber-500/20 border border-amber-500/30 rounded-xl px-3 py-1.5 flex-row items-center ml-2">
                <Star size={14} color="#f59e0b" fill="#f59e0b" className="mr-1.5" />
                <Text className="text-amber-400 font-black text-[15px] tracking-tight">
                  {Number(request.client.rating || 5.0).toFixed(1)}
                </Text>
             </View>
          </View>
        )}

        {/* 🏷️ 4. QUAD-DASHBOARD METRICS (Uniform Squares spanning full width) */}
        {request?.serviceType === "delivery" && (
          <View style={{ flexDirection: 'row', width: '100%', marginBottom: 24 }}>
            
            {/* Metrica 1: Veiculo */}
            <View style={{ flex: 1, marginRight: 6, height: 64, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
               <MaterialCommunityIcons 
                 name={request.vehicleType === "motorcycle" ? "motorbike" : request.vehicleType === "car" ? "car" : "truck-delivery"} 
                 size={20} 
                 color="white" 
                 style={{ marginBottom: 4 }} 
               />
               <Text numberOfLines={1} style={{ color: 'white', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
                 {request.vehicleType === "motorcycle" ? "MOTO" : request.vehicleType === "car" ? "CARRO" : "VAN"}
               </Text>
            </View>
            
            {/* Metrica 2: Tipo Carga */}
            {request.details?.itemType && (
              <View style={{ flex: 1, marginRight: 6, height: 64, backgroundColor: 'rgba(2,222,149,0.1)', borderColor: 'rgba(2,222,149,0.3)', borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
                 <Package size={18} color="#02de95" style={{ marginBottom: 4 }} />
                 <Text numberOfLines={1} style={{ color: '#02de95', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 }}>
                    {
                      {
                        food: "ENTREGA", doc: "DOCS", market: "MERCADO", box: "CAIXA",
                        material: "MAT.", furniture: "MÓVEIS", moving: "MUDANÇA", other: "OUTROS"
                      }[request.details.itemType as string] || "CARGA"
                    }
                 </Text>
              </View>
            )}

            {/* Metrica 3: Prioridade */}
            <View style={{ 
              flex: 1, marginRight: 6, height: 64, 
              backgroundColor: request.details?.priority === 2 ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)', 
              borderColor: request.details?.priority === 2 ? 'rgba(239,68,68,0.3)' : 'rgba(6,182,212,0.3)', 
              borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' 
            }}>
               <MaterialCommunityIcons 
                 name={request.details?.priority === 2 ? "lightning-bolt" : "leaf"} 
                 size={18} 
                 color={request.details?.priority === 2 ? '#EF4444' : '#06B6D4'} 
                 style={{ marginBottom: 4 }} 
               />
               <Text numberOfLines={1} style={{ 
                 color: request.details?.priority === 2 ? '#EF4444' : '#06B6D4', 
                 fontSize: 9, fontWeight: '900', letterSpacing: 0.5 
               }}>
                 {request.details?.priority === 2 ? "URGENTE" : "ECONÔM."}
               </Text>
            </View>

            {/* Metrica 4: Pagamento */}
            <View style={{ flex: 1, height: 64, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', borderWidth: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}>
               {(() => {
                 const type = request.payment?.method?.type || request.payment?.method || "cash";
                 if (type === "pix") return (
                   <>
                     <QrCode size={18} color="#32BCAD" style={{ marginBottom: 4 }} />
                     <Text style={{ color: "#32BCAD", fontSize: 9, fontWeight: "900" }}>PIX</Text>
                   </>
                 );
                 if (["card", "credit_card", "debit_card"].includes(type)) return (
                   <>
                     <CreditCard size={18} color="#3b82f6" style={{ marginBottom: 4 }} />
                     <Text style={{ color: "#3b82f6", fontSize: 9, fontWeight: "900" }}>CARTÃO</Text>
                   </>
                 );
                 return (
                   <>
                     <Banknote size={18} color="#02de95" style={{ marginBottom: 4 }} />
                     <Text style={{ color: "#02de95", fontSize: 9, fontWeight: "900" }}>MONEY</Text>
                   </>
                 );
               })()}
            </View>
          </View>
        )}

        {/* 📦 5. CARGO DETAILS (Premium Tactical Alert Aesthetic) */}
        {request.details?.specialInstructions && (
           <View style={{ 
             backgroundColor: 'rgba(245,158,11,0.05)', 
             borderWidth: 1,
             borderColor: 'rgba(245,158,11,0.25)',
             paddingHorizontal: 16, 
             paddingVertical: 14, 
             borderRadius: 16, 
             marginBottom: 24, 
             flexDirection: 'row', 
             alignItems: 'center' 
           }}>
             <View style={{ backgroundColor: 'rgba(245,158,11,0.2)', padding: 8, borderRadius: 10, marginRight: 12 }}>
               <MaterialCommunityIcons name="package-variant" size={20} color="#F59E0B" />
             </View>
             <View style={{ flex: 1 }}>
               <Text style={{ color: 'rgba(245,158,11,0.8)', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 2 }}>
                 DETALHES DA CARGA
               </Text>
                {(() => {
                   const raw = request.details.specialInstructions || "";
                   const match = raw.match(/\[Tamanho:\s*(.*?)\]/i);
                   const sizeKey = match ? match[1].toLowerCase() : "";
                   const description = raw.replace(/\[Tamanho:.*?\]/i, "").trim();
                   
                   let sizeLabel = "";
                   if (sizeKey === "small") sizeLabel = "PEQUENO";
                   else if (sizeKey === "medium") sizeLabel = "MÉDIO";
                   else if (sizeKey === "large") sizeLabel = "GRANDE";
                   else if (sizeKey) sizeLabel = sizeKey.toUpperCase();

                   return (
                     <View>
                       {!!sizeLabel && (
                         <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5, marginBottom: description ? 4 : 0 }}>
                           TAMANHO: {sizeLabel}
                         </Text>
                       )}
                       {!!description && (
                         <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: '600', lineHeight: 16 }}>
                           {description.toUpperCase()}
                         </Text>
                       )}
                     </View>
                   );
                })()}
             </View>
           </View>
        )}

        {/* 📍 6. ROUTE BOX (High-Fidelity Dynamic Path) */}
        <View className="bg-white/[0.02] rounded-[24px] border border-white/20 p-5 mb-6">
           <View className="flex-row items-start mb-6">
              <View className="items-center mr-4 pt-1">
                 <View className="w-6 h-6 rounded-full border-2 border-[#02de95] items-center justify-center bg-[#02de95]/10 shadow-sm z-10">
                   <View className="w-2 h-2 rounded-full bg-[#02de95]" />
                 </View>
                 {/* Physical Intelligent Trace - Absolute connection bridging the gap */}
                 <View style={{ 
                    position: 'absolute', 
                    top: 28, 
                    bottom: -24, 
                    width: 24, 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    zIndex: 0
                 }}>
                   <View style={{ flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                   <MaterialCommunityIcons name="chevron-double-down" size={14} color="rgba(255,255,255,0.4)" style={{ marginVertical: 2 }} />
                   <View style={{ flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }} />
                 </View>
              </View>
              <View className="flex-1 pt-0.5">
                 <Text className="text-[#02de95] text-[10px] font-black uppercase tracking-[2px] mb-1">COLETA OFICIAL</Text>
                 <Text className="text-white font-black text-[16px] leading-tight" numberOfLines={2}>
                   {request?.pickup?.address?.split("-")[0]?.trim() || "Ponto de Coleta"}
                 </Text>
              </View>
           </View>

           <View className="flex-row items-start">
              <View className="items-center mr-4 pt-1">
                 <View className="w-6 h-6 rounded-full border-2 border-red-500 items-center justify-center bg-red-500/10 shadow-sm z-10">
                   <View className="w-2 h-2 rounded-full bg-red-500" />
                 </View>
              </View>
              <View className="flex-1 pt-0.5">
                 <Text className="text-red-400 text-[10px] font-black uppercase tracking-[2px] mb-1">ENTREGA FINAL</Text>
                 <Text className="text-white font-black text-[16px] leading-tight" numberOfLines={2}>
                   {request?.dropoff?.address?.split("-")[0]?.trim() || "Ponto de Entrega"}
                 </Text>
              </View>
           </View>

           {/* Metrics Subbox */}
           {(request?.distance?.text || request?.duration?.text) && (
              <View className="mt-5 pt-4 border-t border-white/20 flex-row items-center justify-between px-2">
                 {request?.distance?.text && (
                   <View className="flex-row items-center">
                      <Route size={12} color="rgba(255,255,255,0.4)" className="mr-1.5" />
                      <Text className="text-white font-black text-lg">{request.distance.text}</Text>
                   </View>
                 )}
                 {request?.duration?.text && (
                   <View className="flex-row items-center">
                      <Timer size={12} color="rgba(255,255,255,0.4)" className="mr-1.5" />
                      <Text className="text-white font-black text-lg">{request.duration.text}</Text>
                   </View>
                 )}
              </View>
           )}
        </View>

        {/* 🎮 7. EMERGENCY FIXED ACTION BUTTONS ROW */}
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, width: "100%" }}>
          
          {/* 🔴 Ignorar Button */}
          <TouchableOpacity
            onPress={onReject}
            activeOpacity={0.7}
            style={{
              flex: 1,
              height: 56,
              backgroundColor: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
              borderWidth: 1,
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12 // Replaces broken gap-3 property!
            }}
          >
            <X size={18} color="rgba(255,255,255,0.5)" style={{ marginRight: 6 }} />
            <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "800", fontSize: 13, letterSpacing: 1 }}>IGNORAR</Text>
          </TouchableOpacity>

          {/* 🟢 Accept Button (Hardened Flex Rendering) */}
          <TouchableOpacity
            onPress={onAccept}
            activeOpacity={0.85}
            style={{
              flex: 1.5, // Clean defined flex relationship
              height: 56,
              backgroundColor: "#02de95",
              borderRadius: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#02de95",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6 // Essential Android shadow fix
            }}
          >
             <Check size={20} color="#070D15" strokeWidth={3.5} style={{ marginRight: 6 }} />
             <Text style={{ color: "#070D15", fontWeight: "900", fontSize: 15, letterSpacing: 0.5 }}>
               ACEITAR
             </Text>
          </TouchableOpacity>
        </View>

        {/* 💬 8. HIGHLIGHTED NEGOTIATION CORE */}
        {isNegotiation && onNegotiate && (
           <TouchableOpacity
             onPress={onNegotiate}
             activeOpacity={0.8}
             style={{ width: '100%' }}
           >
             <MotiView
               from={{ borderColor: "rgba(2, 222, 149, 0.2)" }}
               animate={{ borderColor: "rgba(2, 222, 149, 0.5)" }}
               transition={{ loop: true, duration: 2000, repeatReverse: true }}
               style={{
                 width: '100%',
                 height: 52,
                 borderWidth: 1,
                 backgroundColor: "rgba(2, 222, 149, 0.05)",
                 borderRadius: 16,
                 flexDirection: "row",
                 alignItems: "center",
                 justifyContent: "center"
               }}
             >
               <DollarSign size={16} color="#02de95" style={{ marginRight: 8 }} />
               <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 13, letterSpacing: 1.5 }}>
                  PROPOR NOVO VALOR
               </Text>
             </MotiView>
           </TouchableOpacity>
        )}

      </BottomSheetScrollView>
    </BottomSheet>
  );
}
