import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { ArrowRight } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/dimensions";

interface ModeFooterProps {
  onPress: () => void;
  isEnabled: boolean;
  loading?: boolean;
  buttonLabel: string;
  selectedProfile?: "client" | "driver" | null;
}

export const ModeFooter = ({
  onPress,
  isEnabled,
  loading = false,
  buttonLabel,
  selectedProfile = null,
}: ModeFooterProps) => {
  // Define dynamic button configurations
  const isDriver = selectedProfile === "driver";
  
  const gradientColors = isEnabled
    ? isDriver
      ? ["#00F3FF", "#00A8B5"] // Cyan Fintech
      : ["#02de95", "#01a86f"] // Emerald Green Leva Mais
    : ["rgba(255, 255, 255, 0.05)", "rgba(255, 255, 255, 0.02)"];

  const shadowColor = isEnabled
    ? isDriver
      ? "#00F3FF"
      : colors.primary[500]
    : "transparent";

  const textColor = isEnabled
    ? "#091A2F" // Dark contrast color for maximum premium text legibility
    : colors.text.disabled;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 25 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 400 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.touchable,
          { 
            opacity: isEnabled ? 1 : 0.6,
          }
        ]}
        disabled={!isEnabled || loading}
        onPress={onPress}
        activeOpacity={0.85}
      >
        <MotiView
          animate={{
            shadowColor: shadowColor,
            shadowOpacity: isEnabled ? 0.35 : 0,
            shadowRadius: isEnabled ? 14 : 0,
          }}
          transition={{ type: "timing", duration: 10 }}
          style={styles.buttonWrapper}
        >
          <LinearGradient
            colors={gradientColors as any}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBg}
          >
            {loading ? (
              <ActivityIndicator color="#091A2F" />
            ) : (
              <>
                <Text style={[styles.btnText, { color: textColor }]}>
                  {buttonLabel}
                </Text>
                <ArrowRight 
                  size={20} 
                  strokeWidth={2.5}
                  color={textColor} 
                  style={{ marginLeft: 8 }}
                />
              </>
            )}
          </LinearGradient>
        </MotiView>
      </TouchableOpacity>

      <Text style={styles.smallDisclaimer}>
        Você poderá alternar entre os modos depois.
      </Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  touchable: {
    width: "100%",
  },
  buttonWrapper: {
    width: "100%",
    borderRadius: borderRadius.xl,
    overflow: "hidden",
    elevation: 6,
  },
  gradientBg: {
    height: 58,
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    fontWeight: "800",
    letterSpacing: 0.3,
  },
  smallDisclaimer: {
    fontFamily: fonts.regular,
    fontSize: 12,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: "center",
    opacity: 0.8,
    letterSpacing: 0.3,
  },
});
