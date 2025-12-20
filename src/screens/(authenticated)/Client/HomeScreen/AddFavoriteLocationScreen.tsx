import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  FlatList,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import MapView, { PROVIDER_GOOGLE } from "react-native-maps";
import FavoriteBottomSheet from "../../../../components/FavoriteBottomSheet";
import {
  buscarEnderecoPorTexto,
  obterEnderecoPorCoordenadas,
  getCurrentLocation,
  formatarEndereco,
  type GeocodingResult,
} from "../../../../utils/location";

export default function AddFavoriteLocationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const mapRef = React.useRef<MapView>(null);

  // Estilo de mapa escuro
  const darkMapStyle = [
    { elementType: "geometry", stylers: [{ color: "#0f231c" }] },
    { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#9db9b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0b1814" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#0b1f19" }],
    },
    {
      featureType: "poi.park",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b8f8f" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#132b23" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "road",
      elementType: "labels.text.fill",
      stylers: [{ color: "#9db9b9" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#1a3b31" }],
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#0b1814" }],
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#6b8f8f" }],
    },
  ];

  const [address, setAddress] = useState("Buscando endereço...");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const [userCity, setUserCity] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");
  const [favoriteLabel, setFavoriteLabel] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("home");
  const [showBottomSheet, setShowBottomSheet] = useState(true);

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);

  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          const newRegion = {
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          };
          setRegion(newRegion);

          const endereco = await obterEnderecoPorCoordenadas(
            location.latitude,
            location.longitude
          );

          const cidadeDetectada =
            endereco?.city || endereco?.subregion || endereco?.district;
          if (cidadeDetectada) setUserCity(cidadeDetectada);
          if (endereco?.region) setUserRegion(endereco.region);

          setAddress(formatarEndereco(endereco));
        }
      } catch (error) {
        console.error("Erro ao detectar localização:", error);
      }
    };
    detectUserLocation();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchQuery.trim().length >= 3) {
        setIsSearching(true);
        setShowResults(true);
        try {
          const results = await buscarEnderecoPorTexto(
            searchQuery,
            userCity,
            userRegion
          );
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
  }, [searchQuery, userCity, userRegion]);

  const handleRegionChangeComplete = async (newRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    setIsGeocodingLoading(true);
    setAddress("Localizando...");
    try {
      const endereco = await obterEnderecoPorCoordenadas(
        newRegion.latitude,
        newRegion.longitude
      );

      const formatted = formatarEndereco(endereco);
      setAddress(formatted || "Endereço não encontrado");
    } catch (error) {
      console.error("Erro no geocoding:", error);
      setAddress("Erro ao buscar endereço");
    } finally {
      setIsGeocodingLoading(false);
    }
  };

  const handleSelectResult = (result: GeocodingResult) => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);
    setAddress(result.formattedAddress);

    const newRegion = {
      latitude: result.latitude,
      longitude: result.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 500);
  };

  const handleSaveFavorite = async () => {
    if (!favoriteLabel.trim()) {
      Alert.alert("Atenção", "Por favor, dê um nome para este favorito");
      return;
    }

    if (!region) {
      Alert.alert("Erro", "Localização não disponível");
      return;
    }

    try {
      // TODO: Implementar salvamento no banco de dados
      console.log("💾 Salvando favorito:", {
        label: favoriteLabel,
        icon: selectedIcon,
        address: address,
        latitude: region.latitude,
        longitude: region.longitude,
      });

      Alert.alert("Sucesso", "Favorito adicionado com sucesso!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error) {
      console.error("Erro ao salvar favorito:", error);
      Alert.alert("Erro", "Não foi possível salvar o favorito");
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {!region ? (
        <View
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <ActivityIndicator size="large" color="#02de95" />
          <Text style={{ color: "#fff", marginTop: 16, fontSize: 16 }}>
            Buscando sua localização...
          </Text>
        </View>
      ) : (
        <>
          {/* Map */}
          <MapView
            ref={mapRef}
            style={{ flex: 1 }}
            provider={PROVIDER_GOOGLE}
            region={region}
            customMapStyle={darkMapStyle}
            onRegionChangeComplete={handleRegionChangeComplete}
            showsUserLocation
            showsMyLocationButton={false}
          />

          {/* Center Pin */}
          <View
            style={{
              position: "absolute",
              inset: 0,
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
              pointerEvents: "none",
              paddingBottom: 48,
            }}
          >
            <MaterialIcons name="location-on" size={48} color="#02de95" />
          </View>

          {/* Top Navigation & Search */}
          <View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              paddingTop: Math.max(insets.top, 20),
              paddingHorizontal: 16,
              paddingBottom: 16,
              zIndex: 20,
            }}
            pointerEvents="box-none"
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 12,
                gap: 12,
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 9999,
                  backgroundColor: "#1c2727",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <MaterialIcons name="arrow-back" size={24} color="#fff" />
              </TouchableOpacity>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "bold",
                  }}
                >
                  Adicionar Favorito
                </Text>
                <Text
                  style={{
                    color: "#9db9b9",
                    fontSize: 12,
                  }}
                >
                  Escolha um local no mapa
                </Text>
              </View>
            </View>

            <View style={{ width: "100%" }}>
              <View
                style={{
                  height: 48,
                  borderRadius: 12,
                  backgroundColor: "#1c2727",
                  flexDirection: "row",
                  alignItems: "center",
                  paddingHorizontal: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <MaterialIcons
                  name="search"
                  size={20}
                  color="#9db9b9"
                  style={{ marginRight: 8 }}
                />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={
                    userCity
                      ? `Buscar em ${userCity}${
                          userRegion ? ` - ${userRegion}` : ""
                        }`
                      : "Buscar endereço"
                  }
                  placeholderTextColor="#9db9b9"
                  style={{
                    flex: 1,
                    color: "#fff",
                    fontSize: 16,
                    height: "100%",
                  }}
                />
                {isSearching && (
                  <ActivityIndicator
                    size="small"
                    color="#02de95"
                    style={{ marginLeft: 8 }}
                  />
                )}
                {searchQuery.length > 0 && !isSearching && (
                  <TouchableOpacity
                    onPress={() => {
                      setSearchQuery("");
                      setShowResults(false);
                      setSearchResults([]);
                    }}
                  >
                    <MaterialIcons name="close" size={20} color="#9db9b9" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Autocomplete Results */}
              {showResults && searchResults.length > 0 && (
                <View
                  style={{
                    position: "absolute",
                    top: 56,
                    left: 0,
                    right: 0,
                    maxHeight: 300,
                    backgroundColor: "#1c2727",
                    borderRadius: 12,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 12,
                    elevation: 8,
                    overflow: "hidden",
                  }}
                >
                  <FlatList
                    data={searchResults}
                    keyExtractor={(item, index) =>
                      `${item.latitude}-${item.longitude}-${index}`
                    }
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        onPress={() => handleSelectResult(item)}
                        style={{
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          borderBottomWidth: 1,
                          borderBottomColor: "rgba(255,255,255,0.05)",
                          flexDirection: "row",
                          alignItems: "center",
                          gap: 12,
                        }}
                        activeOpacity={0.7}
                      >
                        <View
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "rgba(2, 222, 149, 0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <MaterialIcons
                            name="location-on"
                            size={18}
                            color="#02de95"
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 15,
                              fontWeight: "600",
                            }}
                            numberOfLines={1}
                          >
                            {(item.street ||
                              item.formattedAddress.split(" - ")[0]) +
                              (item.streetNumber
                                ? `, ${item.streetNumber}`
                                : "")}
                          </Text>
                          <Text
                            style={{
                              color: "#9db9b9",
                              fontSize: 13,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {item.city && item.region
                              ? `${item.city} - ${item.region}`
                              : item.formattedAddress}
                          </Text>
                        </View>
                        <MaterialIcons
                          name="north-west"
                          size={16}
                          color="#9db9b9"
                        />
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}
            </View>
          </View>

          {/* Bottom Sheet Component */}
          {showBottomSheet && (
            <FavoriteBottomSheet
              address={address}
              isGeocodingLoading={isGeocodingLoading}
              favoriteLabel={favoriteLabel}
              selectedIcon={selectedIcon}
              onLabelChange={setFavoriteLabel}
              onIconSelect={setSelectedIcon}
              onSave={handleSaveFavorite}
              onDismiss={() => {
                setShowBottomSheet(false);
                navigation.goBack();
              }}
            />
          )}
        </>
      )}
    </View>
  );
}
