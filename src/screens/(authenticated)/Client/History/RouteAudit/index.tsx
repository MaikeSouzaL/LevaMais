import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, Polyline } from "react-native-maps";
import { ChevronLeft, Route as RouteIcon, Gauge, Clock, MapPin, TrendingUp } from "lucide-react-native";

import { GlobalMap } from "@/components/GlobalMap";
import RoutePin from "@/components/maps/RoutePin";
import rideService from "@/services/ride.service";
import { ClientStackParamList } from "../../types/navigation";

type LatLng = { latitude: number; longitude: number };

const PHASE_LABEL: Record<string, string> = {
  to_pickup: "A caminho da coleta/embarque",
  at_pickup: "No ponto de coleta/embarque",
  to_dropoff: "A caminho do destino",
  at_dropoff: "No destino",
  completed: "Finalizado",
};

function formatDuration(ms?: number | null) {
  if (!ms || ms <= 0) return "--";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function formatTime(iso?: string) {
  if (!iso) return "--";
  try {
    return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--";
  }
}

export default function RouteAuditScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "RouteAudit">>();
  const insets = useSafeAreaInsets();
  const { rideId } = route.params as { rideId: string };

  const mapRef = useRef<MapView>(null);
  const [loading, setLoading] = useState(true);
  const [audit, setAudit] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const data = await rideService.getRouteAudit(rideId);
        if (mounted) setAudit(data);
      } catch (e: any) {
        if (mounted) setError(e?.message || "Não foi possível carregar a auditoria.");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [rideId]);

  const track: LatLng[] = useMemo(() => {
    const t = Array.isArray(audit?.track) ? audit.track : [];
    return t
      .filter((p: any) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
      .map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
  }, [audit?.track]);

  const pickup = audit?.pickup;
  const dropoff = audit?.dropoff;

  const fitCoords = useMemo(() => {
    const pts: LatLng[] = [...track];
    if (pickup?.latitude && pickup?.longitude) pts.push({ latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) });
    if (dropoff?.latitude && dropoff?.longitude) pts.push({ latitude: Number(dropoff.latitude), longitude: Number(dropoff.longitude) });
    return pts;
  }, [track, pickup, dropoff]);

  const handleMapReady = () => {
    if (fitCoords.length >= 2) {
      setTimeout(() => {
        mapRef.current?.fitToCoordinates(fitCoords, {
          edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
          animated: true,
        });
      }, 400);
    }
  };

  const divergence = audit?.routeDivergencePercent;
  const phasesEntries: Array<[string, any]> = audit?.phases ? Object.entries(audit.phases) : [];

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trajeto percorrido</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#02de95" size="large" />
          <Text style={styles.muted}>Carregando auditoria...</Text>
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.muted}>{error}</Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }}>
          {/* Mapa com trajeto real */}
          <View style={styles.mapWrap}>
            <GlobalMap
              ref={mapRef}
              style={StyleSheet.absoluteFillObject}
              useDarkStyle
              showsUserLocation={false}
              initialRegion={{
                latitude: Number(pickup?.latitude) || -23.55,
                longitude: Number(pickup?.longitude) || -46.63,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              onMapReady={handleMapReady}
            >
              {track.length >= 2 && (
                <Polyline coordinates={track} strokeColor="#02de95" strokeWidth={5} lineCap="round" lineJoin="round" />
              )}
              {!!pickup?.latitude && (
                <Marker coordinate={{ latitude: Number(pickup.latitude), longitude: Number(pickup.longitude) }} anchor={{ x: 0.5, y: 1 }}>
                  <RoutePin variant="pickup" />
                </Marker>
              )}
              {!!dropoff?.latitude && (
                <Marker coordinate={{ latitude: Number(dropoff.latitude), longitude: Number(dropoff.longitude) }} anchor={{ x: 0.5, y: 1 }}>
                  <RoutePin variant="dropoff" />
                </Marker>
              )}
            </GlobalMap>
            {track.length < 2 && (
              <View style={styles.noTrack}>
                <RouteIcon size={20} color="rgba(255,255,255,0.5)" />
                <Text style={styles.noTrackText}>Sem pontos de trajeto registrados</Text>
              </View>
            )}
          </View>

          {/* Métricas */}
          <View style={styles.metricsGrid}>
            <Metric icon={<RouteIcon size={16} color="#02de95" />} label="Distância real" value={`${((audit?.totalDistanceMeters || 0) / 1000).toFixed(1)} km`} />
            <Metric icon={<MapPin size={16} color="#60a5fa" />} label="Planejada" value={`${((audit?.plannedDistanceMeters || 0) / 1000).toFixed(1)} km`} />
            <Metric
              icon={<TrendingUp size={16} color={divergence != null && divergence > 15 ? "#f59e0b" : "#02de95"} />}
              label="Divergência"
              value={divergence != null ? `${divergence > 0 ? "+" : ""}${divergence}%` : "--"}
            />
            <Metric icon={<Gauge size={16} color="#02de95" />} label="Vel. média" value={audit?.avgSpeedKmh != null ? `${audit.avgSpeedKmh} km/h` : "--"} />
            <Metric icon={<Clock size={16} color="#02de95" />} label="Duração" value={formatDuration(audit?.totalDurationMs)} />
            <Metric icon={<MapPin size={16} color="#02de95" />} label="Pontos GPS" value={String(audit?.totalPoints ?? 0)} />
          </View>

          {/* Janela de tempo */}
          <View style={styles.timeCard}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Início</Text>
              <Text style={styles.timeValue}>{formatTime(audit?.startedAt)}</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Fim</Text>
              <Text style={styles.timeValue}>{formatTime(audit?.endedAt)}</Text>
            </View>
          </View>

          {/* Fases */}
          {phasesEntries.length > 0 && (
            <View style={styles.phasesCard}>
              <Text style={styles.sectionTitle}>Fases do trajeto</Text>
              {phasesEntries.map(([key, data]) => (
                <View key={key} style={styles.phaseRow}>
                  <View style={styles.phaseDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.phaseLabel}>{PHASE_LABEL[key] || key}</Text>
                    <Text style={styles.phaseMeta}>
                      {formatTime(data?.startTime)} – {formatTime(data?.endTime)} · {data?.pointCount || 0} pontos
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <View style={styles.metricIcon}>{icon}</View>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#091A2F" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 12, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.06)" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "900" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  muted: { color: "rgba(255,255,255,0.6)", fontSize: 13 },
  mapWrap: { height: 280, marginHorizontal: 16, borderRadius: 20, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", position: "relative" },
  noTrack: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "rgba(9,26,47,0.4)" },
  noTrackText: { color: "rgba(255,255,255,0.55)", fontSize: 12, fontWeight: "700" },
  metricsGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 12, marginTop: 14, gap: 8 },
  metric: { width: "31.5%", backgroundColor: "#11253E", borderRadius: 16, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  metricIcon: { marginBottom: 6 },
  metricValue: { color: "#fff", fontSize: 15, fontWeight: "900" },
  metricLabel: { color: "rgba(255,255,255,0.45)", fontSize: 10, fontWeight: "700", marginTop: 2, textAlign: "center" },
  timeCard: { flexDirection: "row", backgroundColor: "#11253E", marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  timeRow: { flex: 1, alignItems: "center" },
  timeLabel: { color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700" },
  timeValue: { color: "#fff", fontSize: 16, fontWeight: "900", marginTop: 2 },
  timeDivider: { width: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  phasesCard: { backgroundColor: "#11253E", marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  sectionTitle: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 12 },
  phaseRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 12 },
  phaseDot: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: "#02de95", marginTop: 4 },
  phaseLabel: { color: "#fff", fontSize: 13, fontWeight: "800" },
  phaseMeta: { color: "rgba(255,255,255,0.45)", fontSize: 11, marginTop: 2 },
});
