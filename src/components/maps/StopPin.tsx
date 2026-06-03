import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AlertTriangle } from "lucide-react-native";

/**
 * StopPin — marcador DISTINTO para paradas (waypoints) no trajeto.
 *
 * Diferente do RoutePin de coleta/destino: usa um triângulo verde (AlertTriangle)
 * com haste e bolinha, e mostra opcionalmente o número da parada.
 * Padrão único usado em todos os mapas (motorista + acompanhamento).
 *
 * Use dentro de <Marker anchor={{ x: 0.5, y: 1 }}>.
 */

interface StopPinProps {
  /** Número da parada (1-based) para exibir no badge. */
  index?: number;
}

export default function StopPin({ index }: StopPinProps) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.head}>
        <AlertTriangle size={18} color="#091A2F" fill="#02de95" strokeWidth={2.5} />
        {typeof index === "number" && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{index}</Text>
          </View>
        )}
      </View>
      <View style={styles.spike} />
      <View style={styles.foot} />
    </View>
  );
}

const HEAD = 28;
const SPIKE_H = 10;

const styles = StyleSheet.create({
  wrapper: {
    width: HEAD + 8,
    height: HEAD + SPIKE_H + 8,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  head: {
    width: HEAD,
    height: HEAD,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 3,
    backgroundColor: "#091A2F",
    borderWidth: 1.5,
    borderColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#02de95",
    fontSize: 9,
    fontWeight: "900",
  },
  spike: {
    width: 3,
    height: SPIKE_H,
    backgroundColor: "#02de95",
    borderBottomLeftRadius: 1,
    borderBottomRightRadius: 1,
  },
  foot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#02de95",
    borderWidth: 1,
    borderColor: "#ffffff",
    marginTop: -1,
  },
});
