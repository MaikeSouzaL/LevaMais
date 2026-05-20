import React from "react";
import { View, Text, TextInput } from "react-native";
import { Weight } from "lucide-react-native";

interface WeightInputProps {
  value: string;
  onChange: (txt: string) => void;
}

export const WeightInput = ({ value, onChange }: WeightInputProps) => {
  const hasValue = value.trim().length > 0;

  return (
    <View className="mx-6 mb-4 bg-[#11253E] border border-white/[0.05] rounded-2xl p-4">
      <View className="flex-row items-center gap-2 mb-3">
        <View className={`w-9 h-9 rounded-full items-center justify-center ${hasValue ? 'bg-primary/15' : 'bg-[#1E2D3D]'}`}>
          <Weight size={16} color={hasValue ? "#02de95" : "#94a3b8"} />
        </View>
        <View>
          <Text className="text-white text-sm font-bold">Peso aproximado (kg)</Text>
          <Text className="text-slate-400 text-[10px] font-medium">Ajuda o entregador a se preparar</Text>
        </View>
      </View>

      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Ex: 5"
        placeholderTextColor="rgba(255,255,255,0.35)"
        keyboardType="numeric"
        className="h-12 rounded-xl border border-white/[0.08] bg-[#0E1D31] px-4 text-white text-sm font-medium"
      />
    </View>
  );
};
