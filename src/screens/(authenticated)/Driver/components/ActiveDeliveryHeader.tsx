import React from "react";
import { View, Text, TouchableOpacity, Image } from "react-native";

type ActiveDeliveryHeaderProps = {
  driverName?: string;
  driverPhoto?: string;
  onCancelPress?: () => void;
  canCancel?: boolean;
};

export function ActiveDeliveryHeader({
  driverPhoto,
  onCancelPress,
  canCancel = true,
}: ActiveDeliveryHeaderProps) {
  return (
    <View className="h-16 px-4 flex-row items-center justify-between bg-[#091A2F] border-b border-white/[0.05]">
      <View className="flex-row items-center gap-3">
        {driverPhoto ? (
          <Image
            source={{ uri: driverPhoto }}
            className="w-10 h-10 rounded-full border border-white/10"
          />
        ) : (
          <View className="w-10 h-10 rounded-full bg-[#11253E] border border-white/10 items-center justify-center">
            <Text className="text-white text-xs font-black">M</Text>
          </View>
        )}
        <Text className="text-white font-extrabold text-base tracking-wide">
          Entrega ativa
        </Text>
      </View>

      {canCancel && onCancelPress && (
        <TouchableOpacity onPress={onCancelPress} activeOpacity={0.8}>
          <Text className="text-red-500 font-extrabold text-sm uppercase tracking-wide">
            Cancelar
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
