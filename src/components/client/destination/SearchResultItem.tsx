import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MapPin, History, ArrowRight } from "lucide-react-native";

interface SearchResultItemProps {
  mainText: string;
  secondaryText: string;
  distance?: string;
  isHistory?: boolean;
  onPress: () => void;
}

export const SearchResultItem = ({
  mainText,
  secondaryText,
  distance,
  isHistory = true,
  onPress,
}: SearchResultItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center p-4 active:bg-white/5"
    >
      <View className="w-9 h-9 rounded-xl bg-white/5 items-center justify-center mr-3 border border-white/10">
        {isHistory ? (
          <History size={16} color="#94a3b8" />
        ) : (
          <MapPin size={16} color="#94a3b8" />
        )}
      </View>

      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-sm font-bold flex-1" numberOfLines={1}>{mainText}</Text>
          {distance && (
            <Text className="text-primary text-xs font-bold ml-1">{distance}</Text>
          )}
        </View>
        <Text className="text-slate-400 text-xs mt-0.5" numberOfLines={1}>{secondaryText}</Text>
      </View>

      <ArrowRight size={16} color="rgba(255, 255, 255, 0.15)" />
    </TouchableOpacity>
  );
};
