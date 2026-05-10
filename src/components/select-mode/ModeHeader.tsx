import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
import { fonts } from "../../theme/typography";
import { spacing } from "../../theme/dimensions";
import { MotiView } from "moti";

export const ModeHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <MotiView
        from={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", damping: 15 }}
        style={styles.logoWrapper}
      >
        {/* Deep glow underpinning brand */}
        <View style={styles.glowCircle} />
        
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>LEVA</Text>
          <View style={styles.logoDot} />
        </View>
      </MotiView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.md,
    zIndex: 10,
  },
  logoWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  logoText: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.primary[500],
    letterSpacing: 3,
    fontWeight: "900",
  },
  logoDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary[500],
    marginBottom: 6,
    marginLeft: 3,
  },
  glowCircle: {
    position: "absolute",
    width: 120,
    height: 50,
    backgroundColor: colors.primary[500],
    borderRadius: 60,
    opacity: 0.08,
    blurRadius: 20,
    zIndex: -1,
  },
});
