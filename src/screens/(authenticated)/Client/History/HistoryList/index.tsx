/**
 * HistoryScreen - Versão Refatorada
 */

import React from 'react';
import { FlatList, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { EmptyState, StatusBadge } from '../../Shared/components';
import { formatBRL } from '@/utils/mappers';

export default function HistoryScreen() {
  const navigation = useNavigation();
  const history: any[] = []; // TODO: Get from API

  if (history.length === 0) {
    return (
      <EmptyState
        icon="history"
        title="Nenhuma corrida"
        description="Seu histórico de corridas aparecerá aqui"
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => (navigation as any).navigate('OrderDetails', { order: item })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardDate}>{item.date}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardAddress}>{item.address}</Text>
            <Text style={styles.cardPrice}>{formatBRL(item.total)}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.list}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  list: { padding: spacing.lg },
  card: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardDate: { color: colors.text.tertiary, fontSize: fontSize.sm },
  cardAddress: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.semibold, marginBottom: spacing.xs },
  cardPrice: { color: colors.primary[500], fontSize: fontSize.lg, fontWeight: fontWeight.bold },
});
