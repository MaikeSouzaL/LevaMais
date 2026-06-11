import React from "react";
import { View, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { MotiView } from "moti";

/**
 * RoutePin — marcador de ponto padrão de TODOS os mapas (coleta / destino / motorista / cliente).
 *
 * É o mesmo "drop-pin" que o motorista vê quando está a caminho:
 * cabeça colorida, borda branca, haste (spike) e uma bolinha no base.
 *
 *  - pickup   -> verde (#02de95)  = ponto de coleta / embarque
 *  - dropoff  -> vermelho (#ef4444) = ponto de entrega / desembarque
 *  - driver   -> azul (#3B82F6) com ícone de carro = motorista em tempo real
 *  - client   -> verde (#02de95) com ícone de pessoa = cliente em tempo real
 *
 * Use sempre dentro de <Marker anchor={{ x: 0.35, y: 0.75 }}> para que a ponta toque a coordenada.
 */

export type RoutePinVariant = "pickup" | "dropoff" | "driver" | "client";

interface RoutePinProps {
  variant: RoutePinVariant;
  /** Substitui a bolinha/ícone padrão por um nó customizado. */
  iconNode?: React.ReactNode;
}

const VARIANT_CONFIG: Record<RoutePinVariant, { bg: string; icon?: string; iconColor: string }> = {
  pickup: { bg: "#02de95", iconColor: "#FFFFFF" },
  dropoff: { bg: "#ef4444", iconColor: "#FFFFFF" },
  driver: { bg: "#3B82F6", icon: "directions-car", iconColor: "#FFFFFF" },
  client: { bg: "#02de95", icon: "person", iconColor: "#FFFFFF" },
};

export default function RoutePin({ variant, iconNode }: RoutePinProps) {
  const config = VARIANT_CONFIG[variant];
  const showPulse = variant === "driver" || variant === "client";

  const renderCenter = () => {
    if (iconNode) return iconNode;
    if (config.icon) {
      return <Icon name={config.icon as any} size={16} color={config.iconColor} />;
    }
    return <View style={[styles.innerDot, { backgroundColor: config.iconColor }]} />;
  };

  return (
    <View style={styles.wrapper}>
      {/* Pulse ring for live markers (driver/client) */}
      {showPulse && (
        <MotiView
          from={{ scale: 0.6, opacity: 0.7 }}
          animate={{ scale: 2.5, opacity: 0 }}
          transition={{ loop: true, type: "timing", duration: 1800 }}
          style={[styles.pulseRing, { backgroundColor: config.bg }]}
        />
      )}

      {/* Pin Head */}
      <View
        style={[
          styles.head,
          {
            backgroundColor: config.bg,
            shadowColor: config.bg,
          },
        ]}
      >
        {renderCenter()}
      </View>

      {/* Spike / Stem */}
      <View style={[styles.spike, { borderTopColor: config.bg }]} />
    </View>
  );
}

const HEAD = 32;
const SPIKE_H = 14;

const styles = StyleSheet.create({
  wrapper: {
    width: HEAD + 10,
    height: HEAD + SPIKE_H + 4,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  pulseRing: {
    position: "absolute",
    top: HEAD / 2 - 8,
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
    overflow: "hidden",
  },
  innerDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  spike: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: SPIKE_H,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
    zIndex: 9,
  },
});
