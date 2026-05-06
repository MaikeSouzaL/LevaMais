import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import rideService, { Ride } from "@/services/ride.service";
import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, StatusBadge, LoadingButton } from "../../Shared/components";
import { formatBRL } from "@/utils/mappers";

function formatDateTime(value?: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDistance(distance?: Ride["distance"]): string {
  if (!distance) return "-";
  return distance.text || `${((distance.value || 0) / 1000).toFixed(1)} km`;
}

function formatDuration(duration?: Ride["duration"]): string {
  if (!duration) return "-";
  return duration.text || `${Math.ceil((duration.value || 0) / 60)} min`;
}

export default function OrderDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  const rideIdFromParams = useMemo(() => {
    const params = (route.params || {}) as any;
    if (params.rideId) return String(params.rideId);
    if (params.order?._id) return String(params.order._id);
    if (params.order?.id) return String(params.order.id);
    return "";
  }, [route.params]);

  useEffect(() => {
    let mounted = true;

    const loadRide = async () => {
      if (!rideIdFromParams) {
        setRide(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await rideService.getById(rideIdFromParams);
        if (mounted) setRide(data);
      } catch {
        if (mounted) setRide(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadRide();

    return () => {
      mounted = false;
    };
  }, [rideIdFromParams]);

  const handleRebook = () => {
    if (!ride) {
      navigation.navigate("Home");
      return;
    }

    navigation.navigate("SelectVehicle", {
      pickup: {
        address: ride.pickup?.address,
        latitude: Number(ride.pickup?.latitude),
        longitude: Number(ride.pickup?.longitude),
      },
      dropoff: {
        address: ride.dropoff?.address,
        latitude: Number(ride.dropoff?.latitude),
        longitude: Number(ride.dropoff?.longitude),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Detalhes da corrida"
          subtitle="Resumo completo da viagem"
          showBack
        />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando detalhes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={styles.container}>
        <ClientScreenHeader
          title="Detalhes da corrida"
          subtitle="Resumo completo da viagem"
          showBack
        />
        <View style={styles.centered}>
          <Text style={styles.emptyText}>Corrida nao encontrada.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const driverName =
    (ride.driverId as any)?.name ||
    (ride.driverId as any)?.nome ||
    "Motorista nao atribuido";

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Detalhes da corrida"
        subtitle="Resumo completo da viagem"
        showBack
      />

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: spacing["2xl"] }}>
        <View style={styles.headerCard}>
          <View>
            <Text style={styles.headerTitle}>Status atual</Text>
            <Text style={styles.headerSub}>{formatDateTime(ride.updatedAt)}</Text>
          </View>
          <StatusBadge status={ride.status as any} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trajeto</Text>
          <Row label="Origem" value={ride.pickup?.address || "-"} />
          <Row label="Destino" value={ride.dropoff?.address || "-"} />
          <Row label="Distancia" value={formatDistance(ride.distance)} />
          <Row label="Duracao" value={formatDuration(ride.duration)} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Servico</Text>
          <Row label="Tipo" value={ride.serviceType || "-"} />
          <Row label="Veiculo" value={ride.vehicleType || "-"} />
          <Row label="Motorista" value={driverName} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pagamento</Text>
          <Row label="Metodo" value={ride.payment?.method?.type || "-"} />
          {ride.scheduledFor && (
            <Row label="Agendada para" value={formatDateTime(ride.scheduledFor)} />
          )}
          {ride.negotiation?.enabled && (
            <Row
              label="Oferta do cliente"
              value={formatBRL(ride.negotiation?.clientOffer || 0)}
            />
          )}
          {ride.negotiation?.enabled && ride.negotiation?.finalAgreedPrice && (
            <Row
              label="Preco fechado"
              value={formatBRL(ride.negotiation?.finalAgreedPrice || 0)}
            />
          )}
          <Row label="Tarifa base" value={formatBRL(ride.pricing?.basePrice || 0)} />
          <Row label="Distancia" value={formatBRL(ride.pricing?.distancePrice || 0)} />
          <Row label="Taxa de servico" value={formatBRL(ride.pricing?.serviceFee || 0)} />
          <Row label="Total" value={formatBRL(ride.pricing?.total || 0)} highlight />
          <Row label="Solicitada em" value={formatDateTime(ride.requestedAt || ride.createdAt)} />
        </View>

        <View style={styles.actionsWrap}>
          <LoadingButton title="Pedir novamente" onPress={handleRebook} variant="primary" />
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate("Home")}
            activeOpacity={0.8}
          >
            <MaterialIcons name="home" size={18} color={colors.text.secondary} />
            <Text style={styles.backHomeText}>Voltar ao inicio</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  loadingText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  emptyText: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
  },
  headerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  headerSub: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  section: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: spacing.md,
  },
  rowLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    flex: 1,
  },
  rowValue: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    flex: 1,
    textAlign: "right",
  },
  rowValueHighlight: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold,
  },
  actionsWrap: {
    gap: spacing.md,
  },
  backHomeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background.secondary,
  },
  backHomeText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
});
