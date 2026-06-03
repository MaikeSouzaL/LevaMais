import React from "react";
import { TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Icon } from "@/components/ui/Icon";

export type DriverMapMenuButtonProps = {
  onPress?: () => void;
};

export function DriverMapMenuButton({ onPress }: DriverMapMenuButtonProps) {
  const navigation = useNavigation();

  return (
    <TouchableOpacity
      onPress={onPress ?? (() => (navigation as any).openDrawer?.())}
      activeOpacity={0.85}
      accessibilityLabel="Abrir menu"
      style={{
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: "rgba(17,24,22,0.88)",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
      }}
    >
      <Icon name="menu" size={24} color="#02de95" />
    </TouchableOpacity>
  );
}

