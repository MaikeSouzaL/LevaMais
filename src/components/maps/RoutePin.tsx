import React from "react";
import { View, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

/**
 * RoutePin — marcador de ponto padrão de TODOS os mapas (coleta / destino / motorista / cliente).
 *
 * É o mesmo "drop-pin" que o motorista vê quando está a caminho:
 * cabeça #091A2F, borda branca, haste (spike) e uma bolinha colorida (ou ícone) no centro.
 *
 *  - pickup   -> bolinha azul (#60a5fa) = ponto de coleta / embarque
 *  - dropoff  -> bolinha verde (#02de95) = ponto de entrega / desembarque
 *  - driver   -> ícone de carro azul = motorista em tempo real
 *  - client   -> ícone de pessoa verde = cliente em tempo real
 *
 * Use sempre dentro de <Marker anchor={{ x: 0.5, y: 1 }}> para que a ponta toque a coordenada.
 */

export type RoutePinVariant = "pickup" | "dropoff" | "driver" | "client";

interface RoutePinProps {
  variant: RoutePinVariant;
  /** Substitui a bolinha/ícone padrão por um nó customizado. */
  iconNode?: React.ReactNode;
}

const DOT_COLOR: Record<RoutePinVariant, string> = {
  pickup: "#60a5fa",
  dropoff: "#02de95",
  driver: "#60a5fa",
  client: "#02de95",
};

export default function RoutePin({ variant, iconNode }: RoutePinProps) {
  const renderCenter = () => {
    if (iconNode) return iconNode;
    if (variant === "driver") {
      return <MaterialIcons name="directions-car" size={16} color={DOT_COLOR.driver} />;
    }
    if (variant === "client") {
      return <MaterialIcons name="person" size={16} color={DOT_COLOR.client} />;
    }
    return <View style={[styles.dot, { backgroundColor: DOT_COLOR[variant] }]} />;
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.head}>{renderCenter()}</View>
      <View style={styles.spike} />
    </View>
  );
}

const HEAD = 30;
const SPIKE_H = 22;

const styles = StyleSheet.create({
  wrapper: {
    width: HEAD + 8,
    height: HEAD + SPIKE_H + 2,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    backgroundColor: "#091A2F",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 6,
  },
  dot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
  },
  spike: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: SPIKE_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderTopColor: "#091A2F",
    marginTop: -1,
  },
});
