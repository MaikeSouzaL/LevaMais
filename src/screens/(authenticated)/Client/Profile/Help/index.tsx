/**
 * HelpScreen - Versão Refatorada
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

const HELP_ITEMS = [
  { icon: 'phone', label: 'Ligar para Suporte', action: () => Linking.openURL('tel:0800123456') },
  { icon: 'email', label: 'Enviar E-mail', action: () => Linking.openURL('mailto:suporte@levamais.com') },
  { icon: 'chat', label: 'Chat Online', action: () => {} },
  { icon: 'help', label: 'FAQ', action: () => {} },
];

export default function HelpScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <MaterialIcons name="support-agent" size={64} color={colors.primary[500]} />
          <Text style={styles.title}>Como podemos ajudar?</Text>
          <Text style={styles.subtitle}>Escolha uma opção abaixo</Text>
        </View>

        <View style={styles.menu}>
          {HELP_ITEMS.map((item, index) => (
            <TouchableOpacity key={index} style={styles.menuItem} onPress={item.action}>
              <MaterialIcons name={item.icon as any} size={24} color={colors.text.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  header: { alignItems: 'center', padding: spacing.xl, marginBottom: spacing.lg },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginTop: spacing.lg },
  subtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
  menu: { padding: spacing.lg },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuLabel: { flex: 1, color: colors.text.primary, fontSize: fontSize.base, marginLeft: spacing.md },
});
