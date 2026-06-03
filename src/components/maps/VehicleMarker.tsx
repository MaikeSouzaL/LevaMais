import React, { useState } from "react";
import { View, StyleSheet, Image } from "react-native";
import { MotiView } from "moti";
import { Icon } from "@/components/ui/Icon";

export type VehicleType = "motorcycle" | "car" | "van" | "truck" | "moto" | "carro";

interface VehicleMarkerProps {
  type: VehicleType;
  isOnline?: boolean;
  avatarUrl?: string;
}

const VEHICLE_ICONS: Record<"motorcycle" | "car" | "van" | "truck", { name: string; size: number }> = {
  motorcycle: { name: "motorcycle", size: 14 },
  car: { name: "car", size: 13 },
  van: { name: "truck", size: 12 },
  truck: { name: "truck", size: 12 },
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
      {/* Outer breathing pulse ring */}
      <MotiView
        from={{ scale: 0.6, opacity: 0.7 }}
        animate={{ scale: 2.5, opacity: 0 }}
        transition={{ loop: true, type: "timing", duration: 2000 }}
        style={[styles.pulseRing, { backgroundColor: accentColor }]}
      />

      {/* Secondary pulse ring (delayed) */}
      <MotiView
        from={{ scale: 0.6, opacity: 0.5 }}
        animate={{ scale: 2.0, opacity: 0 }}
        transition={{ loop: true, type: "timing", duration: 2000, delay: 600 }}
        style={[styles.pulseRing, { backgroundColor: accentColor }]}
      />

      {/* Puck: photo if available, otherwise vehicle icon */}
      <View
        style={[
          styles.puck,
          {
            backgroundColor: showAvatar ? "#091A2F" : accentColor,
            borderColor: "#FFFFFF",
            shadowColor: accentColor,
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
          <Icon
            name={config.name as any}
            size={config.size}
            color="#091A2F"
          />
        )}
      </View>
    </View>
  );
};

const PUCK_SIZE = 30;

const styles = StyleSheet.create({
  container: {
    width: PUCK_SIZE + 12,
    height: PUCK_SIZE + 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: PUCK_SIZE,
    height: PUCK_SIZE,
    borderRadius: PUCK_SIZE / 2,
  },
  puck: {
    width: PUCK_SIZE,
    height: PUCK_SIZE,
    borderRadius: PUCK_SIZE / 2,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    overflow: "hidden",
  },
  avatar: {
    width: "100%",
    height: "100%",
    borderRadius: PUCK_SIZE / 2,
    resizeMode: "cover",
  },
});
