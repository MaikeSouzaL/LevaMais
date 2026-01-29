import React from "react";
import { View, StyleProp, ViewStyle } from "react-native";

export type MapFabStackProps = {
  /** absolute positioning container style (top/right/bottom/left/zIndex) */
  floatingStyle?: StyleProp<ViewStyle>;
  /** spacing between buttons */
  gap?: number;
  children: React.ReactNode;
};

export function MapFabStack({
  floatingStyle,
  gap = 12,
  children,
}: MapFabStackProps) {
  return (
    <View
      style={[
        {
          position: "absolute",
          zIndex: 80,
        },
        floatingStyle,
      ]}
    >
      <View style={{ gap }}>{children}</View>
    </View>
  );
}
