import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  ArrowLeft,
  Car,
  Clock,
  MapPin,
  Route,
  TrendingUp,
  Wallet,
  Calendar,
  Hash,
  Package,
  CheckCircle,
  XCircle,
  User,
} from "lucide-react-native";
import { MotiView } from "moti";
import rideService, { Ride } from "../../../services/ride.service";
import MapMarker from "../../../components/MapMarker";

// Spec-defined colors matching Tailwind Config
const colors = {
  background: "#051424",
  onSurface: "#d4e4fa",
  onSurfaceVariant: "#c5c6cd",
  secondary: "#70ffba",
  onSecondary: "#003822",
  surfaceContainerHigh: "#1c2b3c",
  surfaceContainerHighest: "#273647",
  surfaceContainer: "#122131",
  surface: "#051424",
  outlineVariant: "#45474d",
  error: "#ffb4ab",
  errorContainer: "#93000a",
};

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverRideDetailsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { rideId, ride } = route.params as { rideId?: string; ride?: Ride };

  const [details, setDetails] = useState<Ride | null>(ride || null);
  const [loading, setLoading] = useState(!ride);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    if (!details && rideId) {
      loadDetails();
    }
  }, [rideId]);

  const loadDetails = async () => {
    try {
      setLoading(true);
      const data = await rideService.getById(rideId!);
      setDetails(data);
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (details && mapRef.current) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(
          [
            { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
            { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude },
          ],
          {
            edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
            animated: true,
          }
        );
      }, 500);
    }
  }, [details]);

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.topAppBarTitle}>Detalhes da corrida</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.secondary} />
        </View>
      </View>
    );
  }

  if (!details) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View style={styles.topAppBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.onSurface} />
          </TouchableOpacity>
          <Text style={styles.topAppBarTitle}>Detalhes da corrida</Text>
        </View>
        <View style={styles.centered}>
          <Text style={{ color: colors.onSurfaceVariant, fontSize: 16 }}>Corrida não encontrada.</Text>
        </View>
      </View>
    );
  }

  const isCompleted = details.status === "completed";
  const isCancelled = String(details.status || "").includes("cancel");
  const statusColor = isCompleted ? colors.secondary : colors.error;
  const statusLabel = isCompleted ? "Concluída" : isCancelled ? "Cancelada" : details.status || "--";

  const total = details.pricing?.total || 0;
  const driverEarnings = details.pricing?.driverValue ?? total * 0.8;
  const platformFee = details.pricing?.platformFee ?? total * 0.2;

  const createdDate = new Date(details.createdAt);
  const formattedDate = createdDate.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
  const formattedTime = createdDate.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const clientName = (details as any)?.clientId?.name || (details as any)?.clientId?.nome || null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── TopAppBar ── */}
      <View style={styles.topAppBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topAppBarTitle}>Detalhes da corrida</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Map ── */}
        <MotiView
          from={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", damping: 18 }}
          style={styles.mapWrapper}
        >
          <GlobalMap
            ref={mapRef}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: details.pickup.latitude,
              longitude: details.pickup.longitude,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            liteMode={false}
          >
            <Marker coordinate={details.pickup} title="Retirada" anchor={{ x: 0.5, y: 1 }}>
              <MapMarker type="pickup" size={32} />
            </Marker>
            <Marker coordinate={details.dropoff} title="Entrega" anchor={{ x: 0.5, y: 1 }}>
              <MapMarker type="dropoff" size={32} />
            </Marker>
            <Polyline
              coordinates={[
                { latitude: details.pickup.latitude, longitude: details.pickup.longitude },
                { latitude: details.dropoff.latitude, longitude: details.dropoff.longitude },
              ]}
              strokeWidth={4}
              strokeColor={colors.secondary}
            />
          </GlobalMap>
        </MotiView>

        {/* ── Status Badge + Date ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 100 }}
          style={styles.statusSection}
        >
          <View style={[styles.statusBadge, { backgroundColor: isCompleted ? "rgba(112,255,186,0.12)" : "rgba(255,180,171,0.12)", borderColor: isCompleted ? "rgba(112,255,186,0.3)" : "rgba(255,180,171,0.3)" }]}>
            {isCompleted ? (
              <CheckCircle size={16} color={statusColor} />
            ) : (
              <XCircle size={16} color={statusColor} />
            )}
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusLabel}
            </Text>
          </View>
          <View style={styles.dateRow}>
            <Calendar size={13} color={colors.onSurfaceVariant} />
            <Text style={styles.dateText}>{formattedDate} às {formattedTime}</Text>
          </View>
        </MotiView>

        {/* ── Financial Breakdown ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 200 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Wallet size={18} color={colors.secondary} />
            <Text style={styles.cardTitle}>Financeiro</Text>
          </View>

          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Valor total</Text>
            <Text style={styles.financeValue}>{formatBRL(total)}</Text>
          </View>
          <View style={styles.financeRow}>
            <Text style={styles.financeLabel}>Taxa da plataforma</Text>
            <Text style={[styles.financeValue, { color: colors.error }]}>- {formatBRL(platformFee)}</Text>
          </View>

          <View style={styles.financeDivider} />

          <View style={styles.financeRow}>
            <Text style={styles.financeGainLabel}>Seu ganho líquido</Text>
            <Text style={styles.financeGainValue}>{formatBRL(driverEarnings)}</Text>
          </View>
        </MotiView>

        {/* ── Route Addresses ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 300 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <MapPin size={18} color={colors.secondary} />
            <Text style={styles.cardTitle}>Rota</Text>
          </View>

          {/* Pickup */}
          <View style={styles.addressBlock}>
            <View style={styles.addressTimeline}>
              <View style={[styles.addressDot, { backgroundColor: colors.secondary }]} />
              <View style={styles.addressLine} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressTag}>Retirada</Text>
              <Text style={styles.addressText}>{details.pickup.address}</Text>
            </View>
          </View>

          {/* Dropoff */}
          <View style={styles.addressBlock}>
            <View style={styles.addressTimeline}>
              <View style={[styles.addressDot, { backgroundColor: colors.error }]} />
            </View>
            <View style={styles.addressContent}>
              <Text style={styles.addressTag}>Entrega</Text>
              <Text style={styles.addressText}>{details.dropoff.address}</Text>
            </View>
          </View>
        </MotiView>

        {/* ── Ride Stats Grid ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 400 }}
          style={styles.statsGrid}
        >
          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(112,255,186,0.08)" }]}>
              <Car size={18} color={colors.secondary} />
            </View>
            <Text style={styles.statLabel}>Serviço</Text>
            <Text style={styles.statValue}>
              {details.serviceType === "delivery" ? "Entrega" : "Corrida"}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(176,201,232,0.08)" }]}>
              <Clock size={18} color="#b0c9e8" />
            </View>
            <Text style={styles.statLabel}>Duração</Text>
            <Text style={styles.statValue}>{details.duration?.text || "--"}</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconWrap, { backgroundColor: "rgba(187,198,227,0.08)" }]}>
              <Route size={18} color="#bbc6e3" />
            </View>
            <Text style={styles.statLabel}>Distância</Text>
            <Text style={styles.statValue}>{details.distance?.text || "--"}</Text>
          </View>
        </MotiView>

        {/* ── Extra Info ── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "spring", damping: 18, delay: 500 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Hash size={18} color={colors.onSurfaceVariant} />
            <Text style={styles.cardTitle}>Informações</Text>
          </View>

          {clientName && (
            <View style={styles.infoRow}>
              <View style={styles.infoIconWrap}>
                <User size={14} color={colors.onSurfaceVariant} />
              </View>
              <Text style={styles.infoLabel}>Cliente</Text>
              <Text style={styles.infoValue}>{clientName}</Text>
            </View>
          )}

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Package size={14} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>
              {details.serviceType === "delivery" ? "Entrega" : "Corrida"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Hash size={14} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.infoLabel}>ID</Text>
            <Text style={[styles.infoValue, { fontSize: 11 }]} numberOfLines={1}>
              {details._id || rideId || "--"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconWrap}>
              <Calendar size={14} color={colors.onSurfaceVariant} />
            </View>
            <Text style={styles.infoLabel}>Criada em</Text>
            <Text style={styles.infoValue}>{formattedDate}</Text>
          </View>
        </MotiView>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 12,
  },
  topAppBarTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    gap: 16,
  },
  mapWrapper: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  statusSection: {
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 9999,
    borderWidth: 1,
  },
  statusText: {
    fontSize: 14,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateText: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "500",
  },
  card: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    gap: 14,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  cardTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: "700",
  },
  financeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  financeLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  financeValue: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "600",
  },
  financeDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    marginVertical: 2,
  },
  financeGainLabel: {
    color: colors.secondary,
    fontSize: 16,
    fontWeight: "700",
  },
  financeGainValue: {
    color: colors.secondary,
    fontSize: 24,
    fontWeight: "800",
  },
  addressBlock: {
    flexDirection: "row",
    gap: 14,
  },
  addressTimeline: {
    alignItems: "center",
    width: 14,
    paddingTop: 2,
  },
  addressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  addressLine: {
    width: 2,
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    marginVertical: 4,
    minHeight: 30,
  },
  addressContent: {
    flex: 1,
    paddingBottom: 8,
  },
  addressTag: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  addressText: {
    color: colors.onSurface,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  statIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
    fontWeight: "500",
  },
  statValue: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: "700",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  infoIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  infoLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 13,
    fontWeight: "500",
    minWidth: 55,
  },
  infoValue: {
    color: colors.onSurface,
    fontSize: 13,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
});
