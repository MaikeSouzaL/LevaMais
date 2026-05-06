import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { ClientScreenHeader } from '../../Shared/components';

const MENU_ITEMS = [
  { icon: 'history', label: 'Historico', screen: 'History' },
  { icon: 'receipt-long', label: 'Comprovantes', screen: 'Receipts' },
  { icon: 'delivery-dining', label: 'Plantoes motoboy', screen: 'ShiftOffersClient' },
  { icon: 'star', label: 'Favoritos', screen: 'Favorites' },
  { icon: 'account-balance-wallet', label: 'Carteira', screen: 'Wallet' },
  { icon: 'credit-card', label: 'Pagamentos', screen: 'PaymentsCenter' },
  { icon: 'local-offer', label: 'Cupons', screen: 'Coupons' },
  { icon: 'shield', label: 'Seguranca', screen: 'SafetyCenter' },
  { icon: 'notifications', label: 'Notificacoes', screen: 'NotificationsCenter' },
  { icon: 'support-agent', label: 'Suporte', screen: 'SupportCenter' },
  { icon: 'privacy-tip', label: 'Privacidade', screen: 'PrivacyData' },
  { icon: 'group-add', label: 'Convidar amigos', screen: 'InviteFriends' },
  { icon: 'settings', label: 'Configuracoes', screen: 'Settings' },
  { icon: 'help', label: 'Ajuda rapida', screen: 'Help' },
] as const;

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const user = useAuthStore((state) => state.userData);
  const logout = useAuthStore((state) => state.logout);

  const displayName = user?.name || user?.nome || 'Usuario';
  const displayEmail = user?.email || 'sem-email@leva-mais.app';

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Perfil"
        subtitle="Dados da conta e acessos rapidos"
      />
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={48} color={colors.text.primary} />
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{displayEmail}</Text>
        </View>

        <View style={styles.menu}>
          {MENU_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.screen}
              style={styles.menuItem}
              onPress={() => navigation.navigate(item.screen)}
            >
              <MaterialIcons name={item.icon as any} size={24} color={colors.text.primary} />
              <Text style={styles.menuLabel}>{item.label}</Text>
              <MaterialIcons name="chevron-right" size={24} color={colors.text.tertiary} />
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.logoutItem} onPress={logout}>
            <MaterialIcons name="logout" size={22} color={colors.error[500]} />
            <Text style={styles.logoutLabel}>Sair da conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    padding: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  name: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  email: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  menu: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  menuLabel: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.base,
    marginLeft: spacing.md,
  },
  logoutItem: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error[500],
    padding: spacing.md,
    gap: spacing.sm,
  },
  logoutLabel: {
    color: colors.error[500],
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
});
