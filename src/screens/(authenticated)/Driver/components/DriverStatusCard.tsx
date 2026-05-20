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

  // Custom visual theme based on current trip phase
  const getPhaseTheme = () => {
    if (canArrive) return { color: "#fbbf24", bg: "rgba(251,191,36,0.08)", icon: "navigation" };
    if (canStart) return { color: "#02de95", bg: "rgba(2,222,149,0.08)", icon: "pin-drop" };
    return { color: "#3b82f6", bg: "rgba(59,130,246,0.08)", icon: "local-shipping" };
  };

  const phase = getPhaseTheme();

  // Helper to extract initials for avatar
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .slice(0, 2)
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <View
      style={{
        backgroundColor: "#0b1a2f",
        borderRadius: 24,
        padding: 20,
        borderWidth: 1.5,
        borderColor: "rgba(255, 255, 255, 0.06)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 10,
      }}
    >
      {/* Top Header: Phase Badge & Chat Quick Action */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <View
            style={{
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 12,
              backgroundColor: phase.bg,
              borderWidth: 1,
              borderColor: `${phase.color}30`,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
            }}
          >
            <MaterialIcons name={phase.icon as any} size={14} color={phase.color} />
            <Text style={{ color: phase.color, fontSize: 10.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
              {statusLabel}
            </Text>
          </View>
        </View>

        {!!onChat && (
          <TouchableOpacity
            onPress={onChat}
            activeOpacity={0.85}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(2,222,149,0.08)",
              borderWidth: 1.5,
              borderColor: "rgba(2,222,149,0.25)",
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
                  borderWidth: 1.5,
                  borderColor: "#0b1a2f",
                }}
              >
                <Text style={{ color: "#fff", fontSize: 9.5, fontWeight: "900" }}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Client Profile Information Row */}
      {!!clientName && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: "rgba(255, 255, 255, 0.03)",
            padding: 12,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.04)",
            marginBottom: 16,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(2, 222, 149, 0.12)",
              borderWidth: 1,
              borderColor: "rgba(2, 222, 149, 0.25)",
              alignItems: "center",
              justifyContent: "center",
              marginRight: 12,
            }}
          >
            <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "900" }}>
              {getInitials(clientName)}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 }}>
              {isDelivery ? "Remetente da Encomenda" : "Passageiro da Corrida"}
            </Text>
            <Text style={{ color: "#ffffff", fontSize: 13.5, fontWeight: "900", marginTop: 1 }}>
              {clientName}
            </Text>
          </View>
        </View>
      )}

      {/* Journey Addresses Vertical Timeline (Identical to high-end ride sharing) */}
      {showRouteDetails && (
        <View
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderRadius: 18,
            padding: 14,
            borderWidth: 1,
            borderColor: "rgba(255, 255, 255, 0.04)",
            marginBottom: 14,
            flexDirection: "row",
            gap: 12,
          }}
        >
          {/* Timeline Visual Lines */}
          <View style={{ alignItems: "center", paddingTop: 4 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#02de95", borderWidth: 2, borderColor: "#0b1a2f" }} />
            <View style={{ width: 1.5, flex: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 4, borderStyle: "dashed", borderRadius: 1 }} />
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#ef4444", borderWidth: 2, borderColor: "#0b1a2f" }} />
          </View>

          {/* Address Content Blocks */}
          <View style={{ flex: 1, gap: 14 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 8.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 }}>
                Ponto de Coleta
              </Text>
              <Text style={{ color: "#ffffff", fontSize: 11.5, fontWeight: "500", marginTop: 2, lineHeight: 15 }} numberOfLines={2}>
                {pickupAddress || "Carregando local..."}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 8.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 }}>
                Ponto de Entrega
              </Text>
              <Text style={{ color: "#ffffff", fontSize: 11.5, fontWeight: "500", marginTop: 2, lineHeight: 15 }} numberOfLines={2}>
                {dropoffAddress || "Carregando destino..."}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Payment Method Badge */}
      {(() => {
        const rawType = typeof payment?.method === "object" ? payment?.method?.type : payment?.method;
        const type = rawType || "cash";

        let label = "DINHEIRO EM MÃOS";
        let color = "#02de95";
        let icon = "money-bill-wave";

        if (type === "pix") {
          label = "PAGAMENTO VIA PIX";
          color = "#32BCAD";
          icon = "qrcode";
        } else if (["card", "credit_card", "debit_card"].includes(String(type))) {
          label = "CARTÃO DE CRÉDITO/DÉBITO";
          color = "#3b82f6";
          icon = "credit-card";
        }

        return (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: `${color}08`,
              paddingHorizontal: 12,
              paddingVertical: 10,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${color}20`,
              marginBottom: 12,
            }}
          >
            <FontAwesome5 name={icon} size={11} color={color} />
            <Text style={{ color: "#fff", fontSize: 10, fontWeight: "800", marginLeft: 8, letterSpacing: 0.2 }}>
              MEIO DE PAGAMENTO: <Text style={{ color: color }}>{label}</Text>
            </Text>
          </View>
        );
      })()}

      {/* Cargo Complement details */}
      {(!!details?.recipientName ||
        !!details?.recipientPhone ||
        !!details?.pickupComplement ||
        !!details?.dropoffComplement ||
        !!details?.recipientInstructions ||
        !!details?.deliveryPin) && (
        <View
          style={{
            padding: 12,
            backgroundColor: "rgba(59,130,246,0.06)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(59,130,246,0.15)",
            marginBottom: 12,
            gap: 4,
          }}
        >
          <Text style={{ color: "#60a5fa", fontSize: 9.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
            📦 Informações Adicionais da Carga
          </Text>
          {!!details?.recipientName && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              Destinatário: <Text style={{ color: "#fff", fontWeight: "700" }}>{details.recipientName}</Text>
            </Text>
          )}
          {!!details?.recipientPhone && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              Contato: <Text style={{ color: "#fff", fontWeight: "700" }}>{details.recipientPhone}</Text>
            </Text>
          )}
          {!!details?.pickupComplement && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              Anotações Coleta: <Text style={{ color: "#fff", fontWeight: "500" }}>{details.pickupComplement}</Text>
            </Text>
          )}
          {!!details?.dropoffComplement && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              Anotações Destino: <Text style={{ color: "#fff", fontWeight: "500" }}>{details.dropoffComplement}</Text>
            </Text>
          )}
          {!!details?.recipientInstructions && (
            <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 11 }}>
              Instruções: <Text style={{ color: "#fff", fontWeight: "500" }}>{details.recipientInstructions}</Text>
            </Text>
          )}
          {!!details?.deliveryPin && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 }}>
              <MaterialIcons name="security" size={12} color="#F59E0B" />
              <Text style={{ color: "#F59E0B", fontSize: 11, fontWeight: "900" }}>
                PIN da Entrega: {details.deliveryPin}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Special Delivery Instructions */}
      {!!details?.specialInstructions && (
        <View
          style={{
            padding: 12,
            backgroundColor: "rgba(2, 222, 149, 0.04)",
            borderRadius: 14,
            borderLeftWidth: 3,
            borderLeftColor: "#02de95",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "rgba(2, 222, 149, 0.7)", fontSize: 9, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.3 }}>
            Requisitos de Transporte:
          </Text>
          <Text style={{ color: "#fff", fontSize: 11.5, marginTop: 2, fontWeight: "500" }}>
            {details.specialInstructions}
          </Text>
        </View>
      )}

      {/* Awaiting Payment Warning Component */}
      {isAwaitingPayment && (
        <View
          style={{
            padding: 14,
            backgroundColor: "rgba(245,158,11,0.06)",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(245,158,11,0.2)",
            alignItems: "center",
            gap: 6,
          }}
        >
          <FontAwesome5 name="hourglass-half" size={20} color="#F59E0B" />
          <Text style={{ color: "#F59E0B", fontSize: 12.5, fontWeight: "900" }}>
            Cliente selecionou sua oferta!
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 10.5, textAlign: "center", lineHeight: 14 }}>
            Aguardando a confirmação do pagamento do cliente no aplicativo para liberar o início da rota.
          </Text>
        </View>
      )}

      {/* Dropoff Arrived banner (delivery flow) */}
      {isDelivery && arrivedAtDropoff && (
        <View
          style={{
            padding: 8,
            backgroundColor: "rgba(2,222,149,0.06)",
            borderRadius: 10,
            alignItems: "center",
            marginBottom: 12,
            borderWidth: 1,
            borderColor: "rgba(2,222,149,0.15)",
          }}
        >
          <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
            🏁 Chegada no ponto de entrega registrada!
          </Text>
        </View>
      )}

      {/* Driver progression Action Buttons Grid */}
      {!isAwaitingPayment && (
        <View style={{ flexDirection: "row", gap: 10, marginTop: 4 }}>
          {canArrive && (
            <TouchableOpacity
              onPress={onArrive}
              disabled={busy}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 48,
                backgroundColor: "rgba(251, 191, 36, 0.15)",
                borderWidth: 1.5,
                borderColor: "#fbbf24",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#fbbf24", fontSize: 13.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.3 }}>
                {actionLoading === "arrived" ? "Registrando..." : "Marcar Cheguei"}
              </Text>
            </TouchableOpacity>
          )}

          {canStart && (
            <TouchableOpacity
              onPress={onStart}
              disabled={busy}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 48,
                backgroundColor: "#02de95",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 6,
                elevation: 3,
              }}
            >
              <Text style={{ color: "#091A2F", fontSize: 13.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {actionLoading === "in_progress" ? "Iniciando..." : "Iniciar Viagem"}
              </Text>
            </TouchableOpacity>
          )}

          {/* Conditional: Arrived Dropoff or Finalize */}
          {isDelivery && canArriveDropoff ? (
            <TouchableOpacity
              onPress={onArriveDropoff}
              disabled={busy}
              activeOpacity={0.8}
              style={{
                flex: 1,
                height: 48,
                backgroundColor: "rgba(2, 222, 149, 0.1)",
                borderWidth: 1.5,
                borderColor: "#02de95",
                borderRadius: 14,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.3 }}>
                {actionLoading === "arrived_at_dropoff" ? "Registrando..." : "Cheguei no Destino"}
              </Text>
            </TouchableOpacity>
          ) : (
            canComplete && (
              <TouchableOpacity
                onPress={onComplete}
                disabled={busy}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  backgroundColor: "#02de95",
                  borderRadius: 14,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#02de95",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Text style={{ color: "#091A2F", fontSize: 13.5, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 }}>
                  {actionLoading === "completed" ? "Finalizando..." : "Finalizar Entrega"}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      )}
    </View>
  );
}
