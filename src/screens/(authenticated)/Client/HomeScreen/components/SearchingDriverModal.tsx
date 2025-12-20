import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, Animated, Easing } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

interface SearchingDriverModalProps {
  visible: boolean;
  serviceTitle: string; // e.g., "Leva+ Moto"
  price: string; // e.g., "R$ 15,90"
  etaText: string; // e.g., "Chegada em ~5 min"
  distanceText?: string; // e.g., "4.2 km • Sem paradas"
  paymentText?: string; // e.g., "Mastercard •••• 4242"
  onCancel?: () => void;
  onBack?: () => void;
  onHelp?: () => void;
}

export function SearchingDriverModal({
  visible,
  serviceTitle,
  price,
  etaText,
  distanceText = "4.2 km • Sem paradas",
  paymentText = "Mastercard •••• 4242",
  onCancel,
  onBack,
  onHelp,
}: SearchingDriverModalProps) {
  if (!visible) return null;

  // Animated radar setup
  const rotateAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
  }, [rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  // Generate trail segments for the smooth radar sweep
  const TRAIL_SEGMENTS = 60;
  const trailSegments = Array.from({ length: TRAIL_SEGMENTS }).map((_, i) => {
    // Opacity fades from 0.4 to 0
    const opacity = 0.4 * (1 - i / TRAIL_SEGMENTS);
    return {
      rotation: -i * 1.5, // 1.5 degrees per segment
      opacity,
    };
  });

  return (
    <SafeAreaView
      style={{
        position: "absolute",
        inset: 0 as any,
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        // Transparent to show map behind
        backgroundColor: "transparent",
        zIndex: 60,
      }}
    >
      {/* Top bar */}
      <View
        style={{
          paddingTop: 16,
          paddingHorizontal: 12,
          paddingBottom: 12,
          // semi-transparent top bar
          backgroundColor: "rgba(0,0,0,0.4)",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={onBack}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <MaterialIcons name="arrow-back" size={22} color="#fff" />
          </TouchableOpacity>
          <View
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 9999,
              backgroundColor: "rgba(0,0,0,0.4)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <Text
              style={{
                color: "#06db94",
                fontSize: 12,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              Buscando
            </Text>
          </View>
          <TouchableOpacity
            onPress={onHelp}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.1)",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            <MaterialIcons name="help" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Center status */}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 20,
        }}
      >
        {/* Animated radar */}
        <View
          style={{
            marginBottom: 12,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Radar container */}
          <View
            style={{
              width: 220,
              height: 220,
              borderRadius: 110,
              backgroundColor: "rgba(6,219,148,0.06)",
              borderWidth: 2,
              borderColor: "rgba(6,219,148,0.35)",
              overflow: "hidden",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* Grid lines */}
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
              }}
            >
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={`h-${i}`}
                  style={{
                    position: "absolute",
                    top: (i + 1) * (220 / 7),
                    left: 0,
                    right: 0,
                    height: 1,
                    backgroundColor: "rgba(6,219,148,0.15)",
                  }}
                />
              ))}
              {Array.from({ length: 6 }).map((_, i) => (
                <View
                  key={`v-${i}`}
                  style={{
                    position: "absolute",
                    left: (i + 1) * (220 / 7),
                    top: 0,
                    bottom: 0,
                    width: 1,
                    backgroundColor: "rgba(6,219,148,0.15)",
                  }}
                />
              ))}
            </View>

            {/* Rings */}
            {[40, 80, 120, 160].map((size, idx) => (
              <View
                key={size}
                style={{
                  position: "absolute",
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 1,
                  borderColor: "rgba(6,219,148,0.35)",
                }}
              />
            ))}

            {/* Rotating Radar Container */}
            <Animated.View
              style={{
                position: "absolute",
                width: 220,
                height: 220,
                alignItems: "center",
                justifyContent: "center",
                transform: [{ rotate: spin }],
              }}
            >
              {/* Trail Segments */}
              {trailSegments.map((segment, idx) => (
                <View
                  key={`trail-${idx}`}
                  style={{
                    position: "absolute",
                    width: 112, // slightly longer to ensure coverage
                    height: 5, // thick enough to overlap
                    backgroundColor: `rgba(6,219,148,${segment.opacity})`,
                    transform: [
                      { rotate: `${segment.rotation}deg` },
                      { translateX: 56 },
                    ],
                  }}
                />
              ))}

              {/* Main Pointer */}
              <View
                style={{
                  position: "absolute",
                  width: 115,
                  height: 3,
                  backgroundColor: "rgba(6,219,148,1)",
                  shadowColor: "#06db94",
                  shadowOpacity: 0.8,
                  shadowRadius: 6,
                  elevation: 4,
                  transform: [{ translateX: 57.5 }],
                }}
              />
            </Animated.View>

            {/* Center dot (slightly bigger to hide any inner tip) */}
            <View
              style={{
                width: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: "#06db94",
              }}
            />
          </View>
        </View>
        <Text
          style={{
            color: "#fff",
            fontSize: 22,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 6,
          }}
        >
          Procurando motorista{"\n"}disponível...
        </Text>
        <Text
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: 13,
            textAlign: "center",
            maxWidth: 260,
          }}
        >
          Isso pode levar alguns segundos, estamos conectando você.
        </Text>
      </View>

      {/* Bottom card */}
      <View style={{ padding: 16, paddingBottom: 24 }}>
        <View
          style={{
            backgroundColor: "#1b2723",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            padding: 16,
          }}
        >
          {/* progress */}
          <View
            style={{
              width: "100%",
              height: 4,
              borderRadius: 9999,
              backgroundColor: "rgba(255,255,255,0.1)",
              overflow: "hidden",
              marginBottom: 16,
            }}
          >
            <View
              style={{
                height: "100%",
                width: "35%",
                backgroundColor: "#06db94",
                borderRadius: 9999,
              }}
            />
          </View>

          {/* header info */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "flex-start",
              justifyContent: "space-between",
              marginBottom: 16,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "rgba(255,255,255,0.06)",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                }}
              >
                <MaterialIcons name="two-wheeler" size={24} color="#06db94" />
              </View>
              <View>
                <Text
                  style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}
                >
                  {serviceTitle}
                </Text>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <MaterialIcons
                    name="schedule"
                    size={14}
                    color="rgba(255,255,255,0.7)"
                  />
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}
                  >
                    {etaText}
                  </Text>
                </View>
              </View>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>
                {price}
              </Text>
              <Text
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 12,
                  textDecorationLine: "line-through",
                }}
              >
                R$ 18,50
              </Text>
            </View>
          </View>

          {/* route */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(255,255,255,0.06)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.06)",
              marginBottom: 12,
            }}
          >
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#06db94",
                }}
              />
              <View
                style={{
                  width: 2,
                  height: 12,
                  backgroundColor: "rgba(255,255,255,0.2)",
                  marginVertical: 2,
                }}
              />
              <View
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.6)",
                }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12 }}>
                Distância total
              </Text>
              <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
                {distanceText}
              </Text>
            </View>
          </View>

          {/* payment */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 4,
              marginBottom: 12,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <MaterialIcons
                name="credit-card"
                size={18}
                color="rgba(255,255,255,0.7)"
              />
              <Text style={{ color: "#ddd" }}>{paymentText}</Text>
            </View>
            <TouchableOpacity>
              <Text
                style={{ color: "#06db94", fontSize: 12, fontWeight: "800" }}
              >
                TROCAR
              </Text>
            </TouchableOpacity>
          </View>

          {/* cancel */}
          <View>
            <TouchableOpacity
              onPress={onCancel}
              style={{
                width: "100%",
                paddingVertical: 14,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "rgba(239,68,68,0.3)",
                backgroundColor: "transparent",
              }}
            >
              <Text
                style={{
                  color: "#ef4444",
                  textAlign: "center",
                  fontWeight: "700",
                }}
              >
                Cancelar busca
              </Text>
            </TouchableOpacity>
            <Text
              style={{
                color: "rgba(255,255,255,0.4)",
                textAlign: "center",
                fontSize: 10,
                marginTop: 6,
              }}
            >
              Você não será cobrado se cancelar agora
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}
