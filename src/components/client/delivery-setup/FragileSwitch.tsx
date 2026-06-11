import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MotiView } from "moti";

interface FragileSwitchProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

export const FragileSwitch = ({ enabled, onToggle }: FragileSwitchProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => onToggle(!enabled)}
      className="mx-6 mb-4 bg-[#11253E] border border-white/[0.05] rounded-2xl p-4 flex-row items-center justify-between shadow-md"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${enabled ? 'bg-amber-500/15' : 'bg-[#1E2D3D]'}`}>
          <Text className="text-sm">{enabled ? "📦" : "📦"}</Text>
        </View>
        <View>
          <Text className="text-white text-sm font-bold">Carga frágil</Text>
          <Text className="text-slate-400 text-[10px] font-medium">Embalagem especial e cuidado redobrado</Text>
        </View>
      </View>

      <View className={`w-12 h-7 rounded-full ${enabled ? "bg-[#f59e0b]" : "bg-white/20"}`}>
        <MotiView
          animate={{ translateX: enabled ? 20 : 2 }}
          transition={{ type: "spring", damping: 18, stiffness: 220 }}
          className="w-5 h-5 rounded-full bg-white shadow-sm mt-1"
        />
      </View>
    </TouchableOpacity>
  );
};
