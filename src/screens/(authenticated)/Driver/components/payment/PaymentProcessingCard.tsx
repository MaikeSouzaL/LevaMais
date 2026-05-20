import React from "react";
import { Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LivePaymentStatus } from "./LivePaymentStatus";
import { SecureTransactionBadge } from "./SecureTransactionBadge";
import { PaymentRealtimeLoader } from "./PaymentRealtimeLoader";
import { OperationalTimeline } from "./OperationalTimeline";
import { DeliveryUnlockCard } from "./DeliveryUnlockCard";
import { ProcessingCountdown } from "./ProcessingCountdown";
import { deriveStateFromCountdown, getPaymentUiMeta, type PaymentRealtimeState } from "./PaymentStateManager";

export function PaymentProcessingCard({
  forcedState,
  estimatedSeconds = 300,
}: {
  forcedState?: PaymentRealtimeState;
  estimatedSeconds?: number;
}) {
  const state = forcedState || deriveStateFromCountdown(estimatedSeconds);
  const meta = getPaymentUiMeta(state);

  return (
    <View
      style={{
        marginTop: 10,
        borderRadius: 18,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.14)",
        backgroundColor: "rgba(7,21,40,0.72)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 14 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
        elevation: 12,
      }}
    >
      <BlurView intensity={24} tint="dark" style={{ padding: 14 }}>
        <View
          style={{
            position: "absolute",
            top: -26,
            right: -20,
            width: 130,
            height: 130,
            borderRadius: 65,
            backgroundColor: "rgba(251,191,36,0.09)",
          }}
        />
        <View
          style={{
            position: "absolute",
            bottom: -38,
            left: -26,
            width: 150,
            height: 150,
            borderRadius: 75,
            backgroundColor: "rgba(34,211,238,0.08)",
          }}
        />

        <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>
          Central operacional de pagamento
        </Text>

        <LivePaymentStatus meta={meta} />
        <SecureTransactionBadge />
        <PaymentRealtimeLoader />
        <ProcessingCountdown initialSeconds={estimatedSeconds} />
        <OperationalTimeline activeIndex={meta.stepIndex} />
        <DeliveryUnlockCard />

        <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)" }}>
          <Text style={{ color: "rgba(255,255,255,0.52)", fontSize: 10.5 }}>
            Você será notificado instantaneamente quando o pagamento for aprovado.
          </Text>
        </View>
      </BlurView>
    </View>
  );
}
