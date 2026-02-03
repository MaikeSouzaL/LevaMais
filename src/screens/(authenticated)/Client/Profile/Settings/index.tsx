/**
 * SettingsScreen - Versão Refatorada
 */

import React from 'react';
import { View, Text, Switch, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

export default function SettingsScreen() {
  const [notifications, setNotifications] = React.useState(true);
  const [darkMode, setDarkMode] = React.useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.sectionTitle}>PREFERÊNCIAS</Text>
        
        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Notificações</Text>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
          />
        </View>

        <View style={styles.setting}>
          <Text style={styles.settingLabel}>Modo Escuro</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{ false: colors.background.tertiary, true: colors.primary[500] }}
          />
        </View>

        <Text style={styles.sectionTitle}>SOBRE</Text>
        <View style={styles.info}>
          <Text style={styles.infoLabel}>Versão</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  sectionTitle: { color: colors.text.tertiary, fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginTop: spacing.lg, marginBottom: spacing.md },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  settingLabel: { color: colors.text.primary, fontSize: fontSize.base },
  info: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: spacing.lg,
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  infoLabel: { color: colors.text.secondary, fontSize: fontSize.base },
  infoValue: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold },
});
