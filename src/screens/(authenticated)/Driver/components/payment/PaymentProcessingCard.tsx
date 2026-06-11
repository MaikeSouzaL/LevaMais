import React from "react";
import { Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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
        marginTop: 14,
        borderRadius: 22,
        overflow: "hidden",
        borderWidth: 1.5,
        borderColor: "rgba(255,255,255,0.08)",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.45,
        shadowRadius: 24,
        elevation: 14,
        position: "relative",
      }}
    >
      {/* Premium blur panel backdrop */}
      <BlurView intensity={32} tint="dark" style={{ padding: 18 }}>
        {/* Subtle operational glass ambient lighting / glows */}
        <LinearGradient
          colors={[meta.gradientStart, meta.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: -1,
          }}
        />

        {/* Ambient light source top-right */}
        <View
          style={{
            position: "absolute",
            top: -40,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: 70,
            backgroundColor: meta.accentGlow,
            opacity: 0.18,
            zIndex: -1,
          }}
        />

        {/* Ambient light source bottom-left */}
        <View
          style={{
            position: "absolute",
            bottom: -50,
            left: -40,
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: "rgba(34,211,238,0.12)",
            opacity: 0.15,
            zIndex: -1,
          }}
        />

        {/* Operational Header Title */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.06)",
            paddingBottom: 8,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.45)",
              fontSize: 9,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            Central Operacional de Pagamento
          </Text>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: meta.accent,
              }}
            />
            <Text
              style={{
                color: meta.accent,
                fontSize: 8.5,
                fontWeight: "900",
                letterSpacing: 0.5,
              }}
            >
              LIVE
            </Text>
          </View>
        </View>

        {/* Main Status Information Panel */}
        <LivePaymentStatus meta={meta} />

        {/* Security Transaction Information */}
        <SecureTransactionBadge />

        {/* Realtime progress loading animation */}
        {state !== "approved" && state !== "declined" && (
          <PaymentRealtimeLoader phrase={meta.loaderPhrase} />
        )}

        {/* Estimated Countdown Indicator */}
        {state !== "approved" && state !== "declined" && (
          <ProcessingCountdown initialSeconds={estimatedSeconds} />
        )}

        {/* Operational Timeline Progress Checkpoints */}
        <OperationalTimeline activeIndex={meta.stepIndex} />

        {/* Next step highlight CTA (visible upon approval) */}
        {meta.showActionUnlock && <DeliveryUnlockCard />}

        {/* Realtime observation system notice */}
        <View
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.06)",
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.48)",
              fontSize: 10.5,
              lineHeight: 15,
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            Você será notificado instantaneamente quando o pagamento for aprovado.
          </Text>
        </View>
      </BlurView>
    </View>
  );
}
