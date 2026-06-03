import React from "react";
import { View, Text } from "react-native";
import { Shield, Key, CheckCircle, Clock } from "lucide-react-native";

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
    <View className="rounded-2xl p-4 mb-4 bg-[#11253E] border border-white/[0.05]">
      <View className="flex-row items-center gap-2 mb-4">
        <Shield size={16} color="#02de95" />
        <Text className="text-white text-base font-bold">Códigos de Segurança</Text>
      </View>

      <View className="flex-row gap-3">
        {pickupPin && (
          <View className="flex-1 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] items-center justify-between">
            <View className="items-center mb-2">
              <View className="w-8 h-8 rounded-lg bg-[#02de95]/10 items-center justify-center mb-1.5">
                <Key size={14} color="#02de95" />
              </View>
              <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider text-center">PIN de Coleta</Text>
              <Text className="text-white text-base font-black tracking-widest mt-1 text-center" style={{ fontFamily: "monospace" }}>
                {pickupPin}
              </Text>
            </View>
            <View
              className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                pickupPinValidated ? "bg-[#02de95]/10 border border-[#02de95]/30" : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              {pickupPinValidated ? (
                <>
                  <CheckCircle size={10} color="#02de95" />
                  <Text className="text-[10px] font-bold text-[#02de95]">Validado</Text>
                </>
              ) : (
                <>
                  <Clock size={10} color="#f59e0b" />
                  <Text className="text-[10px] font-bold text-amber-500">Pendente</Text>
                </>
              )}
            </View>
          </View>
        )}

        {deliveryPin && (
          <View className="flex-1 p-3 rounded-xl bg-white/[0.01] border border-white/[0.03] items-center justify-between">
            <View className="items-center mb-2">
              <View className="w-8 h-8 rounded-lg bg-[#02de95]/10 items-center justify-center mb-1.5">
                <Key size={14} color="#02de95" />
              </View>
              <Text className="text-white/40 text-[9px] font-bold uppercase tracking-wider text-center">PIN de Entrega</Text>
              <Text className="text-white text-base font-black tracking-widest mt-1 text-center" style={{ fontFamily: "monospace" }}>
                {deliveryPin}
              </Text>
            </View>
            <View
              className={`flex-row items-center gap-1 px-2 py-0.5 rounded-full ${
                deliveryPinValidated ? "bg-[#02de95]/10 border border-[#02de95]/30" : "bg-amber-500/10 border border-amber-500/30"
              }`}
            >
              {deliveryPinValidated ? (
                <>
                  <CheckCircle size={10} color="#02de95" />
                  <Text className="text-[10px] font-bold text-[#02de95]">Validado</Text>
                </>
              ) : (
                <>
                  <Clock size={10} color="#f59e0b" />
                  <Text className="text-[10px] font-bold text-amber-500">Pendente</Text>
                </>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  );
}
