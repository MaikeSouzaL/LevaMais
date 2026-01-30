import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import favoriteAddressService from "../../../../services/favoriteAddress.service";
import googlePlacesService, {
  PlaceAutocompleteResult,
  PlaceDetails,
} from "../../../../services/googlePlaces.service";

type Params = {
  AddFavorite: {
    address?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
};

const ICON_OPTIONS = [
  { id: "home", label: "Casa", icon: "home" },
  { id: "work", label: "Trabalho", icon: "work" },
  { id: "favorite", label: "Favorito", icon: "favorite" },
  { id: "shopping-cart", label: "Compras", icon: "shopping-cart" },
  { id: "school", label: "Escola", icon: "school" },
  { id: "restaurant", label: "Restaurante", icon: "restaurant" },
  { id: "local-hospital", label: "Hospital", icon: "local-hospital" },
  { id: "fitness-center", label: "Academia", icon: "fitness-center" },
] as const;

export default function AddFavoriteScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "AddFavorite">>();
  const params = route.params;

  const [name, setName] = useState("");
  const [selectedIcon, setSelectedIcon] = useState<string>("home");
  const [loading, setLoading] = useState(false);

  // Autocomplete states
  const [searchQuery, setSearchQuery] = useState(params?.address || "");
  const [searchResults, setSearchResults] = useState<PlaceAutocompleteResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<{
    formattedAddress?: string;
    street?: string;
    streetNumber?: string;
    address: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    region?: string;
    postalCode?: string;
    latitude: number;
    longitude: number;
  } | null>(
    params?.latitude && params?.longitude
      ? {
          address: params.address || "",
          neighborhood: params.neighborhood,
          city: params.city,
          state: params.state,
          latitude: params.latitude,
          longitude: params.longitude,
        }
      : null
  );

  // Autocomplete search with Google Places
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3 && !selectedAddress) {
        setIsSearching(true);
        setShowResults(true);
        try {
          console.log("🔍 Buscando endereço:", searchQuery);
          const results = await googlePlacesService.searchPlaces(searchQuery);
          console.log("✅ Resultados encontrados:", results.length);
          console.log("📋 Resultados:", results);
          setSearchResults(results);
        } catch (error) {
          console.error("Erro na busca:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedAddress]);

  const handleSelectAddress = async (result: PlaceAutocompleteResult) => {
    try {
      setIsSearching(true);
      console.log("📍 Buscando detalhes do lugar:", result.placeId);
      
      const details = await googlePlacesService.getPlaceDetails(result.placeId);
      
      if (!details) {
        Alert.alert("Erro", "Não foi possível obter os detalhes do endereço");
        return;
      }

      console.log("✅ Detalhes completos recebidos:");
      console.log("   - Endereço formatado:", details.formattedAddress);
      console.log("   - Rua:", details.street);
      console.log("   - Número:", details.streetNumber);
      console.log("   - Bairro:", details.neighborhood);
      console.log("   - Cidade:", details.city);
      console.log("   - Estado:", details.state, `(${details.stateCode})`);
      console.log("   - CEP:", details.postalCode);
      console.log("   - Coordenadas:", details.latitude, details.longitude);

      setSelectedAddress({
        formattedAddress: details.formattedAddress,
        street: details.street,
        streetNumber: details.streetNumber,
        address: details.formattedAddress,
        neighborhood: details.neighborhood,
        city: details.city,
        state: details.stateCode || details.state,
        region: details.state,
        postalCode: details.postalCode,
        latitude: details.latitude,
        longitude: details.longitude,
      });
      
      setSearchQuery(details.formattedAddress);
      setShowResults(false);
      Keyboard.dismiss();
    } catch (error) {
      console.error("Erro ao obter detalhes:", error);
      Alert.alert("Erro", "Não foi possível obter os detalhes do endereço");
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearAddress = () => {
    setSelectedAddress(null);
    setSearchQuery("");
    setShowResults(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Atenção", "Por favor, digite um nome para o favorito");
      return;
    }

    if (!selectedAddress?.latitude || !selectedAddress?.longitude) {
      Alert.alert("Erro", "Por favor, selecione um endereço válido");
      return;
    }

    try {
      setLoading(true);

      await favoriteAddressService.create({
        name: name.trim(),
        icon: selectedIcon,
        formattedAddress: selectedAddress.formattedAddress,
        street: selectedAddress.street,
        streetNumber: selectedAddress.streetNumber,
        address: selectedAddress.address,
        neighborhood: selectedAddress.neighborhood,
        city: selectedAddress.city,
        state: selectedAddress.state,
        region: selectedAddress.region,
        postalCode: selectedAddress.postalCode,
        latitude: selectedAddress.latitude,
        longitude: selectedAddress.longitude,
      });

      Alert.alert("Sucesso", "Favorito salvo com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      const message =
        error?.response?.data?.error || "Erro ao salvar favorito";
      Alert.alert("Erro", message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View>
          <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
            Adicionar Favorito
          </Text>
          <Text style={{ color: "#9abcb0", fontSize: 12, marginTop: 2 }}>
            Escolha um local no mapa
          </Text>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Campo de busca com autocomplete */}
        <View style={{ marginBottom: 24, zIndex: 10 }}>
          <Text
            style={{
              color: "#9abcb0",
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Buscar endereço
          </Text>
          <View style={{ position: "relative" }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#162e25",
                borderWidth: 1,
                borderColor: selectedAddress
                  ? "#02de95"
                  : "rgba(255,255,255,0.08)",
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              <MaterialIcons
                name="search"
                size={20}
                color="#9abcb0"
                style={{ marginRight: 8 }}
              />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Digite o endereço..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={{
                  flex: 1,
                  color: "white",
                  fontSize: 16,
                }}
                editable={!selectedAddress}
              />
              {(isSearching || selectedAddress) && (
                <TouchableOpacity
                  onPress={handleClearAddress}
                  style={{ padding: 4 }}
                >
                  <MaterialIcons
                    name={isSearching ? "hourglass-empty" : "close"}
                    size={20}
                    color="#9abcb0"
                  />
                </TouchableOpacity>
              )}
            </View>

            {/* Autocomplete Results */}
            {showResults && searchResults.length > 0 && (
              <View
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  right: 0,
                  backgroundColor: "#1a3830",
                  borderRadius: 16,
                  marginTop: 8,
                  maxHeight: 600,
                  borderWidth: 2,
                  borderColor: "#02de95",
                  shadowColor: "#02de95",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.3,
                  shadowRadius: 16,
                  elevation: 10,
                  overflow: "hidden",
                }}
              >
                <FlatList
                  data={searchResults}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <TouchableOpacity
                      onPress={() => handleSelectAddress(item)}
                      style={{
                        padding: 16,
                        paddingVertical: 16,
                        borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                        borderBottomColor: "rgba(2,222,149,0.15)",
                        backgroundColor: "transparent",
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "rgba(2,222,149,0.15)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 14,
                          }}
                        >
                          <MaterialIcons
                            name="place"
                            size={24}
                            color="#02de95"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#ffffff",
                              fontSize: 16,
                              fontWeight: "700",
                              marginBottom: 4,
                              lineHeight: 22,
                            }}
                            numberOfLines={2}
                          >
                            {item.mainText}
                          </Text>
                          <Text
                            style={{
                              color: "#9abcb0",
                              fontSize: 14,
                              lineHeight: 20,
                            }}
                            numberOfLines={2}
                          >
                            {item.secondaryText}
                          </Text>
                        </View>
                        <MaterialIcons
                          name="chevron-right"
                          size={24}
                          color="#02de95"
                          style={{ marginLeft: 8 }}
                        />
                      </View>
                    </TouchableOpacity>
                  )}
                  nestedScrollEnabled
                  showsVerticalScrollIndicator={true}
                  indicatorStyle="white"
                />
              </View>
            )}
          </View>
        </View>

        {/* Endereço selecionado */}
        {selectedAddress && (
          <>
            <View
              style={{
                backgroundColor: "#162e25",
                borderWidth: 1,
                borderColor: "#02de95",
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                }}
              >
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color="#02de95"
                  style={{ marginRight: 8 }}
                />
                <Text
                  style={{
                    color: "#02de95",
                    fontSize: 11,
                    fontWeight: "700",
                    textTransform: "uppercase",
                  }}
                >
                  Endereço Selecionado
                </Text>
              </View>
              <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>
                {selectedAddress.address}
              </Text>
            </View>

            {/* Campo para editar número */}
            <View style={{ marginBottom: 24 }}>
              <Text
                style={{
                  color: "#9abcb0",
                  fontSize: 13,
                  fontWeight: "700",
                  marginBottom: 8,
                }}
              >
                Número (opcional - corrija se necessário)
              </Text>
              <TextInput
                value={selectedAddress.streetNumber || ""}
                onChangeText={(text) => {
                  setSelectedAddress({
                    ...selectedAddress,
                    streetNumber: text,
                    // Atualizar também o formattedAddress
                    formattedAddress: selectedAddress.street
                      ? `${selectedAddress.street}, ${text} - ${selectedAddress.neighborhood || ""} - ${selectedAddress.state || ""}`
                      : selectedAddress.formattedAddress,
                  });
                }}
                placeholder="Ex: 295, 123A, S/N"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="default"
                style={{
                  backgroundColor: "#162e25",
                  borderWidth: 1,
                  borderColor: selectedAddress.streetNumber
                    ? "#02de95"
                    : "rgba(255,255,255,0.08)",
                  borderRadius: 12,
                  padding: 16,
                  color: "white",
                  fontSize: 16,
                }}
              />
              <Text
                style={{
                  color: "#9abcb0",
                  fontSize: 11,
                  marginTop: 6,
                  marginLeft: 4,
                  opacity: 0.7,
                }}
              >
                💡 Se o número do autocomplete estiver errado, corrija aqui
              </Text>
            </View>
          </>
        )}

        {/* Nome do favorito */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: "#9abcb0",
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 8,
            }}
          >
            Nome do favorito
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Ex: Casa, Trabalho, Academia..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={{
              backgroundColor: "#162e25",
              borderWidth: 1,
              borderColor: name ? "#02de95" : "rgba(255,255,255,0.08)",
              borderRadius: 12,
              padding: 16,
              color: "white",
              fontSize: 16,
            }}
          />
        </View>

        {/* Seleção de ícone */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              color: "#9abcb0",
              fontSize: 13,
              fontWeight: "700",
              marginBottom: 12,
            }}
          >
            Escolha um ícone:
          </Text>
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {ICON_OPTIONS.map((option) => {
              const isSelected = selectedIcon === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  onPress={() => setSelectedIcon(option.id)}
                  style={{
                    width: 72,
                    height: 72,
                    backgroundColor: isSelected
                      ? "rgba(2,222,149,0.15)"
                      : "#162e25",
                    borderWidth: 2,
                    borderColor: isSelected
                      ? "#02de95"
                      : "rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={28}
                    color={isSelected ? "#02de95" : "#9abcb0"}
                  />
                  <Text
                    style={{
                      color: isSelected ? "#02de95" : "#9abcb0",
                      fontSize: 10,
                      marginTop: 4,
                      fontWeight: isSelected ? "700" : "400",
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Footer com botão salvar */}
      <View
        style={{
          padding: 16,
          paddingBottom: 32,
          backgroundColor: "rgba(15,35,28,0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
        }}
      >
        <TouchableOpacity
          onPress={handleSave}
          disabled={loading || !name.trim() || !selectedAddress}
          activeOpacity={0.9}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor:
              loading || !name.trim() || !selectedAddress
                ? "rgba(2,222,149,0.3)"
                : "#02de95",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "row",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#0f231c" />
          ) : (
            <>
              <MaterialIcons name="bookmark" size={20} color="#0f231c" />
              <Text
                style={{
                  color: "#0f231c",
                  fontWeight: "800",
                  fontSize: 18,
                  marginLeft: 8,
                }}
              >
                Salvar Favorito
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
