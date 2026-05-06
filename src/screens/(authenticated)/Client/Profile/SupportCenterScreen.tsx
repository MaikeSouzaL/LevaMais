import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";

const ITEMS = [
  { title: "Problemas com corrida", subtitle: "Reportar atraso, cancelamento ou valor", target: "History", icon: "directions-car" },
  { title: "Problemas com pagamento", subtitle: "Cartao, pix e cobrancas", target: "PaymentsCenter", icon: "payment" },
  { title: "Seguranca", subtitle: "Ajuda em emergencia", target: "SafetyCenter", icon: "shield" },
];

export default function SupportCenterScreen() {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Suporte" subtitle="Central de atendimento" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {ITEMS.map((item) => (
          <TouchableOpacity key={item.title} style={styles.item} onPress={() => navigation.navigate(item.target)}>
            <MaterialIcons name={item.icon as any} size={22} color={colors.primary[500]} />
            <View style={{ flex: 1 }}>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.itemSubtitle}>{item.subtitle}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.item} onPress={() => Linking.openURL("mailto:suporte@levamais.app") }>
          <MaterialIcons name="mail-outline" size={22} color={colors.primary[500]} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle}>Enviar e-mail</Text>
            <Text style={styles.itemSubtitle}>suporte@levamais.app</Text>
          </View>
          <MaterialIcons name="open-in-new" size={20} color={colors.text.tertiary} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, gap: spacing.sm },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  itemTitle: { color: colors.text.primary, fontWeight: fontWeight.semibold, fontSize: fontSize.base },
  itemSubtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: 2 },
});
