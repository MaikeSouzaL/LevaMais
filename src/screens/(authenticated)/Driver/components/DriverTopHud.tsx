import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type DriverTopHudProps = {
  driverName?: string | null;
  vehicleTypeLabel?: string;
  plate?: string | null;
  pendingRequests?: number;
  onPressNotifications: () => void;
  /** right side custom content (ex: online toggle) */
  right?: React.ReactNode;
};

export function DriverTopHud({
  driverName,
  vehicleTypeLabel,
  plate,
  pendingRequests = 0,
  onPressNotifications,
  right,
}: DriverTopHudProps) {
  return (
    <View
      style={{
        backgroundColor: "rgba(17,24,22,0.88)",
        borderRadius: 16,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
            {driverName ? `Olá, ${driverName}` : "Motorista"}
          </Text>

          {!!vehicleTypeLabel && (
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              {vehicleTypeLabel}
              {plate ? `• ${plate}` : ""}
            </Text>
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity
            onPress={onPressNotifications}
            activeOpacity={0.85}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: "rgba(0,0,0,0.18)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              alignItems: "center",
              justifyContent: "center",
            }}
            accessibilityRole="button"
            accessibilityLabel="Notificações"
          >
            <View>
              <MaterialIcons
                name="notifications"
                size={20}
                color="rgba(255,255,255,0.9)"
              />

              {pendingRequests > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -8,
                    minWidth: 18,
                    height: 18,
                    paddingHorizontal: 5,
                    borderRadius: 999,
                    backgroundColor: "#ef4444",
                    borderWidth: 1,
                    borderColor: "rgba(17,24,22,0.9)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "white",
                      fontSize: 11,
                      fontWeight: "900",
                    }}
                  >
                    {pendingRequests > 9 ? "9+" : String(pendingRequests)}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {right ? <View>{right}</View> : null}
        </View>
      </View>
    </View>
  );
}
