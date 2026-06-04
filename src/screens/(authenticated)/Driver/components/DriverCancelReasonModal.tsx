import React from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";

import ActionButton from "../../../../components/ui/ActionButton";
import { driverTheme } from "./driverTheme";

export type CancelReason = { id: string; label: string };

export type DriverCancelReasonModalProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  /** Aviso destacado sobre as consequências da ação (ex.: estorno ao cliente / re-despacho). */
  infoNote?: string;
  reasons: CancelReason[];
  selectedReasonId: string | null;
  onSelectReason: (id: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  confirmLabel?: string;
};

export function DriverCancelReasonModal({
  visible,
  title = "Cancelar entrega",
  subtitle = "Selecione um motivo. O cliente será notificado.",
  infoNote,
  reasons,
  selectedReasonId,
  onSelectReason,
  onClose,
  onConfirm,
  confirmDisabled,
  confirmLabel = "Confirmar",
}: DriverCancelReasonModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.55)",
          padding: driverTheme.spacing.xl,
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: driverTheme.colors.cardBgSolid,
            borderRadius: driverTheme.radius.lg,
            borderWidth: 1,
            borderColor: driverTheme.colors.border,
            padding: driverTheme.spacing.md,
          }}
        >
          <Text
            style={{
              color: driverTheme.colors.text,
              ...driverTheme.typography.sectionTitle,
            }}
          >
            {title}
          </Text>
          <Text
            style={{
              color: driverTheme.colors.textMuted,
              marginTop: driverTheme.spacing.xs,
            }}
          >
            {subtitle}
          </Text>

          {!!infoNote && (
            <View
              style={{
                marginTop: 12,
                backgroundColor: "rgba(251,191,36,0.12)",
                borderWidth: 1,
                borderColor: "rgba(251,191,36,0.35)",
                borderRadius: 12,
                padding: 12,
              }}
            >
              <Text style={{ color: "#fbbf24", fontWeight: "700", fontSize: 12.5, lineHeight: 18 }}>
                {infoNote}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 12, gap: 10 }}>
            {reasons.map((r) => {
              const selected = selectedReasonId === r.id;
              return (
                <TouchableOpacity
                  key={r.id}
                  onPress={() => onSelectReason(r.id)}
                  style={{
                    paddingVertical: 12,
                    paddingHorizontal: 12,
                    borderRadius: 14,
                    backgroundColor: selected
                      ? "rgba(2,222,149,0.18)"
                      : "rgba(255,255,255,0.06)",
                    borderWidth: 1,
                    borderColor: selected
                      ? "rgba(2,222,149,0.55)"
                      : "rgba(255,255,255,0.08)",
                  }}
                >
                  <Text
                    style={{
                      color: driverTheme.colors.text,
                      fontWeight: "800",
                    }}
                  >
                    {r.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <ActionButton
              title="Voltar"
              variant="secondary"
              onPress={onClose}
              style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
            />

            <ActionButton
              title={confirmLabel}
              variant="danger"
              onPress={onConfirm}
              disabled={!!confirmDisabled}
              style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
