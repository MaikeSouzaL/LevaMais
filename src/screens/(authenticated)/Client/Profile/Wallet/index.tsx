/**
 * WalletScreen - Versão Refatorada
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { useAuthStore } from '@/context/authStore';
import { formatBRL } from '@/utils/mappers';
import { LoadingButton } from '../../Shared/components';

export default function WalletScreen() {
  const balance = useAuthStore((s) => s.walletBalance || 0);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.balanceCard}>
          <MaterialIcons name="account-balance-wallet" size={48} color={colors.primary[500]} />
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balanceValue}>{formatBRL(balance)}</Text>
        </View>

        <View style={styles.actions}>
          <LoadingButton title="Adicionar Saldo" onPress={() => {}} variant="primary" />
          <LoadingButton title="Histórico" onPress={() => {}} variant="secondary" />
        </View>

        <Text style={styles.sectionTitle}>TRANSAÇÕES RECENTES</Text>
        <View style={styles.emptyState}>
          <MaterialIcons name="receipt" size={48} color={colors.text.tertiary} />
          <Text style={styles.emptyText}>Nenhuma transação</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  balanceCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  balanceLabel: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.md },
  balanceValue: { color: colors.primary[500], fontSize: fontSize['3xl'], fontWeight: fontWeight.bold, marginTop: spacing.xs },
  actions: { gap: spacing.md, marginBottom: spacing.xl },
  sectionTitle: { color: colors.text.tertiary, fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  emptyState: { alignItems: 'center', padding: spacing.xl },
  emptyText: { color: colors.text.tertiary, fontSize: fontSize.base, marginTop: spacing.md },
});
