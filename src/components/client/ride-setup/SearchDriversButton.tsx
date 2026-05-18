import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { Search } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SearchDriversButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export const SearchDriversButton = ({ onPress, loading = false }: SearchDriversButtonProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-slate-950/80 border-t border-white/5 px-6 pt-4"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.9}
        className="h-14 w-full rounded-2xl bg-primary overflow-hidden shadow-2xl elevation-8 relative items-center justify-center"
      >
        {/* Static Breathe Glow Ring underneath text */}
        {!loading && (
          <MotiView
            from={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            transition={{ loop: true, type: "timing", duration: 1500 }}
            className="absolute w-full h-full bg-white/10"
          />
        )}

        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <View className="flex-row items-center gap-2">
            <Search size={18} color="#000" strokeWidth={3} />
            <Text className="text-black text-base font-bold tracking-widest uppercase">
              Buscar Motoristas
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
