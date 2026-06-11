import React from "react";
import { TouchableOpacity, Text, View, ActivityIndicator } from "react-native";
import { Power } from "lucide-react-native";
import { MotiView, MotiText } from "moti";

interface OnlineOfflineToggleProps {
  online: boolean;
  loading: boolean;
  onToggle: () => void;
}

export function OnlineOfflineToggle({ online, loading, onToggle }: OnlineOfflineToggleProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={onToggle}
      disabled={loading}
      className={`w-full h-16 rounded-3xl border flex-row items-center justify-center shadow-2xl ${
        online 
          ? "bg-red-500/5 border-red-500/30" 
          : "bg-[#02de95] border-[#02de95]/20"
      }`}
    >
      {loading ? (
        <ActivityIndicator color={online ? "#EF4444" : "#091A2F"} />
      ) : (
        <View className="flex-row items-center">
          <MotiView
            animate={{ scale: [0.9, 1.1, 1] }}
            transition={{ type: "timing", duration: 1000, loop: true }}
            className={`p-1.5 rounded-full mr-3 ${online ? 'bg-red-500/20' : 'bg-[#091A2F]/10'}`}
          >
            <Power size={18} color={online ? "#EF4444" : "#091A2F"} strokeWidth={3} />
          </MotiView>
          
          <MotiText
            className={`text-lg font-black tracking-wider uppercase ${online ? 'text-red-500' : 'text-[#091A2F]'}`}
          >
            {online ? "Ficar Offline" : "Ficar Online"}
          </MotiText>
        </View>
      )}
    </TouchableOpacity>
  );
}
