import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Share,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";

const EMERGENCY_CONTACTS = [
  { id: "police", label: "Policia", number: "190", icon: "local-police", color: "#3b82f6" },
  { id: "ambulance", label: "SAMU", number: "192", icon: "local-hospital", color: "#ef4444" },
  { id: "fire", label: "Bombeiros", number: "193", icon: "fire-truck", color: "#f97316" },
];

const SAFETY_FEATURES = [
  {
    id: "share",
    icon: "share-location",
    label: "Compartilhar localizacao",
    description: "Envie sua localizacao em tempo real para contatos de confianca",
  },
  {
    id: "contacts",
    icon: "contacts",
    label: "Contatos de confianca",
    description: "Gerencie quem pode acompanhar suas viagens",
  },
  {
    id: "verify",
    icon: "verified-user",
    label: "Verificar motorista",
    description: "Confira foto, placa e identidade do motorista ao entrar",
  },
];

export default function SafetyCenterScreen() {
  const navigation = useNavigation<any>();

  const handleCallEmergency = (number: string) => {
    Linking.openURL(`tel:${number}`);
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        message: "Estou em uma viagem no Leva+. Acompanhe minha localizacao: [link da viagem]",
      });
    } catch {}
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Central de Seguranca" subtitle="Recursos de protecao durante as viagens" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.emergencySection}>
          <Text style={styles.sectionTitle}>EMERGENCIA</Text>
          <View style={styles.emergencyGrid}>
            {EMERGENCY_CONTACTS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.emergencyCard}
                onPress={() => handleCallEmergency(item.number)}
                activeOpacity={0.7}
              >
                <View style={[styles.emergencyIconBg, { backgroundColor: item.color + "20" }]}>
                  <MaterialIcons name={item.icon as any} size={28} color={item.color} />
                </View>
                <Text style={styles.emergencyLabel}>{item.label}</Text>
                <Text style={styles.emergencyNumber}>{item.number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <Text style={styles.sectionTitle}>FERRAMENTAS</Text>
        {SAFETY_FEATURES.map((feature) => (
          <TouchableOpacity
            key={feature.id}
            style={styles.featureCard}
            onPress={feature.id === "share" ? handleShareTrip : undefined}
            activeOpacity={0.7}
          >
            <View style={styles.featureIcon}>
              <MaterialIcons name={feature.icon as any} size={24} color={colors.primary[500]} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.featureLabel}>{feature.label}</Text>
              <Text style={styles.featureDesc}>{feature.description}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#555" />
          </TouchableOpacity>
        ))}

        <View style={styles.safetyTipCard}>
          <MaterialIcons name="lightbulb" size={20} color="#fbbf24" style={{ marginRight: spacing.sm }} />
          <Text style={styles.safetyTipText}>
            Confira sempre a placa e o modelo do veiculo antes de entrar. Nao compartilhe seus dados pessoais com o motorista.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { padding: spacing.lg, paddingBottom: spacing["3xl"] },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    marginTop: spacing.lg,
    letterSpacing: 1,
  },
  emergencySection: { marginBottom: spacing.xl },
  emergencyGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  emergencyCard: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  emergencyIconBg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  emergencyLabel: { color: colors.text.primary, fontSize: fontSize.sm, fontWeight: fontWeight.bold },
  emergencyNumber: { color: colors.text.tertiary, fontSize: fontSize.xs, marginTop: 2 },
  featureCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(2,222,149,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  featureLabel: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
  featureDesc: { color: colors.text.tertiary, fontSize: fontSize.xs, marginTop: 2 },
  safetyTipCard: {
    flexDirection: "row",
    backgroundColor: "rgba(251,191,36,0.08)",
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(251,191,36,0.2)",
  },
  safetyTipText: { color: "#fbbf24", fontSize: fontSize.sm, flex: 1, lineHeight: 20 },
});
