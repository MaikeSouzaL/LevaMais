import React from "react";
import { useNavigation } from "@react-navigation/native";

import { MapFabButton } from "../../../../components/ui/MapFabButton";

export type DriverMapMenuButtonProps = {
  /** absolute positioning handled by parent; expose only onPress override when needed */
  onPress?: () => void;
};

export function DriverMapMenuButton({ onPress }: DriverMapMenuButtonProps) {
  const navigation = useNavigation();

  return (
    <MapFabButton
      icon="menu"
      onPress={onPress ?? (() => (navigation as any).openDrawer?.())}
      size={48}
      iconSize={24}
      backgroundColor="rgba(17,24,22,0.88)"
      activeBackgroundColor="#1b2723"
      iconColor="#02de95"
      accessibilityLabel="Abrir menu"
    />
  );
}
