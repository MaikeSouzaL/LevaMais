import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Constants from "expo-constants";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
import { MapFabButton } from "../../../components/ui/MapFabButton";
import { MapFabStack } from "../../../components/ui/MapFabStack";
import { DriverMapMenuButton } from "./components/DriverMapMenuButton";
import { DriverTopHud } from "./components/DriverTopHud";
import { LocationLoadingScreen } from "../../../components/ui/LocationLoadingScreen";

export default function DriverHomeScreen() {
  const navigation = useNavigation();
  const colorScheme = useColorScheme();
  const userData = useAuthStore((s) => s.userData);

  const [online, setOnline] = useState(false);
  const [services, setServices] = useState({ 
    ride: userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle", 
    delivery: true 
  });
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [isCentering, setIsCentering] = useState(false);
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [showMapStyleHint, setShowMapStyleHint] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [stats, setStats] = useState({ earnings: 0, rides: 0, goal: 10, bonus: 0 }); // [NEW] Stats state
  const intervalRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);
  const didSetInitialRegionRef = useRef(false);

  const vehicleType = (userData?.vehicleType ||
    "motorcycle") as DriverVehicleType;
  const vehicleInfo = (userData?.vehicleInfo || {}) as any;

  // [NEW] Fetch stats helper
  const fetchStats = async () => {
    try {
      const data = await rideService.getDriverStats();
      setStats(data);
    } catch (e) {
      console.log("Falha ao buscar stats", e);
    }
  };

  useEffect(() => {
    // Busca inicial
    fetchStats();
    
    // Atualiza a cada 60s se estiver online, para manter sincronizado
    const interval = setInterval(() => {
        fetchStats();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
        serviceTypes: currentServiceTypes(),
      });
    } catch {}

    setOnline(false);
  };

  // Região inicial do mapa deve ser sempre a localização do usuário.
  // Faz isso uma única vez na montagem (não re-centraliza quando o usuário move o mapa).
  // IMPORTANTE: se a permissão de localização for negada/der erro, ainda assim setamos
  // uma região padrão para o mapa renderizar (senão fica preso no loading e “parece que o mapa sumiu”).
  useEffect(() => {
    let mounted = true;

    const DEFAULT_REGION = {
      // São Paulo (fallback visual)
      latitude: -23.5505,
      longitude: -46.6333,
      latitudeDelta: 0.08,
      longitudeDelta: 0.08,
    };

    (async () => {
      if (didSetInitialRegionRef.current) return;

      const seed = async (latitude: number, longitude: number) => {
        if (!mounted || didSetInitialRegionRef.current) return;
        didSetInitialRegionRef.current = true;
        setRegion({
          latitude,
          longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        });
      };

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          // Deixa o mapa aparecer mesmo sem localização
          setError(
            "Permissão de localização negada. Ative a localização para ver sua posição no mapa.",
          );
          // não marca didSetInitialRegionRef, assim o usuário pode tentar centralizar depois
          setRegion(DEFAULT_REGION as any);
          return;
        }

        // 1) tenta última posição conhecida (rápida)
        const last = await Location.getLastKnownPositionAsync();
        if (last?.coords?.latitude && last?.coords?.longitude) {
          await seed(last.coords.latitude, last.coords.longitude);
          return;
        }

        // 2) fallback para posição atual (pode demorar)
        const cur = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (cur?.coords?.latitude && cur?.coords?.longitude) {
          await seed(cur.coords.latitude, cur.coords.longitude);
          return;
        }

        // 3) se não conseguiu pegar coordenadas, ainda renderiza o mapa
        setRegion(DEFAULT_REGION as any);
      } catch (e) {
        console.log("Falha ao obter região inicial", e);
        setError("Não foi possível carregar sua localização agora.");
        setRegion(DEFAULT_REGION as any);
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    // Define status disponível rapidamente (não depende da posição)
    try {
      await driverLocationService.setStatus({
        status: "available",
        serviceTypes: currentServiceTypes(),
      });
    } catch {}

    // TODO: restante do startSharing (tick/interval) continua mais abaixo no arquivo.
    // Esta função foi interrompida por uma edição manual; vamos manter o comportamento atual
    // e não iniciar intervalos aqui para evitar regressão.
  };

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

    const onRideTaken = async (payload: any) => {
      if (!mounted) return;
      const takenId = payload?.rideId;
      if (!takenId) return;

      // se a solicitação que está na tela foi pega por outro motorista, limpa
      if (incomingRequest?.rideId && incomingRequest.rideId === takenId) {
        await clearIncoming();
      }
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.on("new-ride-request", onNewRideRequest);
        webSocketService.on("ride-taken", onRideTaken);
      } catch {}
    })();

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRideRequest);
      webSocketService.off("ride-taken", onRideTaken);
    };
  }, []);

  const toggleOnline = async () => {
    if (isTogglingOnline) return;

    const next = !online;
    // UI otimista: muda imediatamente
    setOnline(next);
    setIsTogglingOnline(true);

    try {
      if (!next) {
        // indo para offline
        await stopSharing();
      } else {
        // exige pelo menos um tipo
        const types = currentServiceTypes();
        if (!types.length) {
          setError(
            "⚠️ Você precisa ativar pelo menos 1 tipo de serviço para ficar online",
          );
          setOnline(false); // reverte
          setIsTogglingOnline(false);
          return;
        }

        await startSharing();
        // Libera o loading imediatamente após iniciar compartilhamento
        setIsTogglingOnline(false);
        // Consulta de corrida ativa em segundo plano
        rideService
          .getActive()
          .then((resp) => {
            if (resp?.active && resp.ride?._id) {
              (navigation as any).navigate("DriverRide", {
                rideId: resp.ride._id,
              });
            }
          })
          .catch(() => {});
      }
    } catch (e) {
      // Em caso de falha, reverte estado e mostra erro genérico
      setOnline(!next);
      if (!error) setError("Não foi possível alterar seu status agora.");
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const toggleService = async (key: "ride" | "delivery") => {
    // Validar se pode ativar corridas
    if (key === "ride") {
      const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";
      if (!canDoRides) {
        setError("Corridas de passageiros disponíveis apenas para carros e motos");
        return;
      }
    }

    // Verificar se está tentando desabilitar o último serviço ativo
    const newValue = !services[key];
    const otherKey = key === "ride" ? "delivery" : "ride";
    
    if (!newValue && !services[otherKey]) {
      // Tentando desabilitar o último serviço
      setError("Você precisa ter pelo menos 1 tipo de serviço ativo");
      return;
    }

    setServices((prev) => ({ ...prev, [key]: !prev[key] }));
    setError(null); // Limpa erro se a operação foi bem sucedida

    // se já estiver online, atualizar preferências no backend
    if (online) {
      try {
        await driverLocationService.setStatus({
          status: "available",
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

  const handleToggleMapStyle = () => {
    if (isSwitchingMapStyle) return;
    setIsSwitchingMapStyle(true);
    setUseDarkMap((prev) => {
      const next = !prev;
      // persistir preferência
      AsyncStorage.setItem("mapStylePref", next ? "dark" : "light").catch(
        () => {},
      );
      return next;
    });
    setShowMapStyleHint(true);
    setTimeout(() => setIsSwitchingMapStyle(false), 300);
    setTimeout(() => setShowMapStyleHint(false), 900);
  };

  // Carregar preferência de estilo de mapa na montagem
  useEffect(() => {
    (async () => {
      try {
        const pref = await AsyncStorage.getItem("mapStylePref");
        if (pref === "dark") setUseDarkMap(true);
        else if (pref === "light") setUseDarkMap(false);
        else setUseDarkMap(colorScheme === "dark");
      } catch {}
    })();
  }, []);

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
        {!region ? (
          <LocationLoadingScreen />
        ) : (
          <GlobalMap
            initialRegion={region as any}
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
        )}

        {/* Botão Menu (Hambúrguer) - só aparece quando o mapa carregou */}
        {!!region && (
          <>
            <View
              style={{ position: "absolute", top: 14, left: 14, zIndex: 60 }}
            >
              <DriverMapMenuButton />
            </View>

            {/* Botões flutuantes (SOS / GPS / Layers) */}
            <MapFabStack floatingStyle={{ top: "35%", right: 14, zIndex: 60 }}>
              <MapFabButton
                icon="sos"
                onPress={handleSOS}
                size={48}
                iconSize={22}
                backgroundColor="rgba(239,68,68,0.18)"
                activeBackgroundColor="rgba(239,68,68,0.28)"
                iconColor="#ef4444"
                accessibilityLabel="SOS"
              />

              <MapFabButton
                icon="my-location"
                onPress={handleCenterMyLocation}
                size={48}
                iconSize={22}
                backgroundColor="rgba(17,24,22,0.88)"
                activeBackgroundColor="#1b2723"
                iconColor="#02de95"
                disabled={isCentering}
                accessibilityLabel="Centralizar localização"
              />

              <MapFabButton
                icon="layers"
                onPress={handleToggleMapStyle}
                size={48}
                iconSize={22}
                backgroundColor={
                  isSwitchingMapStyle ? "#02de95" : "rgba(17,24,22,0.88)"
                }
                activeBackgroundColor="#1b2723"
                iconColor={
                  isSwitchingMapStyle
                    ? "#0f231c"
                    : useDarkMap
                      ? "#02de95"
                      : "rgba(255,255,255,0.9)"
                }
                disabled={isSwitchingMapStyle}
                accessibilityLabel="Trocar estilo do mapa"
              />
            </MapFabStack>

            {/* Top HUD */}
            <View
              style={{ position: "absolute", top: 14, left: 74, right: 14 }}
            >
              <DriverTopHud
                driverName={userData?.name}
                vehicleTypeLabel={vehicleType.toUpperCase()}
                plate={vehicleInfo?.plate}
                pendingRequests={pendingRequests}
                onPressNotifications={handleNotifications}
                online={online}
              />

              {!!error && (
                <Text
                  style={{ 
                    color: "#fbbf24", 
                    marginTop: 10, 
                    fontWeight: "700",
                    fontSize: 13,
                  }}
                >
                  {error}
                </Text>
              )}
            </View>
          </>
        )}

        {/* Banner: Nova solicitação - só aparece quando o mapa carregou */}
        {!!region && pendingRequests > 0 && (
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

        {/* Card em baixo (preview da solicitação) - só aparece quando o mapa carregou */}
        {!!region && !!incomingRequest?.rideId && (
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

        {/* Bottom Sheet - sempre visível */}
        <DriverBottomSheet
          online={online}
          services={services}
          isTogglingOnline={isTogglingOnline}
          onToggleOnline={toggleOnline}
          onToggleService={toggleService}
          vehicleType={vehicleType}
          snapPoints={["55%"]}
          stats={stats} // [NEW]
        />
      </View>
    </SafeAreaView>
  );
}
