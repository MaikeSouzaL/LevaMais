import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MotiView } from "moti";
import { ArrowRight } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

interface DriverCategoryFooterProps {
  onProceed: () => void;
  active: boolean;
}

export const DriverCategoryFooter = ({ onProceed, active }: DriverCategoryFooterProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", delay: 300 }}
      style={styles.host}
    >
      <TouchableOpacity
        style={[
          styles.btn,
          { 
            backgroundColor: active ? colors.primary[500] : "rgba(2, 222, 149, 0.15)",
            opacity: active ? 1 : 0.6
          }
        ]}
        disabled={!active}
        activeOpacity={0.85}
        onPress={onProceed}
      >
        <Text style={[
          styles.btnTxt,
          { color: active ? colors.background.primary : colors.text.tertiary }
        ]}>
          Continuar
        </Text>
        <ArrowRight 
          color={active ? colors.background.primary : colors.text.tertiary} 
          size={20} 
          strokeWidth={2.5} 
          style={{ marginLeft: 8 }}
        />
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  host: {
    width: "100%",
    alignItems: "center",
    marginTop: spacing.lg,
  },
  btn: {
    height: 58,
    width: "100%",
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  btnTxt: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    fontWeight: "800",
  },
});
