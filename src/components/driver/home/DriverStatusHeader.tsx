import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Bell } from "lucide-react-native";
import { MotiView } from "moti";

interface DriverStatusHeaderProps {
  pendingRequests: number;
  scheduledCount: number;
  waitingQueueCount: number;
  pendingNegotiationsCount: number;
  onPressNotifications: () => void;
  online: boolean;
}

export function DriverStatusHeader({
  pendingRequests,
  scheduledCount,
  waitingQueueCount,
  pendingNegotiationsCount,
  onPressNotifications,
  online,
}: DriverStatusHeaderProps) {
  const totalAlerts =
    pendingRequests +
    scheduledCount +
    waitingQueueCount +
    pendingNegotiationsCount;

  return (
    <View className="flex-row items-center justify-end gap-3">
      <TouchableOpacity
        onPress={onPressNotifications}
        activeOpacity={0.8}
        style={{
          height: 58,
          width: 58,
          borderRadius: 16,
          borderWidth: 1,
          borderColor:
            totalAlerts > 0
              ? "rgba(251,191,36,0.5)"
              : "rgba(255,255,255,0.1)",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#091A2F",
          position: "relative",
        }}
      >
        <Bell size={22} color={totalAlerts > 0 ? "#FBBF24" : "rgba(255,255,255,0.8)"} />

        {totalAlerts > 0 && (
          <MotiView
            from={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute",
              top: -6,
              right: -6,
              backgroundColor: "#ef4444",
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 4,
              borderWidth: 2,
              borderColor: "#091A2F",
              zIndex: 10,
            }}
          >
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "900" }}>
              {totalAlerts}
            </Text>
          </MotiView>
        )}
      </TouchableOpacity>
    </View>
  );
}
