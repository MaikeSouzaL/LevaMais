import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

interface DriverProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
}

export const DriverProgressHeader = ({ currentStep, totalSteps }: DriverProgressHeaderProps) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const progressPercent = Math.min(Math.max((currentStep / totalSteps) * 100, 5), 100);

  return (
    <View style={[styles.wrapper, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topRow}>
        <TouchableOpacity
          style={styles.navBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft color="#FFF" size={22} />
        </TouchableOpacity>

        <View style={styles.logoFrame}>
          <Text style={styles.logoMain}>LEVA</Text>
          <View style={styles.logoDot} />
        </View>

        <View style={styles.dummySpacer} />
      </View>

      {/* Advanced Progress Bar Indicator */}
      <View style={styles.progressBarZone}>
        <View style={styles.labelRow}>
          <Text style={styles.stepLabel}>Validação de Perfil</Text>
          <Text style={styles.numericLabel}>Passo {currentStep} de {totalSteps}</Text>
        </View>
        
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progressPercent}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: "100%",
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
    zIndex: 20,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  logoFrame: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  logoMain: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.primary[500],
    fontWeight: "900",
    letterSpacing: 2,
  },
  logoDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
    marginBottom: 5,
    marginLeft: 2,
  },
  dummySpacer: { width: 40 },
  
  progressBarZone: {
    paddingHorizontal: spacing.xl,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.xs + 1,
    color: colors.text.primary,
    letterSpacing: 0.5,
  },
  numericLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.xs,
    color: colors.text.tertiary,
  },
  track: {
    height: 6,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary[500],
    borderRadius: 3,
  },
});
