import React from "react";
import { Text, TouchableOpacity, View } from "react-native";

type ArrivedButtonProps = {
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  label?: string;
};

export function ArrivedButton({
  onPress,
  loading = false,
  disabled = false,
  label = "CHEGUEI",
}: ArrivedButtonProps) {
  return (
    <View className="mt-0.5">
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.85}
        className="w-full h-14 bg-[#02de95] rounded-2xl items-center justify-center"
        style={{
          shadowColor: "#02de95",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text className="text-[#091A2F] text-sm font-black uppercase tracking-wider">
          {loading ? "Processando..." : label}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
