import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle } from "react-native";

export type ActionButtonVariant = "primary" | "secondary" | "danger";

export type ActionButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  variant?: ActionButtonVariant;
  style?: ViewStyle;
};

function getContainerStyle(variant: ActionButtonVariant, disabled: boolean) {
  if (variant === "primary") {
    return {
      backgroundColor: disabled ? "rgba(2,222,149,0.35)" : "#02de95",
      borderWidth: 0,
      borderColor: "transparent",
    } as ViewStyle;
  }

  if (variant === "danger") {
    return {
      backgroundColor: disabled ? "rgba(239,68,68,0.25)" : "#ef4444",
      borderWidth: 0,
      borderColor: "transparent",
    } as ViewStyle;
  }

  return {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  } as ViewStyle;
}

function getTextStyle(variant: ActionButtonVariant) {
  if (variant === "primary") {
    return { color: "#0f231c" } as TextStyle;
  }

  if (variant === "danger") {
    return { color: "#111816" } as TextStyle;
  }

  return { color: "#fff" } as TextStyle;
}

export default function ActionButton(props: ActionButtonProps) {
  let variant = props.variant || "secondary";
  let disabled = !!props.disabled;

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={props.onPress}
      disabled={disabled}
      style={{
        height: 48,
        borderRadius: 999,
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 14,
        opacity: disabled ? 0.7 : 1,
        ...(getContainerStyle(variant, disabled) as any),
        ...(props.style || {}),
      }}
    >
      <Text
        style={{
          fontWeight: "900",
          fontSize: 14,
          ...(getTextStyle(variant) as any),
        }}
      >
        {props.title}
      </Text>
    </TouchableOpacity>
  );
}
