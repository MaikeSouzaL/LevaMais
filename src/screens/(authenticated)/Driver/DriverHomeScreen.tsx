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
import { LocationLoadingScreen } from "../../../components/ui/LocationLoadingScreen";
import MapMarker from "../../../components/MapMarker";
import Toast from "react-native-toast-message";

// 🌌 High-End Components & Modules Upgrade
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { MapPin, Menu, Target, Layers, ShieldAlert, Info } from "lucide-react-native";
import { DriverStatusHeader } from "@/components/driver/home/DriverStatusHeader";
import { IncomingRideCard } from "@/components/driver/home/IncomingRideCard";
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import { PremiumDottedRoute } from "@/components/routes/PremiumDottedRoute";
import { VehicleMarker } from "@/components/maps/VehicleMarker";


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
  const [driverCoords, setDriverCoords] = useState<{latitude: number, longitude: number, heading?: number} | null>(null);
  const watchRef = useRef<any>(null);
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

  // 🛰️ Real-Time High-Definition Tracking for User Puck Marker
  useEffect(() => {
    let mounted = true;
    
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        // Immediate initial snapshot
        let currentLoc = await Location.getLastKnownPositionAsync();
        
        // Fallback to fresh capture if last known isn't cached yet
        if (!currentLoc?.coords) {
          currentLoc = await Location.getCurrentPositionAsync({ 
             accuracy: Location.Accuracy.Balanced 
          });
        }

        if (mounted && currentLoc?.coords) {
           setDriverCoords({
             latitude: currentLoc.coords.latitude,
             longitude: currentLoc.coords.longitude,
             heading: currentLoc.coords.heading ?? 0
           });
        }

        // Set up permanent efficient stream
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000, // Update visually every 3s
            distanceInterval: 5, // or 5 meters
          },
          (pos) => {
            if (mounted && pos?.coords) {
              setDriverCoords({
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                heading: pos.coords.heading ?? undefined,
              });
            }
          }
        );
      } catch (e) {
        console.log("Failed to watch user tracker", e);
      }
    })();

    return () => {
      mounted = false;
      if (watchRef.current && typeof watchRef.current.remove === "function") {
        watchRef.current.remove();
      }
    };
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
          edgePadding: { top: 100, right: 80, bottom: 580, left: 80 },
          animated: true,
        });
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(decoded as any, {
            edgePadding: { top: 100, right: 80, bottom: 580, left: 80 },
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
    <GestureHandlerRootView className="flex-1 bg-[#091A2F]">
      <StatusBar style="light" />

      <View className="flex-1 relative">
        {!region ? (
          <LocationLoadingScreen />
        ) : (
          <GlobalMap
            initialRegion={region as any}
            region={region ?? undefined}
            showsUserLocation={false}
            useDarkStyle={useDarkMap}
            onMapRef={(ref) => {
              mapRef.current = ref;
            }}
            onRegionChangeComplete={(r) => setRegion(r as any)}
          >
            {/* 🚗 The Premium Custom High-Def Driver Tracker Puck */}
            {!!driverCoords && (
              <Marker
                coordinate={{
                  latitude: driverCoords.latitude,
                  longitude: driverCoords.longitude,
                }}
                flat={true}
                anchor={{ x: 0.5, y: 0.5 }}
                tracksViewChanges={true}
                style={{ width: 48, height: 48 }}
              >
                 <VehicleMarker 
                   type={vehicleType as any} 
                   isOnline={online} 
                 />
              </Marker>
            )}
            {!!incomingRequest?.pickup?.latitude &&
              !!incomingRequest?.pickup?.longitude && (
                <Marker
                  coordinate={{
                    latitude: incomingRequest.pickup.latitude,
                    longitude: incomingRequest.pickup.longitude,
                  }}
                  tracksViewChanges={true}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <PremiumMapMarker type="origin" />
                </Marker>
              )}

            {!!incomingRequest?.dropoff?.latitude &&
              !!incomingRequest?.dropoff?.longitude && (
                <Marker
                  coordinate={{
                    latitude: incomingRequest.dropoff.latitude,
                    longitude: incomingRequest.dropoff.longitude,
                  }}
                  tracksViewChanges={true}
                  anchor={{ x: 0.5, y: 0.5 }}
                >
                  <PremiumMapMarker type="destination" />
                </Marker>
              )}

            {!!incomingRequest?.pickup?.latitude &&
              !!incomingRequest?.dropoff?.latitude && 
              routeCoords.length >= 2 && (
                <PremiumDottedRoute coordinates={routeCoords as any} />
              )}
          </GlobalMap>
        )}

        {/* 🌌 Dynamic UI Overlay Layer */}
        {!!region && (
          <>
            {/* 🎛️ TOP FLOATING DASHBOARD HUD */}
            <View className="absolute top-12 left-4 right-4 z-50 flex-row items-center gap-3">
               
               {/* Menu Toggle */}
               <TouchableOpacity
                 onPress={() => (navigation as any).openDrawer?.()}
                 className="h-[58px] w-[58px] bg-[#091A2F]/90 rounded-2xl border border-white/10 items-center justify-center"
               >
                  <Menu size={24} color="#FFF" />
               </TouchableOpacity>

               {/* Driver Status & Stats Hook */}
               <View className="flex-1">
                 <DriverStatusHeader 
                   todayEarnings={todayEarnings}
                   pendingRequests={pendingRequests}
                   scheduledCount={scheduledCount}
                   onPressNotifications={handleNotifications}
                   online={online}
                 />
               </View>
            </View>

            {/* 📡 OPERATIONAL RIGHT WING CONTROLS */}
            <View className="absolute right-4 top-[30%] z-40 flex-col gap-3">
               {/* SOS Panic */}
               <TouchableOpacity 
                 onPress={handleSOS}
                 className="w-12 h-12 bg-red-500/10 border border-red-500/30 rounded-xl items-center justify-center shadow-2xl"
               >
                 <ShieldAlert size={22} color="#EF4444" />
               </TouchableOpacity>

               {/* Center Map */}
               <TouchableOpacity 
                 onPress={handleCenterMyLocation}
                 disabled={isCentering}
                 className="w-12 h-12 bg-[#091A2F]/80 border border-white/10 rounded-xl items-center justify-center shadow-2xl"
               >
                 <Target size={22} color={isCentering ? "#02de9550" : "#02de95"} />
               </TouchableOpacity>

               {/* Map Style Layers */}
               <TouchableOpacity 
                 onPress={handleToggleMapStyle}
                 className={`w-12 h-12 border rounded-xl items-center justify-center shadow-2xl ${
                    isSwitchingMapStyle ? 'bg-[#02de95] border-[#02de95]' : 'bg-[#091A2F]/80 border-white/10'
                 }`}
               >
                 <Layers size={22} color={isSwitchingMapStyle ? "#091A2F" : "#FFF"} />
               </TouchableOpacity>
            </View>

            {/* ⚠️ URGENT QUEUE BANNER (Inline Persistent Alert) */}
            {waitingQueueCount > 0 && pendingRequests === 0 && (
               <MotiView
                 from={{ opacity: 0, translateY: -20 }}
                 animate={{ opacity: 1, translateY: 0 }}
                 className="absolute top-[120px] left-4 right-4 z-30 bg-amber-500 rounded-2xl p-4 flex-row items-center justify-between shadow-xl"
               >
                 <View className="flex-row items-center flex-1">
                    <Info size={20} color="#091A2F" className="mr-3" />
                    <Text className="text-[#091A2F] font-bold text-sm flex-1">
                       Existem {waitingQueueCount} pedido(s) na Fila de Espera!
                    </Text>
                 </View>
                 <TouchableOpacity onPress={handleNotifications} className="bg-[#091A2F] px-3 py-2 rounded-xl">
                    <Text className="text-white font-black text-xs">ABRIR</Text>
                 </TouchableOpacity>
               </MotiView>
            )}

            {/* 🚫 ERROR ALERTS */}
            {!!error && (
               <MotiView
                 from={{ opacity: 0, scale: 0.9 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="absolute top-[120px] left-4 right-4 z-40 bg-[#091A2F] border-2 border-amber-500/50 rounded-2xl p-4 flex-row items-center shadow-2xl"
               >
                  <ShieldAlert size={20} color="#FBBF24" className="mr-3" />
                  <Text className="text-white font-bold text-xs flex-1">{error}</Text>
               </MotiView>
            )}

            {/* 🔔 NEW REQUEST Ticker (Subtle reminder if visible) */}
            {pendingRequests > 0 && !incomingRequest?.rideId && (
               <TouchableOpacity 
                 onPress={handleNotifications}
                 className="absolute bottom-[40%] left-8 right-8 z-40 bg-[#02de95] rounded-full py-3 items-center shadow-2xl flex-row justify-center"
               >
                  <Text className="text-[#091A2F] font-black tracking-widest">VER SOLICITAÇÕES ATIVAS ({pendingRequests})</Text>
               </TouchableOpacity>
            )}

          </>
        )}

        {/* 🎁 MASTER DISPATCH INTERCEPTION NODE */}
        <IncomingRideCard 
          isVisible={!!incomingRequest?.rideId}
          request={incomingRequest}
          countdown={countdown}
          onAccept={acceptIncoming}
          onReject={rejectIncoming}
          onNegotiate={async () => {
             // 🛸 Transfer operational theatre to complete Details Screen!
             const targetId = incomingRequest.rideId || incomingRequest._id;
             const currentOffer = incomingRequest;
             await clearIncoming(); 
             (navigation as any).navigate("DeliveryOfferScreen", { 
                offerId: targetId, 
                initialOffer: currentOffer 
             });
          }}
        />

        {/* 📊 INTELLIGENT OPERATIONAL BASE CAMP (Hidden during active dispatch to prevent visual collision) */}
        {!incomingRequest?.rideId && (
          <DriverBottomSheet
            online={online}
            services={services}
            isTogglingOnline={isTogglingOnline}
            onToggleOnline={toggleOnline}
            onToggleService={toggleService}
            vehicleType={vehicleType}
            snapPoints={["34%", "60%"]}
          />
        )}

      </View>
    </GestureHandlerRootView>
  );
}
