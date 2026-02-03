/**
 * ServicePurposeScreen - Versão Refatorada
 * Seleção do propósito do serviço
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";

// Design System
import { colors, spacing, fontSize } from "@/theme";

// Componentes Compartilhados
import { PurposeCard, EmptyState } from "../../../Shared/components";

// Services
import {
  getPurposesByVehicleType,
  type PurposeItem,
  type VehicleType,
} from "@/services/purposes";

// Utils
import { mapIconName } from "@/utils/iconMapper";

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
};

export default function ServicePurposeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { vehicleType, pickup, dropoff } = (route.params as RouteParams) || {};

  // LOG: Verificar se pickup e dropoff chegaram
  console.log("[ServicePurpose] Params recebidos:", {
    vehicleType,
    pickup,
    dropoff,
  });

  const [loading, setLoading] = useState(false);
  const [purposes, setPurposes] = useState<PurposeItem[]>([]);

  useEffect(() => {
    let mounted = true;
    if (vehicleType) {
      setLoading(true);
      getPurposesByVehicleType(vehicleType)
        .then((data) => {
          if (mounted) setPurposes(data);
        })
        .catch((error) => {
          console.error("Erro ao carregar propósitos:", error);
          if (mounted) setPurposes([]);
        })
        .finally(() => mounted && setLoading(false));
    }
    return () => {
      mounted = false;
    };
  }, [vehicleType]);

  const handleBack = () => {
    (navigation as any).navigate("SelectVehicle", { pickup, dropoff });
  };

  const handleSelectPurpose = (purposeId: string) => {
    console.log("[ServicePurpose] Navegando para Home com:", {
      openOffersFor: vehicleType,
      purposeId,
      pickup,
      dropoff,
    });

    (navigation as any).navigate("Home", {
      openOffersFor: vehicleType,
      purposeId,
      pickup,
      dropoff,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons
            name="arrow-back"
            size={24}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Finalidade do Serviço</Text>
          <Text style={styles.headerSubtitle}>
            O que vamos transportar hoje?
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      ) : purposes.length === 0 ? (
        <EmptyState
          icon="category"
          title="Nenhum propósito disponível"
          description="Não encontramos propósitos para este tipo de veículo"
          actionLabel="Voltar"
          onAction={handleBack}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom, spacing.xl) },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {purposes.map((item) => (
            <PurposeCard
              key={item.id}
              id={item.id}
              title={item.title}
              subtitle={item.subtitle}
              icon={mapIconName(item.icon) as any}
              onPress={() => handleSelectPurpose(item.id)}
            />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  headerSpacer: {
    width: 32,
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
});
