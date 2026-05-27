import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  Animated,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MotiView } from "moti";
import { CheckCircle, X, Package, Clock } from "lucide-react-native";

export default function OrderSentScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const rideId = String(route.params?.rideId || "");
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  const handleClose = () => {
    // Pass rideId directly so Home can show the banner immediately (no polling wait)
    navigation.reset({
      index: 0,
      routes: [{ name: "Home", params: { activeRideId: rideId || undefined } }],
    });
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Close (X) button top-right */}
      <TouchableOpacity
        onPress={handleClose}
        style={{
          position: "absolute",
          top: insets.top + 16,
          right: 20,
          zIndex: 50,
          backgroundColor: "rgba(255,255,255,0.08)",
          borderRadius: 20,
          padding: 8,
        }}
      >
        <X size={22} color="#fff" />
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
        {/* Pulsing icon */}
        <Animated.View style={{ transform: [{ scale: pulse }], marginBottom: 28 }}>
          <MotiView
            from={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 14 }}
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: "rgba(2,222,149,0.12)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: "rgba(2,222,149,0.35)",
            }}
          >
            <CheckCircle size={52} color="#02de95" strokeWidth={1.8} />
          </MotiView>
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

      {/* Bottom CTA */}
      <MotiView
        from={{ opacity: 0, translateY: 24 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ delay: 500 }}
        style={{
          paddingHorizontal: 24,
          paddingBottom: insets.bottom + 24,
          paddingTop: 16,
        }}
      >
        <TouchableOpacity
          onPress={handleClose}
          style={{
            height: 54,
            borderRadius: 16,
            backgroundColor: "#02de95",
            alignItems: "center",
            justifyContent: "center",
          }}
          activeOpacity={0.85}
        >
          <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15, textTransform: "uppercase" }}>
            Voltar para Início
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: 11,
            textAlign: "center",
            marginTop: 10,
          }}
        >
          Um banner branco aparecerá na tela inicial quando você receber propostas
        </Text>
      </MotiView>
    </View>
  );
}
