import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import { useAuthStore } from "@/context/authStore";

export default function InviteFriendsScreen() {
  const user = useAuthStore((s) => s.userData);
  const code = React.useMemo(() => {
    const seed = String(user?.id || "123456").slice(-6).toUpperCase();
    return `LEVA-${seed}`;
  }, [user?.id]);

  const shareInvite = async () => {
    await Share.share({
      message: `Use meu codigo ${code} no Leva Mais e venha pedir corridas e entregas comigo!`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Convide amigos" subtitle="Ganhe beneficios por indicacao" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.hero}>
          <MaterialIcons name="group-add" size={42} color={colors.primary[500]} />
          <Text style={styles.heroTitle}>Seu codigo de convite</Text>
          <Text style={styles.code}>{code}</Text>
          <Text style={styles.heroText}>Compartilhe com amigos para receber vantagens em corridas e entregas.</Text>
        </View>

        <TouchableOpacity style={styles.shareBtn} onPress={shareInvite}>
          <MaterialIcons name="ios-share" size={18} color={colors.background.primary} />
          <Text style={styles.shareText}>Compartilhar convite</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, gap: spacing.md },
  hero: {
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
  },
  heroTitle: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.lg },
  code: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold,
    fontSize: fontSize["2xl"],
    letterSpacing: 1.2,
  },
  heroText: { color: colors.text.secondary, fontSize: fontSize.sm, textAlign: "center", lineHeight: 20 },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.full,
    paddingVertical: spacing.md,
  },
  shareText: {
    color: colors.background.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
});
