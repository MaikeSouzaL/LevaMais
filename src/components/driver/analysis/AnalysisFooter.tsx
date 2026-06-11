import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { ChevronRight } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts } from "../../../theme/typography";

interface AnalysisFooterProps {
  onPress: () => void;
}

export const AnalysisFooter = ({ onPress }: AnalysisFooterProps) => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "spring", delay: 900 }}
      style={styles.container}
    >
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <Text style={styles.buttonText}>Voltar para início</Text>
        <ChevronRight size={18} color={colors.background.primary} style={{ marginLeft: 8 }} />
      </TouchableOpacity>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    paddingTop: 10,
    paddingBottom: 20,
  },
  button: {
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    // Glowing physical effect
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: 16,
    color: colors.background.primary,
    letterSpacing: 0.5,
  },
});
