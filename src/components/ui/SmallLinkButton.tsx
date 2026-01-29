import React from "react";
import { TouchableOpacity, Text, ViewStyle } from "react-native";

export type SmallLinkButtonProps = {
  title: string;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

export default function SmallLinkButton(props: SmallLinkButtonProps) {
  return (
    <TouchableOpacity
      onPress={props.onPress}
      disabled={!!props.disabled}
      activeOpacity={0.85}
      style={{
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 999,
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        opacity: props.disabled ? 0.6 : 1,
        ...(props.style || {}),
      }}
    >
      <Text style={{ color: "#fff", fontWeight: "800", fontSize: 13 }}>
        {props.title}
      </Text>
    </TouchableOpacity>
  );
}
