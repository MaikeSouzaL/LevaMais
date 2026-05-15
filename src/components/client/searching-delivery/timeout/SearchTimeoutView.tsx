import React from "react";
import { View, Text, TouchableOpacity, StatusBar, StyleSheet } from "react-native";
import { X } from "lucide-react-native";
import { MotiView } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const insets = useSafeAreaInsets();

  return (
    <View style={StyleSheet.absoluteFillObject} className="bg-[#091A2F] flex-1 items-center justify-center px-6 py-8">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dynamic Futuristic Deep-Map Background Layer 🗺️ */}
      <PremiumMapBackground pickupCoords={pickupCoords} />

      {/* Floating Exit Gate */}
      <MotiView 
        from={{ opacity: 0, translateY: -20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={{
          position: "absolute",
          top: Math.max(insets.top, 16) + 8,
          right: 24,
          zIndex: 50,
        }}
      >
        <TouchableOpacity
          onPress={onCancel}
          activeOpacity={0.7}
          style={{
            width: 42,
            height: 42,
            borderRadius: 21,
            backgroundColor: "rgba(255, 255, 255, 0.12)",
            borderWidth: 1.5,
            borderColor: "rgba(255, 255, 255, 0.2)",
            alignItems: "center",
            justifyContent: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <X size={20} color="#FFFFFF" />
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
          style={{
            height: 48,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: "rgba(255, 82, 82, 0.1)",
            borderWidth: 1,
            borderColor: "rgba(255, 82, 82, 0.25)",
            borderRadius: 14,
          }}
        >
          <Text style={{
            color: "#FF5252",
            fontWeight: "900",
            fontSize: 11,
            textTransform: "uppercase",
            letterSpacing: 1.5,
          }}>
            Cancelar Solicitação
          </Text>
        </TouchableOpacity>

      </TimeoutStatusCard>

    </View>
  );
}
