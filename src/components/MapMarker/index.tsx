import React from "react";
import { View } from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";

type MarkerType =
  | "pickup"
  | "dropoff"
  | "driver"
  | "client"
  | "store"
  | "restaurant"
  | "home"
  | "package";

interface MapMarkerProps {
  type: MarkerType;
  size?: number;
}

const MARKER_CONFIG: Record<
  MarkerType,
  { icon: string; lib: "MaterialIcons" | "MaterialCommunityIcons"; bg: string; border: string }
> = {
  pickup: {
    icon: "cube-outline",
    lib: "MaterialCommunityIcons",
    bg: "#02de95",
    border: "#091A2F",
  },
  dropoff: {
    icon: "location-on",
    lib: "MaterialIcons",
    bg: "#ef4444",
    border: "#fff",
  },
  driver: {
    icon: "directions-car",
    lib: "MaterialIcons",
    bg: "#2563eb",
    border: "#fff",
  },
  client: {
    icon: "person",
    lib: "MaterialIcons",
    bg: "#f97316",
    border: "#fff",
  },
  store: {
    icon: "store",
    lib: "MaterialIcons",
    bg: "#8b5cf6",
    border: "#fff",
  },
  restaurant: {
    icon: "restaurant",
    lib: "MaterialIcons",
    bg: "#f97316",
    border: "#fff",
  },
  home: {
    icon: "home",
    lib: "MaterialIcons",
    bg: "#ec4899",
    border: "#fff",
  },
  package: {
    icon: "package-variant-closed",
    lib: "MaterialCommunityIcons",
    bg: "#02de95",
    border: "#091A2F",
  },
};

export default function MapMarker({ type, size = 24 }: MapMarkerProps) {
  const config = MARKER_CONFIG[type] || MARKER_CONFIG.pickup;
  const circleSize = size;
  const iconSize = Math.round(circleSize * 0.48);
  const triangleSize = Math.round(circleSize * 0.16);
  const totalHeight = circleSize + triangleSize + 2;

  return (
    <View
      style={{
        width: circleSize + 6,
        height: totalHeight,
        alignItems: "center",
        justifyContent: "flex-start",
      }}
    >
      {/* Circle */}
      <View
        style={{
          width: circleSize,
          height: circleSize,
          borderRadius: circleSize / 2,
          backgroundColor: config.bg,
          borderWidth: 2.5,
          borderColor: config.border,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 5,
        }}
      >
        {config.lib === "MaterialCommunityIcons" ? (
          <MaterialCommunityIcons name={config.icon as any} size={iconSize} color="#fff" />
        ) : (
          <MaterialIcons name={config.icon as any} size={iconSize} color="#fff" />
        )}
      </View>

      {/* Triangle spike */}
      <View
        style={{
          width: 0,
          height: 0,
          borderLeftWidth: triangleSize,
          borderRightWidth: triangleSize,
          borderTopWidth: triangleSize + 2,
          borderLeftColor: "transparent",
          borderRightColor: "transparent",
          borderTopColor: config.bg,
          marginTop: -1,
        }}
      />
    </View>
  );
}

export function getClientMarkerType(
  serviceMode?: string,
  servicePurposeLabel?: string,
): MarkerType {
  const text = `${serviceMode || ""} ${servicePurposeLabel || ""}`.toLowerCase();
  if (/restaurant|comida|food|lanche|pizza|açaí|acai/.test(text)) return "restaurant";
  if (/loja|store|shopping|compra|mercado|supermercado|farmácia|farmacia/.test(text)) return "store";
  if (/casa|home|residência|residencia|domicílio|domicilio/.test(text)) return "home";
  if (/pacote|package|encomenda|documento|correspondência|correspondencia/.test(text)) return "package";
  return "client";
}
