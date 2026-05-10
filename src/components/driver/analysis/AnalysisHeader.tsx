import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../../theme/colors";
import { fonts } from "../../../theme/typography";

export const AnalysisHeader = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20) }]}>
      <View style={styles.logoRow}>
        <Text style={styles.logoText}>LEVA.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 10,
    zIndex: 10,
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoText: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.primary[500],
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
});
