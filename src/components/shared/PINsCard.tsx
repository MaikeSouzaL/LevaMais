import React from "react";
import { View, Text } from "react-native";

interface PINsCardProps {
  pickupPin?: string;
  deliveryPin?: string;
  pickupPinValidated?: boolean;
  deliveryPinValidated?: boolean;
}

export default function PINsCard({
  pickupPin,
  deliveryPin,
  pickupPinValidated = false,
  deliveryPinValidated = false,
}: PINsCardProps) {
  if (!pickupPin && !deliveryPin) {
    return null;
  }

  return (
    <View className="rounded-2xl p-4 mb-4" style={{ backgroundColor: "rgba(2,222,149,0.1)" }}>
      <Text className="text-white text-sm font-bold mb-3">Códigos de Segurança</Text>

      {pickupPin && (
        <View className="flex-row items-center justify-between mb-3 p-3 rounded-xl bg-[rgba(255,255,255,0.05)]">
          <View className="flex-1">
            <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">PIN de Coleta</Text>
            <Text className="text-white text-lg font-bold">{pickupPin}</Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              pickupPinValidated ? "bg-[#02de95]" : "bg-[rgba(251,191,36,0.2)]"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                pickupPinValidated ? "text-[#091A2F]" : "text-[#fbbf24]"
              }`}
            >
              {pickupPinValidated ? "Validado" : "Pendente"}
            </Text>
          </View>
        </View>
      )}

      {deliveryPin && (
        <View className="flex-row items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.05)]">
          <View className="flex-1">
            <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">PIN de Entrega</Text>
            <Text className="text-white text-lg font-bold">{deliveryPin}</Text>
          </View>
          <View
            className={`px-3 py-1 rounded-full ${
              deliveryPinValidated ? "bg-[#02de95]" : "bg-[rgba(251,191,36,0.2)]"
            }`}
          >
            <Text
              className={`text-xs font-bold ${
                deliveryPinValidated ? "text-[#091A2F]" : "text-[#fbbf24]"
              }`}
            >
              {deliveryPinValidated ? "Validado" : "Pendente"}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
