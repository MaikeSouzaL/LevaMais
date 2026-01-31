import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type DriverTopHudProps = {
  driverName?: string | null;
  vehicleTypeLabel?: string;
  plate?: string | null;
  pendingRequests?: number;
  onPressNotifications: () => void;
  /** Status online/offline */
  online?: boolean;
};

export function DriverTopHud({
  driverName,
  vehicleTypeLabel,
  plate,
  pendingRequests = 0,
  onPressNotifications,
  online = false,
}: DriverTopHudProps) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      {/* Nome e Veículo */}
      <View style={{ flex: 1 }}>
        <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
          {driverName ? `Olá, ${driverName}` : "Motorista"}
        </Text>

        {!!vehicleTypeLabel && (
          <Text
            style={{
              color: "rgba(255,255,255,0.7)",
              marginTop: 2,
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            {vehicleTypeLabel}
            {plate ? ` • ${plate}` : ""}
          </Text>
        )}
      </View>

      {/* Notificação e Status */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        {/* Botão de Notificações */}
        <TouchableOpacity
          onPress={onPressNotifications}
          activeOpacity={0.85}
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: "rgba(17,24,22,0.88)",
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
              size={22}
              color="rgba(255,255,255,0.9)"
            />

            {pendingRequests > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -8,
                  right: -8,
                  minWidth: 20,
                  height: 20,
                  paddingHorizontal: 5,
                  borderRadius: 999,
                  backgroundColor: "#ef4444",
                  borderWidth: 2,
                  borderColor: "#0f231c",
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

        {/* Status Badge */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            paddingHorizontal: 12,
            paddingVertical: 10,
            borderRadius: 12,
            backgroundColor: online
              ? "rgba(2,222,149,0.18)"
              : "rgba(107,114,128,0.18)",
            borderWidth: 1,
            borderColor: online
              ? "rgba(2,222,149,0.35)"
              : "rgba(255,255,255,0.10)",
          }}
        >
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              backgroundColor: online ? "#02de95" : "#6b7280",
            }}
          />
          <Text
            style={{
              color: online ? "#02de95" : "rgba(255,255,255,0.7)",
              fontWeight: "900",
              fontSize: 14,
            }}
          >
            {online ? "Online" : "Offline"}
          </Text>
        </View>
      </View>
    </View>
  );
}
