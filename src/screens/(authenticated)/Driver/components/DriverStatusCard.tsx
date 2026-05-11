import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";

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
  details?: {
    itemType?: string;
    priority?: number;
    specialInstructions?: string;
  };
  payment?: {
    method?: {
      type?: string;
    } | string;
  };
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
  details,
  payment,
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

      {/* Payment Method Prompt */}
      {(() => {
        const rawType = typeof payment?.method === "object" ? payment?.method?.type : payment?.method;
        const type = rawType || "cash";

        let label = "DINHEIRO";
        let color = "#02de95";
        let icon = "money-bill-wave";

        if (type === "pix") {
          label = "PIX";
          color = "#32BCAD";
          icon = "qrcode";
        } else if (["card", "credit_card", "debit_card"].includes(String(type))) {
          label = "CARTÃO";
          color = "#3b82f6";
          icon = "credit-card";
        }

        return (
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: `${color}15`,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 8,
            marginTop: 8,
            borderWidth: 1,
            borderColor: `${color}30`
          }}>
            <FontAwesome5 name={icon} size={12} color={color} />
            <Text style={{ color: "#fff", fontSize: 11, fontWeight: "900", marginLeft: 8, opacity: 0.9 }}>
              Pagamento: <Text style={{ color: color }}>{label}</Text>
            </Text>
          </View>
        );
      })()}

      {!!details?.specialInstructions && (
        <View style={{ 
          marginTop: driverTheme.spacing.sm, 
          padding: driverTheme.spacing.sm, 
          backgroundColor: "rgba(255,255,255,0.03)", 
          borderRadius: 8,
          borderLeftWidth: 2,
          borderLeftColor: "#02de95" 
        }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
            Observações da Carga:
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 2, fontWeight: "500" }}>
            {details.specialInstructions}
          </Text>
        </View>
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
