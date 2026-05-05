import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import {
  FlowStepHeader,
  PurposeCard,
  EmptyState,
  LoadingButton,
} from "../../../Shared/components";
import {
  getPurposesByVehicleType,
  type PurposeItem,
  type VehicleType,
} from "@/services/purposes";
import { mapIconName } from "@/utils/iconMapper";
import rideService from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";

type RouteParams = {
  vehicleType?: VehicleType;
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
  initialPurposeId?: string;
};

function resolveVehicleTypeForApi(raw: string): "motorcycle" | "car" | "van" | "truck" {
  const v = String(raw || "").trim().toLowerCase();
  if (v === "moto" || v === "motorcycle") return "motorcycle";
  if (v === "car") return "car";
  if (v === "van") return "van";
  if (v === "truck" || v === "caminhao") return "truck";
  return "car";
}

function toSummaryVehicleType(raw: string): "moto" | "car" | "van" | "truck" {
  const normalized = resolveVehicleTypeForApi(raw);
  return normalized === "motorcycle" ? "moto" : normalized;
}

function inferServiceMode(purposeId: string, purposeLabel?: string): "ride" | "delivery" {
  const text = `${purposeId || ""} ${purposeLabel || ""}`.toLowerCase();
  const rideHints = ["ride", "taxi", "passageiro", "passageiros", "pessoa", "pessoas"];
  return rideHints.some((hint) => text.includes(hint)) ? "ride" : "delivery";
}

export default function ServicePurposeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { vehicleType, pickup, dropoff, initialPurposeId } =
    (route.params as RouteParams) || {};
  const detectedCity = useClientCityStore((state) => state.city);

  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);
  const [selectedPurposeId, setSelectedPurposeId] = useState<string | null>(null);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    if (!vehicleType) {
      Toast.show({ type: "info", text1: "Selecione um veiculo primeiro" });
      navigation.navigate("SelectVehicle", { pickup, dropoff });
      return;
    }

    let mounted = true;
    setLoading(true);

    getPurposesByVehicleType(vehicleType)
      .then((data) => {
        if (!mounted) return;

        const next = data || [];
        setPurposes(next);

        if (next.length === 0) {
          setSelectedPurposeId(null);
          return;
        }

        if (initialPurposeId && next.some((item) => item.id === initialPurposeId)) {
          setSelectedPurposeId(initialPurposeId);
          return;
        }

        setSelectedPurposeId(next[0].id);
      })
      .catch(() => {
        if (mounted) {
          setPurposes([]);
          setSelectedPurposeId(null);
        }
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [dropoff, initialPurposeId, navigation, pickup, vehicleType]);

  const selectedPurpose = useMemo(
    () => purposes.find((p) => p.id === selectedPurposeId) || null,
    [purposes, selectedPurposeId],
  );

  const handleBack = () => {
    navigation.navigate("SelectVehicle", { pickup, dropoff });
  };

  const handleContinue = async () => {
    if (!selectedPurposeId || !vehicleType) return;

    if (!pickup?.latitude || !dropoff?.latitude) {
      navigation.navigate("LocationPicker", {
        initialVehicle: vehicleType,
        initialService: selectedPurposeId,
        selectionMode: "home_dropoff",
        returnScreen: "Home",
      });
      return;
    }

    try {
      setCalculating(true);

      const calculatePayload = {
        pickup: {
          address: pickup.address || "Origem",
          latitude: Number(pickup.latitude),
          longitude: Number(pickup.longitude),
        },
        dropoff: {
          address: dropoff.address || "Destino",
          latitude: Number(dropoff.latitude),
          longitude: Number(dropoff.longitude),
        },
        vehicleType: resolveVehicleTypeForApi(vehicleType),
        cityId:
          (detectedCity as any)?._id ||
          (detectedCity as any)?.id ||
          detectedCity?.cityId ||
          undefined,
        purposeId: selectedPurposeId,
      };

      const resp = await rideService.calculatePrice(calculatePayload);
      const serviceLabel = selectedPurpose?.title || selectedPurposeId;

      const orderData = {
        vehicleType: toSummaryVehicleType(vehicleType),
        serviceMode: inferServiceMode(selectedPurposeId, serviceLabel),
        purposeId: selectedPurposeId,
        pickupAddress: pickup.address || "Origem",
        pickupLatLng: {
          latitude: Number(pickup.latitude),
          longitude: Number(pickup.longitude),
        },
        dropoffAddress: dropoff.address || "Destino",
        dropoffLatLng: {
          latitude: Number(dropoff.latitude),
          longitude: Number(dropoff.longitude),
        },
        etaMinutes: resp?.duration?.value ? Math.ceil(resp.duration.value / 60) : undefined,
        etaText: resp?.duration?.text || undefined,
        servicePurposeLabel: serviceLabel,
        insuranceLevel: "none" as const,
        pricing: {
          base: resp?.pricing?.basePrice || 0,
          distancePrice: resp?.pricing?.distancePrice || 0,
          serviceFee: resp?.pricing?.serviceFee || 0,
          total: resp?.pricing?.total || 0,
          distanceKm: (resp?.distance?.value || 0) / 1000,
        },
        paymentSummary: "Dinheiro",
      };

      navigation.navigate("FinalOrderSummary", { data: orderData });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao calcular preco",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setCalculating(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}> 
      <FlowStepHeader
        title="Escolha o servico"
        subtitle="Etapa 2: tipo do seu pedido"
        currentStep={2}
        totalSteps={4}
        onBack={handleBack}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      ) : purposes.length === 0 ? (
        <EmptyState
          icon="category"
          title="Nenhum servico disponivel"
          description="Nao encontramos opcoes para esse veiculo"
          actionLabel="Voltar"
          onAction={handleBack}
        />
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: Math.max(insets.bottom, spacing.xl) + 160 },
            ]}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.helperCard}>
              <Text style={styles.helperTitle}>Como escolher</Text>
              <Text style={styles.helperText}>
                Selecione a opcao que melhor descreve seu pedido para calcular preco e tempo corretamente.
              </Text>
            </View>

            <Text style={styles.sectionLabel}>Opcoes disponiveis</Text>

            {purposes.map((item) => (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedPurposeId(item.id)}
                style={selectedPurposeId === item.id ? styles.selectedWrapper : undefined}
              >
                <PurposeCard
                  id={item.id}
                  title={item.title}
                  subtitle={item.subtitle}
                  icon={mapIconName(item.icon) as any}
                  onPress={() => setSelectedPurposeId(item.id)}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View
            style={[
              styles.footer,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.sm },
            ]}
          >
            <Text style={styles.footerHint} numberOfLines={1}>
              {selectedPurpose
                ? `Selecionado: ${selectedPurpose.title}`
                : "Selecione uma opcao para continuar"}
            </Text>
            <LoadingButton
              title={calculating ? "Calculando..." : "Continuar"}
              onPress={handleContinue}
              disabled={!selectedPurposeId || calculating}
              variant="primary"
            />
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  helperCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  helperTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  helperText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  sectionLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
  },
  selectedWrapper: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.45)",
    marginBottom: spacing.sm,
    backgroundColor: "rgba(2,222,149,0.06)",
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
  footerHint: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.sm,
  },
});
