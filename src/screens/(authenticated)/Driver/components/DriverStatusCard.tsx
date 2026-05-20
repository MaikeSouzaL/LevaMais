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
    | "completed"
    | "arrived_at_dropoff";
  onArrive: () => void;
  onStart: () => void;
  onComplete: () => void;
  onChat?: () => void;
  unreadCount?: number;
  clientName?: string;
  details?: {
    itemType?: string;
    priority?: number;
    pickupComplement?: string;
    dropoffComplement?: string;
    recipientName?: string;
    recipientPhone?: string;
    recipientInstructions?: string;
    deliveryPin?: string;
    specialInstructions?: string;
  };
  payment?: {
    method?: {
      type?: string;
    } | string;
  };
  // Novos campos para fluxo delivery
  isAwaitingPayment?: boolean;
  isDelivery?: boolean;
  arrivedAtDropoff?: boolean;
  canArriveDropoff?: boolean;
  onArriveDropoff?: () => void;
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
  clientName,
  details,
  payment,
  isAwaitingPayment = false,
  isDelivery = false,
  arrivedAtDropoff = false,
  canArriveDropoff = false,
  onArriveDropoff,
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
          label = "CARTAO";
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

      {/* Dados do Solicitante / Remetente */}
      {!!clientName && (
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "rgba(255,255,255,0.03)",
          paddingHorizontal: 12,
          paddingVertical: 8,
          borderRadius: 8,
          marginTop: 8,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.06)"
        }}>
          <MaterialIcons name="person-outline" size={14} color="#02de95" />
          <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700", marginLeft: 8 }}>
            {isDelivery ? "Remetente: " : "Passageiro: "}
            <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "500" }}>{clientName}</Text>
          </Text>
        </View>
      )}

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
            Observacoes da Carga:
          </Text>
          <Text style={{ color: "#fff", fontSize: 12, marginTop: 2, fontWeight: "500" }}>
            {details.specialInstructions}
          </Text>
        </View>
      )}

      {(!!details?.recipientName ||
        !!details?.recipientPhone ||
        !!details?.pickupComplement ||
        !!details?.dropoffComplement ||
        !!details?.recipientInstructions ||
        !!details?.deliveryPin) && (
        <View
          style={{
            marginTop: driverTheme.spacing.sm,
            padding: driverTheme.spacing.sm,
            backgroundColor: "rgba(59,130,246,0.08)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(59,130,246,0.25)",
          }}
        >
          <Text style={{ color: "#60a5fa", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>
            Operacao da Entrega
          </Text>
          {!!details?.recipientName && (
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
              Recebedor: {details.recipientName}
            </Text>
          )}
          {!!details?.recipientPhone && (
            <Text style={{ color: "#fff", fontSize: 12, marginTop: 2 }}>
              Telefone: {details.recipientPhone}
            </Text>
          )}
          {!!details?.pickupComplement && (
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 2 }}>
              Complemento coleta: {details.pickupComplement}
            </Text>
          )}
          {!!details?.dropoffComplement && (
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 2 }}>
              Complemento destino: {details.dropoffComplement}
            </Text>
          )}
          {!!details?.recipientInstructions && (
            <Text style={{ color: "rgba(255,255,255,0.9)", fontSize: 12, marginTop: 2 }}>
              Instrucao: {details.recipientInstructions}
            </Text>
          )}
          {!!details?.deliveryPin && (
            <Text style={{ color: "#F59E0B", fontSize: 12, marginTop: 2, fontWeight: "900" }}>
              PIN: {details.deliveryPin}
            </Text>
          )}
        </View>
      )}

      {/* Aguardando pagamento do cliente */}
      {isAwaitingPayment && (
        <View
          style={{
            marginTop: driverTheme.spacing.sm,
            padding: driverTheme.spacing.sm,
            backgroundColor: "rgba(245,158,11,0.1)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.3)",
            alignItems: "center",
          }}
        >
          <FontAwesome5 name="hourglass-half" size={24} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontSize: 13, fontWeight: "900", marginTop: 6, textAlign: "center" }}>
            Cliente escolheu voce!
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, marginTop: 4, textAlign: "center" }}>
            Aguardando confirmacao de pagamento para liberar a entrega.
          </Text>
        </View>
      )}

      {/* Chegada no destino (delivery) */}
      {isDelivery && arrivedAtDropoff && (
        <View
          style={{
            marginTop: driverTheme.spacing.xs,
            padding: 6,
            backgroundColor: "rgba(2,222,149,0.08)",
            borderRadius: 6,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "800" }}>
            Voce chegou ao destino
          </Text>
        </View>
      )}

      {!isAwaitingPayment && (
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

          {/* Botao condicional: Chegou no destino ou Finalizar */}
          {isDelivery && canArriveDropoff ? (
            <ActionButton
              title={actionLoading === "arrived_at_dropoff" ? "..." : "Chegou no Destino"}
              variant="secondary"
              onPress={onArriveDropoff || (() => {})}
              disabled={!canArriveDropoff || busy}
              style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
            />
          ) : (
            <ActionButton
              title={actionLoading === "completed" ? "..." : "Finalizar"}
              variant="secondary"
              onPress={onComplete}
              disabled={!canComplete || busy}
              style={{ flex: 1, borderRadius: driverTheme.radius.sm }}
            />
          )}
        </View>
      )}
    </View>
  );
}
