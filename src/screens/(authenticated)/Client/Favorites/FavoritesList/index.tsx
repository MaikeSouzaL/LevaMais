import React, { useCallback, useState } from "react";
import {
  FlatList,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView, AnimatePresence } from "moti";
import {
  ArrowLeft,
  Star,
  Home,
  Briefcase,
  MapPin,
  Navigation,
  Edit2,
  Trash2,
  Plus,
  Heart,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import favoriteAddressService, { FavoriteAddress } from "@/services/favoriteAddress.service";
import { ClientStackParamList } from "../../types/navigation";
import { Modal } from "@/components/Modal";

const ICON_MAP: Record<string, any> = {
  home: Home,
  work: Briefcase,
  star: Star,
  favorite: Heart,
  "location-on": MapPin,
  place: MapPin,
};

function FavIcon({ icon }: { icon?: string }) {
  const Icon = ICON_MAP[icon || ""] || MapPin;
  return <Icon size={20} color="#02de95" />;
}

export default function FavoritesScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "Favorites">>();
  const insets = useSafeAreaInsets();

  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Delete confirm modal state
  const [deleteTarget, setDeleteTarget] = useState<FavoriteAddress | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const openNewFavoriteFlow = useCallback(() => {
    navigation.navigate("FavoriteAddressFlow", {
      initialSearchMode: "favoritesList",
    });
  }, [navigation]);

  const loadFavorites = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const list = await favoriteAddressService.list();
      setFavorites(list || []);
    } catch {
      Toast.show({ type: "error", text1: "Erro ao carregar favoritos", text2: "Tente novamente" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadFavorites(); }, [loadFavorites]));

  const handleUseFavorite = (favorite: FavoriteAddress) => {
    navigation.navigate("DestinationSearch", {
      dropoff: {
        address: favorite.formattedAddress || favorite.address,
        latitude: Number(favorite.latitude),
        longitude: Number(favorite.longitude),
      },
    });
  };

  const handleEditFavorite = (favorite: FavoriteAddress) => {
    navigation.navigate("EditFavorite", {
      favoriteId: favorite._id,
      favoriteData: favorite,
      returnScreen: "Favorites",
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      await favoriteAddressService.delete(deleteTarget._id);
      setFavorites((current) => current.filter((item) => item._id !== deleteTarget._id));
      Toast.show({ type: "success", text1: "Favorito removido" });
    } catch {
      Toast.show({ type: "error", text1: "Erro ao remover", text2: "Tente novamente" });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View style={{
        paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 16,
        flexDirection: "row", alignItems: "center",
        borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)",
      }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 14 }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Favoritos</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            {favorites.length > 0 ? `${favorites.length} endereço${favorites.length !== 1 ? "s" : ""} salvo${favorites.length !== 1 ? "s" : ""}` : "Endereços para pedir mais rápido"}
          </Text>
        </View>
        <TouchableOpacity
          onPress={openNewFavoriteFlow}
          activeOpacity={0.85}
          style={{
            height: 38, paddingHorizontal: 14, borderRadius: 12,
            backgroundColor: "rgba(2,222,149,0.12)",
            borderWidth: 1, borderColor: "rgba(2,222,149,0.3)",
            flexDirection: "row", alignItems: "center", gap: 6,
          }}
        >
          <Plus size={15} color="#02de95" />
          <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginTop: 14 }}>Carregando favoritos...</Text>
        </View>
      ) : favorites.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 40 }}>
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              width: 88, height: 88, borderRadius: 44,
              backgroundColor: "rgba(2,222,149,0.07)",
              borderWidth: 1, borderColor: "rgba(2,222,149,0.15)",
              alignItems: "center", justifyContent: "center", marginBottom: 20,
            }}
          >
            <Star size={38} color="rgba(2,222,149,0.4)" />
          </MotiView>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 10 }}>Nenhum favorito ainda</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, textAlign: "center", lineHeight: 21, marginBottom: 28 }}>
            Salve endereços frequentes para solicitar corridas e entregas mais rapidamente.
          </Text>
          <TouchableOpacity
            onPress={openNewFavoriteFlow}
            activeOpacity={0.85}
            style={{
              height: 52, paddingHorizontal: 28, borderRadius: 16,
              backgroundColor: "#02de95", flexDirection: "row", alignItems: "center", gap: 10,
            }}
          >
            <Plus size={18} color="#091A2F" />
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
              Adicionar Favorito
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, gap: 10, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => loadFavorites(true)} tintColor="#02de95" />
          }
          renderItem={({ item, index }) => (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ delay: index * 50 }}
              style={{
                backgroundColor: "#11253E", borderRadius: 20,
                borderWidth: 1, borderColor: "rgba(255,255,255,0.07)",
                overflow: "hidden",
              }}
            >
              {/* Info row */}
              <View style={{ flexDirection: "row", alignItems: "center", padding: 16, gap: 14 }}>
                <View style={{
                  width: 46, height: 46, borderRadius: 14,
                  backgroundColor: "rgba(2,222,149,0.1)",
                  borderWidth: 1, borderColor: "rgba(2,222,149,0.2)",
                  alignItems: "center", justifyContent: "center",
                }}>
                  <FavIcon icon={item.icon} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 3 }}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 12, lineHeight: 17 }} numberOfLines={2}>
                    {item.formattedAddress || item.address}
                  </Text>
                </View>
              </View>

              {/* Action row */}
              <View style={{
                flexDirection: "row", alignItems: "center", gap: 8,
                paddingHorizontal: 16, paddingBottom: 14,
              }}>
                <TouchableOpacity
                  onPress={() => handleUseFavorite(item)}
                  activeOpacity={0.85}
                  style={{
                    flex: 1, height: 40, borderRadius: 12,
                    backgroundColor: "#02de95", flexDirection: "row",
                    alignItems: "center", justifyContent: "center", gap: 7,
                  }}
                >
                  <Navigation size={14} color="#091A2F" />
                  <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 12, textTransform: "uppercase" }}>
                    Usar destino
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => handleEditFavorite(item)}
                  activeOpacity={0.8}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Edit2 size={16} color="rgba(255,255,255,0.6)" />
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeleteTarget(item)}
                  activeOpacity={0.8}
                  style={{
                    width: 40, height: 40, borderRadius: 12,
                    backgroundColor: "rgba(239,68,68,0.08)",
                    borderWidth: 1, borderColor: "rgba(239,68,68,0.2)",
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </MotiView>
          )}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        visible={!!deleteTarget}
        title="Remover Favorito?"
        type="error"
        confirmText={isDeleting ? "Removendo..." : "Confirmar"}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      >
        {deleteTarget && (
          <View style={{ width: "100%", marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 19 }}>
              Deseja remover <Text style={{ color: "#fff", fontWeight: "700" }}>"{deleteTarget.name}"</Text> dos seus favoritos?
            </Text>
          </View>
        )}
      </Modal>
    </View>
  );
}
