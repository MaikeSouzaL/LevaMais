import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type DriverTopHudProps = {
  driverName?: string | null;
  vehicleTypeLabel?: string;
  plate?: string | null;
  todayEarnings?: number;
  pendingRequests?: number;
  scheduledCount?: number;
  onPressNotifications: () => void;
  online?: boolean;
};

export function DriverTopHud({
  vehicleTypeLabel,
  plate,
  todayEarnings = 0,
  pendingRequests = 0,
  scheduledCount = 0,
  onPressNotifications,
  online = false,
}: DriverTopHudProps) {
  const earningsValue = `R$ ${Number(todayEarnings || 0).toFixed(2).replace(".", ",")}`;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <View style={{ flex: 1, justifyContent: "center" }}>
        <View
          style={{
            alignSelf: "flex-start",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "rgba(2,222,149,0.4)",
            backgroundColor: "rgba(2,222,149,0.12)",
            paddingHorizontal: 12,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 24, lineHeight: 26 }}>
            {earningsValue}
          </Text>
        </View>

        {!!plate && (
          <Text
            style={{
              color: "rgba(255,255,255,0.72)",
              marginTop: 6,
              fontSize: 13,
              fontWeight: "700",
              letterSpacing: 0.5,
            }}
          >
            {plate}
          </Text>
        )}
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, alignSelf: "flex-start", marginTop: 2 }}>
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
          accessibilityLabel="Notificacoes"
        >
          <View>
            <MaterialIcons
              name="notifications"
              size={22}
              color="rgba(255,255,255,0.9)"
            />

            {/* Badge vermelho — solicitações em tempo real */}
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
                  borderColor: "#091A2F",
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

            {/* Badge verde — corridas agendadas disponíveis */}
            {scheduledCount > 0 && pendingRequests === 0 && (
              <View
                style={{
                  position: "absolute",
                  bottom: -6,
                  right: -6,
                  minWidth: 18,
                  height: 18,
                  paddingHorizontal: 4,
                  borderRadius: 999,
                  backgroundColor: "#02de95",
                  borderWidth: 2,
                  borderColor: "#091A2F",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: "#091A2F",
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  {scheduledCount > 9 ? "9+" : String(scheduledCount)}
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>

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


