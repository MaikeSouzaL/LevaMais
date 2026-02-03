/**
 * CancelRideScreen - Versão Refatorada
 * Cancelamento de corrida
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Design System
import { colors, spacing, fontSize } from '@/theme';

// Componentes
import { LoadingButton } from '../../../Shared/components';

const CANCEL_REASONS = [
  'Mudei de ideia',
  'Motorista demorou muito',
  'Encontrei outra opção',
  'Preço muito alto',
  'Outro motivo',
];

export default function CancelRideScreen() {
  const navigation = useNavigation();
  const [selectedReason, setSelectedReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCancel = async () => {
    setLoading(true);
    // Cancel ride logic
    setTimeout(() => {
      (navigation as any).navigate('Home');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        <Text style={styles.title}>Por que deseja cancelar?</Text>
        
        {CANCEL_REASONS.map((reason) => (
          <TouchableOpacity
            key={reason}
            style={[styles.reason, selectedReason === reason && styles.reasonSelected]}
            onPress={() => setSelectedReason(reason)}
          >
            <Text style={styles.reasonText}>{reason}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <LoadingButton
          title="Confirmar Cancelamento"
          onPress={handleCancel}
          variant="danger"
          loading={loading}
          disabled={!selectedReason}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xl },
  reason: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 12,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  reasonSelected: { borderColor: colors.primary[500], backgroundColor: 'rgba(2, 222, 149, 0.1)' },
  reasonText: { color: colors.text.primary, fontSize: fontSize.base },
  footer: { padding: spacing.lg },
});
