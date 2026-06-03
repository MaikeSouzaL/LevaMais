import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { LinearGradient } from "expo-linear-gradient";
import type { PaymentUiMeta } from "./PaymentStateManager";

function iconName(icon: PaymentUiMeta["icon"]) {
  if (icon === "check") return "check-circle";
  if (icon === "warning") return "error-outline";
  if (icon === "wallet") return "account-balance-wallet";
  if (icon === "bank") return "account-balance";
  return "verified-user";
}

export function LivePaymentStatus({ meta }: { meta: PaymentUiMeta }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Icon pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Glow opacity
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.9,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.4,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Badge shimmer
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 2400,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, []);

  const shimmerTranslate = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-120, 120],
  });

  return (
    <View style={{ gap: 10 }}>
      {/* Header Row: Icon + Title + Badge */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          {/* Animated Icon with Glow Ring */}
          <Animated.View
            style={{
              transform: [{ scale: pulseAnim }],
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: meta.softAccent,
                borderWidth: 1.5,
                borderColor: `${meta.accent}55`,
              }}
            >
              {/* Glow ring behind the icon */}
              <Animated.View
                style={{
                  position: "absolute",
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: meta.accentGlow,
                  opacity: glowAnim,
                }}
              />
              <Icon name={iconName(meta.icon) as any} size={19} color={meta.accent} />
            </View>
          </Animated.View>

          <View style={{ gap: 1 }}>
            <Text
              style={{
                color: meta.accent,
                fontSize: 13,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 0.8,
              }}
            >
              {meta.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 9, fontWeight: "600" }}>
              {meta.subtitle}
            </Text>
          </View>
        </View>

        {/* Premium Realtime Badge with Shimmer */}
        <View
          style={{
            borderRadius: 999,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: `${meta.accent}44`,
          }}
        >
          <LinearGradient
            colors={[`${meta.accent}20`, `${meta.accent}08`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
            }}
          >
            {/* Animated dot */}
            <Animated.View
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: meta.accent,
                opacity: glowAnim,
              }}
            />
            <Text
              style={{
                color: meta.accent,
                fontSize: 8.5,
                fontWeight: "900",
                textTransform: "uppercase",
                letterSpacing: 1,
              }}
            >
              {meta.badgeLabel}
            </Text>

            {/* Shimmer overlay */}
            <Animated.View
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                width: 40,
                backgroundColor: "rgba(255,255,255,0.12)",
                transform: [{ translateX: shimmerTranslate }],
              }}
            />
          </LinearGradient>
        </View>
      </View>

      {/* Main Message */}
      <Text style={{ color: "#fff", fontSize: 13.5, fontWeight: "700", lineHeight: 19 }}>
        {meta.message}
      </Text>

      {/* Sub text */}
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, lineHeight: 16 }}>
        A plataforma liberará automaticamente a rota assim que o pagamento for aprovado.
      </Text>
    </View>
  );
}
