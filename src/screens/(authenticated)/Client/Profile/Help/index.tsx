import React, { useEffect, useMemo, useState } from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader } from "../../Shared/components";
import configService, { SupportChannels } from "@/services/config.service";

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>["name"];

const FAQ = [
  {
    q: "Como alterar origem ou destino antes de pedir?",
    a: "Na etapa de resumo, toque em Editar para ajustar origem e destino antes de confirmar.",
  },
  {
    q: "Quando a taxa de cancelamento e cobrada?",
    a: "A taxa pode ser aplicada quando o motorista ja foi acionado ou esta a caminho.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "Voce escolhe o metodo na tela de pagamento antes de finalizar o pedido.",
  },
];

export default function HelpScreen() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [supportChannels, setSupportChannels] = useState<SupportChannels | null>(null);

  useEffect(() => {
    configService.getSupportChannels().then(setSupportChannels).catch(() => setSupportChannels(null));
  }, []);

  const helpItems = useMemo(() => {
    const channels = supportChannels || {
      phone: "0800123456",
      email: "suporte@levamais.app",
      whatsapp: "5500000000000",
      helpCenterUrl: "",
    };

    return [
      {
        icon: "phone",
        label: "Ligar para suporte",
        subtitle: channels.phone,
        action: () => Linking.openURL(`tel:${channels.phone}`),
      },
      {
        icon: "email",
        label: "Enviar e-mail",
        subtitle: channels.email,
        action: () => Linking.openURL(`mailto:${channels.email}`),
      },
      {
        icon: "chat",
        label: "Abrir WhatsApp",
        subtitle: channels.whatsapp,
        action: () => Linking.openURL(`https://wa.me/${channels.whatsapp}`),
      },
    ];
  }, [supportChannels]);

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Ajuda" subtitle="Canais de suporte e respostas rapidas" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.headerCard}>
          <MaterialIcons name="support-agent" size={48} color={colors.primary[500]} />
          <Text style={styles.title}>Como podemos ajudar?</Text>
          <Text style={styles.subtitle}>Escolha um canal configurado pela plataforma ou consulte o FAQ.</Text>
        </View>

        <View style={styles.menu}>
          {helpItems.map((item) => (
            <TouchableOpacity key={item.label} style={styles.menuItem} onPress={item.action}>
              <MaterialIcons name={item.icon as MaterialIconName} size={22} color={colors.text.primary} />
              <View style={styles.menuText}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Text style={styles.menuMeta}>{item.subtitle}</Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>PERGUNTAS FREQUENTES</Text>
        {FAQ.map((item, index) => {
          const opened = openFaq === index;
          return (
            <View key={item.q} style={styles.faqItem}>
              <TouchableOpacity style={styles.faqHeader} onPress={() => setOpenFaq(opened ? null : index)}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <MaterialIcons name={opened ? "expand-less" : "expand-more"} size={22} color={colors.text.secondary} />
              </TouchableOpacity>
              {opened && <Text style={styles.faqAnswer}>{item.a}</Text>}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg },
  headerCard: {
    alignItems: "center",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  menu: { marginBottom: spacing.lg, gap: spacing.sm },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuText: {
    flex: 1,
    marginLeft: spacing.md,
  },
  menuLabel: { color: colors.text.primary, fontSize: fontSize.base },
  menuMeta: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.sm,
    letterSpacing: 0.8,
  },
  faqItem: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    marginBottom: spacing.sm,
    overflow: "hidden",
  },
  faqHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  faqQuestion: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
    flex: 1,
    paddingRight: spacing.sm,
  },
  faqAnswer: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
});
