import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
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
    } catch {
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
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Selecionar cidade"
        subtitle="Escolha a cidade onde voce esta para precificacao correta"
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando cidades...</Text>
        </View>
      ) : cities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="location-off" size={64} color="#555" />
          <Text style={styles.emptyTitle}>Nenhuma cidade disponivel</Text>
          <Text style={styles.emptySubtitle}>
            Cadastre cidades via painel administrativo Leva Web
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadCities}>
            <Text style={styles.retryButtonText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={cities}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isSelected = selectedId === item._id;
            return (
              <TouchableOpacity
                style={[styles.cityCard, isSelected && styles.cityCardSelected]}
                onPress={() => handleSelectCity(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cityIconContainer}>
                  <MaterialCommunityIcons
                    name="city"
                    size={24}
                    color={isSelected ? colors.primary[500] : "#8ea6a3"}
                  />
                </View>
                <View style={styles.cityInfo}>
                  <Text
                    style={[
                      styles.cityName,
                      isSelected && styles.cityNameSelected,
                    ]}
                  >
                    {item.name}
                  </Text>
                  <Text style={styles.cityState}>{item.state}</Text>
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: { color: colors.text.tertiary, fontSize: fontSize.base },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  emptyTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.md,
  },
  emptySubtitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  retryButton: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: colors.background.primary,
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  listContent: { padding: spacing.lg },
  cityCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  cityCardSelected: {
    borderColor: colors.primary[500],
    backgroundColor: "rgba(2,222,149,0.06)",
  },
  cityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "rgba(2,222,149,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: spacing.md,
  },
  cityInfo: { flex: 1 },
  cityName: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.semibold,
  },
  cityNameSelected: {
    color: colors.primary[500],
  },
  cityState: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
});
