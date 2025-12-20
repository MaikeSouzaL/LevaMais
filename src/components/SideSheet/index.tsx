import React, { forwardRef, useCallback } from "react";
import { View, StyleSheet, Dimensions, TouchableOpacity } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from "react-native-reanimated";
import {
  GestureDetector,
  Gesture,
  PanGestureHandlerEventPayload,
} from "react-native-gesture-handler";
import { MaterialIcons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Larguras possíveis do SideSheet
const SNAP_POINTS = {
  CLOSED: -SCREEN_WIDTH, // Totalmente fora da tela (esquerda)
  PEEK: -SCREEN_WIDTH + 60, // Apenas borda visível (60px)
  HALF: -SCREEN_WIDTH * 0.4, // 60% da tela
  FULL: 0, // Tela cheia
};

interface SideSheetProps {
  children?: React.ReactNode;
  side?: "left" | "right"; // Lado de onde vem
  initialSnap?: "peek" | "half" | "full"; // Posição inicial
  backgroundColor?: string;
}

export interface SideSheetMethods {
  snapToPosition: (position: "closed" | "peek" | "half" | "full") => void;
  close: () => void;
  open: () => void;
}

export const SideSheet = forwardRef<SideSheetMethods, SideSheetProps>(
  (
    {
      children,
      side = "right",
      initialSnap = "peek",
      backgroundColor = "#0f231c",
    },
    ref
  ) => {
    // Posição inicial baseada no prop
    const getInitialPosition = () => {
      switch (initialSnap) {
        case "peek":
          return SNAP_POINTS.PEEK;
        case "half":
          return SNAP_POINTS.HALF;
        case "full":
          return SNAP_POINTS.FULL;
        default:
          return SNAP_POINTS.PEEK;
      }
    };

    const translateX = useSharedValue(getInitialPosition());
    const context = useSharedValue({ x: 0 });

    // Funções para controlar o SideSheet
    const snapToPosition = useCallback(
      (position: "closed" | "peek" | "half" | "full") => {
        "worklet";
        const targetPosition =
          SNAP_POINTS[position.toUpperCase() as keyof typeof SNAP_POINTS];
        translateX.value = withSpring(targetPosition, {
          damping: 50,
          stiffness: 400,
        });
      },
      []
    );

    const close = useCallback(() => {
      snapToPosition("closed");
    }, [snapToPosition]);

    const open = useCallback(() => {
      snapToPosition("half");
    }, [snapToPosition]);

    // Expor métodos via ref
    React.useImperativeHandle(ref, () => ({
      snapToPosition,
      close,
      open,
    }));

    // Função para encontrar o snap point mais próximo
    const findNearestSnapPoint = (currentX: number) => {
      "worklet";
      const snapValues = Object.values(SNAP_POINTS);
      let nearest = snapValues[0];
      let minDistance = Math.abs(currentX - nearest);

      snapValues.forEach((snap) => {
        const distance = Math.abs(currentX - snap);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = snap;
        }
      });

      return nearest;
    };

    // Gesto de pan (arrastar)
    const panGesture = Gesture.Pan()
      .onStart(() => {
        context.value = { x: translateX.value };
      })
      .onUpdate((event) => {
        // Para side="left", arrastar para direita aumenta translateX (abre)
        // Para side="right", arrastar para esquerda diminui translateX (abre)
        const newX = context.value.x + event.translationX;

        if (side === "left") {
          // Limitar entre -SCREEN_WIDTH (fechado) e 0 (totalmente aberto)
          translateX.value = Math.max(-SCREEN_WIDTH, Math.min(0, newX));
        } else {
          // Para right side
          translateX.value = Math.max(0, Math.min(SCREEN_WIDTH, newX));
        }
      })
      .onEnd((event) => {
        // Velocidade do gesto
        const velocity = event.velocityX;

        if (side === "left") {
          // Se arrastar rápido para direita, abre
          if (velocity > 500) {
            translateX.value = withSpring(SNAP_POINTS.FULL, {
              velocity,
              damping: 50,
              stiffness: 400,
            });
            return;
          }

          // Se arrastar rápido para esquerda, fecha
          if (velocity < -500) {
            translateX.value = withSpring(SNAP_POINTS.CLOSED, {
              velocity,
              damping: 50,
              stiffness: 400,
            });
            return;
          }
        } else {
          // Para side="right"
          if (velocity > 500) {
            translateX.value = withSpring(SNAP_POINTS.CLOSED, {
              velocity,
              damping: 50,
              stiffness: 400,
            });
            return;
          }

          if (velocity < -500) {
            translateX.value = withSpring(SNAP_POINTS.FULL, {
              velocity,
              damping: 50,
              stiffness: 400,
            });
            return;
          }
        }

        // Se não tem velocidade forte, encontra o snap point mais próximo
        const nearest = findNearestSnapPoint(translateX.value);
        translateX.value = withSpring(nearest, {
          damping: 50,
          stiffness: 400,
        });
      });

    // Estilo animado
    const animatedStyle = useAnimatedStyle(() => ({
      transform: [{ translateX: translateX.value }],
    }));

    return (
      <>
        {/* Backdrop - escurece o fundo quando aberto */}
        <Animated.View
          style={[
            styles.backdrop,
            useAnimatedStyle(() => ({
              opacity:
                side === "left"
                  ? 1 + translateX.value / SCREEN_WIDTH
                  : 1 - translateX.value / SCREEN_WIDTH,
              pointerEvents:
                side === "left"
                  ? translateX.value <= -SCREEN_WIDTH + 10
                    ? "none"
                    : "auto"
                  : translateX.value >= SCREEN_WIDTH - 10
                  ? "none"
                  : "auto",
            })),
          ]}
          pointerEvents={
            side === "left"
              ? translateX.value <= -SCREEN_WIDTH + 10
                ? "none"
                : "box-none"
              : translateX.value >= SCREEN_WIDTH - 10
              ? "none"
              : "box-none"
          }
        />

        {/* SideSheet Container - ocupa toda altura */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.container,
              side === "right" ? styles.rightSide : styles.leftSide,
              { backgroundColor },
              animatedStyle,
            ]}
          >
            {/* Conteúdo */}
            <View
              style={[
                styles.content,
                side === "left" ? { paddingRight: 60 } : { paddingLeft: 40 },
              ]}
            >
              {children}
            </View>
          </Animated.View>
        </GestureDetector>

        {/* Handle - separado, apenas no centro, sempre visível */}
        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.handleWrapper,
              side === "left"
                ? styles.handleWrapperLeft
                : styles.handleWrapperRight,
              useAnimatedStyle(() => ({
                transform: [{ translateX: translateX.value }],
              })),
            ]}
            pointerEvents="box-none"
          >
            <View
              style={[
                styles.handleContainer,
                side === "left" ? styles.handleLeft : styles.handleRight,
              ]}
            >
              <View style={styles.handle} />
              <MaterialIcons
                name={side === "left" ? "chevron-right" : "chevron-left"}
                size={24}
                color="#02de95"
              />
            </View>
          </Animated.View>
        </GestureDetector>
      </>
    );
  }
);

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 40,
  },
  container: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
    zIndex: 50,
    shadowColor: "#000",
    shadowOffset: {
      width: -4,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  rightSide: {
    right: 0,
  },
  leftSide: {
    left: 0,
  },
  handleWrapper: {
    position: "absolute",
    top: "50%",
    width: 50,
    height: 80,
    marginTop: -40, // Centraliza verticalmente (metade da altura)
    zIndex: 60, // Acima do container
  },
  handleWrapperLeft: {
    left: 0,
  },
  handleWrapperRight: {
    right: 0,
  },
  handleContainer: {
    width: 50,
    height: 80,
    backgroundColor: "#16201d",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#02de95",
  },
  handleLeft: {
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 0,
  },
  handleRight: {
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderRightWidth: 0,
  },
  handle: {
    width: 4,
    height: 40,
    backgroundColor: "#02de95",
    borderRadius: 2,
    marginBottom: 4,
  },
  content: {
    flex: 1,
  },
});

SideSheet.displayName = "SideSheet";
