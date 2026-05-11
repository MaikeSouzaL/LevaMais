import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

export type VehicleType = "motorcycle" | "car" | "van" | "truck";

interface VehicleMarkerProps {
  type: VehicleType;
  isOnline?: boolean;
}

const VEHICLE_ICONS: Record<VehicleType, { name: string; size: number }> = {
  motorcycle: { name: "moped", size: 16 },
  car: { name: "car", size: 16 },
  van: { name: "van-side", size: 16 },
  truck: { name: "truck", size: 15 },
};

export const VehicleMarker = ({ type, isOnline = true }: VehicleMarkerProps) => {
  const config = VEHICLE_ICONS[type] || VEHICLE_ICONS.motorcycle;
  const accentColor = isOnline ? "#02de95" : "#94a3b8"; // Green if online, gray if offline

  return (
    <View 
      style={{ 
        width: 48, 
        height: 48, 
        alignItems: "center", 
        justifyContent: "center",
        overflow: "visible"
      }}
    >
      {/* Static Halo Drop Shadow Anchor */}
      <View
        style={{
          position: "absolute",
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#091A2F",
          opacity: 0.5,
          transform: [{ translateY: 2 }],
        }}
      />

      {/* Core High-Def Enclosure */}
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: 15,
          backgroundColor: "#11253E",
          borderWidth: 2.5,
          borderColor: accentColor,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MaterialCommunityIcons 
          name={config.name as any} 
          size={config.size} 
          color={accentColor} 
        />
      </View>
    </View>
  );
};
