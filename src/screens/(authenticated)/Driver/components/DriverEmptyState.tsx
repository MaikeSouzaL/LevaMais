import React from "react";
import { Text } from "react-native";

export type DriverEmptyStateProps = {
  title: string;
};

export function DriverEmptyState({ title }: DriverEmptyStateProps) {
  return <Text style={{ color: "rgba(255,255,255,0.7)" }}>{title}</Text>;
}
