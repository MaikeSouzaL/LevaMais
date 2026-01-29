import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";

import GlobalMap from "../../../components/GlobalMap";
import { useAuthStore } from "../../../context/authStore";
import driverLocationService, {
  DriverStatus,
  DriverVehicleType,
} from "../../../services/driverLocation.service";
import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import { DriverBottomSheet } from "./components/DriverBottomSheet";
import { getCurrentLocationAndAddress } from "../../../utils/location";
import MapView, { Marker, Polyline } from "react-native-maps";
import { decodePolyline, LatLng } from "../../../utils/polyline";

export default function DriverHomeScreen() {
  const navigation = useNavigation();
  const userData = useAuthStore((s) => s.userData);

  const [online, setOnline] = useState(false);
  const [acceptingRides, setAcceptingRides] = useState(true);
  const [services, setServices] = useState({ ride: true, delivery: true });
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [isCentering, setIsCentering] = useState(false);
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const intervalRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);

  const vehicleType = (userData?.vehicleType ||
    "motorcycle") as DriverVehicleType;
  const vehicleInfo = (userData?.vehicleInfo || {}) as any;

  const getGoogleMapsApiKey = () => {
    // Prefer env (não expõe a key no repo)
    const envKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (envKey) return envKey;

    // Fallback: tenta ler do app.json via expo-constants
    const maybe = (Constants as any)?.expoConfig?.android?.config?.googleMaps
      ?.apiKey;
    if (maybe) return maybe as string;

    return "";
  };

  const currentServiceTypes = () => {
    const list: Array<"ride" | "delivery"> = [];
    if (services.ride) list.push("ride");
    if (services.delivery) list.push("delivery");
    return list;
  };

  const stopSharing = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    try {
      await driverLocationService.setStatus({
        status: "offline",
        acceptingRides: false,
        serviceTypes: currentServiceTypes(),
      });
    } catch {}

    setOnline(false);
  };

  const startSharing = async () => {
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Permissão de localização negada");
      return;
    }

    // Conectar websocket para receber corridas
    try {
      await webSocketService.connect();
    } catch (e: any) {
      console.log("Falha ao conectar WS", e);
    }

    const sendTick = async () => {
      try {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

        const payload = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading ?? undefined,
          speed: pos.coords.speed ?? undefined,
          status: "available" as DriverStatus,
          vehicleType,
          vehicle: vehicleInfo,
          serviceTypes: currentServiceTypes(),
        };

        if (!region) {
          setRegion({
            latitude: payload.latitude,
            longitude: payload.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          });
        }

        // Persistência + disponibilidade (backend usa isso para encontrar motoristas próximos)
        await driverLocationService.update(payload);

        // RT para clientes quando estiver em corrida (backend ws handler também atualiza DriverLocation)
        webSocketService.emit("update-location", {
          latitude: payload.latitude,
          longitude: payload.longitude,
          heading: payload.heading,
          speed: payload.speed,
        });
      } catch (e: any) {
        console.log("Falha ao enviar localização", e?.message || e);
      }
    };

    await sendTick();

    intervalRef.current = setInterval(sendTick, 5000);

    try {
      await driverLocationService.setStatus({
        status: "available",
        acceptingRides: true,
        serviceTypes: currentServiceTypes(),
      });
    } catch {}

    setAcceptingRides(true);

    setOnline(true);
  };

  useEffect(() => {
    return () => {
      stopSharing();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Badge de solicitações novas (new-ride-request)
  useEffect(() => {
    let mounted = true;

    const onNewRideRequest = async (payload: any) => {
      if (!mounted) return;

      // guarda o último request para preview no mapa
      if (payload?.rideId && payload?.pickup && payload?.dropoff) {
        setIncomingRequest(payload);
      }

      setPendingRequests((prev) => prev + 1);

      try {
        await driverAlertService.start();
      } catch (e) {
        console.log("Falha ao tocar alerta", e);
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("new-ride-request", onNewRideRequest);
      } catch {}
    })();

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRideRequest);
    };
  }, []);

  const toggleOnline = async () => {
    if (online) {
      await stopSharing();
      return;
    }

    // exige pelo menos um tipo
    const types = currentServiceTypes();
    if (!types.length) {
      setError("Selecione pelo menos 1 tipo de serviço (Corridas ou Entregas)");
      return;
    }

    await startSharing();
  };

  const toggleService = async (key: "ride" | "delivery") => {
    setServices((prev) => ({ ...prev, [key]: !prev[key] }));

    // se já estiver online, atualizar preferências no backend
    if (online) {
      try {
        await driverLocationService.setStatus({
          status: "available",
          acceptingRides,
          serviceTypes: currentServiceTypes(),
        });
      } catch {}
    }
  };

  const toggleAccepting = async () => {
    const next = !acceptingRides;
    setAcceptingRides(next);

    if (online) {
      try {
        await driverLocationService.setStatus({
          status: next ? "available" : "busy",
          acceptingRides: next,
          serviceTypes: currentServiceTypes(),
        });
      } catch {}
    }
  };

  const handleCenterMyLocation = async () => {
    if (isCentering) return;

    setIsCentering(true);
    setError(null);

    try {
      const result = await getCurrentLocationAndAddress();
      if (!result) {
        setError("Não foi possível obter sua localização.");
        return;
      }

      const { location } = result;
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      });
    } catch (e) {
      console.log("Falha ao centralizar", e);
      setError("Falha ao centralizar sua localização.");
    } finally {
      setIsCentering(false);
    }
  };

  const handleSOS = () => {
    // MVP: navega para a tela Segurança
    try {
      (navigation as any).navigate("DriverSafety");
    } catch (e) {
      console.log("Falha ao abrir segurança", e);
    }
  };

  const handleNotifications = async () => {
    try {
      (navigation as any).navigate("DriverRequests");
      setPendingRequests(0);
      // mantém alerta tocando até aceitar/rejeitar
    } catch (e) {
      console.log("Falha ao abrir solicitações", e);
    }
  };

  const clearIncoming = async () => {
    setIncomingRequest(null);
    setRouteCoords([]);
    setPendingRequests(0);
    await driverAlertService.stop();
  };

  const acceptIncoming = async () => {
    if (!incomingRequest?.rideId) {
      await clearIncoming();
      return;
    }

    try {
      const ride = await rideService.accept(incomingRequest.rideId);
      await clearIncoming();
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e) {
      console.log("Falha ao aceitar", e);
    }
  };

  const rejectIncoming = async () => {
    if (!incomingRequest?.rideId) {
      await clearIncoming();
      return;
    }

    try {
      await rideService.reject(incomingRequest.rideId, "driver_rejected");
      await clearIncoming();
    } catch (e) {
      console.log("Falha ao rejeitar", e);
    }
  };

  const loadRealRoute = async (pickup: LatLng, dropoff: LatLng) => {
    try {
      const key = getGoogleMapsApiKey();
      if (!key) {
        console.log(
          "Google Maps API key não encontrada. Defina EXPO_PUBLIC_GOOGLE_MAPS_API_KEY",
        );
        setRouteCoords([]);
        return;
      }

      const origin = `${pickup.latitude},${pickup.longitude}`;
      const destination = `${dropoff.latitude},${dropoff.longitude}`;
      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin,
        )}&destination=${encodeURIComponent(destination)}` +
        `&mode=driving&key=${encodeURIComponent(key)}`;

      const res = await fetch(url);
      const data = await res.json();

      const points = data?.routes?.[0]?.overview_polyline?.points;
      if (!points) {
        console.log("Directions sem rota", data?.status, data?.error_message);
        setRouteCoords([]);
        return;
      }

      const decoded = decodePolyline(points);
      setRouteCoords(decoded);

      // Enquadra a rota automaticamente
      if (decoded.length >= 2 && mapRef.current) {
        mapRef.current.fitToCoordinates(decoded as any, {
          edgePadding: { top: 120, right: 60, bottom: 260, left: 60 },
          animated: true,
        });
      }
    } catch (e) {
      console.log("Falha ao carregar rota real", e);
      setRouteCoords([]);
    }
  };

  useEffect(() => {
    const pickup = incomingRequest?.pickup;
    const dropoff = incomingRequest?.dropoff;

    if (
      pickup?.latitude &&
      pickup?.longitude &&
      dropoff?.latitude &&
      dropoff?.longitude
    ) {
      loadRealRoute(
        { latitude: pickup.latitude, longitude: pickup.longitude },
        { latitude: dropoff.latitude, longitude: dropoff.longitude },
      );
    } else {
      setRouteCoords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRequest?.rideId]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={
            (region ?? {
              latitude: -23.5505,
              longitude: -46.6333,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }) as any
          }
          region={region ?? undefined}
          showsUserLocation
          useDarkStyle={useDarkMap}
          onMapRef={(ref) => {
            mapRef.current = ref;
          }}
          onRegionChangeComplete={(r) => setRegion(r as any)}
        >
          {!!incomingRequest?.pickup?.latitude &&
            !!incomingRequest?.pickup?.longitude && (
              <Marker
                coordinate={{
                  latitude: incomingRequest.pickup.latitude,
                  longitude: incomingRequest.pickup.longitude,
                }}
                title="Coleta"
                description={incomingRequest.pickup.address}
                tracksViewChanges={false}
              />
            )}

          {!!incomingRequest?.dropoff?.latitude &&
            !!incomingRequest?.dropoff?.longitude && (
              <Marker
                coordinate={{
                  latitude: incomingRequest.dropoff.latitude,
                  longitude: incomingRequest.dropoff.longitude,
                }}
                title="Destino"
                description={incomingRequest.dropoff.address}
                pinColor="#02de95"
                tracksViewChanges={false}
              />
            )}

          {!!incomingRequest?.pickup?.latitude &&
            !!incomingRequest?.pickup?.longitude &&
            !!incomingRequest?.dropoff?.latitude &&
            !!incomingRequest?.dropoff?.longitude && (
              <Polyline
                coordinates={
                  routeCoords.length >= 2
                    ? (routeCoords as any)
                    : ([
                        {
                          latitude: incomingRequest.pickup.latitude,
                          longitude: incomingRequest.pickup.longitude,
                        },
                        {
                          latitude: incomingRequest.dropoff.latitude,
                          longitude: incomingRequest.dropoff.longitude,
                        },
                      ] as any)
                }
                strokeWidth={4}
                strokeColor="#02de95"
              />
            )}
        </GlobalMap>

        {/* Botão Menu (Hambúrguer) */}
        <View style={{ position: "absolute", top: 14, left: 14, zIndex: 60 }}>
          <TouchableOpacity
            onPress={() => (navigation as any).openDrawer?.()}
            activeOpacity={0.85}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(17,24,22,0.88)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="menu" size={24} color="#02de95" />
          </TouchableOpacity>
        </View>

        {/* Botão SOS */}
        <View style={{ position: "absolute", top: 14, right: 14, zIndex: 60 }}>
          <TouchableOpacity
            onPress={handleSOS}
            activeOpacity={0.85}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(239,68,68,0.18)",
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.35)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <MaterialIcons name="sos" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Botão Centralizar Localização */}
        <View style={{ position: "absolute", top: 72, right: 14, zIndex: 60 }}>
          <TouchableOpacity
            onPress={handleCenterMyLocation}
            activeOpacity={0.85}
            style={{
              width: 48,
              height: 48,
              borderRadius: 24,
              backgroundColor: "rgba(17,24,22,0.88)",
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              alignItems: "center",
              justifyContent: "center",
              opacity: isCentering ? 0.6 : 1,
            }}
          >
            <MaterialIcons name="my-location" size={22} color="#02de95" />
          </TouchableOpacity>
        </View>

        {/* Top HUD */}
        <View
          style={{
            position: "absolute",
            top: 14,
            left: 74,
            right: 14,
            backgroundColor: "rgba(17,24,22,0.88)",
            borderRadius: 16,
            padding: 12,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
                {userData?.name ? `Olá, ${userData.name}` : "Motorista"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                {vehicleType.toUpperCase()}
                {vehicleInfo?.plate ? `• ${vehicleInfo.plate}` : ""}
              </Text>
            </View>

            {/* Ações do HUD */}
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
            >
              <TouchableOpacity
                onPress={() => setUseDarkMap((prev) => !prev)}
                activeOpacity={0.85}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(0,0,0,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons
                  name="layers"
                  size={20}
                  color={useDarkMap ? "#02de95" : "rgba(255,255,255,0.8)"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNotifications}
                activeOpacity={0.85}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  backgroundColor: "rgba(0,0,0,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <View>
                  <MaterialIcons
                    name="notifications"
                    size={20}
                    color="rgba(255,255,255,0.9)"
                  />
                  {pendingRequests > 0 && (
                    <View
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -8,
                        minWidth: 18,
                        height: 18,
                        paddingHorizontal: 5,
                        borderRadius: 999,
                        backgroundColor: "#ef4444",
                        borderWidth: 1,
                        borderColor: "rgba(17,24,22,0.9)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: "white",
                          fontSize: 11,
                          fontWeight: "900",
                        }}
                      >
                        {pendingRequests > 9 ? "9+" : String(pendingRequests)}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    backgroundColor: online ? "#02de95" : "#6b7280",
                  }}
                />
                <Text
                  style={{
                    color: online ? "#02de95" : "rgba(255,255,255,0.7)",
                    fontWeight: "800",
                  }}
                >
                  {online ? "Online" : "Offline"}
                </Text>
              </View>
            </View>
          </View>

          {!!error && (
            <Text
              style={{ color: "#fbbf24", marginTop: 10, fontWeight: "700" }}
            >
              {error}
            </Text>
          )}
        </View>

        {/* Banner: Nova solicitação */}
        {pendingRequests > 0 && (
          <View
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              top: 78,
              backgroundColor: "rgba(17,24,22,0.92)",
              borderRadius: 16,
              padding: 12,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.35)",
              zIndex: 55,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: "white", fontWeight: "900" }}>
                  Nova solicitação
                </Text>
                <Text
                  style={{
                    color: "rgba(255,255,255,0.7)",
                    marginTop: 2,
                    fontWeight: "700",
                  }}
                >
                  Veja no mapa e aceite ou recuse.
                </Text>
              </View>

              <TouchableOpacity
                onPress={handleNotifications}
                activeOpacity={0.85}
                style={{
                  backgroundColor: "#02de95",
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  borderRadius: 12,
                }}
              >
                <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                  Abrir
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={clearIncoming}
                activeOpacity={0.85}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 10,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                }}
              >
                <MaterialIcons name="volume-off" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Card em baixo (preview da solicitação) */}
        {!!incomingRequest?.rideId && (
          <View
            style={{
              position: "absolute",
              left: 14,
              right: 14,
              bottom: 140,
              backgroundColor: "rgba(17,24,22,0.96)",
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.10)",
              zIndex: 55,
            }}
          >
            <Text style={{ color: "white", fontWeight: "900", fontSize: 16 }}>
              {incomingRequest?.pricing?.total != null
                ? `R$ ${Number(incomingRequest.pricing.total).toFixed(2)}`
                : "Nova solicitação"}
            </Text>

            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 8 }}>
              Coleta: {incomingRequest?.pickup?.address || "—"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 4 }}>
              Destino: {incomingRequest?.dropoff?.address || "—"}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={rejectIncoming}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.5)",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#ef4444", fontWeight: "900" }}>
                  Recusar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={acceptIncoming}
                activeOpacity={0.85}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 14,
                  backgroundColor: "#02de95",
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#0f231c", fontWeight: "900" }}>
                  Aceitar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom Sheet */}
        <DriverBottomSheet
          online={online}
          services={services}
          acceptingRides={acceptingRides}
          onToggleOnline={toggleOnline}
          onToggleService={toggleService}
          onToggleAccepting={toggleAccepting}
        />
      </View>
    </SafeAreaView>
  );
}
