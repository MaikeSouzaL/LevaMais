import React from "react";
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { Zap, Info } from "lucide-react-native";

interface PriorityQueueButtonProps {
  onPress: () => void;
  loading: boolean;
}

export function PriorityQueueButton({ onPress, loading }: PriorityQueueButtonProps) {
  return (
    <View className="w-full mb-7">
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={onPress}
        disabled={loading}
        className="w-full h-14 bg-white/[0.03] border border-[#00E5FF]/30 rounded-2xl flex-row items-center justify-center mb-3 shadow-2xl"
        style={{
          borderColor: "rgba(0, 229, 255, 0.25)",
          shadowColor: "#00E5FF",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#00E5FF" />
        ) : (
          <>
            <Zap size={18} color="#00E5FF" className="mr-2" fill="#00E5FF" />
            <Text className="text-[#00E5FF] font-bold text-base">
              Entrar na Fila Prioritária
            </Text>
          </>
        )}
      </TouchableOpacity>

      {/* Explanatory context card below */}
      <View className="flex-row items-start px-2 opacity-70">
        <Info size={12} color="rgba(255,255,255,0.5)" className="mr-1.5 mt-0.5" />
        <Text className="text-white/50 text-xs flex-1 leading-relaxed">
          Sua solicitação ficará visível em destaque para um radar ampliado de motoristas da região.
        </Text>
      </View>
    </View>
  );
}
