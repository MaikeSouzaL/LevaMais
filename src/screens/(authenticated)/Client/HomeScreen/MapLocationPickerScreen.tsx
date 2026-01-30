import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import {
  obterEnderecoPorCoordenadas,
  getCurrentLocation,
  formatarEndereco,
} from "../../../../utils/location";
import {
  buscarPredicoesEnderecoGoogle,
  obterDetalhesEnderecoGoogle,
  type PlacesPrediction,
} from "../../../../utils/googlePlaces";

export default function MapLocationPickerScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const mapRef = React.useRef<MapView>(null);
  
  const { returnScreen, selectionMode } = (route.params as any) || {};
  const isPickupMode = selectionMode === "currentLocation";

  // Estilo de mapa escuro (Google Maps) para combinar com o tema da aplicação
  // Fonte: estilo dark simplificado baseado no Snazzy Maps (ajustado para melhor contraste com os pins).
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
  const [searchResults, setSearchResults] = useState<PlacesPrediction[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  const [userCity, setUserCity] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");

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

          // Formatar endereço
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
          const results = await buscarPredicoesEnderecoGoogle(searchQuery, {
            latitude: region?.latitude,
            longitude: region?.longitude,
            radiusMeters: 50000,
          });
          setSearchResults(results);
        } catch (error) {
          console.error("Erro na busca (Google Places):", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, region?.latitude, region?.longitude]);

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

  const handleSelectResult = async (result: PlacesPrediction) => {
    setSearchQuery("");
    setShowResults(false);
    setSearchResults([]);

    try {
      const details = await obterDetalhesEnderecoGoogle(result.placeId);
      if (!details) {
        setAddress(result.description);
        return;
      }

      setAddress(details.formattedAddress);

      const newRegion = {
        latitude: details.latitude,
        longitude: details.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };

      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error("Erro ao obter detalhes do lugar:", error);
      setAddress(result.description);
    }
  };

  const handleConfirm = () => {
    console.log("📍 Local confirmado:", address);
    if (returnScreen === "LocationPicker") {
      navigation.navigate({
        name: "LocationPicker",
        params: {
          selectedLocation: {
            formattedAddress: address,
            latitude: region?.latitude,
            longitude: region?.longitude,
          },
          selectionMode: selectionMode,
        },
        merge: true,
      } as any);
    } else {
      (navigation as any).navigate("Home", { reopenBottomSheet: true });
    }
  };

  const handleBack = () => {
    (navigation as any).navigate("LocationPicker");
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {!region ? (
        // Loading enquanto busca localização
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

          {/* Center Pin (Fixed) */}
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
            <View style={{ alignItems: "center" }}>
              <View
                style={{
                  marginBottom: 8,
                  backgroundColor: "#fff",
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 9999,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                }}
              >
                <Text
                  style={{ color: "#102222", fontSize: 12, fontWeight: "bold" }}
                >
                  4 min
                </Text>
              </View>
              <MaterialIcons name="location-on" size={48} color="#02de95" />
            </View>
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
            <TouchableOpacity
              onPress={handleBack}
              style={{
                width: 48,
                height: 48,
                borderRadius: 9999,
                backgroundColor: "#1c2727",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

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
                    keyExtractor={(item) => item.placeId}
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
                            {item.primaryText || item.description}
                          </Text>
                          <Text
                            style={{
                              color: "#9db9b9",
                              fontSize: 13,
                              marginTop: 2,
                            }}
                            numberOfLines={1}
                          >
                            {item.secondaryText || ""}
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

          {/* Bottom Sheet (Fixed) */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 30,
              backgroundColor: "#111818",
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              borderTopWidth: 1,
              borderTopColor: "rgba(255,255,255,0.05)",
              paddingBottom: Math.max(insets.bottom, 24),
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -10 },
              shadowOpacity: 0.5,
              shadowRadius: 40,
              elevation: 20,
            }}
          >
            <View
              style={{
                height: 24,
                width: "100%",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 48,
                  height: 4,
                  borderRadius: 9999,
                  backgroundColor: "#3b5454",
                }}
              />
            </View>

            <View style={{ paddingHorizontal: 24, gap: 16 }}>
              <Text
                style={{
                  color: "#9db9b9",
                  fontSize: 14,
                  fontWeight: "500",
                  textAlign: "center",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                {isPickupMode ? "Confirmar local de partida" : "Confirmar destino"}
              </Text>

              <View style={{ alignItems: "center", gap: 4 }}>
                {isGeocodingLoading ? (
                  <View
                    style={{
                      alignItems: "center",
                      gap: 8,
                      paddingVertical: 16,
                    }}
                  >
                    <ActivityIndicator size="small" color="#02de95" />
                    <Text
                      style={{
                        color: "#9db9b9",
                        fontSize: 16,
                        fontWeight: "500",
                        textAlign: "center",
                      }}
                    >
                      Buscando endereço...
                    </Text>
                  </View>
                ) : (
                  <>
                    {(() => {
                      const parts = address.split(" - ");
                      const ruaNumero = parts[0] || address;
                      const resto = parts.slice(1).join(" - ");

                      return (
                        <>
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 24,
                              fontWeight: "700",
                              textAlign: "center",
                            }}
                            numberOfLines={2}
                          >
                            {ruaNumero}
                          </Text>
                          {resto && (
                            <Text
                              style={{
                                color: "#9db9b9",
                                fontSize: 16,
                                fontWeight: "400",
                                textAlign: "center",
                              }}
                            >
                              {resto}
                            </Text>
                          )}
                        </>
                      );
                    })()}
                  </>
                )}
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#1c2727",
                  borderRadius: 12,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.05)",
                  gap: 12,
                }}
              >
                <MaterialIcons name="edit" size={20} color="#02de95" />
                <TextInput
                  placeholder="Adicionar ponto de referência (opcional)"
                  placeholderTextColor="#9db9b9"
                  style={{ flex: 1, color: "#fff", fontSize: 14, padding: 0 }}
                />
              </View>

              <TouchableOpacity
                onPress={handleConfirm}
                activeOpacity={0.9}
                style={{
                  width: "100%",
                  height: 56,
                  backgroundColor: "#02de95",
                  borderRadius: 9999,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  shadowColor: "#02de95",
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.3,
                  shadowRadius: 20,
                  elevation: 10,
                }}
              >
                <Text
                  style={{ color: "#111818", fontSize: 16, fontWeight: "700" }}
                >
                  {isPickupMode ? "Confirmar Local" : "Confirmar Destino"}
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#111818" />
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </View>
  );
}
