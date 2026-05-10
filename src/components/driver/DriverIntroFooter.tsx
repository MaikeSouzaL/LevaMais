import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { ArrowRight } from "lucide-react-native";
import { colors } from "../../theme/colors";
import { fonts, fontSize } from "../../theme/typography";
import { spacing, borderRadius } from "../../theme/dimensions";

interface DriverIntroFooterProps {
  onContinue: () => void;
}

export const DriverIntroFooter = ({ onContinue }: DriverIntroFooterProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 600, delay: 600 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.primaryBtn}
        activeOpacity={0.85}
        onPress={onContinue}
      >
        <Text style={styles.btnText}>Continuar</Text>
        <ArrowRight color={colors.background.primary} size={22} strokeWidth={2.5} />
      </TouchableOpacity>

      <Text style={styles.footerTxt}>
        Preencha seus dados e comece a faturar.
      </Text>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  primaryBtn: {
    height: 58,
    width: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  footerTxt: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs + 1,
    color: colors.text.tertiary,
    marginTop: spacing.md,
    textAlign: "center",
    letterSpacing: 0.3,
  },
});
