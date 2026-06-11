import React from "react";
import { View, Text } from "react-native";
import { getStatusMeta } from "@/utils/statusMeta";

interface StatusBadgeProps {
  status: string;
  serviceType?: string;
}

export default function StatusBadge({ status, serviceType }: StatusBadgeProps) {
  const meta = getStatusMeta(status, serviceType);

  return (
    <View
      className="px-3 py-2 rounded-full flex-row items-center"
      style={{ backgroundColor: meta.bg }}
    >
      <View className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: meta.color }} />
      <Text className="text-sm font-bold" style={{ color: meta.color }}>
        {meta.title}
      </Text>
    </View>
  );
}
