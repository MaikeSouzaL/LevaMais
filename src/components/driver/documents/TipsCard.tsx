import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Lightbulb, CheckCircle2 } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

export const TipsCard = () => {
  const tips = [
    "Remova o documento do plástico para evitar reflexos.",
    "Certifique-se que o local está bem iluminado.",
    "Enquadre todas as bordas e garanta o foco do texto.",
  ];

  return (
    <View style={styles.holder}>
      <View style={styles.titleRow}>
        <Lightbulb size={20} color={colors.primary[500]} style={{ marginRight: 8 }} />
        <Text style={styles.title}>Dicas para aprovação rápida</Text>
      </View>
      
      <View style={styles.list}>
        {tips.map((txt, i) => (
          <View key={i} style={styles.item}>
            <CheckCircle2 size={14} color="rgba(255,255,255,0.4)" style={{ marginTop: 2, marginRight: 8 }} />
            <Text style={styles.txt}>{txt}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  holder: {
    backgroundColor: "rgba(17, 37, 62, 0.4)",
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.text.primary,
    fontWeight: "700",
  },
  list: {
    gap: spacing.sm,
  },
  item: {
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
