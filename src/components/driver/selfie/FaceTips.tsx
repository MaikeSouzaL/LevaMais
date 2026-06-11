import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { UserCheck, CheckCircle2 } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

export const FaceTips = () => {
  const points = [
    "Centralize seu rosto na moldura.",
    "Remova óculos de sol, bonés ou máscaras.",
    "Procure um local bem iluminado e com fundo limpo.",
  ];

  return (
    <View style={styles.box}>
      <View style={styles.rowTitle}>
        <UserCheck size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
        <Text style={styles.titleLabel}>Regras para aprovação</Text>
      </View>
      
      <View style={styles.listZone}>
        {points.map((p, idx) => (
          <View key={idx} style={styles.entry}>
            <CheckCircle2 size={14} color="rgba(255,255,255,0.3)" style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.txt}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    backgroundColor: "rgba(17, 37, 62, 0.35)",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.04)",
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  rowTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  titleLabel: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.text.primary,
  },
  listZone: {
    gap: spacing.sm,
  },
  entry: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  txt: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
});
