import React from "react";
import { View } from "react-native";

export default function SectionCard(props: {
  children: React.ReactNode;
  style?: any;
}) {
  return (
    <View
      style={{
        backgroundColor: "rgba(17,24,22,0.96)",
        borderRadius: 18,
        padding: 14,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.10)",
        ...(props.style || {}),
      }}
    >
      {props.children}
    </View>
  );
}
