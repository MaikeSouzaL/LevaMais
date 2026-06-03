import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Clock } from "lucide-react-native";

function asMMSS(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ProcessingCountdown({ initialSeconds = 300 }: { initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => {
        const next = Math.max(0, prev - 1);
        // Animate progress decay
        Animated.timing(progressAnim, {
          toValue: next / initialSeconds,
          duration: 900,
          useNativeDriver: false,
        }).start();
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [initialSeconds]);

  useEffect(() => {
    // Pulse animation for critical timing under 60 seconds
    if (seconds <= 60) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [seconds]);

  const text = useMemo(() => asMMSS(seconds), [seconds]);
  const isCritical = seconds <= 60;
  const themeColor = isCritical ? "#ef4444" : "#fbbf24";
  const glowColor = isCritical ? "rgba(239,68,68,0.22)" : "rgba(251,191,36,0.18)";

  const widthPercent = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View
      style={{
        marginTop: 12,
        borderRadius: 14,
        overflow: "hidden",
        borderWidth: 1,
        borderColor: isCritical ? "rgba(239,68,68,0.35)" : "rgba(251,191,36,0.25)",
      }}
    >
      <LinearGradient
        colors={[glowColor, "rgba(255,255,255,0.01)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          padding: 12,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Clock
            size={16}
            color={themeColor}
            style={{ opacity: 0.9 }}
          />
          <View>
            <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "600" }}>
              Tempo estimado
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 9, fontWeight: "500", marginTop: 1 }}>
              Aguardando confirmação bancária
            </Text>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.25)",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: `${themeColor}44`,
            }}
          >
            <Text
              style={{
                color: themeColor,
                fontSize: 15,
                fontWeight: "900",
                letterSpacing: 0.8,
                fontFamily: "System",
              }}
            >
              {text}
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>

      {/* Tiny progress status line at the bottom of the countdown card */}
      <View style={{ height: 2, backgroundColor: "rgba(255,255,255,0.05)" }}>
        <Animated.View
          style={{
            height: "100%",
            backgroundColor: themeColor,
            width: widthPercent,
            opacity: 0.8,
          }}
        />
      </View>
    </View>
  );
}
