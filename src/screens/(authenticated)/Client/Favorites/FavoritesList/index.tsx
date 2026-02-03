/**
 * FavoritesScreen - Versão Refatorada
 */

import React from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '@/theme';
import { EmptyState } from '../../Shared/components';

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const favorites: any[] = []; // TODO: Get from store

  if (favorites.length === 0) {
    return (
      <EmptyState
        icon="star"
        title="Nenhum favorito"
        description="Adicione endereços favoritos para acesso rápido"
        actionLabel="Adicionar Favorito"
        onAction={() => (navigation as any).navigate('AddFavorite')}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => null} // TODO: Render favorite item
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary, padding: spacing.lg },
});
