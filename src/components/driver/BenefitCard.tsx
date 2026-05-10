import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { LucideIcon } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/dimensions";

interface BenefitCardProps {
  icon: LucideIcon;
  title: string;
  delay?: number;
}

export const BenefitCard = ({ icon: Icon, title, delay = 0 }: BenefitCardProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 500, delay }}
      style={styles.container}
    >
      <View style={styles.iconWrapper}>
        <Icon color={colors.primary[500]} size={24} strokeWidth={2} />
      </View>
      <Text style={styles.title}>{title}</Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "48%",
    backgroundColor: "rgba(17, 37, 62, 0.5)",
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: "flex-start",
    minHeight: 110,
    justifyContent: "space-between",
    // Elevation for Android / IOS shadows implicit glass
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm + 1,
    color: colors.text.primary,
    fontWeight: "700",
    lineHeight: 18,
  },
});
