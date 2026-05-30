import React from "react";
import { View, Text, TouchableOpacity, Linking } from "react-native";
import { Phone, MessageSquare, AlertTriangle } from "lucide-react-native";

type DriverActionButtonsProps = {
  recipientPhone?: string;
  onChat?: () => void;
  unreadCount?: number;
  onReportProblem?: () => void;
};

export function DriverActionButtons({
  recipientPhone,
  onChat,
  unreadCount = 0,
  onReportProblem,
}: DriverActionButtonsProps) {
  return (
    <View className="flex-row gap-2.5 mb-3.5">
      {/* Ligar */}
      <TouchableOpacity
        onPress={() => {
          if (recipientPhone) {
            Linking.openURL(`tel:${recipientPhone}`);
          }
        }}
        activeOpacity={0.8}
        className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5"
      >
        <Phone size={14} color="rgba(255, 255, 255, 0.7)" />
        <Text className="text-white/80 text-[11px] font-bold">Ligar</Text>
      </TouchableOpacity>

      {/* Chat */}
      {onChat && (
        <TouchableOpacity
          onPress={onChat}
          activeOpacity={0.8}
          className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5 relative"
        >
          <MessageSquare size={14} color="#02de95" fill="rgba(2, 222, 149, 0.1)" />
          <Text className="text-[#02de95] text-[11px] font-extrabold">Chat</Text>
          {unreadCount > 0 && (
            <View className="absolute -top-1 -right-1 min-w-[16px] h-[16px] rounded-full bg-red-500 items-center justify-center px-1 border border-[#091A2F]">
              <Text className="text-white text-[8px] font-black">
                {unreadCount > 9 ? "9+" : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      )}

      {/* Problema */}
      <TouchableOpacity
        onPress={onReportProblem}
        activeOpacity={0.8}
        className="flex-1 h-11 rounded-2xl bg-[#1E2D3D] border border-white/[0.04] flex-row items-center justify-center gap-1.5"
      >
        <AlertTriangle size={14} color="#ef4444" />
        <Text className="text-[#ef4444] text-[11px] font-extrabold">Problema</Text>
      </TouchableOpacity>
    </View>
  );
}
