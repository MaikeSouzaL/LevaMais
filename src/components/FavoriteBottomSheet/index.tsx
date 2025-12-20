import React, { useRef, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  PanResponder,
  Dimensions,
} from "react-native";
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
  const { height: SCREEN_HEIGHT } = Dimensions.get("window");

  const BOTTOM_SHEET_MAX_HEIGHT = SCREEN_HEIGHT * 0.7;
  const BOTTOM_SHEET_MIN_HEIGHT = SCREEN_HEIGHT * 0.5;
  const MAX_UPWARD_TRANSLATE_Y =
    BOTTOM_SHEET_MIN_HEIGHT - BOTTOM_SHEET_MAX_HEIGHT;
  const MAX_DOWNWARD_TRANSLATE_Y = 0;
  const DRAG_THRESHOLD = 50;
  const DISMISS_THRESHOLD = 150; // Threshold para fechar completamente

  const animatedValue = useRef(new Animated.Value(0)).current;
  const lastGestureDy = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        animatedValue.setOffset(lastGestureDy.current);
      },
      onPanResponderMove: (_, gesture) => {
        animatedValue.setValue(gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        animatedValue.flattenOffset();
        lastGestureDy.current += gesture.dy;

        // Se arrastar muito para baixo, fechar o bottom sheet
        if (gesture.dy > DISMISS_THRESHOLD && onDismiss) {
          Animated.timing(animatedValue, {
            toValue: BOTTOM_SHEET_MAX_HEIGHT,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onDismiss();
          });
          return;
        }

        if (gesture.dy > DRAG_THRESHOLD) {
          // Arrastar para baixo - minimizar
          Animated.spring(animatedValue, {
            toValue: MAX_DOWNWARD_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
          lastGestureDy.current = MAX_DOWNWARD_TRANSLATE_Y;
        } else if (gesture.dy < -DRAG_THRESHOLD) {
          // Arrastar para cima - expandir
          Animated.spring(animatedValue, {
            toValue: MAX_UPWARD_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
          lastGestureDy.current = MAX_UPWARD_TRANSLATE_Y;
        } else {
          // Voltar para posição mais próxima
          const shouldMinimize =
            lastGestureDy.current > MAX_UPWARD_TRANSLATE_Y / 2;
          Animated.spring(animatedValue, {
            toValue: shouldMinimize
              ? MAX_DOWNWARD_TRANSLATE_Y
              : MAX_UPWARD_TRANSLATE_Y,
            useNativeDriver: true,
          }).start();
          lastGestureDy.current = shouldMinimize
            ? MAX_DOWNWARD_TRANSLATE_Y
            : MAX_UPWARD_TRANSLATE_Y;
        }
      },
    })
  ).current;

  const bottomSheetAnimation = {
    transform: [
      {
        translateY: animatedValue.interpolate({
          inputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          outputRange: [MAX_UPWARD_TRANSLATE_Y, MAX_DOWNWARD_TRANSLATE_Y],
          extrapolate: "clamp",
        }),
      },
    ],
  };

  return (
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
        bottomSheetAnimation,
      ]}
    >
      {/* Handle para arrastar */}
      <View
        {...panResponder.panHandlers}
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
      <View style={{ paddingHorizontal: 24, gap: 16, flex: 1 }}>
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
      </View>
    </Animated.View>
  );
}
