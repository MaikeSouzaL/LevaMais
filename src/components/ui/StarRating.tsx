import React from "react";
import { View, TouchableOpacity } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export type StarRatingProps = {
  value: number;
  onChange?: (value: number) => void;
  size?: number;
  disabled?: boolean;
};

export default function StarRating(props: StarRatingProps) {
  const size = props.size ?? 28;
  const v = Math.max(0, Math.min(5, Math.round(props.value || 0)));

  return (
    <View style={{ flexDirection: "row", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= v;
        const color = filled ? "#f59e0b" : "rgba(255,255,255,0.25)";

        return (
          <TouchableOpacity
            key={i}
            activeOpacity={0.8}
            disabled={props.disabled || !props.onChange}
            onPress={() => props.onChange?.(i)}
          >
            <MaterialIcons
              name={filled ? "star" : "star-border"}
              size={size}
              color={color}
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
