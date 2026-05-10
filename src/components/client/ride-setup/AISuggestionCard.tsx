import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Zap } from "lucide-react-native";
import { MotiView } from "moti";

interface AISuggestionCardProps {
  min: number;
  max: number;
  onApplySuggested: () => void;
}

export const AISuggestionCard = ({ min, max, onApplySuggested }: AISuggestionCardProps) => {
  return (
    <View className="px-6 mb-6 items-center">
      <TouchableOpacity 
        onPress={onApplySuggested}
        activeOpacity={0.8}
      >
        <MotiView 
          from={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", delay: 200 }}
          className="flex-row items-center bg-slate-800/60 border border-indigo-500/20 py-2.5 px-5 rounded-full"
        >
          <View className="w-5 h-5 rounded-full bg-indigo-500/20 items-center justify-center mr-2">
            <Zap size={12} color="#818cf8" fill="#818cf8" />
          </View>
          <Text className="text-slate-300 text-xs font-medium mr-1">
            Preço sugerido: 
          </Text>
          <Text className="text-white text-xs font-bold">
            R$ {min.toFixed(0)} - R$ {max.toFixed(0)}
          </Text>
        </MotiView>
      </TouchableOpacity>
    </View>
  );
};
