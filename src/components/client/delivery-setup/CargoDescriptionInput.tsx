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
        <Text className="text-slate-400 text-[11px] font-bold uppercase tracking-widest">Detalhes dos Itens</Text>
      </View>
      
      <View className="w-full bg-white/5 border border-white/10 rounded-2xl p-3 focus:border-primary/50">
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholder="Descreva o que será entregue, fragilidade ou observações especiais..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          className="text-white text-sm h-20 p-0"
        />
      </View>
    </View>
  );
};
