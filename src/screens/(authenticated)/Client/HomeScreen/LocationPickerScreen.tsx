import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  buscarEnderecoPorTexto,
  obterEnderecoPorCoordenadas,
  getCurrentLocation,
  formatarEndereco,
  type GeocodingResult,
} from "../../../../utils/location";

export default function LocationPickerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  // Animação do bottom sheet
  const slideAnim = useRef(new Animated.Value(400)).current; // Começa fora da tela (400px abaixo)

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [userCity, setUserCity] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");
  const [currentLocation, setCurrentLocation] =
    useState<string>("Av. Paulista, 1578");
  const [currentAddress, setCurrentAddress] = useState<string>(
    "Bela Vista, São Paulo - SP"
  );

  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);

  const favorites = [
    { icon: "home", title: "Casa", address: "Rua Augusta, 500 - Consolação" },
    {
      icon: "work",
      title: "Trabalho",
      address: "Av. Faria Lima, 3477 - Itaim Bibi",
    },
  ];

  const recents = [
    {
      title: "Shopping Cidade São Paulo",
      address: "Av. Paulista, 1230 - Bela Vista",
    },
    { title: "Aeroporto de Congonhas", address: "Vila Congonhas, São Paulo" },
    {
      title: "Parque Ibirapuera - Portão 3",
      address: "Av. Pedro Álvares Cabral",
    },
  ];

  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        const location = await getCurrentLocation();
        if (location) {
          const address = await obterEnderecoPorCoordenadas(
            location.latitude,
            location.longitude
          );
          if (address) {
            setUserCity(address.city || "");
            setUserRegion(address.region || "");
            setCurrentLocation(
              `${address.street || ""}${
                address.streetNumber ? ", " + address.streetNumber : ""
              }`
            );
            setCurrentAddress(
              `${address.district || ""}, ${address.city || ""} - ${
                address.region || ""
              }`
            );
          }
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

  const handleSelectResult = (result: GeocodingResult) => {
    console.log("📍 Destino selecionado:", result.formattedAddress);
    setSelectedAddress(result.formattedAddress);
  };

  const handleConfirmLocation = () => {
    console.log("📍 Destino confirmado:", selectedAddress);
    navigation.goBack();
  };

  const handleCancelSelection = () => {
    // Animar saída
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setSelectedAddress(null);
    });
  };

  // Animar entrada do bottom sheet quando selectedAddress muda
  useEffect(() => {
    if (selectedAddress) {
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedAddress]);

  const handleChooseOnMap = () => {
    (navigation as any).navigate("MapLocationPicker");
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#0f231c",
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View className="px-6 pt-4 pb-2 flex-row items-center border-b border-white/10">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 rounded-full bg-white/5 items-center justify-center mr-3"
          >
            <MaterialIcons name="arrow-back" size={24} color="#02de95" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-white text-lg font-bold">
              Selecionar Destino
            </Text>
            <Text className="text-gray-400 text-xs">Para onde você vai?</Text>
          </View>
        </View>

        {/* Current Location */}
        <View className="px-6 pt-4 pb-3 border-b border-white/10">
          <Text className="text-primary text-xs font-bold tracking-widest uppercase mb-1">
            Local Atual
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-lg font-bold">
              {currentLocation}
            </Text>
            <MaterialIcons name="edit" size={18} color="#02de95" />
          </View>
          <Text className="text-gray-400 text-sm mt-1">{currentAddress}</Text>
        </View>

        {/* Results or Content */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showResults && searchResults.length > 0 ? (
            // Enquanto há resultados, a lista fica no dropdown; esconder conteúdo abaixo
            <View />
          ) : (
            <>
              {/* Quick Actions */}
              <View className="flex-row gap-3 mb-6 mt-6">
                <TouchableOpacity
                  className="flex-1 flex-row items-center p-4 rounded-2xl bg-surface-dark border border-white/5 active:opacity-80"
                  onPress={handleChooseOnMap}
                >
                  <View className="h-10 w-10 rounded-full bg-blue-500/10 items-center justify-center mr-3">
                    <MaterialIcons name="map" size={20} color="#60A5FA" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-white">
                      Escolher no Mapa
                    </Text>
                    <Text className="text-xs text-gray-400">Ajustar pino</Text>
                  </View>
                  <MaterialIcons
                    name="chevron-right"
                    size={22}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>

              {/* Favorites */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">
                  Favoritos
                </Text>
                <View>
                  {favorites.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                      onPress={() =>
                        handleSelectResult({
                          formattedAddress: item.address,
                        } as any)
                      }
                    >
                      <View className="h-10 w-10 rounded-full bg-white/10 items-center justify-center mr-4">
                        <MaterialIcons
                          name={item.icon as any}
                          size={20}
                          color="#D1D5DB"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-white">
                          {item.title}
                        </Text>
                        <Text
                          className="text-xs text-gray-400"
                          numberOfLines={1}
                        >
                          {item.address}
                        </Text>
                      </View>
                      <MaterialIcons
                        name="chevron-right"
                        size={18}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>
                  ))}

                  {/* Add Favorite */}
                  <TouchableOpacity
                    className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                    onPress={() =>
                      (navigation as any).navigate("AddFavoriteLocation")
                    }
                  >
                    <View className="h-10 w-10 rounded-full border border-dashed border-gray-500 items-center justify-center mr-4">
                      <MaterialIcons name="add" size={20} color="#9CA3AF" />
                    </View>
                    <Text className="text-sm font-medium text-white">
                      Adicionar Favorito
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Recent History */}
              <View className="mb-6">
                <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">
                  Recentes
                </Text>
                <View>
                  {recents.map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      className="flex-row items-center p-3 rounded-xl active:bg-white/5"
                      onPress={() =>
                        handleSelectResult({
                          formattedAddress: item.address,
                        } as any)
                      }
                    >
                      <View className="h-10 w-10 rounded-full bg-white/5 items-center justify-center mr-4">
                        <MaterialIcons
                          name="schedule"
                          size={20}
                          color="#9CA3AF"
                        />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium text-white">
                          {item.title}
                        </Text>
                        <Text
                          className="text-xs text-gray-400"
                          numberOfLines={1}
                        >
                          {item.address}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </>
          )}
        </ScrollView>

        {/* Bottom Sheet de Confirmação (aparece quando há endereço selecionado) */}
        {selectedAddress && (
          <Animated.View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
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
              transform: [{ translateY: slideAnim }],
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
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text
                  style={{
                    color: "#9db9b9",
                    fontSize: 14,
                    fontWeight: "500",
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                    flex: 1,
                  }}
                >
                  Confirmar Destino
                </Text>
                <TouchableOpacity onPress={handleCancelSelection}>
                  <MaterialIcons name="close" size={24} color="#9db9b9" />
                </TouchableOpacity>
              </View>

              <View style={{ alignItems: "center", gap: 4 }}>
                {(() => {
                  const parts = selectedAddress.split(" - ");
                  const ruaNumero = parts[0] || selectedAddress;
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
                onPress={handleConfirmLocation}
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
                  Confirmar Destino
                </Text>
                <MaterialIcons name="arrow-forward" size={20} color="#111818" />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </View>
  );
}
