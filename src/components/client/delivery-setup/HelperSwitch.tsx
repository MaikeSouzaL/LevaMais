import React from "react";
import { View, Text, Switch, TouchableOpacity } from "react-native";
import { Users } from "lucide-react-native";

interface HelperSwitchProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

export const HelperSwitch = ({ enabled, onToggle }: HelperSwitchProps) => {
  return (
    <TouchableOpacity 
      activeOpacity={0.85}
      onPress={() => onToggle(!enabled)}
      className="mx-6 mb-6 bg-[#11253E] border border-white/[0.05] rounded-2xl p-4 flex-row items-center justify-between shadow-md elevation-3"
    >
      <View className="flex-row items-center flex-1 mr-4">
        <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${enabled ? 'bg-primary/15' : 'bg-[#1E2D3D]'}`}>
          <Users size={16} color={enabled ? "#02de95" : "#94a3b8"} />
        </View>
        <View>
          <Text className="text-white text-sm font-bold">Precisa de ajudante?</Text>
          <Text className="text-slate-400 text-[10px] font-medium">Auxílio para carregar e descarregar</Text>
        </View>
      </View>

      <Switch
        trackColor={{ false: "#334155", true: "rgba(2, 222, 149, 0.4)" }}
        thumbColor={enabled ? "#02de95" : "#64748b"}
        ios_backgroundColor="#334155"
        onValueChange={onToggle}
        value={enabled}
      />
    </TouchableOpacity>
  );
};
