import React from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { PackageSearch } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface SearchDeliveryButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export const SearchDeliveryButton = ({ onPress, loading = false }: SearchDeliveryButtonProps) => {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="absolute bottom-0 left-0 right-0 bg-[#091A2F] border-t border-white/[0.05] px-6 pt-4 shadow-2xl shadow-black"
      style={{ paddingBottom: insets.bottom + 16 }}
    >
      <TouchableOpacity
        onPress={onPress}
        disabled={loading}
        activeOpacity={0.85}
        className="h-14 w-full rounded-[20px] bg-primary overflow-hidden shadow-2xl shadow-primary/30 elevation-12 items-center justify-center active:scale-[0.97]"
      >
        {!loading && (
          <MotiView
            from={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1.1, opacity: 0.9 }}
            transition={{ loop: true, type: "timing", duration: 1500 }}
            className="absolute w-full h-full bg-white/10"
          />
        )}

        {loading ? (
          <ActivityIndicator color="#0f172a" />
        ) : (
          <View className="flex-row items-center gap-2.5">
            <PackageSearch size={20} color="#0f172a" strokeWidth={2.5} />
            <Text className="text-slate-900 text-base font-extrabold tracking-widest uppercase">
              Buscar Entregadores
            </Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};
