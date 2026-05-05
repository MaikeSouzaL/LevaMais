import React, { useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  TouchableOpacity,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { FlowStepHeader, VehicleCard, LoadingButton } from "../../../Shared/components";
import type { VehicleType } from "../../../types";

type RouteParams = {
  pickup?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff?: {
    address: string;
    latitude: number;
    longitude: number;
  };
};

const VEHICLES: Array<{
  type: VehicleType;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
  badgeColor?: string;
}> = [
  {
    type: "motorcycle",
    title: "Moto",
    description: "Pequenos pacotes e documentos ate 20kg",
    icon: "two-wheeler",
    badge: "Mais rapido",
    badgeColor: colors.primary[500],
  },
  {
    type: "car",
    title: "Carro",
    description: "Compras de mercado ou caixas medias",
    icon: "directions-car",
  },
  {
    type: "van",
    title: "Van",
    description: "Moveis pequenos ou muitas caixas",
    icon: "airport-shuttle",
  },
  {
    type: "truck",
    title: "Caminhao",
    description: "Mudancas e grandes cargas comerciais",
    icon: "local-shipping",
    badge: "Grandes volumes",
    badgeColor: colors.text.tertiary,
  },
];

export default function SelectVehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = route.params as RouteParams;

  const [selectedType, setSelectedType] = useState<VehicleType | null>(null);

  const canContinue = Boolean(selectedType);

  const summaryLines = useMemo(() => {
    return {
      pickup: params?.pickup?.address || "Defina sua origem",
      dropoff: params?.dropoff?.address || "Defina seu destino",
    };
  }, [params?.pickup?.address, params?.dropoff?.address]);

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate("Home");
  };

  const handleContinue = () => {
    if (!selectedType) return;

    if (!params?.dropoff?.latitude) {
      navigation.navigate("LocationPicker", {
        initialVehicle: selectedType,
        selectionMode: "home_dropoff",
        returnScreen: "Home",
      });
      return;
    }

    navigation.navigate("ServicePurpose", {
      vehicleType: selectedType,
      pickup: params?.pickup,
      dropoff: params?.dropoff,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <FlowStepHeader
        title="Escolha o veiculo"
        subtitle="Etapa 1: selecione a melhor opcao"
        currentStep={1}
        totalSteps={4}
        onBack={handleBack}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeCard}>
          <Text style={styles.routeTitle}>Rota do pedido</Text>

          <View style={styles.routeRow}>
            <View style={styles.dotPickup} />
            <Text style={styles.routeText} numberOfLines={1}>{summaryLines.pickup}</Text>
          </View>

          <View style={styles.routeDivider} />

          <View style={styles.routeRow}>
            <MaterialIcons name="location-on" size={14} color="#ff6b6b" />
            <Text style={styles.routeText} numberOfLines={1}>{summaryLines.dropoff}</Text>
          </View>

          {!params?.dropoff?.latitude && (
            <TouchableOpacity
              style={styles.missingDestinationBtn}
              onPress={() =>
                navigation.navigate("LocationPicker", {
                  selectionMode: "home_dropoff",
                  returnScreen: "Home",
                })
              }
            >
              <MaterialIcons name="edit-location-alt" size={16} color={colors.primary[500]} />
              <Text style={styles.missingDestinationText}>Escolher destino</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.sectionLabel}>Categorias disponiveis</Text>

        {VEHICLES.map((vehicle) => (
          <VehicleCard
            key={vehicle.type}
            type={vehicle.type}
            title={vehicle.title}
            description={vehicle.description}
            icon={vehicle.icon}
            badge={vehicle.badge}
            badgeColor={vehicle.badgeColor}
            selected={selectedType === vehicle.type}
            onPress={() => setSelectedType(vehicle.type)}
            style={styles.vehicleCard}
          />
        ))}
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
        ]}
      >
        <LoadingButton
          title={canContinue ? "Continuar" : "Selecione um veiculo"}
          onPress={handleContinue}
          disabled={!canContinue}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  routeCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  routeTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.md,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  dotPickup: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
    marginLeft: 2,
  },
  routeText: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.sm,
  },
  routeDivider: {
    height: 1,
    marginVertical: spacing.sm,
    backgroundColor: colors.border.light,
  },
  missingDestinationBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.35)",
    backgroundColor: "rgba(2,222,149,0.08)",
  },
  missingDestinationText: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  vehicleCard: {
    marginBottom: spacing.md,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: "rgba(10,25,20,0.96)",
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
});
