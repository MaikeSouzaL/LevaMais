import React, { useEffect, useRef, useState } from "react";
import { AppState, View, Text, TouchableOpacity, useColorScheme } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Constants from "expo-constants";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
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
import MapMarker from "../../../components/MapMarker";
import Toast from "react-native-toast-message";


export default function DriverHomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const userData = useAuthStore((s) => s.userData);

  const [online, setOnline] = useState(false);
  const [services, setServices] = useState({
    ride:
      userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle",
    delivery: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [isCentering, setIsCentering] = useState(false);
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [showMapStyleHint, setShowMapStyleHint] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [waitingQueueCount, setWaitingQueueCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const intervalRef = useRef<any>(null);
  const pendingSyncIntervalRef = useRef<any>(null);
  const countdownIntervalRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);
  const hasIncomingRequestRef = useRef(false);
  const didSetInitialRegionRef = useRef(false);
  const lastAppStateRef = useRef(AppState.currentState);

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

  const currentServiceTypesFrom = (
    nextServices: typeof services,
  ): Array<"ride" | "delivery"> => {
    const list: Array<"ride" | "delivery"> = [];
    if (nextServices.ride) list.push("ride");
    if (nextServices.delivery) list.push("delivery");
    return list;
  };

  const publishDriverLocation = async (
    nextStatus: DriverStatus = "available",
    serviceTypes?: Array<"ride" | "delivery">,
  ) => {
    const types = serviceTypes || currentServiceTypes();

    let latitude: number | null = null;
    let longitude: number | null = null;
    let heading: number | undefined;
    let speed: number | undefined;

    try {
      const last = await Location.getLastKnownPositionAsync();
      if (last?.coords?.latitude && last?.coords?.longitude) {
        latitude = last.coords.latitude;
        longitude = last.coords.longitude;
        heading = last.coords.heading ?? undefined;
        speed =
          typeof last.coords.speed === "number"
            ? Math.max(0, last.coords.speed * 3.6)
            : undefined;
      }
    } catch {}

    if (latitude == null || longitude == null) {
      const cur = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      latitude = cur.coords.latitude;
      longitude = cur.coords.longitude;
      heading = cur.coords.heading ?? undefined;
      speed =
        typeof cur.coords.speed === "number"
          ? Math.max(0, cur.coords.speed * 3.6)
          : undefined;
    }

    await driverLocationService.update({
      latitude,
      longitude,
      heading,
      speed,
      status: nextStatus,
      vehicleType,
      vehicle: {
        plate: vehicleInfo?.plate,
        model: vehicleInfo?.model,
        color: vehicleInfo?.color,
        year: vehicleInfo?.year,
      },
      serviceTypes: types,
    });

    await driverLocationService.setStatus({
      status: nextStatus,
      serviceTypes: types,
    });

    if (!hasIncomingRequestRef.current) {
      setRegion((prev: any) => ({
        latitude,
        longitude,
        latitudeDelta: prev?.latitudeDelta || 0.02,
        longitudeDelta: prev?.longitudeDelta || 0.02,
      }));
    }
  };

  const showIncomingRideRequest = async (payload: any, totalCount?: number) => {
    if (!payload?.rideId || !payload?.pickup || !payload?.dropoff) return;

    const alreadyShowing = incomingRequest?.rideId === payload.rideId;
    setIncomingRequest(payload);
    hasIncomingRequestRef.current = true;
    setPendingRequests((prev) => {
      if (typeof totalCount === "number") return Math.max(totalCount, 1);
      if (alreadyShowing) return Math.max(prev, 1);
      return Math.max(prev + 1, 1);
    });

    try {
      await driverAlertService.start();
    } catch (e) {
      console.log("Falha ao tocar alerta", e);
    }
  };

  const syncAvailableRequests = async () => {
    if (!isFocused) return;
    if (hasIncomingRequestRef.current) return;

    try {
      const active = await rideService.getActive();
      if (active?.active && active.ride?._id) {
        await clearIncoming();
        (navigation as any).navigate("DriverRide", { rideId: active.ride._id });
        return;
      }

      const response = await rideService.getAvailableRequests();
      const requests = response?.requests || [];
      const qCount = response?.waitingQueueCount || 0;
      setWaitingQueueCount(qCount);

      if (!requests.length) {
        setPendingRequests(0);
        return;
      }

      await showIncomingRideRequest(requests[0], response.count || requests.length);
    } catch (e) {
      console.log("Falha ao sincronizar solicitacoes disponiveis", e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      (async () => {
        try {
          const response = await rideService.getActive();
          if (!active) return;
          if (response?.active && response.ride?._id) {
            await clearIncoming();
            (navigation as any).navigate("DriverRide", {
              rideId: response.ride._id,
            });
          }
        } catch {}
      })();

      return () => {
        active = false;
      };
    }, [navigation]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      const resumed =
        prevState.match(/inactive|background/) && nextState === "active";
      if (!resumed) return;

      rideService
        .getActive()
        .then(async (response) => {
          if (response?.active && response.ride?._id) {
            setIncomingRequest(null);
            hasIncomingRequestRef.current = false;
            setRouteCoords([]);
            setPendingRequests(0);
            await driverAlertService.stop();
            (navigation as any).navigate("DriverRide", {
              rideId: response.ride._id,
            });
          }
        })
        .catch(() => {});
    });

    return () => subscription.remove();
  }, [navigation]);

  const stopSharing = async () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (pendingSyncIntervalRef.current) {
      clearInterval(pendingSyncIntervalRef.current);
      pendingSyncIntervalRef.current = null;
    }

    try {
      await driverLocationService.setStatus({
        status: "offline",
        serviceTypes: currentServiceTypes(),
      });
    } catch {}

    try {
      webSocketService.disconnect();
    } catch {}

    try {
      await driverAlertService.stop();
    } catch {}

    setOnline(false);
    driverAlertService.playOfflineSound().catch(() => {});
  };

  // Região inicial do mapa deve ser sempre a localização do usuário.
  // Faz isso uma única vez na montagem (não re-centraliza quando o usuário move o mapa).
  useEffect(() => {
    let mounted = true;

    (async () => {
      if (didSetInitialRegionRef.current) return;

      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

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
        }
      } catch {
        // silêncio: se falhar, o map ainda renderiza e o usuário pode centralizar pelo botão.
      }
    })();

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincroniza status online inicial com backend (evita UI divergente ao reabrir app)
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const me = await driverLocationService.getMe();
        if (!mounted) return;

        const isOnline =
          me?.status === "available" ||
          me?.status === "busy" ||
          me?.status === "on_ride";

        setOnline(Boolean(isOnline));
      } catch {
        // segue offline por padrão
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const startSharing = async () => {
    setError(null);

    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Permissao de localizacao negada");
      return;
    }

    try {
      await webSocketService.connect();
    } catch (e: any) {
      const message = String(e?.message || "");
      console.log("Falha ao conectar WS", e);

      if (/sessao expirada|token inv[aá]lido|token n[aã]o fornecido|jwt/i.test(message)) {
        setError("Sua sessao expirou. Faca login novamente para ficar online.");
      } else {
        setError("Nao foi possivel conectar em tempo real. Tente novamente.");
      }
      throw e;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    await publishDriverLocation("available", currentServiceTypes());

    intervalRef.current = setInterval(() => {
      publishDriverLocation("available", currentServiceTypes()).catch(() => {});
    }, 10000);

    setOnline(true);
    driverAlertService.playOnlineSound().catch(() => {});
  };

  // Badge de solicitacoes novas (new-ride-request)
  useEffect(() => {
    let mounted = true;

    if (!online || !isFocused) {
      webSocketService.off("new-ride-request");
      webSocketService.off("ride-taken");
      return () => {
        mounted = false;
      };
    }

    const onNewRideRequest = async (payload: any) => {
      if (!mounted) return;
      if (!isFocused) return;

      try {
        const active = await rideService.getActive();
        if (active?.active && active.ride?._id) {
          await clearIncoming();
          (navigation as any).navigate("DriverRide", { rideId: active.ride._id });
          return;
        }
      } catch {}

      await showIncomingRideRequest(payload);
    };

    const onRideTaken = async (payload: any) => {
      if (!mounted) return;
      const takenId = payload?.rideId;
      if (!takenId) return;

      if (incomingRequest?.rideId && incomingRequest.rideId === takenId) {
        await clearIncoming();
      }
    };

    webSocketService.on("new-ride-request", onNewRideRequest);
    webSocketService.on("ride-taken", onRideTaken);

    webSocketService.connect().catch(() => {});
    syncAvailableRequests().catch(() => {});

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRideRequest);
      webSocketService.off("ride-taken", onRideTaken);
    };
  }, [online, incomingRequest?.rideId, isFocused]);

  useEffect(() => {
    if (!online || !isFocused) {
      if (pendingSyncIntervalRef.current) {
        clearInterval(pendingSyncIntervalRef.current);
        pendingSyncIntervalRef.current = null;
      }
      return;
    }

    syncAvailableRequests().catch(() => {});
    if (pendingSyncIntervalRef.current) {
      clearInterval(pendingSyncIntervalRef.current);
    }
    pendingSyncIntervalRef.current = setInterval(() => {
      syncAvailableRequests().catch(() => {});
    }, 6000);

    return () => {
      if (pendingSyncIntervalRef.current) {
        clearInterval(pendingSyncIntervalRef.current);
        pendingSyncIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, isFocused]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (pendingSyncIntervalRef.current) {
        clearInterval(pendingSyncIntervalRef.current);
        pendingSyncIntervalRef.current = null;
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (incomingRequest) {
      setCountdown(60);
      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev === null || prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      setCountdown(null);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [incomingRequest]);

  useEffect(() => {
    if (countdown === 0) {
      rejectIncoming();
    }
  }, [countdown]);

  const toggleOnline = async () => {
    if (isTogglingOnline) return;

    const next = !online;
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
          setIsTogglingOnline(false);
          return;
        }

        await startSharing();
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
    } catch (e: any) {
      // Em caso de falha, reverte estado e mostra erro retornado (quando houver)
      setOnline(!next);
      const message = String(e?.message || "").trim();
      if (message) {
        setError(message);
      } else if (!error) {
        setError("Nao foi possivel alterar seu status agora.");
      }
    } finally {
      setIsTogglingOnline(false);
    }
  };

  const toggleService = async (key: "ride" | "delivery") => {
    // Validar se pode ativar corridas
    if (key === "ride") {
      const canDoRides = vehicleType === "car" || vehicleType === "motorcycle";
      if (!canDoRides) {
        setError(
          "Corridas de passageiros disponíveis apenas para carros e motos",
        );
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

    const nextServices = { ...services, [key]: !services[key] };
    setServices(nextServices);
    setError(null); // Limpa erro se a operação foi bem sucedida

    // se já estiver online, atualizar preferências no backend
    if (online) {
      try {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: currentServiceTypesFrom(nextServices),
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

  const refreshScheduledCount = async () => {
    try {
      const res = await rideService.getAvailableScheduledRides();
      setScheduledCount(res?.count || 0);
    } catch {}
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
    hasIncomingRequestRef.current = false;
    setRouteCoords([]);
    setPendingRequests(0);
    await driverAlertService.stop();
  };

  const refreshTodayEarnings = async () => {
    try {
      const stats = await rideService.getDriverStats();
      setTodayEarnings(Number(stats?.earnings || 0));
    } catch {
      // silencioso para nao impactar operacao
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await refreshTodayEarnings();
      await refreshScheduledCount();
    };

    run();
    const timer = setInterval(run, 60000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const acceptIncoming = async () => {
    if (!incomingRequest?.rideId) {
      await clearIncoming();
      return;
    }

    try {
      if (incomingRequest?.negotiation?.enabled) {
        await rideService.respondToOffer(incomingRequest.rideId, { action: "accept" });
        Toast.show({
          type: "success",
          text1: "Oferta aceita",
          text2: "Aguardando cliente selecionar sua proposta.",
        });
        await clearIncoming();
        return;
      }

      const ride = await rideService.accept(incomingRequest.rideId);
      await clearIncoming();
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
      console.log("Falha ao aceitar", e);
      Toast.show({
        type: "error",
        text1: "Falha ao aceitar",
        text2: e?.response?.data?.error || e?.message || "Tente novamente",
      });
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
          edgePadding: { top: 220, right: 90, bottom: 460, left: 90 },
          animated: true,
        });
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(decoded as any, {
            edgePadding: { top: 220, right: 90, bottom: 460, left: 90 },
            animated: true,
          });
        }, 350);
      }
    } catch (e) {
      console.log("Falha ao carregar rota real", e);
      setRouteCoords([]);
    }
  };

  useEffect(() => {
    const pickup = incomingRequest?.pickup;
    const dropoff = incomingRequest?.dropoff;
    hasIncomingRequestRef.current = Boolean(incomingRequest?.rideId);

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
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
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <MapMarker type="client" />
                </Marker>
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
                  tracksViewChanges={false}
                  anchor={{ x: 0.5, y: 1 }}
                >
                  <MapMarker type="dropoff" />
                </Marker>
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
                    ? "#091A2F"
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
                todayEarnings={todayEarnings}
                pendingRequests={pendingRequests || waitingQueueCount}
                scheduledCount={scheduledCount}
                onPressNotifications={handleNotifications}
                online={online}
              />

              {waitingQueueCount > 0 && pendingRequests === 0 && (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={handleNotifications}
                  style={{
                    backgroundColor: "rgba(239, 68, 68, 0.98)",
                    borderColor: "rgba(255, 255, 255, 0.22)",
                    borderWidth: 1,
                    borderRadius: 20,
                    paddingHorizontal: 16,
                    paddingVertical: 10,
                    marginTop: 10,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 5,
                  }}
                >
                  <MaterialIcons name="warning" size={16} color="white" />
                  <Text style={{ color: "white", fontSize: 13, fontWeight: "bold" }}>
                    {waitingQueueCount === 1
                      ? "1 pedido urgente na Fila de Espera!"
                      : `${waitingQueueCount} pedidos urgentes na Fila de Espera!`}
                  </Text>
                  <MaterialIcons name="chevron-right" size={18} color="white" />
                </TouchableOpacity>
              )}

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
                <Text style={{ color: "#091A2F", fontWeight: "900" }}>
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
              backgroundColor: "rgba(42,54,50,0.98)",
              borderRadius: 18,
              padding: 14,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.22)",
              zIndex: 55,
            }}
          >
            {incomingRequest?.negotiation?.enabled ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <View style={{ backgroundColor: "rgba(2,222,149,0.18)", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: "rgba(2,222,149,0.3)" }}>
                  <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "900" }}>OFERTA DE NEGOCIAÇÃO</Text>
                </View>
              </View>
            ) : null}

            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <Text style={{ color: "white", fontWeight: "900", fontSize: 18 }}>
                {incomingRequest?.negotiation?.enabled && incomingRequest?.negotiation?.clientOffer != null
                  ? `R$ ${Number(incomingRequest.negotiation.clientOffer).toFixed(2)}`
                  : incomingRequest?.pricing?.total != null
                  ? `R$ ${Number(incomingRequest.pricing.total).toFixed(2)}`
                  : "Nova solicitação"}
              </Text>
              {countdown !== null ? (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(253,216,53,0.15)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: "rgba(253,216,53,0.3)" }}>
                  <MaterialIcons name="timer" size={14} color="#fdd835" />
                  <Text style={{ color: "#fdd835", fontSize: 12, fontWeight: "900" }}>{countdown}s</Text>
                </View>
              ) : null}
            </View>

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
                <Text style={{ color: "#091A2F", fontWeight: "900" }}>
                  {incomingRequest?.negotiation?.enabled ? "Aceitar Oferta" : "Aceitar"}
                </Text>
              </TouchableOpacity>
            </View>

            {incomingRequest?.negotiation?.enabled ? (
              <TouchableOpacity
                onPress={async () => {
                  await clearIncoming();
                  (navigation as any).navigate("DriverRequests");
                }}
                activeOpacity={0.85}
                style={{
                  marginTop: 10,
                  paddingVertical: 12,
                  borderRadius: 14,
                  borderWidth: 1,
                  borderColor: "rgba(2,222,149,0.35)",
                  alignItems: "center",
                  backgroundColor: "rgba(2,222,149,0.08)",
                }}
              >
                <Text style={{ color: "#02de95", fontWeight: "900" }}>
                  Fazer contraoferta / Ver negociação
                </Text>
              </TouchableOpacity>
            ) : null}
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
          // Controla a altura do sheet. Exemplos:
          // ["25%"] → altura fixa em 25%
          // ["20%", "40%"] → mínima 20%, máxima 40% (pode arrastar)
          snapPoints={["26%"]}
        />
      </View>
    </SafeAreaView>
  );
}
