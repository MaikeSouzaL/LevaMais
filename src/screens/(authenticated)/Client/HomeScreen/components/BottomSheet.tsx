import React, { forwardRef, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { SearchBar } from "./SearchBar";
import { AppBottomSheet, AppBottomSheetRef } from "../../../../../components/ui/AppBottomSheet";
import favoriteAddressService, { FavoriteAddress } from "../../../../../services/favoriteAddress.service";

interface BottomSheetProps {
  onPressSearch?: () => void;
  onSelectFavorite?: (favorite: FavoriteAddress) => void;
}

export const BottomSheet = forwardRef<AppBottomSheetRef, BottomSheetProps>(
  ({ onPressSearch, onSelectFavorite }, ref) => {
    const navigation = useNavigation();
    const [favorites, setFavorites] = useState<FavoriteAddress[]>([]);
    const [loadingFavorites, setLoadingFavorites] = useState(true);

    useEffect(() => {
      loadFavorites();
    }, []);

    const loadFavorites = async () => {
      try {
        setLoadingFavorites(true);
        const favorites = await favoriteAddressService.list();
        // Pegar apenas os 2 primeiros
        setFavorites(favorites.slice(0, 2));
      } catch (error) {
        console.error("Erro ao carregar favoritos:", error);
        setFavorites([]);
      } finally {
        setLoadingFavorites(false);
      }
    };

    const handleFavoritePress = (favorite: FavoriteAddress) => {
      if (onSelectFavorite) {
        onSelectFavorite(favorite);
      }
    };

    return (
      <AppBottomSheet
        ref={ref}
        index={0}
        snapPoints={favorites.length > 0 ? ["32%"] : ["20%"]}
        enablePanDownToClose={false}
        backgroundColor="#0f231c"
        handleIndicatorColor="rgba(156, 163, 175, 0.3)"
        contentPaddingHorizontal={24}
        contentPaddingTop={16}
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.5,
          shadowRadius: 12,
          elevation: 10,
        }}
      >
        <SearchBar onPress={onPressSearch} />

        {/* Favoritos */}
        {loadingFavorites ? (
          <View style={{ marginTop: 16, alignItems: "center" }}>
            <ActivityIndicator color="#02de95" size="small" />
          </View>
        ) : favorites.length > 0 ? (
          <View style={{ marginTop: 16 }}>
            <Text
              style={{
                color: "#9bbbb0",
                fontSize: 11,
                fontWeight: "700",
                marginBottom: 12,
                marginLeft: 4,
                textTransform: "uppercase",
                letterSpacing: 0.5,
              }}
            >
              Favoritos
            </Text>
            {favorites.map((favorite) => (
              <TouchableOpacity
                key={favorite._id}
                onPress={() => handleFavoritePress(favorite)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#162e25",
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: "rgba(2,222,149,0.1)",
                }}
                activeOpacity={0.7}
              >
                {/* Ícone */}
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: "rgba(2,222,149,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  <MaterialIcons
                    name={favorite.icon as any}
                    size={20}
                    color="#02de95"
                  />
                </View>

                {/* Informações */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontSize: 14,
                      fontWeight: "700",
                      marginBottom: 2,
                    }}
                    numberOfLines={1}
                  >
                    {favorite.name}
                  </Text>
                  <Text
                    style={{
                      color: "#9bbbb0",
                      fontSize: 12,
                    }}
                    numberOfLines={1}
                  >
                    {favorite.formattedAddress || favorite.address}
                  </Text>
                </View>

                {/* Seta */}
                <MaterialIcons
                  name="chevron-right"
                  size={20}
                  color="#9bbbb0"
                />
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <Text
            style={{
              color: "#9bbbb0",
              fontSize: 11,
              fontWeight: "600",
              marginTop: 16,
              marginBottom: 8,
              marginLeft: 4,
              textAlign: "center",
              opacity: 0.7,
            }}
          >
            Toque na barra de busca para escolher seu destino
          </Text>
        )}
      </AppBottomSheet>
    );
  },
);
