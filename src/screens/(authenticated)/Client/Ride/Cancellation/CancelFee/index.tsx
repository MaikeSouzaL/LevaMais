/**
 * CancelFeeScreen - Versão Refatorada
 * Informação sobre taxa de cancelamento
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// Design System
import { colors, spacing, fontSize } from '@/theme';

// Componentes
import { LoadingButton } from '../../../Shared/components';
import { formatBRL } from '@/utils/mappers';

export default function CancelFeeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { fee = 5 } = (route.params as any) || {};

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="warning" size={80} color="#ff9800" />
        <Text style={styles.title}>Taxa de Cancelamento</Text>
        <Text style={styles.subtitle}>
          Será cobrada uma taxa de {formatBRL(fee)} por este cancelamento
        </Text>
      </View>

      <View style={styles.footer}>
        <LoadingButton
          title="Entendi"
          onPress={() => (navigation as any).navigate('Home')}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { color: colors.text.primary, fontSize: fontSize['2xl'], fontWeight: '700', marginTop: spacing.xl },
  subtitle: { color: colors.text.secondary, fontSize: fontSize.base, marginTop: spacing.sm, textAlign: 'center' },
  footer: { padding: spacing.lg },
});
