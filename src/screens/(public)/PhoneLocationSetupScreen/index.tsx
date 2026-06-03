import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Icon } from "@/components/ui/Icon";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

import { obterEnderecoPorCoordenadas } from "../../../utils/location";
import userService from "../../../services/user.service";

const theme = {
  COLORS: {
    BRAND_LIGHT: "#02de95",
    BRAND_DARK: "#091A2F",
    SURFACE_PRIMARY: "rgba(9, 26, 47, 0.8)",
  },
};

export default function PhoneLocationSetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { user, token } = (route.params || {}) as { user: any; token?: string };
  const [loading, setLoading] = useState(false);

  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.2);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.3);
  const scale3 = useSharedValue(1);
  const opacity3 = useSharedValue(0.4);

  useEffect(() => {
    scale1.value = withRepeat(withTiming(1.5, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    opacity1.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    scale2.value = withRepeat(withTiming(1.3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    opacity2.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    scale3.value = withRepeat(withTiming(1.2, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
    opacity3.value = withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false);
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({ transform: [{ scale: scale1.value }], opacity: opacity1.value }));
  const animatedStyle2 = useAnimatedStyle(() => ({ transform: [{ scale: scale2.value }], opacity: opacity2.value }));
  const animatedStyle3 = useAnimatedStyle(() => ({ transform: [{ scale: scale3.value }], opacity: opacity3.value }));

  const handleAllowLocation = async () => {
    setLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permissão negada", text2: "A localização é necessária." });
        setLoading(false);
        return;
      }

      let city = "";
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (pos?.coords) {
        const endereco = await obterEnderecoPorCoordenadas(pos.coords.latitude, pos.coords.longitude);
        if (endereco?.city) {
          city = endereco.city;
        }
      }

      // Salva cidade no backend se tiver token
      if (token && city) {
        try {
          await userService.updateProfile({ city }, token);
        } catch {}
      }

      // Navega para SelectProfile com dados atualizados
      navigation.reset({
        index: 0,
        routes: [{
          name: "SelectProfile",
          params: {
            user: { ...user, city: city || user?.city || "" },
            token,
          },
        }],
      });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: "Não foi possível obter a localização." });
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{
        name: "SelectProfile",
        params: { user, token },
      }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      <View style={styles.content}>
        {/* Radar animation */}
        <View style={styles.radarArea}>
          <View style={styles.radarCenter}>
            <Animated.View style={[styles.radarRing, styles.ringOuter, animatedStyle1]} />
            <Animated.View style={[styles.radarRing, styles.ringMid, animatedStyle2]} />
            <Animated.View style={[styles.radarRing, styles.ringInner, animatedStyle3]} />
            <View style={styles.pinCircle}>
              <Icon name="map-marker" size={80} color={theme.COLORS.BRAND_LIGHT} />
            </View>
          </View>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.title}>Permissões do App</Text>
          <Text style={styles.subtitle}>
            Para começar, precisamos da sua localização para te conectar às melhores rotas. Fique tranquilo, só mais tarde pediremos acesso à sua câmera e galeria para completar o seu perfil!
          </Text>
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.allowBtn, loading && styles.btnDisabled]}
            onPress={handleAllowLocation}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color={theme.COLORS.BRAND_DARK} />
            ) : (
              <Text style={styles.allowBtnText}>Permitir Localização</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.7}>
            <Text style={styles.skipBtnText}>Agora Não</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091A2F" },
  content: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 24 },
  radarArea: { alignItems: "center", marginBottom: 80 },
  radarCenter: { alignItems: "center", justifyContent: "center" },
  radarRing: { position: "absolute", borderRadius: 999, backgroundColor: "#02de95" },
  ringOuter: { width: 256, height: 256 },
  ringMid: { width: 192, height: 192 },
  ringInner: { width: 160, height: 160 },
  pinCircle: {
    width: 128, height: 128, borderRadius: 64,
    backgroundColor: "rgba(9, 26, 47, 0.8)", alignItems: "center", justifyContent: "center",
  },
  textArea: { alignItems: "center", marginBottom: 32 },
  title: { color: "#fff", fontSize: 32, fontWeight: "900", marginBottom: 16, textAlign: "center" },
  subtitle: { color: "rgba(255,255,255,0.5)", fontSize: 15, textAlign: "center", lineHeight: 24, paddingHorizontal: 16 },
  buttons: { width: "100%", gap: 16 },
  allowBtn: {
    height: 56, borderRadius: 16, backgroundColor: "#02de95",
    alignItems: "center", justifyContent: "center",
  },
  btnDisabled: { opacity: 0.6 },
  allowBtnText: { color: "#091A2F", fontWeight: "900", fontSize: 17 },
  skipBtn: { height: 56, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  skipBtnText: { color: "#fff", fontWeight: "600", fontSize: 16 },
});
