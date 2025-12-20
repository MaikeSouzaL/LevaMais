import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
} from "react-native-reanimated";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface FavoriteBottomSheetProps {
  address: string;
  isGeocodingLoading: boolean;
  favoriteLabel: string;
  selectedIcon: string;
  onLabelChange: (label: string) => void;
  onIconSelect: (icon: string) => void;
  onSave: () => void;
  onDismiss?: () => void;
}

const favoriteIcons = [
  { icon: "home", label: "Casa" },
  { icon: "work", label: "Trabalho" },
  { icon: "favorite", label: "Favorito" },
  { icon: "shopping-cart", label: "Mercado" },
  { icon: "school", label: "Escola" },
  { icon: "fitness-center", label: "Academia" },
  { icon: "local-hospital", label: "Hospital" },
  { icon: "restaurant", label: "Restaurante" },
];

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FavoriteBottomSheet({
  address,
  isGeocodingLoading,
  favoriteLabel,
  selectedIcon,
  onLabelChange,
  onIconSelect,
  onSave,
  onDismiss,
}: FavoriteBottomSheetProps) {
  const insets = useSafeAreaInsets();

  const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
  const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.35;
  
  // Snap points (relative to initial position 0)
  const SNAP_TOP = 0;
  const SNAP_BOTTOM = BOTTOM_SHEET_MAX_HEIGHT - BOTTOM_SHEET_MIN_HEIGHT;

  const translateY = useSharedValue(0);
  const context = useSharedValue({ y: 0 });

  const scrollTo = useCallback((destination: number) => {
    "worklet";
    translateY.value = withSpring(destination, {
      damping: 50,
      stiffness: 400,
    });
  }, []);

  const gesture = Gesture.Pan()
    .onStart(() => {
      context.value = { y: translateY.value };
    })
    .onUpdate((event) => {
      translateY.value = event.translationY + context.value.y;
      
      // Resistance when dragging beyond limits
      if (translateY.value < SNAP_TOP) {
        translateY.value = SNAP_TOP + (translateY.value - SNAP_TOP) * 0.5;
      }
    })
    .onEnd((event) => {
      // Se tiver onDismiss e arrastar muito para baixo
      if (onDismiss && translateY.value > SNAP_BOTTOM + 50) {
        runOnJS(onDismiss)();
        return;
      }

      // Calculate where to snap based on velocity and position
      if (event.velocityY > 500) {
        // Fling down
        scrollTo(SNAP_BOTTOM);
      } else if (event.velocityY < -500) {
        // Fling up
        scrollTo(SNAP_TOP);
      } else {
        // Snap to closest
        const midPoint = (SNAP_TOP + SNAP_BOTTOM) / 2;
        if (translateY.value > midPoint) {
          scrollTo(SNAP_BOTTOM);
        } else {
          scrollTo(SNAP_TOP);
        }
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 30,
            backgroundColor: "#111818",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            borderTopWidth: 1,
            borderTopColor: "rgba(255,255,255,0.05)",
            paddingBottom: Math.max(insets.bottom, 24),
            shadowColor: "#000",
            shadowOffset: { width: 0, height: -10 },
            shadowOpacity: 0.5,
            shadowRadius: 40,
            elevation: 20,
            height: BOTTOM_SHEET_MAX_HEIGHT,
          },
          animatedStyle,
        ]}
      >
        {/* Handle para arrastar */}
        <View
          style={{
            height: 24,
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 8,
          }}
        >
          <View
            style={{
              width: 48,
              height: 4,
              borderRadius: 9999,
              backgroundColor: "#3b5454",
            }}
          />
        </View>

        {/* Conteúdo do Bottom Sheet */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === "android" ? 0 : 0}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              gap: 16,
              paddingBottom: 24,
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Text
              style={{
                color: "#9db9b9",
                fontSize: 14,
                fontWeight: "500",
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Configurar Favorito
            </Text>

            {/* Endereço */}
            <View style={{ alignItems: "center", gap: 4 }}>
              {isGeocodingLoading ? (
                <View
                  style={{
                    alignItems: "center",
                    gap: 8,
                    paddingVertical: 16,
                  }}
                >
                  <ActivityIndicator size="small" color="#02de95" />
                  <Text
                    style={{
                      color: "#9db9b9",
                      fontSize: 16,
                      fontWeight: "500",
                      textAlign: "center",
                    }}
                  >
                    Buscando endereço...
                  </Text>
                </View>
              ) : (
                <>
                  {(() => {
                    const parts = address.split(" - ");
                    const ruaNumero = parts[0] || address;
                    const resto = parts.slice(1).join(" - ");

                    return (
                      <>
                        <Text
                          style={{
                            color: "#fff",
                            fontSize: 20,
                            fontWeight: "700",
                            textAlign: "center",
                          }}
                          numberOfLines={2}
                        >
                          {ruaNumero}
                        </Text>
                        {resto && (
                          <Text
                            style={{
                              color: "#9db9b9",
                              fontSize: 14,
                              fontWeight: "400",
                              textAlign: "center",
                            }}
                          >
                            {resto}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </View>

            {/* Nome do Favorito */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#1c2727",
                borderRadius: 12,
                padding: 12,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.05)",
                gap: 12,
              }}
            >
              <MaterialIcons name="label" size={20} color="#02de95" />
              <TextInput
                placeholder="Nome do favorito (ex: Casa, Trabalho)"
                placeholderTextColor="#9db9b9"
                value={favoriteLabel}
                onChangeText={onLabelChange}
                onFocus={() => scrollTo(SNAP_TOP)}
                style={{ flex: 1, color: "#fff", fontSize: 14, padding: 0 }}
              />
            </View>

            {/* Seleção de Ícone */}
            <View>
              <Text
                style={{
                  color: "#9db9b9",
                  fontSize: 12,
                  fontWeight: "500",
                  marginBottom: 8,
                }}
              >
                Escolha um ícone:
              </Text>
              <View
                style={{
                  flexDirection: "row",
                  flexWrap: "wrap",
                  gap: 8,
                }}
              >
                {favoriteIcons.map((item) => (
                  <TouchableOpacity
                    key={item.icon}
                    onPress={() => onIconSelect(item.icon)}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 12,
                      backgroundColor:
                        selectedIcon === item.icon
                          ? "rgba(2, 222, 149, 0.2)"
                          : "#1c2727",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: 2,
                      borderColor:
                        selectedIcon === item.icon ? "#02de95" : "transparent",
                    }}
                  >
                    <MaterialIcons
                      name={item.icon as any}
                      size={24}
                      color={selectedIcon === item.icon ? "#02de95" : "#9db9b9"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Botão Salvar */}
            <TouchableOpacity
              onPress={onSave}
              activeOpacity={0.9}
              style={{
                width: "100%",
                height: 56,
                backgroundColor: "#02de95",
                borderRadius: 9999,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.3,
                shadowRadius: 20,
                elevation: 10,
              }}
            >
              <MaterialIcons name="bookmark" size={20} color="#111818" />
              <Text style={{ color: "#111818", fontSize: 16, fontWeight: "700" }}>
                Salvar Favorito
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </GestureDetector>
  );
}
