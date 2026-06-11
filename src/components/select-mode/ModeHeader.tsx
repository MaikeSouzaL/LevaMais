import React from "react";
import { View, Image, StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "../../theme/colors";
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
      ><Image source={require("../../assets/Logo/logo.png")} style={styles.logoImage} resizeMode="contain" /></MotiView>
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
  logoImage: {
    width: 140,
    height: 40,
  },
});
