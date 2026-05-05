import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import ActionButton from "../../../../components/ui/ActionButton";
import { driverTheme } from "./driverTheme";

export type DriverStatusCardProps = {
  statusLabel: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  showRouteDetails?: boolean;
  canArrive: boolean;
  canStart: boolean;
  canComplete: boolean;
  actionLoading:
    | null
    | "cancel"
    | "driver_arriving"
    | "arrived"
    | "in_progress"
    | "completed";
  onArrive: () => void;
  onStart: () => void;
  onComplete: () => void;
  onChat?: () => void;
  unreadCount?: number;
};

export function DriverStatusCard({
  statusLabel,
  pickupAddress,
  dropoffAddress,
  showRouteDetails = true,
  canArrive,
  canStart,
  canComplete,
  actionLoading,
  onArrive,
  onStart,
  onComplete,
  onChat,
  unreadCount,
}: DriverStatusCardProps) {
  const busy = actionLoading != null;

  return (
    <View
      style={{
        backgroundColor: driverTheme.colors.cardBgSolid,
        borderRadius: driverTheme.radius.md,
        padding: driverTheme.spacing.md,
        borderWidth: 1,
        borderColor: driverTheme.colors.borderSubtle,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <Text
          style={{
            color: driverTheme.colors.text,
            ...driverTheme.typography.sectionTitle,
            flex: 1,
          }}
        >
          Status: {statusLabel}
        </Text>

        {!!onChat && (
          <TouchableOpacity
            onPress={onChat}
            activeOpacity={0.85}
            style={{
              width: 42,
              height: 42,
              borderRadius: 21,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(2,222,149,0.14)",
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.36)",
            }}
          >
            <MaterialIcons name="chat-bubble-outline" size={20} color="#02de95" />
            {!!unreadCount && unreadCount > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  minWidth: 18,
                  height: 18,
                  borderRadius: 9,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 4,
                }}
              >
                <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {showRouteDetails && (
        <>
          <Text
            style={{
              color: driverTheme.colors.textSubtle,
              marginTop: driverTheme.spacing.xs,
            }}
          >
            Coleta: {pickupAddress || "-"}
          </Text>
          <Text
            style={{
              color: driverTheme.colors.textSubtle,
              marginTop: 2,
            }}
          >
            Destino: {dropoffAddress || "-"}
          </Text>
        </>
      )}

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <ActionButton
          title={actionLoading === "arrived" ? "..." : "Cheguei"}
          variant="secondary"
          onPress={onArrive}
          disabled={!canArrive || busy}
          style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
        />

        <ActionButton
          title={actionLoading === "in_progress" ? "..." : "Iniciar"}
          variant="primary"
          onPress={onStart}
          disabled={!canStart || busy}
          style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
        />

        <ActionButton
          title={actionLoading === "completed" ? "..." : "Finalizar"}
          variant="secondary"
          onPress={onComplete}
          disabled={!canComplete || busy}
          style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
        />
      </View>
    </View>
  );
}
