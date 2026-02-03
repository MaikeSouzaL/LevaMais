/**
 * AddFavoriteScreen - Versão Refatorada
 */

import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing, fontSize, borderRadius } from '@/theme';
import { LoadingButton, SearchBar } from '../../Shared/components';

export default function AddFavoriteScreen() {
  const navigation = useNavigation();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    // Save favorite logic
    setTimeout(() => {
      navigation.goBack();
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Nome do Local</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ex: Casa, Trabalho..."
          placeholderTextColor={colors.text.tertiary}
        />

        <Text style={styles.label}>Endereço</Text>
        <SearchBar
          placeholder="Buscar endereço..."
          value={address}
          onChangeText={setAddress}
        />
      </View>

      <View style={styles.footer}>
        <LoadingButton
          title="Salvar Favorito"
          onPress={handleSave}
          loading={loading}
          disabled={!name || !address}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  label: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: '600', marginBottom: spacing.sm, marginTop: spacing.lg },
  input: {
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  footer: { padding: spacing.lg },
});
