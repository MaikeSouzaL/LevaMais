import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useAuthStore } from "../../../context/authStore";
import theme from "../../../theme";
import * as Location from "expo-location";

const { width, height } = Dimensions.get("window");

// Tipos de veículos/categorias
type VehicleCategory = "moto" | "carro" | "caminhao" | "passageiro";

interface Driver {
  id: string;
  name: string;
  category: VehicleCategory;
  rating: number;
  distance: number; // em km
  estimatedTime: number; // em minutos
  latitude: number;
  longitude: number;
  available: boolean;
  vehicleInfo?: string;
}

// Dados mockados de motoristas
const mockDrivers: Driver[] = [
  {
    id: "1",
    name: "João Silva",
    category: "moto",
    rating: 4.8,
    distance: 0.5,
    estimatedTime: 3,
    latitude: -23.5505,
    longitude: -46.6333,
    available: true,
    vehicleInfo: "Honda CG 160",
  },
  {
    id: "2",
    name: "Maria Santos",
    category: "moto",
    rating: 4.9,
    distance: 1.2,
    estimatedTime: 5,
    latitude: -23.5515,
    longitude: -46.6343,
    available: true,
    vehicleInfo: "Yamaha Fazer 250",
  },
  {
    id: "3",
    name: "Carlos Oliveira",
    category: "carro",
    rating: 4.7,
    distance: 2.1,
    estimatedTime: 8,
    latitude: -23.5525,
    longitude: -46.6353,
    available: true,
    vehicleInfo: "Fiat Uno",
  },
  {
    id: "4",
    name: "Ana Costa",
    category: "carro",
    rating: 4.9,
    distance: 1.8,
    estimatedTime: 7,
    latitude: -23.5495,
    longitude: -46.6323,
    available: true,
    vehicleInfo: "Chevrolet Spin",
  },
  {
    id: "5",
    name: "Pedro Alves",
    category: "caminhao",
    rating: 4.6,
    distance: 3.5,
    estimatedTime: 12,
    latitude: -23.5535,
    longitude: -46.6363,
    available: true,
    vehicleInfo: "Mercedes Sprinter",
  },
  {
    id: "6",
    name: "Lucas Ferreira",
    category: "passageiro",
    rating: 4.8,
    distance: 0.8,
    estimatedTime: 4,
    latitude: -23.5485,
    longitude: -46.6313,
    available: true,
    vehicleInfo: "Toyota Corolla",
  },
];

const categoryInfo = {
  moto: {
    name: "Moto",
    icon: "motorbike",
    description: "Comida, remédios, envelopes, peças",
    color: theme.COLORS.BRAND_LIGHT,
  },
  carro: {
    name: "Carro/Van",
    icon: "car",
    description: "Cargas médias e grandes",
    color: "#3B82F6",
  },
  caminhao: {
    name: "Caminhão",
    icon: "truck",
    description: "Fretes e cargas pesadas",
    color: "#F59E0B",
  },
  passageiro: {
    name: "Passageiro",
    icon: "car",
    description: "Transporte de pessoas",
    color: "#8B5CF6",
  },
};

export default function HomeScreen() {
  const { userData } = useAuthStore();
  const [selectedCategory, setSelectedCategory] =
    useState<VehicleCategory>("moto");
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [searchText, setSearchText] = useState("");
  const [mapType, setMapType] = useState<
    "standard" | "satellite" | "hybrid" | "terrain"
  >("standard");
  const mapRef = useRef<MapView>(null);

  // Filtrar motoristas por categoria
  const availableDrivers = mockDrivers.filter(
    (driver) => driver.category === selectedCategory && driver.available
  );

  // Obter localização do usuário
  useEffect(() => {
    async function getUserLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        setUserLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        // Centralizar mapa na localização do usuário
        if (mapRef.current) {
          mapRef.current.animateToRegion(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
            1000
          );
        }
      } catch (error) {
        console.error("Erro ao obter localização:", error);
        // Usar localização padrão (São Paulo)
        setUserLocation({
          latitude: -23.5505,
          longitude: -46.6333,
        });
      }
    }

    getUserLocation();
  }, []);

  function getCategoryIcon(category: VehicleCategory) {
    return categoryInfo[category].icon;
  }

  function getCategoryColor(category: VehicleCategory) {
    return categoryInfo[category].color;
  }

  function toggleMapType() {
    const mapTypes: Array<"standard" | "satellite" | "hybrid" | "terrain"> = [
      "standard",
      "satellite",
      "hybrid",
      "terrain",
    ];
    const currentIndex = mapTypes.indexOf(mapType);
    const nextIndex = (currentIndex + 1) % mapTypes.length;
    setMapType(mapTypes[nextIndex]);
  }

  function centerOnUserLocation() {
    if (userLocation && mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: userLocation.latitude,
          longitude: userLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        1000
      );
    }
  }

  return (
    <View className="flex-1 bg-brand-dark">
      {/* Mapa em tela cheia */}
      <MapView
        ref={mapRef}
        style={{ flex: 1, width: "100%", height: "100%" }}
        provider={PROVIDER_DEFAULT}
        mapType={mapType}
        initialRegion={{
          latitude: userLocation?.latitude || -23.5505,
          longitude: userLocation?.longitude || -46.6333,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
      >
        {/* Marcador da localização do usuário */}
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            title="Sua localização"
            anchor={{ x: 0.5, y: 1 }}
          >
            <View className="items-center">
              {/* Pin simples */}
              <MaterialCommunityIcons
                name="map-marker"
                size={40}
                color={theme.COLORS.BRAND_LIGHT}
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 5,
                }}
              />
            </View>
          </Marker>
        )}

        {/* Marcadores dos motoristas */}
        {availableDrivers.map((driver) => (
          <Marker
            key={driver.id}
            coordinate={{
              latitude: driver.latitude,
              longitude: driver.longitude,
            }}
            title={driver.name}
            description={`${driver.distance.toFixed(1)} km • ${
              driver.estimatedTime
            } min`}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center border-2"
              style={{
                backgroundColor: getCategoryColor(driver.category),
                borderColor: theme.COLORS.WHITE,
              }}
            >
              <MaterialCommunityIcons
                name={getCategoryIcon(driver.category) as any}
                size={20}
                color={theme.COLORS.WHITE}
              />
            </View>
          </Marker>
        ))}
      </MapView>

      {/* Botões de controle do mapa */}
      <View className="absolute top-32 right-4">
        {/* Botão para mudar tipo de visualização do mapa */}
        <TouchableOpacity
          onPress={toggleMapType}
          className="w-12 h-12 rounded-full items-center justify-center shadow-lg mb-3"
          style={{
            backgroundColor: theme.COLORS.SURFACE_PRIMARY,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
        >
          <MaterialCommunityIcons
            name={
              mapType === "standard"
                ? "map"
                : mapType === "satellite"
                ? "satellite-variant"
                : mapType === "hybrid"
                ? "layers"
                : "terrain"
            }
            size={24}
            color={theme.COLORS.WHITE}
          />
        </TouchableOpacity>

        {/* Botão para centralizar na localização do usuário */}
        <TouchableOpacity
          onPress={centerOnUserLocation}
          className="w-12 h-12 rounded-full items-center justify-center shadow-lg"
          style={{
            backgroundColor: theme.COLORS.SURFACE_PRIMARY,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          disabled={!userLocation}
        >
          <MaterialCommunityIcons
            name="crosshairs-gps"
            size={24}
            color={
              userLocation ? theme.COLORS.BRAND_LIGHT : theme.COLORS.GRAY_400
            }
          />
        </TouchableOpacity>
      </View>

      {/* Barra superior com busca */}
      <SafeAreaView
        className="absolute top-0 left-0 right-0"
        edges={["top"]}
        pointerEvents="box-none"
      >
        <View className="px-4 pt-2">
          <View
            className="bg-surface-primary rounded-2xl px-4 py-3 flex-row items-center"
            style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          >
            <Feather name="search" size={20} color={theme.COLORS.GRAY_400} />
            <TextInput
              className="flex-1 text-white ml-3 text-sm"
              placeholder="Para onde você quer ir?"
              placeholderTextColor={theme.COLORS.GRAY_400}
              value={searchText}
              onChangeText={setSearchText}
            />
            <TouchableOpacity
              className="w-10 h-10 rounded-full items-center justify-center"
              style={{ backgroundColor: theme.COLORS.SURFACE_SECONDARY }}
            >
              <MaterialCommunityIcons
                name="menu"
                size={20}
                color={theme.COLORS.WHITE}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>

      {/* Card de seleção de categoria na parte inferior */}
      <SafeAreaView
        className="absolute bottom-0 left-0 right-0"
        edges={["bottom"]}
        pointerEvents="box-none"
      >
        <View className="px-4" style={{ paddingBottom: 16 }}>
          <View
            className="bg-surface-primary rounded-3xl p-5"
            style={{ backgroundColor: theme.COLORS.SURFACE_PRIMARY }}
          >
            <Text className="text-white font-bold text-lg mb-4">
              Escolha o tipo de serviço
            </Text>

            {/* Categorias */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mb-4"
            >
              <View className="flex-row gap-3">
                {(Object.keys(categoryInfo) as VehicleCategory[]).map(
                  (category) => {
                    const isSelected = selectedCategory === category;
                    const info = categoryInfo[category];
                    return (
                      <TouchableOpacity
                        key={category}
                        onPress={() => setSelectedCategory(category)}
                        className="items-center"
                        style={{ width: 90 }}
                      >
                        <View
                          className={`w-16 h-16 rounded-2xl items-center justify-center mb-2 ${
                            isSelected ? "border-2" : ""
                          }`}
                          style={{
                            backgroundColor: isSelected
                              ? info.color + "20"
                              : theme.COLORS.SURFACE_SECONDARY,
                            borderColor: isSelected
                              ? info.color
                              : "transparent",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={info.icon as any}
                            size={28}
                            color={
                              isSelected ? info.color : theme.COLORS.GRAY_400
                            }
                          />
                        </View>
                        <Text
                          className={`text-xs font-bold text-center ${
                            isSelected ? "text-white" : "text-gray-400"
                          }`}
                        >
                          {info.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </ScrollView>

            {/* Lista de motoristas disponíveis */}
            {availableDrivers.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="mt-2"
              >
                <View className="flex-row gap-3">
                  {availableDrivers.map((driver) => (
                    <TouchableOpacity
                      key={driver.id}
                      className="bg-surface-secondary rounded-2xl p-4"
                      style={{
                        backgroundColor: theme.COLORS.SURFACE_SECONDARY,
                        width: 200,
                      }}
                    >
                      <View className="flex-row items-center mb-2">
                        <View
                          className="w-10 h-10 rounded-full items-center justify-center mr-3"
                          style={{
                            backgroundColor:
                              getCategoryColor(driver.category) + "20",
                          }}
                        >
                          <MaterialCommunityIcons
                            name={getCategoryIcon(driver.category) as any}
                            size={20}
                            color={getCategoryColor(driver.category)}
                          />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-bold text-sm">
                            {driver.name}
                          </Text>
                          <View className="flex-row items-center">
                            <MaterialCommunityIcons
                              name="star"
                              size={12}
                              color="#FBBF24"
                            />
                            <Text className="text-gray-400 text-xs ml-1">
                              {driver.rating}
                            </Text>
                          </View>
                        </View>
                      </View>
                      {driver.vehicleInfo && (
                        <Text className="text-gray-400 text-xs mb-2">
                          {driver.vehicleInfo}
                        </Text>
                      )}
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons
                            name="map-marker-distance"
                            size={14}
                            color={theme.COLORS.BRAND_LIGHT}
                          />
                          <Text className="text-brand-light text-xs ml-1">
                            {driver.distance.toFixed(1)} km
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <MaterialCommunityIcons
                            name="clock-outline"
                            size={14}
                            color={theme.COLORS.GRAY_400}
                          />
                          <Text className="text-gray-400 text-xs ml-1">
                            {driver.estimatedTime} min
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            ) : (
              <View className="items-center py-4">
                <Text className="text-gray-400 text-sm">
                  Nenhum motorista disponível nesta categoria
                </Text>
              </View>
            )}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
