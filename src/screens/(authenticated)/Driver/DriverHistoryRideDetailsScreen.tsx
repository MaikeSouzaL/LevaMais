import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useRoute } from "@react-navigation/native";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Icon } from "@/components/ui/Icon";
import { DriverScreen } from "./components/DriverScreen";
import { GlobalMap } from "@/components/GlobalMap";
import MapMarker from "../../../components/MapMarker";
import rideService from "../../../services/ride.service";
import { useAuthStore } from "../../../context/authStore";

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

function formatDuration(ms?: number | null) {
  if (!ms || ms <= 0) return "--";
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min`;
}

function mapStatusLabel(status?: string) {
  const key = String(status || "");
  const map: Record<string, string> = {
    completed: "Concluída",
    cancelled: "Cancelada",
    cancelled_by_client: "Cancelada pelo cliente",
    cancelled_by_driver: "Cancelada por você",
    in_progress: "Em andamento",
    accepted: "Aceita",
    arrived: "No local",
    driver_arriving: "Chegando",
    requesting: "Buscando",
  };
  return map[key] || key || "--";
}

export default function DriverHistoryRideDetailsScreen() {
  const { params } = useRoute<any>();
  const rideId = String(params?.rideId || "");
  const driverId = useAuthStore((s) => s.userData?.id);
  const mapRef = useRef<MapView | null>(null);

  const [loading, setLoading] = useState(true);
  const [ride, setRide] = useState<any>(null);
  const [audit, setAudit] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [rideData, auditData] = await Promise.all([
          rideService.getById(rideId),
          rideService.getRouteAudit(rideId).catch(() => null),
        ]);
        if (!mounted) return;
        setRide(rideData);
        setAudit(auditData);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [rideId]);

  const routeCoords = useMemo(() => {
    const allPoints: any[] = [];
    const phaseOrder = ["to_pickup", "at_pickup", "to_dropoff", "at_dropoff", "completed"];
    for (const phase of phaseOrder) {
      const pts = audit?.phases?.[phase]?.points || [];
      for (const p of pts) {
        if (typeof p?.latitude === "number" && typeof p?.longitude === "number") {
          allPoints.push({ latitude: p.latitude, longitude: p.longitude });
        }
      }
    }
    if (allPoints.length >= 2) return allPoints;
    if (Array.isArray(ride?.routeCoordinates) && ride.routeCoordinates.length >= 2) {
      return ride.routeCoordinates
        .map((p: any) => ({
          latitude: Number(p?.latitude),
          longitude: Number(p?.longitude),
        }))
        .filter((p: any) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude));
    }
    if (ride?.pickup?.latitude && ride?.dropoff?.latitude) {
      return [
        { latitude: ride.pickup.latitude, longitude: ride.pickup.longitude },
        { latitude: ride.dropoff.latitude, longitude: ride.dropoff.longitude },
      ];
    }
    return [];
  }, [audit, ride]);

  useEffect(() => {
    if (!mapRef.current || routeCoords.length < 2) return;
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(routeCoords, {
        edgePadding: { top: 60, right: 60, bottom: 60, left: 60 },
        animated: true,
      });
    }, 400);
    return () => clearTimeout(t);
  }, [routeCoords]);

  if (loading) {
    return (
      <DriverScreen title="Detalhes da corrida">
        <ActivityIndicator size="large" color="#02de95" style={{ marginTop: 48 }} />
      </DriverScreen>
    );
  }

  if (!ride) {
    return (
      <DriverScreen title="Detalhes da corrida">
        <Text style={{ color: "#fff", marginTop: 24, textAlign: "center" }}>Corrida não encontrada.</Text>
      </DriverScreen>
    );
  }

  const total = Number(ride?.pricing?.total || 0);
  const appFee = Number(ride?.pricing?.platformFee ?? ride?.pricing?.serviceFee ?? Math.max(0, total * 0.2));
  const gain = Number(ride?.pricing?.driverValue ?? Math.max(0, total - appFee));
  const totalDistanceKm = audit?.totalDistanceMeters ? (Number(audit.totalDistanceMeters) / 1000).toFixed(1) : (ride?.distance?.text || "--");
  const toPickup = audit?.phases?.to_pickup;
  const toDropoff = audit?.phases?.to_dropoff;
  const declinedByMe = Array.isArray(ride?.rejectedBy) && ride.rejectedBy.some((x: any) => String(x?.driverId?._id || x?.driverId) === String(driverId || ""));
  const statusLabel = declinedByMe ? "Recusada por você" : mapStatusLabel(ride?.status);
  const finishDate = ride?.completedAt || ride?.cancelledAt || ride?.updatedAt || ride?.createdAt;
  const finishDateText = finishDate ? new Date(finishDate).toLocaleString("pt-BR") : "--";
  const isCompleted = String(ride?.status || "") === "completed";
  const statusColor = declinedByMe ? "#f97316" : isCompleted ? "#02de95" : "#ef4444";

  return (
    <DriverScreen title="Detalhes da corrida" scroll={false}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View
          style={{
            marginBottom: 12,
            backgroundColor: "rgba(255,255,255,0.04)",
            borderRadius: 16,
            padding: 14,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 17 }}>Resumo da corrida</Text>
            <View
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: 14,
                backgroundColor: declinedByMe ? "rgba(249,115,22,0.15)" : isCompleted ? "rgba(2,222,149,0.15)" : "rgba(239,68,68,0.15)",
                borderWidth: 1,
                borderColor: declinedByMe ? "rgba(249,115,22,0.35)" : isCompleted ? "rgba(2,222,149,0.35)" : "rgba(239,68,68,0.35)",
              }}
            >
              <Text style={{ color: statusColor, fontSize: 11, fontWeight: "800" }}>{statusLabel}</Text>
            </View>
          </View>
          <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 6, fontSize: 12 }}>{finishDateText}</Text>
        </View>

        <View style={{ height: 250, borderRadius: 16, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" }}>
          <GlobalMap
            ref={mapRef}
            initialRegion={{
              latitude: ride?.pickup?.latitude || -23.55,
              longitude: ride?.pickup?.longitude || -46.63,
              latitudeDelta: 0.06,
              longitudeDelta: 0.06,
            }}
            useDarkStyle
          >
            {!!ride?.pickup?.latitude && (
              <Marker coordinate={{ latitude: ride.pickup.latitude, longitude: ride.pickup.longitude }}>
                <MapMarker type="pickup" />
              </Marker>
            )}
            {!!ride?.dropoff?.latitude && (
              <Marker coordinate={{ latitude: ride.dropoff.latitude, longitude: ride.dropoff.longitude }}>
                <MapMarker type="dropoff" />
              </Marker>
            )}
            {routeCoords.length >= 2 && <Polyline coordinates={routeCoords} strokeWidth={4} strokeColor="#02de95" />}
          </GlobalMap>
        </View>

        <View style={{ marginTop: 14, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 10 }}>Financeiro</Text>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>Total</Text>
              <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, marginTop: 4 }}>{formatBRL(total)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 11 }}>Taxa app</Text>
              <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 16, marginTop: 4 }}>- {formatBRL(appFee)}</Text>
            </View>
            <View style={{ flex: 1, backgroundColor: isCompleted ? "rgba(2,222,149,0.1)" : "rgba(255,255,255,0.03)", borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isCompleted ? "rgba(2,222,149,0.25)" : "rgba(255,255,255,0.08)" }}>
              <Text style={{ color: "rgba(2,222,149,0.8)", fontSize: 11 }}>Seu ganho</Text>
              <Text style={{ color: isCompleted ? "#02de95" : "rgba(255,255,255,0.6)", fontWeight: "900", fontSize: 16, marginTop: 4 }}>
                {isCompleted ? formatBRL(gain) : "--"}
              </Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 8 }}>Operação</Text>
          <View style={{ gap: 7 }}>
            <Text style={{ color: "rgba(255,255,255,0.75)" }}>Cliente: {ride?.clientId?.name || "--"}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)" }}>Recebedor: {ride?.details?.recipientName || "--"}</Text>
            <Text style={{ color: "rgba(255,255,255,0.75)" }}>Contato recebedor: {ride?.details?.recipientPhone || "--"}</Text>
          </View>

          <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.08)", marginVertical: 10 }} />

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            <View style={{ minWidth: "48%", flexGrow: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Até coleta</Text>
              <Text style={{ color: "#fff", marginTop: 3 }}>
                {toPickup?.pointCount ? `${toPickup.pointCount} pontos / ${formatDuration(new Date(toPickup.endTime).getTime() - new Date(toPickup.startTime).getTime())}` : "--"}
              </Text>
            </View>
            <View style={{ minWidth: "48%", flexGrow: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Coleta até entrega</Text>
              <Text style={{ color: "#fff", marginTop: 3 }}>
                {toDropoff?.pointCount ? `${toDropoff.pointCount} pontos / ${formatDuration(new Date(toDropoff.endTime).getTime() - new Date(toDropoff.startTime).getTime())}` : "--"}
              </Text>
            </View>
            <View style={{ minWidth: "48%", flexGrow: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>KM rodado</Text>
              <Text style={{ color: "#fff", marginTop: 3 }}>{String(totalDistanceKm).includes("km") ? totalDistanceKm : `${totalDistanceKm} km`}</Text>
            </View>
            <View style={{ minWidth: "48%", flexGrow: 1, backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 10 }}>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11 }}>Status final</Text>
              <Text style={{ color: statusColor, marginTop: 3, fontWeight: "700" }}>{statusLabel}</Text>
            </View>
          </View>
        </View>

        <View style={{ marginTop: 12, backgroundColor: "rgba(255,255,255,0.04)", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
          <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginBottom: 8 }}>Endereços</Text>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start", marginBottom: 8 }}>
            <Icon name="radio-button-checked" size={12} color="#02de95" style={{ marginTop: 4 }} />
            <Text style={{ color: "rgba(255,255,255,0.78)", flex: 1 }}>{ride?.pickup?.address || "--"}</Text>
          </View>
          <View style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
            <Icon name="radio-button-checked" size={12} color="#ef4444" style={{ marginTop: 4 }} />
            <Text style={{ color: "rgba(255,255,255,0.78)", flex: 1 }}>{ride?.dropoff?.address || "--"}</Text>
          </View>
          {!!ride?.details?.specialInstructions && (
            <View
              style={{
                marginTop: 10,
                padding: 10,
                borderRadius: 10,
                backgroundColor: "rgba(255,255,255,0.03)",
                flexDirection: "row",
                gap: 8,
              }}
            >
              <Icon name="information-circle-outline" size={16} color="rgba(255,255,255,0.7)" style={{ marginTop: 1 }} />
              <Text style={{ color: "rgba(255,255,255,0.7)", flex: 1 }}>{ride.details.specialInstructions}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </DriverScreen>
  );
}
