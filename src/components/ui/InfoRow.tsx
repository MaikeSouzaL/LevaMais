import React from "react";
import { View, Text } from "react-native";

export type InfoRowProps = {
  label: string;
  value?: string;
};

export default function InfoRow(props: InfoRowProps) {
  if (!props.value) return null;

  return (
    <View style={{ marginTop: 8 }}>
      <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>
        {props.label}
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.85)",
          fontSize: 14,
          fontWeight: "700",
          marginTop: 3,
        }}
        numberOfLines={2}
      >
        {props.value}
      </Text>
    </View>
  );
}
