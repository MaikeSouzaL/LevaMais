import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { Check, X, Package, Clock } from "lucide-react-native";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function OrderSentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const rideId = String(route.params?.rideId || "");
  const pulse = useRef(new Animated.Value(1)).current;
  const progress = useRef(new Animated.Value(1)).current;

  const handleClose = () => {
    // Pass rideId directly so Home can show the banner immediately (no polling wait)
    navigation.reset({ index: 0, routes: [{ name: "Home", params: { activeRideId: rideId || undefined } }] });
  };

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();

    const progressAnim = Animated.timing(progress, {
      toValue: 0,
      duration: 5000, // 5 seconds
      useNativeDriver: true,
    });

    progressAnim.start(({ finished }) => {
      if (finished) {
        handleClose();
      }
    });

    return () => {
      anim.stop();
      progressAnim.stop();
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Dynamic Progress Bar */}
      <View
        style={{
          position: "absolute",
          top: insets.top,
          left: 0,
          right: 0,
          height: 4,
          backgroundColor: "rgba(255,255,255,0.08)",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        <Animated.View
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: "#02de95",
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-SCREEN_WIDTH, 0],
                }),
              },
            ],
          }}
        />
      </View>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Pulsing high-end glassmorphic success badge */}
        <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: 28 }}>
          <View style={{ alignItems: "center", justifyContent: "center" }}>
            {/* Outer halo ripple */}
            <MotiView
              from={{ scale: 0.8, opacity: 0.5 }}
              animate={{ scale: 1.35, opacity: 0 }}
              transition={{ loop: true, type: "timing", duration: 1800 }}
              style={{
                position: "absolute",
                width: 112,
                height: 112,
                borderRadius: 56,
                borderWidth: 2.5,
                borderColor: "rgba(2,222,149,0.4)",
              }}
            />
            
            {/* Second glowing glass capsule */}
            <MotiView
              from={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", damping: 15 }}
              style={{
                width: 112,
                height: 112,
                borderRadius: 56,
                backgroundColor: "rgba(2,222,149,0.06)",
                borderWidth: 1.5,
                borderColor: "rgba(2,222,149,0.25)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Inner Solid Premium Core Puck */}
              <View
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: "#02de95",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#02de95",
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Check size={38} color="#091A2F" strokeWidth={3.5} />
              </View>
            </MotiView>
          </View>
        </Animated.View>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 200 }}
        >
          <Text
            style={{
              color: "#fff",
              fontSize: 24,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 10,
            }}
          >
            Pedido Enviado!
          </Text>
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
              textAlign: "center",
              lineHeight: 22,
            }}
          >
            Seu pedido foi publicado para os entregadores próximos. Aguarde enquanto eles analisam sua oferta.
          </Text>
        </MotiView>

        {/* Status pills */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 380 }}
          style={{ marginTop: 36, gap: 12, width: "100%" }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#ffffff",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(9, 26, 47, 0.08)",
              shadowColor: "#091A2F",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(2, 222, 149, 0.08)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Package size={18} color="#00b578" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#091A2F", fontWeight: "800", fontSize: 13 }}>
                Aguardando Propostas
              </Text>
              <Text style={{ color: "rgba(9, 26, 47, 0.5)", fontSize: 11, marginTop: 2, fontWeight: "500" }}>
                Entregadores próximos estão sendo notificados
              </Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#ffffff",
              borderRadius: 18,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(9, 26, 47, 0.08)",
              shadowColor: "#091A2F",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.06,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: "rgba(9, 26, 47, 0.04)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Clock size={18} color="#091A2F" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#091A2F", fontWeight: "800", fontSize: 13 }}>
                Notificação Automática
              </Text>
              <Text style={{ color: "rgba(9, 26, 47, 0.5)", fontSize: 11, marginTop: 2, fontWeight: "500" }}>
                Você receberá um aviso ao receber uma proposta
              </Text>
            </View>
          </View>
        </MotiView>
      </View>

      {/* Bottom Helper Info (No Buttons!) */}
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500 }}
        style={{
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 24),
          paddingTop: 16,
        }}
      >
        <Text
          style={{
            color: "rgba(255,255,255,0.45)",
            fontSize: 12,
            fontWeight: "700",
            textAlign: "center",
            lineHeight: 18,
          }}
        >
          Um banner branco aparecerá na tela inicial quando você receber propostas
        </Text>
      </MotiView>
    </View>
  );
}
