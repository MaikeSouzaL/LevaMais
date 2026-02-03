/**
 * ProfileScreen - Versão Refatorada
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { useAuthStore } from '@/context/authStore';

const MENU_ITEMS = [
  { icon: 'person', label: 'Editar Perfil', screen: 'EditProfile' },
  { icon: 'payment', label: 'Métodos de Pagamento', screen: 'PaymentMethods' },
  { icon: 'settings', label: 'Configurações', screen: 'Settings' },
  { icon: 'help', label: 'Ajuda', screen: 'Help' },
];

export default function ProfileScreen() {
  const navigation = useNavigation();
  const user = useAuthStore((s) => s.userData);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={48} color={colors.text.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Usuário'}</Text>
          <Text style={styles.email}>{user?.email || 'email@exemplo.com'}</Text>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => (navigation as any).navigate(item.screen)}
            >
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
  header: { alignItems: 'center', padding: spacing.xl, borderBottomWidth: 1, borderBottomColor: colors.border.light },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  name: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.xs },
  email: { color: colors.text.secondary, fontSize: fontSize.sm },
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
