import React from "react";
import { View, Text } from "react-native";

import ActionButton from "../../../../components/ui/ActionButton";
import { driverTheme } from "./driverTheme";

export type DriverStatusCardProps = {
  statusLabel: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  canArrive: boolean;
  canStart: boolean;
  canComplete: boolean;
  actionLoading: null | "cancel" | "arrived" | "in_progress" | "completed";
  onArrive: () => void;
  onStart: () => void;
  onComplete: () => void;
};

export function DriverStatusCard({
  statusLabel,
  pickupAddress,
  dropoffAddress,
  canArrive,
  canStart,
  canComplete,
  actionLoading,
  onArrive,
  onStart,
  onComplete,
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
      <Text
        style={{
          color: driverTheme.colors.text,
          ...driverTheme.typography.sectionTitle,
        }}
      >
        Status: {statusLabel}
      </Text>
      <Text
        style={{
          color: driverTheme.colors.textSubtle,
          marginTop: driverTheme.spacing.xs,
        }}
      >
        Coleta: {pickupAddress || "—"}
      </Text>
      <Text
        style={{
          color: driverTheme.colors.textSubtle,
          marginTop: 2,
        }}
      >
        Destino: {dropoffAddress || "—"}
      </Text>

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
