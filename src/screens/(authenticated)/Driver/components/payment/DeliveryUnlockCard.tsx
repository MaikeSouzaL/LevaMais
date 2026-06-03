import React, { useEffect, useRef } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { LinearGradient } from "expo-linear-gradient";

export function DeliveryUnlockCard() {
  const hoverAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Elegant floating/bobbing effect for the rocket icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(hoverAnim, {
          toValue: -3,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(hoverAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: "rgba(2,222,149,0.3)",
      }}
    >
      <LinearGradient
        colors={["rgba(2,222,149,0.14)", "rgba(2,222,149,0.02)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          padding: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        {/* Animated Rocket Icon wrapper */}
        <Animated.View style={{ transform: [{ translateY: hoverAnim }] }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: "rgba(2,222,149,0.16)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.35)",
            }}
          >
            <Icon name="rocket-launch" size={18} color="#02de95" />
          </View>
        </Animated.View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              color: "#02de95",
              fontSize: 9,
              fontWeight: "900",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 1,
            }}
          >
            Próxima etapa
          </Text>
          <Text
            style={{
              color: "#d2ffe9",
              fontSize: 12,
              fontWeight: "800",
              letterSpacing: 0.3,
            }}
          >
            Iniciar rota automaticamente
          </Text>
        </View>

        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: "rgba(2,222,149,0.12)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="chevron-right" size={16} color="#02de95" />
        </View>
      </LinearGradient>
    </View>
  );
}
