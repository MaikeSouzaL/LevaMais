import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Circle } from "lucide-react-native";
import { MotiView } from "moti";

/**
 * StopPin — marcador DISTINTO para paradas (waypoints) no trajeto.
 *
 * Redesigned: uses a solid orange disc with a circle icon inside,
 * a stem, and an optional index badge. Consistent with the
 * RoutePin visual language (colored head + white border + spike).
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
      {/* Head */}
      <View style={styles.head}>
        <Circle size={14} color="#FFFFFF" fill="#FFFFFF" />
        {typeof index === "number" && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{index}</Text>
          </View>
        )}
      </View>

      {/* Stem */}
      <View style={styles.stem} />

      {/* Base Dot */}
      <View style={styles.baseDot} />
    </View>
  );
}

const HEAD = 28;
const STEM_H = 10;

const styles = StyleSheet.create({
  wrapper: {
    width: HEAD + 10,
    height: HEAD + STEM_H + 10,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  head: {
    width: HEAD,
    height: HEAD,
    borderRadius: HEAD / 2,
    backgroundColor: "#F59E0B",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#F59E0B",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.45,
    shadowRadius: 5,
    elevation: 7,
    zIndex: 10,
  },
  badge: {
    position: "absolute",
    top: -5,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    backgroundColor: "#091A2F",
    borderWidth: 1.5,
    borderColor: "#F59E0B",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  badgeText: {
    color: "#F59E0B",
    fontSize: 9,
    fontWeight: "900",
  },
  stem: {
    width: 3,
    height: STEM_H,
    backgroundColor: "#F59E0B",
    borderBottomLeftRadius: 1.5,
    borderBottomRightRadius: 1.5,
    marginTop: -2,
    zIndex: 9,
  },
  baseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F59E0B",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginTop: -1,
    zIndex: 12,
  },
});
