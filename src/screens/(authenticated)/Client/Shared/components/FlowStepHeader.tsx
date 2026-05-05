import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight } from "@/theme";

type FlowStepHeaderProps = {
  title: string;
  subtitle?: string;
  currentStep?: number;
  totalSteps?: number;
  onBack?: () => void;
};

export default function FlowStepHeader({
  title,
  subtitle,
  currentStep,
  totalSteps,
  onBack,
}: FlowStepHeaderProps) {
  const stepText =
    typeof currentStep === "number" && typeof totalSteps === "number"
      ? `Etapa ${currentStep} de ${totalSteps}`
      : null;

  return (
    <View style={styles.container}>
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={onBack}
          style={styles.backButton}
          accessibilityRole="button"
        >
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <View style={styles.titleWrap}>
          <Text style={styles.title}>{title}</Text>
          {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        <View style={styles.rightSpacer} />
      </View>

      {!!stepText && (
        <View style={styles.progressWrap}>
          <Text style={styles.stepText}>{stepText}</Text>
          <View style={styles.track}>
            <View
              style={[
                styles.fill,
                {
                  width: `${Math.max(
                    0,
                    Math.min(100, (currentStep! / Math.max(1, totalSteps!)) * 100),
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    gap: spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  titleWrap: {
    flex: 1,
    marginHorizontal: spacing.md,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },
  progressWrap: {
    gap: spacing.xs,
  },
  stepText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  track: {
    width: "100%",
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.background.tertiary,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 999,
    backgroundColor: colors.primary[500],
  },
});
