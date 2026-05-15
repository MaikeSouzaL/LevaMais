import React from "react";
import { Text, TouchableOpacity, ActivityIndicator, View } from "react-native";
import { RefreshCw } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

interface RetryButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export function RetryButton({ onPress, loading }: RetryButtonProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      disabled={loading}
      className="w-full h-14 rounded-2xl overflow-hidden relative shadow-lg mb-4"
      style={{
        shadowColor: "#02de95",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      }}
    >
      <LinearGradient
        colors={["#02de95", "#00c382"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="w-full h-full flex-row items-center justify-center px-4"
      >
        {loading ? (
          <ActivityIndicator color="#091A2F" />
        ) : (
          <>
            <View className="w-5 h-5 mr-2 items-center justify-center">
              <RefreshCw size={18} color="#091A2F" strokeWidth={3} />
            </View>
            <Text className="text-[#091A2F] font-black text-base tracking-wide">
              Tentar Novamente
            </Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}
