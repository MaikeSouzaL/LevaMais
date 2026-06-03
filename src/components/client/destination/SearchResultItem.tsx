import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MapPin, History, ArrowRight, Edit3, Trash2 } from "lucide-react-native";

interface SearchResultItemProps {
  mainText: string;
  secondaryText: string;
  distance?: string;
  isHistory?: boolean;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const SearchResultItem = ({
  mainText,
  secondaryText,
  distance,
  isHistory = true,
  onPress,
  onEdit,
  onDelete,
}: SearchResultItemProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center p-4"
    >
      <View className="w-9 h-9 rounded-xl bg-slate-100 items-center justify-center mr-3 border border-slate-200">
        {isHistory ? (
          <History size={16} color="#64748b" />
        ) : (
          <MapPin size={16} color="#64748b" />
        )}
      </View>

      <View className="flex-1 mr-2">
        <View className="flex-row justify-between items-center">
          <Text className="text-slate-800 text-sm font-bold flex-1" numberOfLines={1}>{mainText}</Text>
          {!!distance && (
            <Text className="text-primary text-xs font-bold ml-1">{distance}</Text>
          )}
        </View>
        <Text className="text-slate-500 text-xs mt-0.5" numberOfLines={1}>{secondaryText}</Text>
      </View>

      {onEdit || onDelete ? (
        <View className="flex-row items-center">
          {onEdit && (
            <TouchableOpacity 
              onPress={onEdit} 
              className="p-2 bg-sky-50 rounded-lg mr-1.5 border border-sky-100"
              hitSlop={10}
            >
              <Edit3 size={14} color="#0284c7" />
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity 
              onPress={onDelete} 
              className="p-2 bg-red-50 rounded-lg border border-red-100"
              hitSlop={10}
            >
              <Trash2 size={14} color="#dc2626" />
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <ArrowRight size={16} color="rgba(15, 23, 42, 0.2)" />
      )}
    </TouchableOpacity>
  );
};
