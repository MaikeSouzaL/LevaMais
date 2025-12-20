import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface LocationHeaderProps {
  currentAddress: string;
  userPhotoUrl?: string;
  onPressLocation?: () => void;
}

export function LocationHeader({
  currentAddress,
  userPhotoUrl,
  onPressLocation,
}: LocationHeaderProps) {
  return (
    <TouchableOpacity
      onPress={onPressLocation}
      activeOpacity={0.8}
      className="flex-row items-center justify-between bg-surface-dark/90 border border-white/10 p-2 pr-3 rounded-full shadow-2xl"
    >
      {/* Avatar do usuário */}
      <View className="w-10 h-10 rounded-full border-2 border-primary overflow-hidden bg-gray-700">
        {userPhotoUrl ? (
          <Image
            source={{ uri: userPhotoUrl }}
            className="w-full h-full"
            resizeMode="cover"
          />
        ) : (
          <View className="w-full h-full items-center justify-center bg-gray-600">
            <MaterialIcons name="person" size={24} color="#02de95" />
          </View>
        )}
      </View>

      {/* Informações de localização */}
      <View className="flex-col justify-center flex-1 pl-3">
        <Text className="text-[10px] text-primary font-bold uppercase tracking-wider leading-none mb-1">
          Local atual
        </Text>
        <Text
          className="text-sm font-bold text-white leading-none"
          numberOfLines={1}
        >
          {currentAddress}
        </Text>
      </View>

      {/* Seta dropdown - dentro do campo */}
      <MaterialIcons name="keyboard-arrow-down" size={24} color="white" />
    </TouchableOpacity>
  );
}
