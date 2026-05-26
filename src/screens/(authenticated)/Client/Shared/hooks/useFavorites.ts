import { useCallback, useEffect, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import { logger } from "@/utils/logger";

/**
 * Hook para gerenciar favoritos do cliente.
 * Carrega automaticamente no mount e recarrega quando a tela recebe foco.
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const favs = await favoriteAddressService.list();
      setFavorites(favs || []);
    } catch (error) {
      logger.error("useFavorites", "Erro ao carregar favoritos", error);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega no mount
  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  // Recarrega quando a tela recebe foco
  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [loadFavorites])
  );

  return {
    favorites,
    loading,
    refresh: loadFavorites,
  };
}
