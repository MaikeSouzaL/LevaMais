import React from "react";
import { View } from "react-native";
import { MotiView } from "moti";
import { MaterialCommunityIcons } from "@expo/vector-icons";

export type VehicleType = "motorcycle" | "car" | "van" | "truck";

interface VehicleMarkerProps {
  type: VehicleType;
  isOnline?: boolean;
}

const VEHICLE_ICONS: Record<VehicleType, { name: string; size: number }> = {
  motorcycle: { name: "moped", size: 14 },
  car: { name: "car", size: 14 },
  van: { name: "van-side", size: 14 },
  truck: { name: "truck", size: 13 },
};

export const VehicleMarker = ({ type, isOnline = true }: VehicleMarkerProps) => {
  const config = VEHICLE_ICONS[type] || VEHICLE_ICONS.motorcycle;
  const accentColor = isOnline ? "#02de95" : "#94a3b8";
  
  // Replicate the client's exact RoutePulseIndicator styling structure
  return (
    <View className="w-10 h-10 items-center justify-center" style={{ overflow: "visible" }}>
      {/* Breathing glow outer ring - exactly like client */}
      <MotiView
        from={{ scale: 0.8, opacity: 0.9 }}
        animate={{ scale: 1.8, opacity: 0 }}
        transition={{
          loop: true,
          type: "timing",
          duration: 1500,
        }}
        style={{
          position: "absolute",
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: accentColor,
          opacity: 0.4
        }}
      />
      
      {/* The actual dynamic active vehicle icon puck */}
      <View 
        className="w-7 h-7 bg-[#11253E] border-2 rounded-full items-center justify-center"
        style={{
          borderColor: accentColor,
          // Avoid dynamic shadowed elevation explicitly, relies on Tailwind / absolute static
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
