import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import citiesService, { City } from "../../../services/cities.service";
import { useClientCityStore, ClientCity } from "../../../context/clientCityStore";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "../../../theme";
import { ClientScreenHeader } from "./Shared/components";

export default function ClientCityScreen() {
  const navigation = useNavigation();
  const currentCity = useClientCityStore((s) => s.city);
  const setCity = useClientCityStore((s) => s.setCity);

  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(
    currentCity?.cityId || null
  );

  const loadCities = useCallback(async () => {
    try {
      setLoading(true);
      const data = await citiesService.list({ isActive: true });
      setCities(data);
    } catch (error) {
      console.error("Error loading cities:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao carregar cidades",
        text2: "Verifique sua conexao e tente novamente.",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCities();
  }, [loadCities]);

  useEffect(() => {
    if (currentCity?.cityId) {
      setSelectedId(currentCity.cityId);
    }
  }, [currentCity?.cityId]);

  const handleSelectCity = (city: City) => {
    setSelectedId(city._id);
    const newCity: ClientCity = {
      cityId: city._id,
      name: city.name,
      state: city.state,
      source: "manual",
      updatedAt: Date.now(),
    };
    setCity(newCity);
    Toast.show({
      type: "success",
      text1: "Cidade atualizada",
      text2: `${city.name} - ${city.state}`,
    });
    setTimeout(() => navigation.goBack(), 400);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader
        title="Selecionar cidade"
        subtitle="Escolha a cidade onde voce esta para precificacao correta"
      />

      {loading ? (
        <View className="flex-1 items-center justify-center gap-3">
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text className="text-gray-400 text-base">Carregando cidades...</Text>
        </View>
      ) : cities.length === 0 ? (
        <View className="flex-1 items-center justify-center px-6 gap-2">
          <MaterialIcons name="location-off" size={64} color="#555" />
          <Text className="text-white text-lg font-bold mt-3">Nenhuma cidade disponivel</Text>
          <Text className="text-gray-400 text-sm text-center">
            Cadastre cidades via painel administrativo Leva Web
          </Text>
          <TouchableOpacity className="mt-6 px-6 py-3 bg-[#02de95] rounded-lg" onPress={loadCities}>
            <Text className="text-[#091A2F] font-bold text-base">Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ padding: spacing.lg }}
          renderItem={({ item }) => {
            const isSelected = selectedId === item._id;
            return (
              <TouchableOpacity
                className={`flex-row items-center rounded-lg border mb-2 p-4 ${
                  isSelected
                    ? "border-[#02de95] bg-[rgba(2,222,149,0.06)]"
                    : "border-gray-700 bg-[#0d2838]"
                }`}
                onPress={() => handleSelectCity(item)}
                activeOpacity={0.7}
              >
                <View className="w-12 h-12 rounded-xl bg-[rgba(2,222,149,0.08)] items-center justify-center mr-4">
                  <MaterialCommunityIcons
                    name="city"
                    size={24}
                    color={isSelected ? colors.primary[500] : "#8ea6a3"}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base font-semibold ${
                      isSelected ? "text-[#02de95]" : "text-white"
                    }`}
                  >
                    {item.name}
                  </Text>
                  <Text className="text-gray-400 text-sm mt-0.5">{item.state}</Text>
                </View>
                {isSelected && (
                  <MaterialIcons
                    name="check-circle"
                    size={28}
                    color={colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

