import React, { useEffect, useRef, useState } from "react";
import { AppState, View, Text, TouchableOpacity, useColorScheme, Alert, StyleSheet } from "react-native";
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
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { BalanceWidget } from "@/components/BalanceWidget";
import { DriverDepositModal } from "@/components/DriverDepositModal";
import { QueueTagYellowFloating } from "@/components/QueueTagYellow";
import { MapActionButtons } from "@/components/MapActionButtons";
import { useAuthStore } from "../../../context/authStore";
import driverLocationService, {
  DriverStatus,
  DriverVehicleType,
} from "../../../services/driverLocation.service";
import webSocketService from "../../../services/websocket.service";
import driverAlertService from "../../../services/driverAlert.service";
import rideService from "../../../services/ride.service";
import walletService from "../../../services/wallet.service";
import driverService from "../../../services/driver.service";
import userService from "../../../services/user.service";
import { DriverBottomSheet } from "./components/DriverBottomSheet";
import DriverOnboardingDashboard from "@/components/driver/home/DriverOnboardingDashboard";
import { getCurrentLocationAndAddress } from "../../../utils/location";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline } from "react-native-maps";
import { decodePolyline, LatLng } from "../../../utils/polyline";
import { LocationLoadingScreen } from "../../../components/ui/LocationLoadingScreen";
import MapMarker from "../../../components/MapMarker";
import Toast from "react-native-toast-message";
import { Modal } from "../../../components/Modal";

// 🌌 High-End Components & Modules Upgrade
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { MotiView } from "moti";
import { MapPin, Menu, Target, Layers, ShieldAlert, Info , AlertTriangle, X } from "lucide-react-native";
import { NewIncomingOfferSheet } from "@/components/driver/home/NewIncomingOfferSheet";
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import { PremiumDottedRoute } from "@/components/routes/PremiumDottedRoute";
import { VehicleMarker } from "@/components/maps/VehicleMarker";


// 🔋 ConfiguraÃ§Ãµes de Sinal GPS baseadas na Escolha de ConservaÃ§Ã£o de Bateria
const GPS_PRESETS = {
  high: { 
    accuracy: Location.Accuracy.High, 
    timeInterval: 3000, 
    distanceInterval: 5, 
    pollMs: 5000 
  },
  balanced: { 
    accuracy: Location.Accuracy.Balanced, 
    timeInterval: 10000, 
    distanceInterval: 15, 
    pollMs: 15000 
  },
  low: { 
    accuracy: Location.Accuracy.Low, 
    timeInterval: 30000, 
    distanceInterval: 50, 
    pollMs: 45000 
  }
} as const;

export default function DriverHomeScreen() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const colorScheme = useColorScheme();
  const userData = useAuthStore((s) => s.userData);
  const isApproved = userData?.driverStatus === "approved";

  const [online, setOnline] = useState(false);
  const [services, setServices] = useState<{ ride: boolean; delivery: boolean }>(() => {
    const serviceTypes = userData?.driverPreferences?.serviceTypes;
    if (Array.isArray(serviceTypes)) {
      return {
        ride: serviceTypes.includes("ride"),
        delivery: serviceTypes.includes("delivery"),
      };
    }
    const canDoRides = userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle";
    return {
      ride: canDoRides,
      delivery: true,
    };
  });

  // Keep services preference state synchronized with latest profile / userData updates
  useEffect(() => {
    if (userData?.driverPreferences?.serviceTypes) {
      const serviceTypes = userData.driverPreferences.serviceTypes;
      setServices({
        ride: serviceTypes.includes("ride"),
        delivery: serviceTypes.includes("delivery"),
      });
    } else {
      const canDoRides = userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle";
      setServices({
        ride: canDoRides,
        delivery: true,
      });
    }
  }, [userData?.driverPreferences?.serviceTypes, userData?.vehicleType]);

  const servicesRef = useRef(services);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [isCentering, setIsCentering] = useState(false);
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [showMapStyleHint, setShowMapStyleHint] = useState(false);
  const [isTogglingOnline, setIsTogglingOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState(0);
  const [waitingQueueCount, setWaitingQueueCount] = useState(0);
  const [pendingNegotiationsCount, setPendingNegotiationsCount] = useState(0);
  const [clientCounteredCount, setClientCounteredCount] = useState(0);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [incomingRequest, setIncomingRequest] = useState<any>(null);
  const [isIncomingRequestDismissed, setIsIncomingRequestDismissed] = useState(false);
  const [showPendingBanner, setShowPendingBanner] = useState(false);
  const [offersPulseToken, setOffersPulseToken] = useState(0);
  const [showPendingOfferHighlight, setShowPendingOfferHighlight] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalReason, setCancelModalReason] = useState<string | null>(null);
  const [showNoBalanceModal, setShowNoBalanceModal] = useState(false);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [driverCoords, setDriverCoords] = useState<{latitude: number, longitude: number, heading?: number} | null>(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [driverBalance, setDriverBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [driverStats, setDriverStats] = useState<any>(null);
  const [onlineSessionStart, setOnlineSessionStart] = useState<string | null>(null);
  const [gpsQuality, setGpsQuality] = useState<"low" | "balanced" | "high">("high");
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);
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
  const hasActiveIncomingRequest = !!incomingRequest?.rideId && !isIncomingRequestDismissed;

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
    if (servicesRef.current.ride) list.push("ride");
    if (servicesRef.current.delivery) list.push("delivery");
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
    onlineSessionStart?: string,
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
      onlineSessionStart,
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

    // NÃO mostrar chamadas da fila de espera no bottom sheet
    // Elas devem aparecer apenas na aba "Fila" do DriverRequestsScreen
    if (payload?.isWaitingInQueue === true) {
      return;
    }

    const alreadyShowing = incomingRequest?.rideId === payload.rideId;
    setIncomingRequest(payload);
    setIsIncomingRequestDismissed(false);
    hasIncomingRequestRef.current = true;
    setPendingRequests((prev) => {
      if (typeof totalCount === "number") return Math.max(totalCount, 1);
      if (alreadyShowing) return Math.max(prev, 1);
      return Math.max(prev + 1, 1);
    });

    try {
      await driverAlertService.start();
    } catch (e) {
      console.error("Error starting driver alert:", e);
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
      setPendingNegotiationsCount(response?.pendingNegotiationsCount || 0);
      setClientCounteredCount(response?.clientCounteredCount || 0);

      if (!requests.length) {
        setPendingRequests(0);
        return;
      }

      // Filtrar apenas chamadas que NÃO são da fila de espera
      // Fila será mostrada apenas na aba "Fila" do DriverRequestsScreen
      const currentDriverId = useAuthStore.getState().userData?.id;
      // Filtrar apenas chamadas que NÃO são da fila de espera E que o motorista NÃO está negociando
      const realtimeRequests = requests.filter((r: any) => {
        if (r.isWaitingInQueue === true) return false;

        // 🚀 Bloqueio Duplo: Evitar que chamadas que eu já contrapropus façam o bottom sheet piscar/reaparecer
        const alreadyProposed = Array.isArray(r.negotiation?.offers) && r.negotiation.offers.some((o: any) => {
          const oId = typeof o.driverId === "string" ? o.driverId : o.driverId?._id;
          return oId && currentDriverId && String(oId) === String(currentDriverId);
        });
        return !alreadyProposed;
      });
      
      if (realtimeRequests.length > 0) {
        await showIncomingRideRequest(realtimeRequests[0], response.count || requests.length);
      } else {
        setPendingRequests(0);
        // Se não há chamadas imediatas mas há negociações pendentes,
        // redireciona para DriverRequests na aba de negociação
        const negotiations = response?.pendingNegotiationsCount || 0;
        const countered = response?.clientCounteredCount || 0;
        if ((negotiations > 0 || countered > 0) && !hasIncomingRequestRef.current) {
          (navigation as any).navigate("DriverRequests", { initialTab: "negotiation" });
          return;
        }
      }
    } catch (e) {
      console.error("Error syncing available requests:", e);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let active = true;

      const loadProfile = async () => {
        try {
          const profile = await userService.getProfile();
          if (!active) return;
          if (profile) {
            useAuthStore.getState().updateUserData(profile);
          }
        } catch (e) {
          console.error("Failed to sync profile on home screen focus:", e);
        }
      };

      loadProfile();

      (async () => {
        try {
          const response = await rideService.getActive();
          if (!active) return;
          if (response?.active && response.ride?._id) {
            await clearIncoming();
            (navigation as any).navigate("DriverRide", {
              rideId: response.ride._id,
            });
            return;
          }

          // Se não tem corrida ativa, verifica negociações pendentes
          const negotiations = await rideService.getPendingNegotiations();
          if (active && negotiations?.count > 0 && negotiations.requests.length > 0) {
            (navigation as any).navigate("DriverRequests", { initialTab: "negotiation" });
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
            return;
          }

          // Se não tem corrida ativa, verifica negociações pendentes
          const negotiations = await rideService.getPendingNegotiations();
          if (negotiations?.count > 0 && negotiations.requests.length > 0) {
            (navigation as any).navigate("DriverRequests", { initialTab: "negotiation" });
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

  // 🎈 PREMIUM USER GUIDE TOUR SYSTEM
  const tourSteps = [
    {
      title: "Menu Principal 🍔",
      desc: "Aqui você gerencia seu perfil, preferências, consulta o suporte e altera configurações da sua conta.",
      targetStyle: {
        top: 48,
        left: 16,
        width: 58,
        height: 58,
        borderRadius: 16,
      },
      balloonStyle: {
        top: 120,
        left: 16,
        right: 16,
      },
      arrowStyle: {
        top: -8,
        left: 36,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderStyle: "solid" as const,
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#0B1E36",
        position: "absolute" as const,
      }
    },
    {
      title: "Seu Faturamento & Alertas 📊",
      desc: "Veja seus ganhos diários atualizados em tempo real e verifique notificações e chamadas pendentes.",
      targetStyle: {
        top: 48,
        left: 86,
        right: 16,
        height: 58,
        borderRadius: 16,
      },
      balloonStyle: {
        top: 120,
        left: 16,
        right: 16,
      },
      arrowStyle: {
        top: -8,
        right: 48,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderStyle: "solid" as const,
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#0B1E36",
        position: "absolute" as const,
      }
    },
    {
      title: "Botão SOS de Pânico 🚨",
      desc: "Sua segurança é nossa prioridade absoluta. Em qualquer situação de perigo, clique aqui para acionar a central Leva+ imediatamente.",
      targetStyle: {
        top: 150,
        right: 16,
        width: 48,
        height: 48,
        borderRadius: 12,
      },
      balloonStyle: {
        top: 215,
        left: 16,
        right: 16,
      },
      arrowStyle: {
        top: -8,
        right: 32,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderBottomWidth: 8,
        borderStyle: "solid" as const,
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderBottomColor: "#0B1E36",
        position: "absolute" as const,
      }
    },
    {
      title: "Ficar Online & Começar 🚀",
      desc: "Arraste ou clique no botão do painel inferior para ficar online! Quando estiver ativo, o aplicativo começará a buscar corridas e entregas na sua área.",
      targetStyle: {
        bottom: 85,
        left: 16,
        right: 16,
        height: 64,
        borderRadius: 24,
      },
      balloonStyle: {
        bottom: 185,
        left: 16,
        right: 16,
      },
      arrowStyle: {
        bottom: -8,
        left: "50%",
        marginLeft: -8,
        width: 0,
        height: 0,
        borderLeftWidth: 8,
        borderRightWidth: 8,
        borderTopWidth: 8,
        borderStyle: "solid" as const,
        backgroundColor: "transparent",
        borderLeftColor: "transparent",
        borderRightColor: "transparent",
        borderTopColor: "#0B1E36",
        position: "absolute" as const,
      }
    }
  ];

  useEffect(() => {
    const checkTour = async () => {
      if (isApproved) {
        const seen = await AsyncStorage.getItem("@leva_mais:driver_tour_seen");
        if (!seen) {
          setTimeout(() => {
            setShowTour(true);
          }, 1200);
        }
      }
    };
    checkTour();
  }, [isApproved]);

  const handleNextTourStep = async () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      await AsyncStorage.setItem("@leva_mais:driver_tour_seen", "true");
    }
  };

  const handleSkipTour = async () => {
    setShowTour(false);
    await AsyncStorage.setItem("@leva_mais:driver_tour_seen", "true");
  };

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

        // Fetch current persisted GPS configuration choice from backend
        let currentQuality: "low" | "balanced" | "high" = "high";
        try {
          const u = await userService.getProfile();
          if (u?.gpsQuality) {
            currentQuality = u.gpsQuality;
            if (mounted) setGpsQuality(currentQuality);
          }
        } catch {}

        const activePreset = GPS_PRESETS[currentQuality] || GPS_PRESETS.high;

        // Set up permanent efficient stream with dynamic user-based battery options
        watchRef.current = await Location.watchPositionAsync(
          {
            accuracy: activePreset.accuracy,
            timeInterval: activePreset.timeInterval,
            distanceInterval: activePreset.distanceInterval,
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
              }
    })();

    return () => {
      mounted = false;
      if (watchRef.current && typeof watchRef.current.remove === "function") {
        watchRef.current.remove();
      }
    };
  }, []);

  // 🌍 AUTO CITY DETECTION & UPDATE (Ensures driver profile has a registered city)
  useEffect(() => {
    if (!userData || userData.city) return;

    (async () => {
      try {
        const result = await getCurrentLocationAndAddress();
        if (result?.address?.city) {
          await userService.updateProfile({ city: result.address.city });
          // Note: profile sync happens via authStore listeners or manual refresh if needed
        }
      } catch (err) {
        console.error("Failed to auto-detect city:", err);
      }
    })();
  }, [userData]);

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

    const sessionStart = new Date().toISOString();
    setOnlineSessionStart(sessionStart);

    await publishDriverLocation("available", currentServiceTypes(), sessionStart);

    const preset = GPS_PRESETS[gpsQuality] || GPS_PRESETS.high;

    intervalRef.current = setInterval(() => {
      publishDriverLocation("available", currentServiceTypes(), sessionStart).catch(() => {});
    }, preset.pollMs);

    setOnline(true);
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

    const onRideCancelled = async (payload: any) => {
      if (!mounted) return;
      const cancelledId = payload?.rideId;
      if (!cancelledId) return;

      if (incomingRequest?.rideId && incomingRequest.rideId === cancelledId) {
        await clearIncoming();
        setCancelModalReason(payload?.reason || null);
        setShowCancelModal(true);
      }
    };

    const onOnlineTimeUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.totalSecondsToday != null) {
        setDriverStats((prev: any) => {
          if (!prev) return { onlineTime: payload.totalSecondsToday };
          return { ...prev, onlineTime: payload.totalSecondsToday };
        });
      }
    };

    const onClientCounterProposal = () => {
      if (mounted && isFocused) {
        driverAlertService.playCounterProposalSound().catch(() => {});
        syncAvailableRequests().catch(() => {});
        (navigation as any).navigate("DriverRequests", { initialTab: "negotiation" });
      }
    };

    const onRideStatusChanged = async (payload: any) => {
      if (!mounted) return;
      const payloadRideId = String(payload?.rideId || payload?._id || payload?.ride?._id || payload?.ride || "");
      const currentRideId = String(incomingRequest?.rideId || "");
      if (!payloadRideId || !currentRideId || payloadRideId !== currentRideId) return;
      const status = String(payload?.status || payload?.ride?.status || "").toLowerCase();
      const terminalStatuses = [
        "accepted",
        "in_progress",
        "arrived",
        "completed",
        "cancelled",
        "canceled",
        "cancelled_by_client",
        "cancelled_by_driver",
        "cancelled_no_driver",
        "rejected",
        "expired",
        "no_drivers_available",
      ];
      if (terminalStatuses.includes(status)) {
        await clearIncoming();
        return;
      }
      setIncomingRequest((prev: any) => (prev ? { ...prev, status } : prev));
    };

    // NEW: Handle client selecting this driver's offer (awaiting payment)
    const onClientSelectedOffer = async (payload: any) => {
      if (!mounted) return;
      const rideId = payload?.rideId || payload?.ride?._id;
      if (!rideId) return;
      if (incomingRequest && incomingRequest.rideId === rideId) {
        setIncomingRequest((prev: any) => ({ ...prev, paymentPending: true, status: "payment_pending" }));
      }
      await driverAlertService.stop().catch(() => {});
      Toast.show({ type: "success", text1: "Oferta Selecionada!", text2: "Cliente aceitou sua proposta e esta confirmando o pagamento." });
      if (isFocused) { (navigation as any).navigate("DriverRequests", { initialTab: "negotiation" }); }
    };

    // NEW: Handle payment expiration (client didn't confirm)
    const onDeliverySelectionExpired = async (payload: any) => {
      if (!mounted) return;
      const reason = payload?.reason || "tempo_pagamento_expirado";
      await clearIncoming();
      await driverAlertService.stop().catch(() => {});
      Toast.show({ type: "error", text1: "Tempo de Pagamento Expirado", text2: "Cliente nao confirmou o pagamento a tempo. Voce foi liberado." });
      syncAvailableRequests().catch(() => {});
    };

    webSocketService.on("new-ride-request", onNewRideRequest);
    webSocketService.on("ride-taken", onRideTaken);
    webSocketService.on("ride-cancelled", onRideCancelled);
    webSocketService.on("waiting-queue-updated", syncAvailableRequests);
    webSocketService.on("online_time_updated", onOnlineTimeUpdated);
    webSocketService.on("client-counter-proposal", onClientCounterProposal);
    webSocketService.on("client-selected-offer-awaiting-payment", onClientSelectedOffer);
    webSocketService.on("delivery-selection-expired", onDeliverySelectionExpired);
    webSocketService.on("ride-status-updated", onRideStatusChanged);
    webSocketService.on("ride-status-changed", onRideStatusChanged);

    webSocketService.connect().catch(() => {});
    syncAvailableRequests().catch(() => {});

    return () => {
      mounted = false;
      webSocketService.off("new-ride-request", onNewRideRequest);
      webSocketService.off("ride-taken", onRideTaken);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("waiting-queue-updated", syncAvailableRequests);
      webSocketService.off("online_time_updated", onOnlineTimeUpdated);
      webSocketService.off("client-counter-proposal", onClientCounterProposal);
      webSocketService.off("client-selected-offer-awaiting-payment", onClientSelectedOffer);
      webSocketService.off("delivery-selection-expired", onDeliverySelectionExpired);
      webSocketService.off("ride-status-updated", onRideStatusChanged);
      webSocketService.off("ride-status-changed", onRideStatusChanged);
    };
  }, [online, incomingRequest?.rideId, isFocused]);

  // 🕒 CronÃ´metro de Atividade Fluido (PrediÃ§Ã£o Local Suave)
  useEffect(() => {
    if (!online || !isFocused) return;

    const timer = setInterval(() => {
      setDriverStats((prev: any) => {
        if (!prev || prev.onlineTime == null) return prev;
        return {
          ...prev,
          onlineTime: Number(prev.onlineTime) + 1,
        };
      });
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [online, isFocused]);

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

    // Play premium pluck sound immediately on tap for instant sensory feedback
    if (next) {
      driverAlertService.playOnlineSound().catch(() => {});
    } else {
      driverAlertService.playOfflineSound().catch(() => {});
    }

    try {
      if (!next) {
        // indo para offline
        await stopSharing();
        await refreshTodayEarnings();
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

        // ✅ Verificar permissao para ficar online (driverStatus, docs, veiculo, saldo)
        // 1. Verificar saldo positivo client-side imediatamente para evitar requests desnecessários
        if (driverBalance !== null && driverBalance <= 0) {
          setIsTogglingOnline(false);
          setError("⚠️ Saldo Insuficiente. Você precisa de saldo positivo para ficar online e aceitar corridas.");
          return;
        }

        try {
          const goOnlineResult = await driverService.goOnline();
          if (!goOnlineResult?.success) {
            setIsTogglingOnline(false);
            setError(goOnlineResult?.error || "Voce nao esta liberado para ficar online.");
            return;
          }
        } catch (e: any) {
          setIsTogglingOnline(false);
          const msg = e?.response?.data?.error || e?.message || "Nao foi possivel validar sua conta para ficar online.";
          setError(msg);
          return;
        }

        await startSharing();
        await refreshTodayEarnings();
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

    // Sincronizar persistentemente as preferências no perfil do motorista no backend e atualizar o cache local
    try {
      const selectedServices = currentServiceTypesFrom(nextServices);
      const defaultVehicle = (userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle" || userData?.vehicleType === "van" || userData?.vehicleType === "truck")
        ? userData.vehicleType
        : "motorcycle";
      const selectedVehicles: Array<"motorcycle" | "car" | "van" | "truck"> = 
        (userData?.driverPreferences?.selectedVehicles as any) || [defaultVehicle];

      const updatedPrefs = {
        serviceTypes: selectedServices,
        selectedVehicles,
        searchRadiusKm: userData?.driverPreferences?.searchRadiusKm || 8,
        autoAccept: userData?.driverPreferences?.autoAccept || false,
      };

      await userService.updateProfile({
        driverPreferences: updatedPrefs,
      });

      useAuthStore.getState().updateUserData({
        driverPreferences: updatedPrefs,
      });
    } catch (profileErr) {
      console.error("Erro ao salvar preferências no perfil persistentemente:", profileErr);
    }

    // se já estiver online, atualizar preferências no backend
    if (online) {
      try {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: currentServiceTypesFrom(nextServices),
        });
        // ⚡ Sincronizar chamadas disponíveis imediatamente para capturar pedidos compatíveis da fila!
        await syncAvailableRequests();
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
          }
  };

  const dismissIncomingSheet = async () => {
    setIsIncomingRequestDismissed(true);
    setShowPendingBanner(true);
    setShowPendingOfferHighlight(false);
    await driverAlertService.stop();
  };

  const clearIncoming = async () => {
    setIncomingRequest(null);
    setIsIncomingRequestDismissed(false);
    setShowPendingBanner(false);
    setShowPendingOfferHighlight(false);
    hasIncomingRequestRef.current = false;
    setRouteCoords([]);
    setPendingRequests(0);
    await driverAlertService.stop();
  };

  const loadBalance = React.useCallback(async () => {
    try {
      setBalanceLoading(true);
      const balance = await driverService.getBalance();
      setDriverBalance(balance.balance);
    } catch (error) {
      setDriverBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const checkAndAutoActivateVehicle = async () => {
    try {
      const res = await driverService.listVehicles();
      const vehicles = res?.vehicles || [];
      const activeVehicleId = res?.activeVehicleId;

      if (!activeVehicleId && vehicles.length > 0) {
        const approvedVehicles = vehicles.filter((v: any) => v.status === "approved");
        if (approvedVehicles.length > 0) {
          const targetVehicle = approvedVehicles[0];
          await driverService.activateVehicle(targetVehicle._id);

          const updatedProfile = await userService.getProfile().catch(() => null);
          if (updatedProfile) {
            useAuthStore.getState().updateUserData({
              vehicleType: updatedProfile.vehicleType || targetVehicle.type,
              vehicleInfo: updatedProfile.vehicleInfo || {
                plate: targetVehicle.plate,
                model: targetVehicle.model,
                color: targetVehicle.color,
                year: targetVehicle.year,
              }
            });
          }

          Toast.show({
            type: "success",
            text1: "Veículo Ativado Automaticamente! 🚗",
            text2: `${targetVehicle.model} (${targetVehicle.plate}) foi selecionado como seu veículo ativo.`,
          });
        }
      }
    } catch (err) {
      console.warn("Failed to auto-activate vehicle:", err);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadBalance();
      if (isApproved) {
        checkAndAutoActivateVehicle();
      }
    }
  }, [isFocused, isApproved, loadBalance]);



  const refreshTodayEarnings = async () => {
    try {
      const stats = await rideService.getDriverStats();
      setTodayEarnings(Number(stats?.earnings || 0));
      setDriverStats(stats);
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
    const timer = setInterval(run, 60000); // ⏱️ EstatÃ­sticas fixas a cada 60s (Tempo real tratado por Sockets)

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [online]);

  const acceptIncoming = async () => {
    if (!incomingRequest?.rideId) {
      await clearIncoming();
      return;
    }

    try {
      // Check driver balance before accepting
      const balance = await walletService.getBalance();
      if (balance.available <= 0) {
        await clearIncoming();
        setShowNoBalanceModal(true);
        return;
      }

      if (incomingRequest?.negotiation?.enabled) {
        await rideService.respondToOffer(incomingRequest.rideId, { action: "accept" });
        Toast.show({
          type: "success",
          text1: "Oferta aceita",
          text2: "Aguardando cliente selecionar sua proposta.",
        });
        // We do NOT call clearIncoming() here. The IncomingRideCard will display the 'Aguardando Resposta' state.
        return;
      }

      const ride = await rideService.accept(incomingRequest.rideId);
      await clearIncoming();
      (navigation as any).navigate("DriverRide", { rideId: ride._id });
    } catch (e: any) {
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
    }
  };

  const counterOfferIncoming = async (amount: number, message: string) => {
    if (!incomingRequest?.rideId) {
      await clearIncoming();
      return;
    }

    try {
      await rideService.respondToOffer(incomingRequest.rideId, {
        action: "counter",
        amount,
        message: message || "Negociação justa",
      });
      await driverAlertService.stop().catch(() => {});

      Toast.show({
        type: "success",
        text1: "Proposta Enviada! 🚀",
        text2: `Sua oferta de R$ ${amount.toFixed(2).replace(".", ",")} foi enviada ao cliente.`,
      });
      // We do NOT call clearIncoming() here. The IncomingRideCard will display the 'Aguardando Resposta' state.
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao Propor",
        text2: err?.response?.data?.error || err?.message || "Tente novamente",
      });
      throw err; // Bubbles up to reset card loading state
    }
  };

  const loadRealRoute = async (pickup: LatLng, dropoff: LatLng) => {
    try {
      const key = getGoogleMapsApiKey();
      if (!key) {
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
            setRouteCoords([]);
    }
  };

  useEffect(() => {
    const pickup = incomingRequest?.pickup;
    const dropoff = incomingRequest?.dropoff;
    hasIncomingRequestRef.current = Boolean(incomingRequest?.rideId);

    if (
      !isIncomingRequestDismissed &&
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
  }, [incomingRequest?.rideId, isIncomingRequestDismissed]);



  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
          <StatusBar style="light" />

          {region && (
            <>
              <GlobalMap
                ref={mapRef}
                region={region}
                onRegionChangeComplete={(r) => {
                  if (!isCentering) setRegion(r);
                }}
                useDarkStyle={useDarkMap}
                showsUserLocation={false}
              >
                {/* 🎯 Real-Time User Puck Marker (HD) */}
                {driverCoords && (
                  <Marker 
                    key={`driver-puck-${vehicleType}-${online}`}
                    coordinate={{
                      latitude: driverCoords.latitude,
                      longitude: driverCoords.longitude
                    }}
                    rotation={driverCoords.heading}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat={true}
                  >
                    <VehicleMarker 
                      type={vehicleType as any} 
                      isOnline={online} 
                      avatarUrl={userData?.fotoPerfil || userData?.profilePhoto || undefined}
                    />
                  </Marker>
                )}

                {/* 🛣️ Route visualization when request is active */}
                {incomingRequest?.rideId && !isIncomingRequestDismissed && routeCoords.length > 0 && (
                  <>
                    <PremiumDottedRoute coordinates={routeCoords} />
                    <Marker 
                      coordinate={routeCoords[0]} 
                      title="Partida"
                      anchor={{ x: 0.5, y: 1 }}
                    >
                      <MapMarker type="pickup" />
                    </Marker>
                    <Marker 
                      coordinate={routeCoords[routeCoords.length - 1]} 
                      title="Destino"
                    >
                      <MapMarker type="dropoff" />
                    </Marker>
                  </>
                )}
              </GlobalMap>

              {/* 🎛️ TOP FLOATING DASHBOARD HUD */}
              <View className="absolute top-12 left-4 right-4 z-50 flex-row items-center gap-3">
                 <TouchableOpacity
                   onPress={() => (navigation as any).openDrawer?.()}
                   className="h-[58px] w-[58px] items-center justify-center"
                 >
                    <Menu size={24} color="#FFF" />
                 </TouchableOpacity>

                 <View className="flex-1 flex-row justify-end">
                   {hasActiveIncomingRequest && (
                     <TouchableOpacity
                       onPress={dismissIncomingSheet}
                       className="h-[58px] w-[58px] items-center justify-center"
                       activeOpacity={0.8}
                     >
                       <X size={24} color="#FFFFFF" />
                     </TouchableOpacity>
                   )}
                 </View>
              </View>

              {/* 🛠️ Map Action Buttons (Centering, Zoom, Layers, SOS) */}
              {!hasActiveIncomingRequest && (
                <MapActionButtons 
                  onSosPress={handleSOS}
                  onLocationPress={handleCenterMyLocation}
                  onMapStylePress={handleToggleMapStyle}
                  useDarkMap={useDarkMap}
                  isCentering={isCentering}
                  isSwitchingStyle={isSwitchingMapStyle}
                />
              )}

              {/* ⚠️ ACTIVE OFFER PENDING BANNER */}
              {showPendingBanner && isIncomingRequestDismissed && incomingRequest?.rideId && (
                <MotiView
                  from={{ opacity: 0, translateY: -20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    position: "absolute",
                    top: 120,
                    left: 16,
                    right: 16,
                    zIndex: 40,
                    backgroundColor: "#FBBF24",
                    borderRadius: 16,
                    padding: 14,
                    paddingTop: 18,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                    elevation: 10,
                  }}
                >
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: "#091A2F", fontSize: 13, fontWeight: "900" }}>
                      Chamado Ativo Pendente! 🔔
                    </Text>
                    <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontSize: 11, fontWeight: "700", marginTop: 2 }}>
                      Você tem 1 oferta ativa aguardando.
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={handleNotifications}
                    style={{
                      backgroundColor: "#091A2F",
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                    }}
                  >
                    <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "900" }}>VER DETALHES</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setShowPendingBanner(false);
                      setShowPendingOfferHighlight(true);
                      setOffersPulseToken((prev) => prev + 1);
                    }}
                    activeOpacity={0.85}
                    style={{
                      position: "absolute",
                      top: -4,
                      right: -2,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <X size={18} color="#091A2F" />
                  </TouchableOpacity>
                </MotiView>
              )}

              {/* ⚠️ URGENT QUEUE BANNER */}
              {!!waitingQueueCount && pendingNegotiationsCount === 0 && pendingRequests === 0 && (
                <MotiView
                  from={{ opacity: 0, translateY: -20 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  style={{
                    position: "absolute",
                    top: 120,
                    left: 16,
                    right: 16,
                    zIndex: 40,
                    backgroundColor: "#02de95",
                    borderRadius: 16,
                    padding: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.2)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.2,
                    shadowRadius: 8,
                  }}
                >
                  <View style={{ backgroundColor: "rgba(9, 26, 47, 0.2)", padding: 8, borderRadius: 12, marginRight: 12 }}>
                    <Info size={20} color="#091A2F" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>FILA DE ESPERA</Text>
                    <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>Existem {waitingQueueCount} pedido(s) na fila pública!</Text>
                  </View>
                  <TouchableOpacity 
                    activeOpacity={0.9}
                    onPress={() => (navigation as any).navigate("DriverRequests", { initialTab: "queue" })}
                    style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}
                  >
                    <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 10 }}>ABRIR</Text>
                  </TouchableOpacity>
                </MotiView>
              )}

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
            </>
          )}

          {/* 📦 NEW COMPACT OFFER SHEET — Aceitar | Recusar | Ver Detalhes */}
          {isApproved && (
            <NewIncomingOfferSheet
              isVisible={!!incomingRequest?.rideId && !isIncomingRequestDismissed}
              request={incomingRequest}
              countdown={countdown}
              onAccept={acceptIncoming}
              onReject={rejectIncoming}
              onViewDetail={() => {
                if (!incomingRequest) return;
                (navigation as any).navigate("DeliveryOfferDetail", {
                  offer: incomingRequest,
                  onAccept: acceptIncoming,
                  onReject: rejectIncoming,
                });
              }}
            />
          )}

          {/* 📊 INTELLIGENT OPERATIONAL BASE CAMP */}
          {(!incomingRequest?.rideId || isIncomingRequestDismissed) && (
            <DriverBottomSheet
              online={online}
              services={services}
              isTogglingOnline={isTogglingOnline}
              onToggleOnline={toggleOnline}
              onToggleService={toggleService}
              vehicleType={vehicleType}
              stats={driverStats}
              driverBalance={driverBalance}
              onAddBalance={() => setShowDepositModal(true)}
              onPressOffers={() => (navigation as any).navigate("DriverRequests", { initialTab: "realtime" })}
              hasPendingOffer={showPendingOfferHighlight}
              offersPulseToken={offersPulseToken}
            />
          )}

          <Modal
            visible={showCancelModal}
            title="Pedido Cancelado"
            message="O cliente cancelou esta solicitação e ela não está mais disponível para aceite."
            type="warning"
            confirmText="Entendido"
            onClose={() => {
              setShowCancelModal(false);
              setCancelModalReason(null);
            }}
          />

          <Modal
            visible={showNoBalanceModal}
            title="Saldo Insuficiente"
            message="Você precisa adicionar saldo para ficar online e receber corridas. Acesse a tela de Ganhos e Carteira para recarregar."
            type="error"
            confirmText="Ir para Recarga"
            onClose={() => setShowNoBalanceModal(false)}
            onConfirm={() => {
              setShowNoBalanceModal(false);
              (navigation as any).navigate("DriverFinance", { screen: "DriverEarnings" });
            }}
          />

          <DriverDepositModal
            visible={showDepositModal}
            onClose={() => setShowDepositModal(false)}
            onSuccess={() => {
              setShowDepositModal(false);
              loadBalance(); 
            }}
          />


      {!isApproved && (
            <DriverOnboardingDashboard />
          )}

          {showTour && (
            <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "rgba(0,0,0,0.65)", zIndex: 9999999 }]}>
              {/* Highlight Target */}
              <View 
                style={[
                  {
                    position: "absolute",
                    borderWidth: 2.5,
                    borderColor: "#02de95",
                    backgroundColor: "rgba(2, 222, 149, 0.04)",
                    shadowColor: "#02de95",
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.8,
                    shadowRadius: 12,
                  },
                  tourSteps[tourStep].targetStyle as any
                ]} 
              />

              {/* Balloon */}
              <MotiView
                from={{ opacity: 0, scale: 0.9, translateY: 15 }}
                animate={{ opacity: 1, scale: 1, translateY: 0 }}
                transition={{ type: "spring", damping: 15 }}
                style={[
                  {
                    position: "absolute",
                    backgroundColor: "#0B1E36",
                    borderRadius: 24,
                    padding: 22,
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.1)",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 10 },
                    shadowOpacity: 0.5,
                    shadowRadius: 20,
                  },
                  tourSteps[tourStep].balloonStyle as any
                ]}
              >
                {/* Arrow pointing to target */}
                <View style={tourSteps[tourStep].arrowStyle as any} />

                {/* Content */}
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#02de95", marginRight: 8 }} />
                  <Text style={{ color: "rgba(255, 255, 255, 0.5)", fontSize: 10, fontWeight: "900", letterSpacing: 1.5, textTransform: "uppercase" }}>
                    Guia de Uso • Passo {tourStep + 1} de {tourSteps.length}
                  </Text>
                </View>

                <Text style={{ color: "#fff", fontSize: 18, fontWeight: "900", marginBottom: 8 }}>
                  {tourSteps[tourStep].title}
                </Text>
                <Text style={{ color: "rgba(255, 255, 255, 0.7)", fontSize: 13, lineHeight: 20, fontWeight: "500", marginBottom: 20 }}>
                  {tourSteps[tourStep].desc}
                </Text>

                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <TouchableOpacity onPress={handleSkipTour} activeOpacity={0.7} style={{ paddingVertical: 8 }}>
                    <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "700" }}>
                      Pular Guia
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={handleNextTourStep}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: "#02de95",
                      paddingHorizontal: 22,
                      paddingVertical: 12,
                      borderRadius: 14,
                      shadowColor: "#02de95",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Text style={{ color: "#091A2F", fontSize: 13, fontWeight: "900" }}>
                      {tourStep === tourSteps.length - 1 ? "Entendido!" : "Avançar →"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </MotiView>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}



