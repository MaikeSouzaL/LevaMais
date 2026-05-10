import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { MotiView } from "moti";
import { CheckCircle2 } from "lucide-react-native";
import { colors } from "../../../theme/colors";
import { fonts } from "../../../theme/typography";

export const VerificationStatusCard = () => {
  const steps = [
    { id: 1, label: "Documentos enviados", status: "done" },
    { id: 2, label: "Selfie validada", status: "done" },
    { id: 3, label: "Verificação em andamento", status: "pending" },
  ];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: "timing", duration: 800, delay: 500 }}
      style={styles.card}
    >
      {steps.map((item, index) => (
        <View 
          key={item.id} 
          style={[
            styles.row, 
            index < steps.length - 1 && styles.borderBottom
          ]}
        >
          <View style={styles.iconWrapper}>
            {item.status === "done" ? (
              <MotiView
                from={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring" }}
              >
                <CheckCircle2 size={20} color={colors.primary[500]} />
              </MotiView>
            ) : (
              <ActivityIndicator size="small" color={colors.primary[500]} />
            )}
          </View>
          <Text 
            style={[
              styles.label, 
              item.status === "pending" ? styles.pendingText : styles.doneText
            ]}
          >
            {item.label}
          </Text>
        </View>
      ))}
    </MotiView>
  );
};

const styles = StyleSheet.create({
  card: {
    width: "100%",
    backgroundColor: "rgba(17, 37, 62, 0.6)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    padding: 16,
    marginVertical: 10,
    // Subtle glass shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.04)",
  },
  iconWrapper: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  label: {
    fontFamily: fonts.medium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  doneText: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  pendingText: {
    color: colors.primary[500],
    fontWeight: "600",
  },
});
