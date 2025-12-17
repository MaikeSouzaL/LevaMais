import React, { useEffect } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import theme from "../../../theme";

interface LocationPermissionScreenProps {
  onAllow: () => void;
  onSkip: () => void;
}

export default function LocationPermissionScreen({
  onAllow,
  onSkip,
}: LocationPermissionScreenProps) {
  // Animações para os círculos pulsantes
  const scale1 = useSharedValue(1);
  const opacity1 = useSharedValue(0.2);
  const scale2 = useSharedValue(1);
  const opacity2 = useSharedValue(0.3);
  const scale3 = useSharedValue(1);
  const opacity3 = useSharedValue(0.4);

  useEffect(() => {
    // Animação do círculo externo
    scale1.value = withRepeat(
      withTiming(1.5, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
    opacity1.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );

    // Animação do círculo médio (com delay)
    scale2.value = withRepeat(
      withTiming(1.3, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
    opacity2.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );

    // Animação do círculo interno (com delay maior)
    scale3.value = withRepeat(
      withTiming(1.2, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
    opacity3.value = withRepeat(
      withTiming(0, {
        duration: 2000,
        easing: Easing.out(Easing.ease),
      }),
      -1,
      false
    );
  }, []);

  // Estilos animados
  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: scale1.value }],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: scale2.value }],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [{ scale: scale3.value }],
    opacity: opacity3.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <View className="flex-1 items-center justify-center px-6">
        {/* Ícone de localização centralizado */}
        <View className="items-center mb-20 relative">
          {/* Círculos concêntricos (efeito radar) */}
          <View className="relative items-center justify-center">
            {/* Círculo externo animado */}
            <Animated.View
              className="absolute w-64 h-64 rounded-full"
              style={[
                {
                  backgroundColor: theme.COLORS.BRAND_LIGHT,
                },
                animatedStyle1,
              ]}
            />
            {/* Círculo médio animado */}
            <Animated.View
              className="absolute w-48 h-48 rounded-full"
              style={[
                {
                  backgroundColor: theme.COLORS.BRAND_LIGHT,
                },
                animatedStyle2,
              ]}
            />
            {/* Círculo interno animado */}
            <Animated.View
              className="absolute w-40 h-40 rounded-full"
              style={[
                {
                  backgroundColor: theme.COLORS.BRAND_LIGHT,
                },
                animatedStyle3,
              ]}
            />
            {/* Círculo interno com pin (fixo) */}
            <View
              className="w-32 h-32 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
            >
              <MaterialCommunityIcons
                name="map-marker"
                size={80}
                color={theme.COLORS.BRAND_LIGHT}
              />
            </View>
          </View>
        </View>

        {/* Texto principal */}
        <View className="items-center mb-8">
          <Text className="text-white text-3xl font-bold mb-4 text-center">
            Habilite sua localização
          </Text>
          <Text className="text-gray-400 text-base text-center leading-6 px-4">
            Precisamos da sua localização para encontrar entregadores próximos e
            rastrear sua entrega com precisão.
          </Text>
        </View>

        {/* Botões */}
        <View className="w-full gap-4">
          <TouchableOpacity
            className="h-14 rounded-2xl items-center justify-center"
            style={{ backgroundColor: theme.COLORS.BRAND_LIGHT }}
            onPress={onAllow}
          >
            <Text
              className="text-brand-dark font-bold text-lg"
              style={{ color: theme.COLORS.BRAND_DARK }}
            >
              Permitir Localização
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 rounded-2xl items-center justify-center"
            onPress={onSkip}
          >
            <Text className="text-white font-semibold text-base">
              Agora Não
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
