import React from "react";
import { View, Text, TextInput } from "react-native";
import { FileText } from "lucide-react-native";

interface CargoDescriptionInputProps {
  value: string;
  onChange: (txt: string) => void;
}

export const CargoDescriptionInput = ({ value, onChange }: CargoDescriptionInputProps) => {
  return (
    <View className="px-6 mb-6">
      <View className="flex-row items-center gap-1.5 mb-2.5">
        <FileText size={12} color="#94a3b8" />
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Descrição</Text>
      </View>
      
      <View className="w-full bg-[#1E2D3D] border border-white/[0.03] rounded-2xl p-4 shadow-sm">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Descreva o que será entregue, fragilidade ou observações..."
          placeholderTextColor="rgba(255,255,255,0.25)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="text-white text-sm h-20 p-0 font-medium"
        />
      </View>
    </View>
  );
};
