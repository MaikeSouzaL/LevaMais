import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleProp,
  View,
  ViewStyle,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type MapFabButtonProps = {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  size?: number;
  iconSize?: number;
  /** background for default state */
  backgroundColor?: string;
  /** background when active (pressed/selected) */
  activeBackgroundColor?: string;
  /** icon color */
  iconColor?: string;
  /** if true, use activeBackgroundColor */
  active?: boolean;
  /** Optional extra container style */
  style?: StyleProp<ViewStyle>;
  testID?: string;
  accessibilityLabel?: string;
};

export function MapFabButton({
  icon,
  onPress,
  disabled,
  loading,
  size = 56,
  iconSize = 26,
  backgroundColor = "#111816",
  activeBackgroundColor = "#1b2723",
  iconColor = "#02de95",
  active,
  style,
  testID,
  accessibilityLabel,
}: MapFabButtonProps) {
  const bg = active ? activeBackgroundColor : backgroundColor;
  const isDisabled = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: pressed ? activeBackgroundColor : bg,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.22,
          shadowRadius: 12,
          elevation: 8,
          opacity: isDisabled ? 0.75 : 1,
        },
        style,
      ]}
    >
      <View>
        {loading ? (
          <ActivityIndicator size="small" color={iconColor} />
        ) : (
          <MaterialIcons name={icon} size={iconSize} color={iconColor} />
        )}
      </View>
    </Pressable>
  );
}
