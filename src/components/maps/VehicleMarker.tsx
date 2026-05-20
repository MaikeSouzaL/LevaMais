import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { MotiView } from "moti";
import { FontAwesome5 } from "@expo/vector-icons";

export type VehicleType = "motorcycle" | "car" | "van" | "truck" | "moto" | "carro";

interface VehicleMarkerProps {
  type: VehicleType;
  isOnline?: boolean;
  avatarUrl?: string;
}

const VEHICLE_ICONS: Record<"motorcycle" | "car" | "van" | "truck", { name: string; size: number }> = {
  motorcycle: { name: "motorcycle", size: 12 },
  car: { name: "car", size: 11 },
  van: { name: "truck", size: 10 },
  truck: { name: "truck", size: 10 },
};

const normalizeVehicleType = (type?: string): "motorcycle" | "car" | "van" | "truck" => {
  const t = String(type || "").toLowerCase();
  if (t === "moto" || t === "motorcycle") return "motorcycle";
  if (t === "carro" || t === "car") return "car";
  if (t === "van") return "van";
  if (t === "truck" || t === "caminhao" || t === "caminhão") return "truck";
  return "motorcycle";
};

export const VehicleMarker = ({ type, isOnline = true, avatarUrl }: VehicleMarkerProps) => {
  const [imageError, setImageError] = useState(false);
  const normalizedType = normalizeVehicleType(type);
  const config = VEHICLE_ICONS[normalizedType] || VEHICLE_ICONS.motorcycle;
  const accentColor = isOnline ? "#02de95" : "#94a3b8";

  const showAvatar = !!avatarUrl && !imageError;

  return (
    <View style={styles.container}>
      {/* Pulsing neon ring */}
      <MotiView
        from={{ scale: 0.7, opacity: 0.9 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{ loop: true, type: "timing", duration: 1800 }}
        style={[styles.pulseRing, { backgroundColor: accentColor }]}
      />

      {/* Puck: photo if available, otherwise motorbike icon on neon background */}
      <View
        style={[
          styles.puck,
          { 
            backgroundColor: showAvatar ? "#091A2F" : accentColor,
            borderColor: accentColor,
          },
        ]}
      >
        {showAvatar ? (
          <Image
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            onError={() => setImageError(true)}
          />
        ) : (
          <FontAwesome5
            name={config.name as any}
            size={config.size}
            color={showAvatar ? accentColor : "#091A2F"}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    opacity: 0.4,
  },
  puck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#02de95",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: 11,
    resizeMode: "cover",
  },
});
