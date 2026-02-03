/**
 * RideCompletedScreen - Versão Refatorada
 * Tela de corrida concluída
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// Design System
import { colors, spacing, fontSize } from '@/theme';

// Componentes
import { LoadingButton } from '../../../Shared/components';

export default function RideCompletedScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <MaterialIcons name="check-circle" size={80} color={colors.primary[500]} />
        <Text style={styles.title}>Corrida Concluída!</Text>
        <Text style={styles.subtitle}>Obrigado por usar nosso serviço</Text>
      </View>

      <View style={styles.footer}>
        <LoadingButton
          title="Avaliar Motorista"
          onPress={() => (navigation as any).navigate('RateDriver')}
          variant="primary"
        />
        <LoadingButton
          title="Voltar ao Início"
          onPress={() => (navigation as any).navigate('Home')}
          variant="secondary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { color: colors.text.primary, fontSize: fontSize['2xl'], fontWeight: '700', marginTop: spacing.xl },
  subtitle: { color: colors.text.secondary, fontSize: fontSize.base, marginTop: spacing.sm },
  footer: { padding: spacing.lg, gap: spacing.md },
});
