import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { MotiView } from "moti";
import { Clock, BellRing } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts } from "../../../theme/typography";

export const AnalysisEstimate = () => {
  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 800, delay: 700 }}
      style={styles.container}
    >
      {/* ⏱️ Time Card */}
      <View style={styles.estimateCard}>
        <Clock size={18} color={colors.primary[500]} style={{ marginRight: 8 }} />
        <Text style={styles.estimateText}>
          Tempo médio de aprovação: <Text style={styles.bold}>até 24 horas</Text>
        </Text>
      </View>

      {/* 🔔 Info Row */}
      <View style={styles.infoRow}>
        <BellRing size={14} color="rgba(255,255,255,0.4)" style={{ marginRight: 6, marginTop: 2 }} />
        <Text style={styles.infoText}>
          Você receberá uma notificação quando sua conta for aprovada.
        </Text>
      </View>
    </MotiView>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginTop: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  estimateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 222, 149, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.15)",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "100%",
  },
  estimateText: {
    fontFamily: fonts.regular,
    fontSize: 14,
    color: "#EAF4F0",
    flex: 1,
  },
  bold: {
    fontFamily: fonts.bold,
    color: colors.primary[500],
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 4,
    marginTop: 12,
    width: "100%",
  },
  infoText: {
    fontFamily: fonts.regular,
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    lineHeight: 18,
    flex: 1,
  },
});
