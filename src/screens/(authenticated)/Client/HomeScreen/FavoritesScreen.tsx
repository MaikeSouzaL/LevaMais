import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";

import favoriteAddressService, {
  type FavoriteAddress,
} from "../../../../services/favoriteAddress.service";

export default function FavoritesScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const params = (route.params as any) || {};

  const pickup = params.pickup;

  const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const list = await favoriteAddressService.list();
      setFavorites(list);
    } catch (e) {
      console.error("Erro ao carregar favoritos:", e);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  const handleDelete = (fav: FavoriteAddress) => {
    Alert.alert(
      "Excluir favorito",
      `Deseja excluir \"${fav.name}\"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await favoriteAddressService.delete(fav._id);
              await load();
            } catch (e) {
              console.error("Erro ao excluir favorito:", e);
              Alert.alert("Erro", "Não foi possível excluir o favorito.");
            }
          },
        },
      ],
    );
  };

  const handleSelect = (fav: FavoriteAddress) => {
    const dropAddr = fav.formattedAddress || fav.address;

    (navigation as any).navigate("SelectVehicle", {
      pickup,
      dropoff: {
        address: dropAddr,
        latitude: fav.latitude,
        longitude: fav.longitude,
      },
    });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => (navigation as any).goBack()} style={{ padding: 6 }}>
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900" }}>Favoritos</Text>
          <Text style={{ color: "#9abcb0", fontSize: 12, marginTop: 2 }}>
            Toque para selecionar ou exclua um favorito
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#02de95" size="large" />
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={() => (
            <View style={{ paddingTop: 32, alignItems: "center" }}>
              <Text style={{ color: "#9abcb0" }}>Nenhum favorito salvo.</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#162e25",
                borderRadius: 14,
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.06)",
                overflow: "hidden",
              }}
            >
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(2,222,149,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <MaterialIcons name={item.icon as any} size={20} color="#02de95" />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={{ color: "#9abcb0", fontSize: 12 }} numberOfLines={1}>
                    {item.formattedAddress || item.address}
                  </Text>
                </View>

                <MaterialIcons name="chevron-right" size={22} color="#9abcb0" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDelete(item)}
                style={{ paddingHorizontal: 14, paddingVertical: 16 }}
                activeOpacity={0.8}
              >
                <MaterialIcons name="delete-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            </View>
          )}
        />
      )}
    </SafeAreaView>
  );
}
