import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import favoriteAddressService, {
  FavoriteAddress,
} from '@/services/favoriteAddress.service';
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { ClientScreenHeader, EmptyState } from '../../Shared/components';

export default function FavoritesScreen() {
  const navigation = useNavigation<any>();
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const list = await favoriteAddressService.list();
      setFavorites(list || []);
    } catch (error) {
      Alert.alert('Erro', 'Nao foi possivel carregar os favoritos.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites]),
  );

  const handleAddFavorite = () => {
    navigation.navigate('LocationPicker', {
      selectionMode: 'favorite_creation',
      returnScreen: 'Favorites',
    });
  };

  const handleUseFavorite = (favorite: FavoriteAddress) => {
    navigation.navigate('Home', {
      home_dropoff: {
        address: favorite.formattedAddress || favorite.address,
        latitude: Number(favorite.latitude),
        longitude: Number(favorite.longitude),
      },
    });
  };

  const handleEditFavorite = (favorite: FavoriteAddress) => {
    navigation.navigate('EditFavorite', {
      favoriteId: favorite._id,
      favoriteData: favorite,
      returnScreen: 'Favorites',
    });
  };

  const handleDeleteFavorite = (favorite: FavoriteAddress) => {
    Alert.alert(
      'Remover favorito',
      `Deseja remover "${favorite.name}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: async () => {
            try {
              await favoriteAddressService.delete(favorite._id);
              setFavorites((current) =>
                current.filter((item) => item._id !== favorite._id),
              );
            } catch {
              Alert.alert('Erro', 'Nao foi possivel remover este favorito.');
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Favoritos"
          subtitle="Enderecos salvos para pedir mais rapido"
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando favoritos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (favorites.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Favoritos"
          subtitle="Enderecos salvos para pedir mais rapido"
        />
        <EmptyState
          icon="star"
          title="Nenhum favorito"
          description="Salve enderecos para usar mais rapido nas proximas corridas."
          actionLabel="Adicionar favorito"
          onAction={handleAddFavorite}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Favoritos"
        subtitle="Enderecos salvos para pedir mais rapido"
      />
      <FlatList
        data={favorites}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={() => loadFavorites(true)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.iconWrap}>
                <MaterialIcons
                  name={(item.icon as any) || 'place'}
                  size={20}
                  color={colors.primary[500]}
                />
              </View>

              <View style={styles.textWrap}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.address} numberOfLines={2}>
                  {item.formattedAddress || item.address}
                </Text>
              </View>
            </View>

            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionButton, styles.primaryButton]}
                onPress={() => handleUseFavorite(item)}
              >
                <Text style={styles.primaryButtonText}>Usar destino</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleEditFavorite(item)}
              >
                <MaterialIcons name="edit" size={20} color={colors.text.primary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDeleteFavorite(item)}
              >
                <MaterialIcons name="delete" size={20} color={colors.error[500]} />
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListFooterComponent={
          <TouchableOpacity style={styles.addButton} onPress={handleAddFavorite}>
            <MaterialIcons name="add-circle-outline" size={20} color={colors.primary[500]} />
            <Text style={styles.addButtonText}>Adicionar novo favorito</Text>
          </TouchableOpacity>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  listContent: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(2, 222, 149, 0.12)',
  },
  textWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  name: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  address: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary[500],
    flex: 1,
  },
  primaryButtonText: {
    color: colors.background.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.primary,
  },
  addButton: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary[500],
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addButtonText: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
