import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts } from "../../../theme/typography";
import { spacing } from "../../../theme/dimensions";

export const DriverCategoryHeader = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
      <TouchableOpacity
        style={styles.actionBtn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <ArrowLeft color={colors.text.primary} size={24} />
      </TouchableOpacity>

      <View style={styles.brand}>
        <Text style={styles.brandText}>LEVA</Text>
        <View style={styles.dot} />
      </View>
      
      <View style={styles.spacer} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  actionBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.05)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  brandText: {
    fontFamily: fonts.black,
    fontSize: 20,
    color: colors.primary[500],
    fontWeight: "900",
    letterSpacing: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primary[500],
    marginBottom: 5,
    marginLeft: 2,
  },
  spacer: { width: 42 },
});
