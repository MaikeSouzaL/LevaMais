import React, { useState, useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, TextInput, Dimensions } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { BlurView } from "expo-blur";
import { Plus, Minus, Sparkles, Check, X, MessageSquare, DollarSign } from "lucide-react-native";
import { formatBRL } from "@/utils/mappers";

const { height } = Dimensions.get("window");

interface NegotiationModalProps {
  isVisible: boolean;
  onClose: () => void;
  currentValue: number;
  onSendCounterOffer: (newValue: number, message?: string) => void;
  loading?: boolean;
}

export function NegotiationModal({
  isVisible,
  onClose,
  currentValue,
  onSendCounterOffer,
  loading = false,
}: NegotiationModalProps) {
  
  const [counterValue, setCounterValue] = useState(currentValue);
  const [message, setMessage] = useState("");

  // Re-sync if default changes
  useEffect(() => {
    if (isVisible) {
      setCounterValue(currentValue + 2); // Pre-suggest a reasonable bump
    }
  }, [isVisible, currentValue]);

  const handleAdjust = (diff: number) => {
    setCounterValue(prev => Math.max(currentValue, prev + diff));
  };

  // IA Chance Computation simulation based on simple difference 🤖
  const acceptanceChance = useMemo(() => {
    const diff = counterValue - currentValue;
    if (diff <= 2) return { label: "Chance Muito Alta", color: "#02de95" };
    if (diff <= 5) return { label: "Chance Média", color: "#FBBF24" };
    return { label: "Chance Baixa", color: "#EF4444" };
  }, [counterValue, currentValue]);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-[999] bg-black/60 justify-end"
        >
           {/* Tap to Close Backdrop */}
           <TouchableOpacity 
             activeOpacity={1} 
             className="absolute inset-0" 
             onPress={onClose} 
           />

           {/* 🏦 MAIN MODAL BODY */}
           <MotiView
             from={{ translateY: height }}
             animate={{ translateY: 0 }}
             exit={{ translateY: height }}
             transition={{ type: "spring", damping: 25, stiffness: 200 }}
             className="bg-[#0B1523] rounded-t-[40px] border-t border-white/10 shadow-3xl pb-10 px-6"
           >
             {/* Drag Handle */}
             <View className="w-12 h-1.5 bg-white/10 self-center rounded-full mt-4 mb-6" />

             {/* HEADER & CLOSE */}
             <View className="flex-row justify-between items-center mb-6">
                <View>
                  <Text className="text-white font-black text-2xl tracking-tight">Negociar Valor</Text>
                  <Text className="text-white/40 text-xs">Faça sua oferta em tempo real</Text>
                </View>
                <TouchableOpacity onPress={onClose} className="bg-white/5 w-10 h-10 rounded-full items-center justify-center border border-white/10">
                   <X size={18} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
             </View>

             {/* 💰 CLIENT OFFER STUB */}
             <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 flex-row items-center justify-between">
                 <View>
                    <Text className="text-white/40 text-[10px] font-black uppercase tracking-wider">Oferta Original do Cliente</Text>
                    <Text className="text-white font-bold text-lg">{formatBRL(currentValue)}</Text>
                 </View>
                 <View className="w-10 h-10 bg-[#02de95]/10 rounded-xl items-center justify-center">
                    <DollarSign size={18} color="#02de95" />
                 </View>
             </View>

             {/* 🎮 COUNTER INPUT WIDGET */}
             <View className="items-center mb-6">
                <Text className="text-white/50 text-xs font-bold uppercase tracking-widest mb-3">Sua Contraproposta</Text>
                
                <View className="flex-row items-center gap-6">
                   <TouchableOpacity 
                     onPress={() => handleAdjust(-1)}
                     className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center active:bg-white/10"
                   >
                      <Minus size={24} color="#FFF" strokeWidth={3} />
                   </TouchableOpacity>

                   <View className="items-center min-w-[140px]">
                      <Text className="text-[#02de95] font-black text-5xl tracking-tight">
                         {formatBRL(counterValue).replace(",00", "")}
                      </Text>
                   </View>

                   <TouchableOpacity 
                     onPress={() => handleAdjust(1)}
                     className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 items-center justify-center active:bg-white/10"
                   >
                      <Plus size={24} color="#FFF" strokeWidth={3} />
                   </TouchableOpacity>
                </View>
             </View>

             {/* 🚀 QUICK BOOST PILLS */}
             <View className="flex-row gap-3 mb-6">
                <TouchableOpacity 
                  onPress={() => setCounterValue(currentValue + 2)}
                  className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl flex-1 items-center"
                >
                   <Text className="text-white font-bold">+ R$ 2</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setCounterValue(currentValue + 5)}
                  className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl flex-1 items-center"
                >
                   <Text className="text-white font-bold">+ R$ 5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => setCounterValue(currentValue + 10)}
                  className="bg-white/5 border border-white/10 px-4 py-3 rounded-xl flex-1 items-center"
                >
                   <Text className="text-white font-bold">+ R$ 10</Text>
                </TouchableOpacity>
             </View>

             {/* 🤖 IA ACCEPTANCE PROJECTION */}
             <View className="bg-[#02de95]/5 border border-[#02de95]/10 p-4 rounded-2xl flex-row items-center mb-6">
                <Sparkles size={18} color="#02de95" fill="#02de95" className="mr-3" />
                <View className="flex-1">
                   <Text className="text-white font-bold text-sm">Assistente de Preço</Text>
                   <Text style={{ color: acceptanceChance.color }} className="font-black text-xs uppercase tracking-wider">
                      {acceptanceChance.label} para esta rota.
                   </Text>
                </View>
             </View>

             {/* 📝 OPTIONAL MESSAGE */}
             <View className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-8">
                 <View className="flex-row items-center mb-2">
                    <MessageSquare size={14} color="rgba(255,255,255,0.4)" className="mr-2" />
                    <Text className="text-white/40 text-[10px] font-black uppercase tracking-widest">Adicionar Observação</Text>
                 </View>
                 <TextInput
                   placeholder="Ex: Trânsito intenso / Alta demanda"
                   placeholderTextColor="rgba(255,255,255,0.2)"
                   className="text-white font-medium text-sm p-0"
                   value={message}
                   onChangeText={setMessage}
                   maxLength={60}
                 />
             </View>

             {/* 🚀 SUBMIT ACTION LOCK */}
             <TouchableOpacity
               onPress={() => onSendCounterOffer(counterValue, message)}
               disabled={loading}
               activeOpacity={0.85}
               className={`w-full h-16 bg-[#02de95] rounded-2xl items-center justify-center flex-row shadow-2xl shadow-[#02de95]/30 ${loading ? 'opacity-60' : ''}`}
             >
               <Check size={22} color="#091A2F" className="mr-2" strokeWidth={3} />
               <Text className="text-[#091A2F] font-black text-lg uppercase tracking-wider">
                 {loading ? "ENVIANDO..." : "ENVIAR CONTRAPROPOSTA"}
               </Text>
             </TouchableOpacity>

           </MotiView>

        </MotiView>
      )}
    </AnimatePresence>
  );
}
