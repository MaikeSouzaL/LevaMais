import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Shield } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";

export function SecureTransactionBadge() {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    // Shimmer sweep
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 3000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    // Subtle pulse on the shield icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, []);

  const shimmerTranslateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-200, 400],
  });

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(34,211,238,0.25)",
      }}
    >
      <LinearGradient
        colors={["rgba(34,211,238,0.10)", "rgba(34,211,238,0.04)", "rgba(34,211,238,0.08)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
        }}
      >
        {/* Shield icon with glow */}
        <Animated.View style={{ opacity: pulseAnim }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: "rgba(34,211,238,0.14)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(34,211,238,0.3)",
            }}
          >
            <Shield size={16} color="#22d3ee" />
          </View>
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#22d3ee",
              fontSize: 9,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 0.8,
              marginBottom: 2,
            }}
          >
            🛡 Transação protegida
          </Text>
          <Text style={{ color: "#9be8f7", fontSize: 10.5, fontWeight: "600", lineHeight: 15 }}>
            Monitorada em tempo real e protegida pela plataforma.
          </Text>
        </View>

        {/* Shimmer sweep overlay */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 60,
            backgroundColor: "rgba(34,211,238,0.08)",
            transform: [{ translateX: shimmerTranslateX }],
          }}
        />
      </LinearGradient>
    </View>
  );
}
