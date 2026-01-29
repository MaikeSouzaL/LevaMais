import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Linking, Image } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import GlobalMap from "../../../components/GlobalMap";
import rideService, { Ride } from "../../../services/ride.service";
import webSocketService from "../../../services/websocket.service";
import { Marker, Polyline } from "react-native-maps";
import ActionButton from "../../../components/ui/ActionButton";
import InfoRow from "../../../components/ui/InfoRow";
import { decodePolyline, type LatLng } from "../../../utils/polyline";

type Params = {
  RideTracking: {
    rideId: string;
  };
};

export default function RideTrackingScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "RideTracking">>();
  const rideId = route.params?.rideId;

  const [ride, setRide] = useState<Ride | null>(null);
  const [driverLatLng, setDriverLatLng] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [statusText, setStatusText] = useState<string>(
    "Aguardando motorista...",
  );
  const [driverInfo, setDriverInfo] = useState<any>(null);
  const [etaText, setEtaText] = useState<string | undefined>(undefined);

  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [routeError, setRouteError] = useState<string | null>(null);

  const [cancelCard, setCancelCard] = useState<{
    visible: boolean;
    reason?: string;
    cancelledBy?: "client" | "driver" | "system";
  }>({ visible: false });

  const initialRegion = useMemo(() => {
    const lat = ride?.pickup?.latitude ?? -23.5505;
    const lng = ride?.pickup?.longitude ?? -46.6333;
    return {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }, [ride?.pickup?.latitude, ride?.pickup?.longitude]);

  function getStatusTitle(value?: string) {
    if (!value) return "Aguardando motorista...";
    if (value === "requesting") return "Procurando motorista";
    if (value === "accepted") return "Motorista a caminho";
    if (value === "arrived") return "Motorista chegou";
    if (value === "in_progress") return "Em andamento";
    if (value === "completed") return "Finalizada";
    if (String(value).startsWith("cancelled")) return "Cancelada";
    return `Status: ${value}`;
  }

  function openCompleted() {
    if (!rideId) return;
    try {
      (navigation as any).navigate("RideCompleted", { rideId: rideId });
    } catch {}
  }

  function canClientCancel(value?: string) {
    if (!value) return true;
    if (value === "completed") return false;
    if (String(value).startsWith("cancelled")) return false;
    return true;
  }

  function formatVehicleText(driver: any) {
    if (!driver) return "";
    let vehicle = driver.vehicle || {};
    let model = vehicle.model ? String(vehicle.model) : "";
    let plate = vehicle.plate ? String(vehicle.plate) : "";
    if (model && plate) return `${model} • ${plate}`;
    if (model) return model;
    if (plate) return plate;
    return "";
  }

  function openPhone(phone?: string) {
    if (!phone) return;
    try {
      Linking.openURL(`tel:${phone}`);
    } catch {}
  }

  function openChat(name?: string) {
    try {
      (navigation as any).navigate("Chat", {
        driverName: name || "Motorista",
      });
    } catch {}
  }

  function getGoogleMapsApiKey() {
    // Prefer env
    if (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY) {
      return String(process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY);
    }

    // Fallback: algumas configs Expo guardam no app.json
    try {
      // import dinâmico para não quebrar web
      let Constants = require("expo-constants").default;
      let maybe = Constants?.expoConfig?.android?.config?.googleMaps?.apiKey;
      if (maybe) return String(maybe);
    } catch {}

    return "";
  }

  function getRouteEndpoints() {
    // Não desenhar rota sem motorista ainda
    if (!driverLatLng) return null;

    let status = ride?.status;
    let pickup = ride?.pickup;
    let dropoff = ride?.dropoff;

    if (!pickup?.latitude || !pickup?.longitude) return null;
    if (!dropoff?.latitude || !dropoff?.longitude) return null;

    // Antes de iniciar: rota do motorista -> coleta
    if (status === "accepted" || status === "arrived" || status === "requesting") {
      return {
        origin: driverLatLng,
        destination: { latitude: pickup.latitude, longitude: pickup.longitude },
      };
    }

    // Durante a entrega/corrida: motorista -> destino
    if (status === "in_progress") {
      return {
        origin: driverLatLng,
        destination: { latitude: dropoff.latitude, longitude: dropoff.longitude },
      };
    }

    return null;
  }

  async function loadRealRoute() {
    try {
      setRouteError(null);

      let key = getGoogleMapsApiKey();
      if (!key) {
        setRouteCoords([]);
        setRouteError(
          "Google Maps API key não encontrada. Defina EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
        );
        return;
      }

      let endpoints = getRouteEndpoints();
      if (!endpoints) {
        setRouteCoords([]);
        return;
      }

      let origin = `${endpoints.origin.latitude},${endpoints.origin.longitude}`;
      let destination = `${endpoints.destination.latitude},${endpoints.destination.longitude}`;

      let url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin,
        )}&destination=${encodeURIComponent(destination)}` +
        `&mode=driving&key=${encodeURIComponent(key)}`;

      let res = await fetch(url);
      let data = await res.json();

      let points = data?.routes?.[0]?.overview_polyline?.points;
      if (!points) {
        setRouteCoords([]);
        setRouteError(
          data?.error_message ||
            (data?.status ? `Directions: ${data.status}` : "Sem rota"),
        );
        return;
      }

      setRouteCoords(decodePolyline(String(points)));
    } catch (e: any) {
      setRouteCoords([]);
      setRouteError(e?.message || "Falha ao carregar rota");
    }
  }

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatusText(getStatusTitle(r?.status));

        // Se a corrida já tem motorista (pelo GET), preencher card mesmo se WS perder o evento
        const drv = (r as any)?.driverId;
        if (drv) {
          setDriverInfo((prev: any) => prev || drv);
        }

        if (r?.status === "completed") {
          openCompleted();
          return;
        }

        if (String(r?.status || "").startsWith("cancelled")) {
          setCancelCard({
            visible: true,
            cancelledBy: "system",
            reason: "Corrida cancelada.",
          });
        }
      } catch (e) {
        console.log("Falha ao carregar corrida", e);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [rideId]);

  // Fallback de produção: polling leve para não depender 100% do WebSocket
  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    let stopped = false;

    const stopIfDone = (st?: string) => {
      if (!st) return false;
      if (st === "completed") return true;
      if (String(st).startsWith("cancelled")) return true;
      return false;
    };

    const tick = async () => {
      if (stopped) return;
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;

        setRide(r as any);
        setStatusText(getStatusTitle(r?.status));

        const drv = (r as any)?.driverId;
        if (drv) {
          setDriverInfo((prev: any) => prev || drv);
        }

        if (r?.status === "completed") {
          stopped = true;
          openCompleted();
          return;
        }

        if (String(r?.status || "").startsWith("cancelled")) {
          stopped = true;
          setCancelCard({
            visible: true,
            cancelledBy: "system",
            reason: "Corrida cancelada.",
          });
          return;
        }
      } catch {
        // silencioso
      }
    };

    const startTimer = setTimeout(() => {
      tick();
    }, 2000);

    const id = setInterval(() => {
      if (stopIfDone((ride as any)?.status)) return;
      tick();
    }, 6000);

    return () => {
      mounted = false;
      clearTimeout(startTimer);
      clearInterval(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rideId]);

  // Carregar rota real (e atualizar quando status ou localização do motorista mudarem)
  useEffect(() => {
    if (ride?.status === "completed") {
      openCompleted();
      return;
    }

    loadRealRoute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ride?.status, driverLatLng?.latitude, driverLatLng?.longitude]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    const onDriverFound = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      setStatusText("Motorista a caminho");
      if (payload?.driver) setDriverInfo(payload.driver);
      const t =
        payload?.eta?.text ||
        (typeof payload?.eta === "string" ? payload.eta : undefined);
      if (t) setEtaText(String(t));
    };

    const onDriverLocationUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverLatLng({ latitude: loc.latitude, longitude: loc.longitude });
      }
    };

    const onRideStatusUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      if (payload?.status) {
        // Se finalizou: manda para a tela de resumo
        if (payload.status === "completed") {
          setRide((prev) => {
            if (!prev) return prev;
            return { ...(prev as any), status: payload.status } as any;
          });
          openCompleted();
          return;
        }

        if (String(payload.status).startsWith("cancelled")) {
          setRide((prev) => {
            if (!prev) return prev;
            return { ...(prev as any), status: payload.status } as any;
          });
          setStatusText(getStatusTitle(payload.status));
          setCancelCard({
            visible: true,
            cancelledBy: "system",
            reason: "Corrida cancelada.",
          });
          return;
        }

        setStatusText(getStatusTitle(payload.status));
        setRide((prev) => {
          if (!prev) return prev;
          return { ...(prev as any), status: payload.status } as any;
        });
      }
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      const cancelledBy = payload?.cancelledBy;
      const reason = payload?.reason;

      setStatusText("Cancelada");

      // Estilo Uber/99: não some sozinho, mostra card com motivo e botão de ação
      setCancelCard({
        visible: true,
        cancelledBy: cancelledBy === "driver" ? "driver" : "system",
        reason: reason ? String(reason) : undefined,
      });

      // Toast como complemento
      Toast.show({
        type: "error",
        text1:
          cancelledBy === "driver"
            ? "O motorista cancelou"
            : "Corrida cancelada",
        text2: reason ? String(reason) : "Você pode solicitar outra corrida.",
      });
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onDriverFound(onDriverFound);
        webSocketService.onDriverLocationUpdated(onDriverLocationUpdated);
        webSocketService.onRideStatusUpdated(onRideStatusUpdated);
        webSocketService.onRideCancelled(onRideCancelled);
      } catch (e) {
        console.log("Falha ao conectar WebSocket", e);
      }
    })();

    return () => {
      mounted = false;
      webSocketService.off("driver-found", onDriverFound);
      webSocketService.off("driver-location-updated", onDriverLocationUpdated);
      webSocketService.off("ride-status-updated", onRideStatusUpdated);
      webSocketService.off("ride-cancelled", onRideCancelled);
    };
  }, [rideId]);

  async function handleCancel() {
    if (!rideId) return;

    try {
      (navigation as any).navigate("ClientCancelRide", { rideId });
    } catch {
      // fallback: tenta cancelar direto
      try {
        await rideService.cancel(rideId, "changed_mind");
        setStatusText("Cancelada");
        Toast.show({ type: "success", text1: "Corrida cancelada" });
        navigation.goBack();
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Não foi possível cancelar",
          text2: e?.message || "Tente novamente",
        });
      }
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#02de95" />
          <Text style={{ color: "white", fontWeight: "800" }}>Acompanhar</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleCancel} disabled={!canClientCancel(ride?.status)}>
          <Text
            style={{
              color: canClientCancel(ride?.status)
                ? "#ef4444"
                : "rgba(255,255,255,0.35)",
              fontWeight: "800",
            }}
          >
            Cancelar
          </Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation
          region={undefined}
        >
          {!!ride?.pickup?.latitude && !!ride?.pickup?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
              }}
              title="Coleta"
              description={ride.pickup.address}
              tracksViewChanges={false}
            />
          )}

          {!!ride?.dropoff?.latitude && !!ride?.dropoff?.longitude && (
            <Marker
              coordinate={{
                latitude: ride.dropoff.latitude,
                longitude: ride.dropoff.longitude,
              }}
              title="Destino"
              description={ride.dropoff.address}
              pinColor="#02de95"
              tracksViewChanges={false}
            />
          )}

          {routeCoords.length >= 2 && (
            <Polyline
              coordinates={routeCoords as any}
              strokeWidth={5}
              strokeColor="#02de95"
              lineCap="round"
              lineJoin="round"
            />
          )}

          {driverLatLng && (
            <Marker
              coordinate={driverLatLng}
              title="Motorista"
              tracksViewChanges={false}
            />
          )}
        </GlobalMap>

        {/* Bottom Card (estilo Uber/99) */}
        <View
          style={{
            position: "absolute",
            left: 16,
            right: 16,
            bottom: 16,
            backgroundColor: "rgba(17,24,22,0.96)",
            borderRadius: 22,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.10)",
            shadowColor: "#000",
            shadowOpacity: 0.45,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 10 },
            elevation: 14,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            {driverInfo?.profilePhoto ? (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                }}
              >
                <Image
                  source={{ uri: String(driverInfo.profilePhoto) }}
                  style={{ width: 44, height: 44 }}
                  resizeMode="cover"
                />
              </View>
            ) : (
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 16,
                  backgroundColor: "rgba(2,222,149,0.14)",
                  borderWidth: 1,
                  borderColor: "rgba(2,222,149,0.22)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="near-me" size={20} color="#02de95" />
              </View>
            )}

            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                {statusText}
              </Text>
              {!!etaText && (
                <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 2 }}>
                  Chega em: {etaText}
                </Text>
              )}
              {!!routeError && (
                <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 2, fontSize: 12 }}>
                  {routeError}
                </Text>
              )}
            </View>
          </View>

          <InfoRow label="Motorista" value={driverInfo?.name ? String(driverInfo.name) : undefined} />
          <InfoRow label="Veículo" value={formatVehicleText(driverInfo) || undefined} />
          <InfoRow label="Coleta" value={ride?.pickup?.address} />
          <InfoRow label="Destino" value={ride?.dropoff?.address} />

          {/* Actions */}
          <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
            <ActionButton
              title="Ligar"
              variant="secondary"
              onPress={() => openPhone(driverInfo?.phone)}
              disabled={!driverInfo?.phone}
              style={{ flex: 1 }}
            />
            <ActionButton
              title="Chat"
              variant="secondary"
              onPress={() => openChat(driverInfo?.name)}
              style={{ flex: 1 }}
            />
          </View>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 10 }}>
            <ActionButton
              title="Cancelar corrida"
              variant="danger"
              onPress={handleCancel}
              disabled={!canClientCancel(ride?.status)}
              style={{ flex: 1 }}
            />
          </View>
        </View>

        {/* Card de cancelamento (não some sozinho) */}
        {cancelCard.visible && (
          <View
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 16,
              backgroundColor: "rgba(17,24,22,0.98)",
              borderRadius: 22,
              padding: 16,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.35)",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 16,
              minHeight: 220,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(239,68,68,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.28)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="error-outline" size={22} color="#ef4444" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                  Corrida cancelada
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  {cancelCard.cancelledBy === "driver"
                    ? "O motorista cancelou"
                    : cancelCard.reason === "no_driver_found"
                      ? "Sem motoristas no momento"
                      : "Cancelada"}
                </Text>
              </View>
            </View>

            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.78)", lineHeight: 19 }}>
                {cancelCard.reason === "no_driver_found"
                  ? "Não encontramos motoristas disponíveis. Você pode tentar novamente."
                  : cancelCard.reason || "Motivo não informado."}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <ActionButton
                title="Fechar"
                variant="secondary"
                onPress={() => {
                  setCancelCard({ visible: false });
                  navigation.goBack();
                }}
                style={{ flex: 1 }}
              />
              <ActionButton
                title="Solicitar outra"
                variant="primary"
                onPress={() => {
                  setCancelCard({ visible: false });
                  navigation.goBack();
                }}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
