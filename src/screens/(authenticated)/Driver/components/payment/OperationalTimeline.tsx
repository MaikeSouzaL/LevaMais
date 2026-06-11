import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Check } from "lucide-react-native";

const STEPS = [
  { label: "Cliente confirmou proposta", activeDesc: "Oferta aceita e confirmada" },
  { label: "Pagamento em análise", activeDesc: "Processando transação com banco" },
  { label: "Plataforma validando", activeDesc: "Autenticando chaves de segurança" },
  { label: "Rota será liberada", activeDesc: "Aguardando sinal verde final" },
];

export function OperationalTimeline({ activeIndex }: { activeIndex: number }) {
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [activeIndex]);

  return (
    <View style={{ marginTop: 16, gap: 12 }}>
      <Text
        style={{
          color: "rgba(255,255,255,0.4)",
          fontSize: 9,
          fontWeight: "900",
          textTransform: "uppercase",
          letterSpacing: 1.2,
          marginBottom: 4,
        }}
      >
        Timeline operacional
      </Text>

      <View style={{ position: "relative", paddingLeft: 6 }}>
        {/* Connection line behind checkpoints */}
        <View
          style={{
            position: "absolute",
            left: 14,
            top: 10,
            bottom: 10,
            width: 2,
            backgroundColor: "rgba(255,255,255,0.06)",
          }}
        />

        {/* Highlighted path for completed/active steps */}
        <View
          style={{
            position: "absolute",
            left: 14,
            top: 10,
            height: `${Math.min(90, (activeIndex / (STEPS.length - 1)) * 90)}%`,
            width: 2,
            backgroundColor: "#02de95",
            opacity: 0.8,
          }}
        />

        {STEPS.map((step, idx) => {
          const isDone = idx < activeIndex;
          const isActive = idx === activeIndex;
          const isPending = idx > activeIndex;

          return (
            <View
              key={step.label}
              style={{
                flexDirection: "row",
                alignItems: "flex-start",
                marginBottom: idx === STEPS.length - 1 ? 0 : 16,
                gap: 14,
              }}
            >
              {/* Checkpoint Dot / Indicator */}
              <View style={{ width: 18, alignItems: "center", justifyContent: "center", height: 18 }}>
                {isDone ? (
                  <View
                    style={{
                      width: 14,
                      height: 14,
                      borderRadius: 7,
                      backgroundColor: "#02de95",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor: "rgba(9, 26, 47, 1)",
                    }}
                  >
                    <Check size={9} color="#091A2F" />
                  </View>
                ) : isActive ? (
                  <View style={{ alignItems: "center", justifyContent: "center" }}>
                    {/* Glowing outer aura for active step */}
                    <Animated.View
                      style={{
                        position: "absolute",
                        width: 20,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: "rgba(251,191,36,0.35)",
                        opacity: pulseAnim,
                        transform: [{ scale: pulseAnim.interpolate({ inputRange: [0.4, 1], outputRange: [0.9, 1.4] }) }],
                      }}
                    />
                    <View
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: 6,
                        backgroundColor: "#fbbf24",
                        borderWidth: 2.5,
                        borderColor: "rgba(9, 26, 47, 1)",
                        zIndex: 2,
                      }}
                    />
                  </View>
                ) : (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "rgba(255,255,255,0.18)",
                      borderWidth: 2,
                      borderColor: "rgba(9, 26, 47, 1)",
                    }}
                  />
                )}
              </View>

              {/* Step Info */}
              <View style={{ flex: 1, paddingTop: 1 }}>
                <Text
                  style={{
                    color: isActive ? "#ffffff" : isDone ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.35)",
                    fontSize: 12,
                    fontWeight: isActive || isDone ? "800" : "600",
                  }}
                >
                  {step.label}
                </Text>
                {isActive && (
                  <Text
                    style={{
                      color: "#fbbf24",
                      fontSize: 10,
                      fontWeight: "500",
                      marginTop: 2.5,
                    }}
                  >
                    {step.activeDesc}
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
