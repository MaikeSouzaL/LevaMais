import React from "react";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import { useAuthStore } from "@/context/authStore";

export default function PrivacyDataScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((s) => s.userData);

  const exportData = async () => {
    const payload = {
      name: user?.name,
      email: user?.email,
      phone: user?.telefone,
      city: user?.cidade,
    };

    await Share.share({
      message: `Meus dados - Leva Mais\n${JSON.stringify(payload, null, 2)}`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Privacidade e dados" subtitle="Controle da sua conta" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.infoCard}>
          <MaterialIcons name="verified-user" size={28} color={colors.primary[500]} />
          <Text style={styles.infoTitle}>Seus dados</Text>
          <Text style={styles.infoText}>Voce pode exportar seus dados e revisar informacoes principais da conta.</Text>
        </View>

        <TouchableOpacity style={styles.row} onPress={exportData}>
          <MaterialIcons name="download" size={20} color={colors.primary[500]} />
          <Text style={styles.rowText}>Exportar meus dados</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate("Settings") }>
          <MaterialIcons name="settings" size={20} color={colors.primary[500]} />
          <Text style={styles.rowText}>Gerenciar preferencias de privacidade</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, gap: spacing.md },
  infoCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  infoTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  infoText: { color: colors.text.secondary, fontSize: fontSize.sm, lineHeight: 20 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  rowText: { color: colors.text.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
});
