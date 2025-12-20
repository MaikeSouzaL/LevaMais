import React from "react";
import { View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

interface VehicleMarkerProps {
  type: "car" | "motorcycle";
  isPulsing?: boolean;
  rotation?: number;
}

export function VehicleMarker({
  type,
  isPulsing = false,
  rotation = 45,
}: VehicleMarkerProps) {
  const iconName = type === "car" ? "directions-car" : "two-wheeler";
  const iconSize = type === "car" ? 20 : 16;
  const containerSize = type === "car" ? "w-10 h-10" : "w-8 h-8";
  const padding = type === "car" ? "p-2" : "p-1.5";

  return (
    <View className="items-center justify-center">
      <View className="relative">
        {/* Glow effect */}
        {isPulsing && (
          <View className="absolute inset-0 bg-primary rounded-full opacity-40 blur-md" />
        )}

        {/* Marker container */}
        <View
          className={`relative bg-background-dark ${padding} rounded-full border border-primary/50 shadow-lg z-10`}
          style={{ transform: [{ rotate: `${rotation}deg` }] }}
        >
          <MaterialIcons
            name={iconName as any}
            size={iconSize}
            color="#02de95"
          />
        </View>
      </View>
    </View>
  );
}
