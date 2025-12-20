import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
  buscarEnderecoPorTexto,
  obterEnderecoPorCoordenadas,
  getCurrentLocation,
  type GeocodingResult,
} from "../../../../utils/location";

export default function LocationPickerScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const [userCity, setUserCity] = useState<string>("");
  const [userRegion, setUserRegion] = useState<string>("");
  const [currentLocation, setCurrentLocation] = useState<string>("Av. Paulista, 1578");
  const [currentAddress, setCurrentAddress] = useState<string>("Bela Vista, São Paulo - SP");

  const favorites = [
    { icon: "home", title: "Casa", address: "Rua Augusta, 500 - Consolação" },
    { icon: "work", title: "Trabalho", address: "Av. Faria Lima, 3477 - Itaim Bibi" },
  ];

  const recents = [
    { title: "Shopping Cidade São Paulo", address: "Av. Paulista, 1230 - Bela Vista" },
    { title: "Aeroporto de Congonhas", address: "Vila Congonhas, São Paulo" },
    { title: "Parque Ibirapuera - Portão 3", address: "Av. Pedro Álvares Cabral" },
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
            setCurrentLocation(`${address.street || ""}${address.streetNumber ? ", " + address.streetNumber : ""}`);
            setCurrentAddress(`${address.district || ""}, ${address.city || ""} - ${address.region || ""}`);
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
          const results = await buscarEnderecoPorTexto(searchQuery, userCity, userRegion);
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
    navigation.goBack();
  };

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
            <Text className="text-white text-lg font-bold">Selecionar Destino</Text>
            <Text className="text-gray-400 text-xs">Para onde você vai?</Text>
          </View>
        </View>

        {/* Current Location */}
        <View className="px-6 pt-4 pb-3 border-b border-white/10">
          <Text className="text-primary text-xs font-bold tracking-widest uppercase mb-1">
            Local Atual
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="text-white text-lg font-bold">{currentLocation}</Text>
            <MaterialIcons name="edit" size={18} color="#02de95" />
          </View>
          <Text className="text-gray-400 text-sm mt-1">{currentAddress}</Text>
        </View>

        {/* Search Bar */}
        <View className="px-6 py-4">
          <View className="relative">
            <View className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
              <MaterialIcons name="search" size={20} color="#9CA3AF" />
            </View>
            <TextInput
              placeholder="Digite um endereço ou escolha no mapa"
              placeholderTextColor="#6B7280"
              className="w-full p-4 pl-12 text-sm text-white border border-white/10 rounded-xl bg-surface-dark"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            {isSearching && (
              <View className="absolute right-4 top-1/2 -translate-y-1/2">
                <ActivityIndicator size="small" color="#02de95" />
              </View>
            )}
          </View>
        </View>

        {/* Results or Content */}
        <ScrollView
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {showResults && searchResults.length > 0 ? (
            /* Search Results */
            <View className="mb-6">
              <Text className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 pl-1">
                Resultados ({searchResults.length})
              </Text>
              {searchResults.map((result, index) => (
                <TouchableOpacity
                  key={index}
                  className="flex-row items-center p-3 rounded-xl active:bg-white/5 mb-2"
                  onPress={() => handleSelectResult(result)}
                >
                  <View className="h-10 w-10 rounded-full bg-primary/10 items-center justify-center mr-4">
                    <MaterialIcons name="place" size={20} color="#02de95" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-white">
                      {result.formattedAddress}
                    </Text>
                    <Text className="text-xs text-gray-400" numberOfLines={1}>
                      {result.city}, {result.region}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <>
              {/* Quick Actions */}
              <View className="flex-row gap-3 mb-6">
                <TouchableOpacity
                  className="flex-1 p-4 rounded-2xl bg-surface-dark border border-white/5 active:opacity-80"
                  onPress={handleChooseOnMap}
                >
                  <View className="h-10 w-10 rounded-full bg-blue-500/10 items-center justify-center mb-3">
                    <MaterialIcons name="map" size={20} color="#60A5FA" />
                  </View>
                  <Text className="text-sm font-semibold text-white">
                    Escolher no Mapa
                  </Text>
                  <Text className="text-xs text-gray-400">Ajustar pino</Text>
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
                      onPress={() => handleSelectResult({ formattedAddress: item.address } as any)}
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
                        <Text className="text-xs text-gray-400" numberOfLines={1}>
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
                  <TouchableOpacity className="flex-row items-center p-3 rounded-xl active:bg-white/5">
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
                      onPress={() => handleSelectResult({ formattedAddress: item.address } as any)}
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
                        <Text className="text-xs text-gray-400" numberOfLines={1}>
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
      </KeyboardAvoidingView>
    </View>
  );
}
