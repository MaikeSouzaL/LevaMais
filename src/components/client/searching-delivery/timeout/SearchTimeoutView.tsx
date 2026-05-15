import React from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { MotiView } from "moti";

// Nested high-end components
import { PremiumMapBackground } from "./PremiumMapBackground";
import { TimeoutStatusCard } from "./TimeoutStatusCard";
import { RadarAnimation } from "./RadarAnimation";
import { SmartSuggestionCard } from "./SmartSuggestionCard";
import { RetryButton } from "./RetryButton";
import { PriorityQueueButton } from "./PriorityQueueButton";

interface SearchTimeoutViewProps {
  allDriversRejected: boolean;
  enteringQueue: boolean;
  onRetry: () => void;
  onEnterQueue: () => void;
  onCancel: () => void;
  pickupCoords: { latitude: number; longitude: number } | null;
}

export function SearchTimeoutView({
  allDriversRejected,
  enteringQueue,
  onRetry,
  onEnterQueue,
  onCancel,
  pickupCoords,
}: SearchTimeoutViewProps) {
  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-[#091A2F] flex-1 items-center justify-center px-6 py-8">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dynamic Futuristic Deep-Map Background Layer 🗺️ */}
      <PremiumMapBackground pickupCoords={pickupCoords} />

      {/* Floating Exit Gate */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        className="absolute top-14 right-6 z-30"
      >
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 items-center justify-center"
        >
          <X size={18} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>
      </MotiView>

      {/* =========================================================
          THE PREMIUM GLASSMORPHISM INTERFACE CORE CARD 🏆💎
         ========================================================= */}
      <TimeoutStatusCard allDriversRejected={allDriversRejected}>
        
        {/* 🛰️ The Golden/Red Pulse Radar Sweeper */}
        <RadarAnimation allDriversRejected={allDriversRejected} />

        {/* Powerful, Empathetic Typography Suite */}
        <Text className="text-white font-black text-2xl text-center tracking-tight mb-2">
          {allDriversRejected ? "Busca Encerrada" : "Nenhum Motorista Encontrado"}
        </Text>

        <Text className="text-white/60 text-center text-[15px] leading-relaxed mb-6 px-2 font-medium">
          {allDriversRejected
            ? "Todos os motoristas no perímetro recusaram a oferta base neste momento."
            : "Ainda não localizamos motoristas ativos disponíveis nas proximidades."}
        </Text>

        {/* 🤖 AI Intelligence Data Matrix */}
        <SmartSuggestionCard />

        {/* 🟢 Call to Action Gateway */}
        <RetryButton onPress={onRetry} />

        {/* ⚡ Expansion Pathway Secondary Integration */}
        <PriorityQueueButton onPress={onEnterQueue} loading={enteringQueue} />

        {/* Soft termination link */}
        <TouchableOpacity 
          onPress={onCancel}
          activeOpacity={0.6}
          className="h-10 items-center justify-center px-6 border border-red-500/10 bg-red-500/5 rounded-xl"
        >
          <Text className="text-red-400/80 font-bold text-xs uppercase tracking-widest">
            Cancelar Solicitação
          </Text>
        </TouchableOpacity>

      </TimeoutStatusCard>

    </View>
  );
}
