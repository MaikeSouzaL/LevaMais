/**
 * OrderDetailsScreen - Versão Refatorada
 */

import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight } from '@/theme';
import { StatusBadge } from '../../Shared/components';
import { formatBRL } from '@/utils/mappers';

export default function OrderDetailsScreen() {
  const route = useRoute();
  const { order } = (route.params as any) || {};

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.emptyText}>Pedido não encontrado</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Detalhes do Pedido</Text>
          <StatusBadge status={order.status || 'completed'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>INFORMAÇÕES</Text>
          <Row label="Data" value={order.date || 'N/A'} />
          <Row label="Veículo" value={order.vehicle || 'N/A'} />
          <Row label="Distância" value={order.distance || 'N/A'} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>VALOR</Text>
          <Row label="Total" value={formatBRL(order.total || 0)} highlight />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const Row = ({ label, value, highlight }: any) => (
  <View style={styles.row}>
    <Text style={styles.rowLabel}>{label}</Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  emptyText: { color: colors.text.secondary, fontSize: fontSize.base, textAlign: 'center', marginTop: spacing['3xl'] },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xl },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: fontWeight.bold },
  section: { marginBottom: spacing.xl },
  sectionTitle: { color: colors.text.tertiary, fontSize: fontSize.xs, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  rowLabel: { color: colors.text.secondary, fontSize: fontSize.base },
  rowValue: { color: colors.text.primary, fontSize: fontSize.base },
  rowValueHighlight: { color: colors.primary[500], fontWeight: fontWeight.bold },
});
