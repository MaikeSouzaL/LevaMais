import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const REALTIME_SUB_PHRASES = [
  "Criptografando dados da transação...",
  "Estabelecendo conexão segura com o gateway...",
  "Consultando saldo na instituição bancária...",
  "Autenticando token de segurança...",
  "Aguardando confirmação de liquidação Pix...",
  "Processando regras de compliance...",
  "Liberando assinatura digital da rota..."
];

export function PaymentRealtimeLoader({ phrase }: { phrase?: string }) {
  const shimmer = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0.15)).current;
  const glow = useRef(new Animated.Value(0.4)).current;
  const fade = useRef(new Animated.Value(1)).current;

  const [subPhraseIdx, setSubPhraseIdx] = useState(0);

  useEffect(() => {
    // Loop for the shimmer highlight
    Animated.loop(
      Animated.timing(shimmer, {
        toValue: 1,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Loop for pulsing glow on the progress bar
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(glow, {
          toValue: 0.4,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Smooth subtle progress fluctuation (feels alive/realtime)
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 0.85,
          duration: 15000,
          easing: Easing.out(Easing.quad),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0.92,
          duration: 20000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        })
      ])
    ).start();

    // Dynamic phrase rotator with fade transitions
    const interval = setInterval(() => {
      Animated.timing(fade, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        setSubPhraseIdx((prev) => (prev + 1) % REALTIME_SUB_PHRASES.length);
        Animated.timing(fade, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      });
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  const translateX = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-150, 250],
  });

  const progressPercent = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={{ marginTop: 14 }}>
      {/* Label and Pulse status indicator */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <Animated.View
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: "#02de95",
              opacity: glow,
            }}
          />
          <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700" }}>
            {phrase || "Processando pagamento..."}
          </Text>
        </View>
        <Text style={{ color: "#02de95", fontSize: 9, fontWeight: "800", letterSpacing: 0.5 }}>
          REALTIME
        </Text>
      </View>

      {/* Modern custom visual progress bar */}
      <View
        style={{
          height: 10,
          borderRadius: 5,
          backgroundColor: "rgba(255,255,255,0.06)",
          overflow: "hidden",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          position: "relative"
        }}
      >
        {/* Animated main progress fill */}
        <Animated.View
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: progressPercent,
          }}
        >
          <LinearGradient
            colors={["#026095", "#02de95"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>

        {/* Shimmer sweep overlay over progress */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: 80,
            backgroundColor: "rgba(255,255,255,0.22)",
            transform: [{ translateX }],
          }}
        />
      </View>

      {/* Subphrase rotating area showing micro-actions (Fintech Operational Center feel) */}
      <View style={{ marginTop: 6, minHeight: 18, justifyContent: "center" }}>
        <Animated.Text
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 10,
            fontFamily: "System",
            fontStyle: "italic",
            opacity: fade,
          }}
        >
          ● {REALTIME_SUB_PHRASES[subPhraseIdx]}
        </Animated.Text>
      </View>
    </View>
  );
}
