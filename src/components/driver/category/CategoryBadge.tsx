import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing } from "../../../theme/dimensions";

interface CategoryBadgeProps {
  label: string;
}

export const CategoryBadge = ({ label }: CategoryBadgeProps) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.2)",
    alignSelf: "flex-start",
  },
  label: {
    fontFamily: fonts.bold,
    fontSize: 10,
    fontWeight: "800",
    color: colors.primary[500],
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
