import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { ArrowRight } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/dimensions";

interface ModeFooterProps {
  onPress: () => void;
  isEnabled: boolean;
  loading?: boolean;
  buttonLabel: string;
}

export const ModeFooter = ({
  onPress,
  isEnabled,
  loading = false,
  buttonLabel,
}: ModeFooterProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 25 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 400 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={[
          styles.primaryBtn,
          { 
            backgroundColor: isEnabled ? colors.primary[500] : "rgba(2, 222, 149, 0.15)",
            opacity: isEnabled ? 1 : 0.6,
          }
        ]}
        disabled={!isEnabled || loading}
        onPress={onPress}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color={colors.background.primary} />
        ) : (
          <>
            <Text style={[
              styles.btnText,
              { color: isEnabled ? colors.background.primary : colors.text.tertiary }
            ]}>
              {buttonLabel}
            </Text>
            <ArrowRight 
              size={20} 
              strokeWidth={2.5}
              color={isEnabled ? colors.background.primary : colors.text.tertiary} 
              style={{ marginLeft: 8 }}
            />
          </>
        )}
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
  primaryBtn: {
    height: 58,
    width: "100%",
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
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
