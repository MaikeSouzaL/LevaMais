/**
 * RateDriverScreen - Versão Refatorada
 * Avaliação do motorista
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';

// Design System
import { colors, spacing, fontSize } from '@/theme';

// Componentes
import { LoadingButton } from '../../../Shared/components';

export default function RateDriverScreen() {
  const navigation = useNavigation();
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    // Submit rating
    (navigation as any).navigate('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Como foi sua experiência?</Text>
        
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <TouchableOpacity key={star} onPress={() => setRating(star)}>
              <MaterialIcons
                name={star <= rating ? 'star' : 'star-border'}
                size={48}
                color={colors.primary[500]}
              />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <LoadingButton
          title="Enviar Avaliação"
          onPress={handleSubmit}
          variant="primary"
          disabled={rating === 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  title: { color: colors.text.primary, fontSize: fontSize.xl, fontWeight: '700', marginBottom: spacing.xl },
  stars: { flexDirection: 'row', gap: spacing.md },
  footer: { padding: spacing.lg },
});
