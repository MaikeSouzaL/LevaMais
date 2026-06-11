import React, { useEffect, useRef, useState } from "react";
import { AppState, View, Text, TouchableOpacity, useColorScheme, Alert, StyleSheet, Image, ActivityIndicator } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "@/components/ui/Icon";
import * as Location from "expo-location";
import Constants from "expo-constants";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { resolveAssetURL } from "../../../utils/mappers";
import { BalanceWidget } from "@/components/BalanceWidget";
import { DriverDepositModal } from "@/components/DriverDepositModal";
import { QueueTagYellowFloating } from "@/components/QueueTagYellow";
import { MapActionButtons } from "@/components/MapActionButtons";
import { useAuthStore } from "../../../context/authStore";
import driverLocationService, {
  DriverStatus,
  DriverVehicleType,
} from "../../../services/driverLocation.service";
import { supabase } from "@/lib/supabase";
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
import { useRegisterPushToken } from "@/hooks/useRegisterPushToken";

// 🌌 High-End Components & Modules Upgrade
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { MotiView, AnimatePresence } from "moti";
import { MapPin, Menu, Target, Layers, ShieldAlert, Info , AlertTriangle, X, User, Wifi, WifiOff, QrCode } from "lucide-react-native";
import { NewIncomingOfferSheet } from "@/components/driver/home/NewIncomingOfferSheet";
import { PremiumDottedRoute } from "@/components/routes/PremiumDottedRoute";
import { VehicleMarker } from "@/components/maps/VehicleMarker";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";


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
  const insets = useSafeAreaInsets();
  const userData = useAuthStore((s) => s.userData);
  const isApproved = userData?.driverStatus === "approved";

  useRegisterPushToken();

  const [online, setOnline] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [onlineBanner, setOnlineBanner] = useState<{ visible: boolean; type: "online" | "offline" }>({ visible: false, type: "online" });
  const isFirstOnlineChangeRef = useRef(true);
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

  // Trigger online/offline banner on state change (disappears after 5 seconds)
  useEffect(() => {
    if (isFirstOnlineChangeRef.current) {
      isFirstOnlineChangeRef.current = false;
      return;
    }
    
    setOnlineBanner({ visible: true, type: online ? "online" : "offline" });
    
    const timer = setTimeout(() => {
      setOnlineBanner((prev) => ({ ...prev, visible: false }));
    }, 5000);

    return () => clearTimeout(timer);
  }, [online]);

  const servicesRef = useRef(services);
  useEffect(() => {
    servicesRef.current = services;
  }, [services]);

  const [error, setError] = useState<string | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [isCentering, setIsCentering] = useState(false);
  const [mapStyleMode, setMapStyleMode] = useState<"dark" | "light" | "satellite">("dark");
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

  useEffect(() => {
    if (
      pendingRequests > 0 ||
      waitingQueueCount > 0 ||
      pendingNegotiationsCount > 0 ||
      clientCounteredCount > 0 ||
      scheduledCount > 0
    ) {
      setShowPendingOfferHighlight(true);
    } else {
      setShowPendingOfferHighlight(false);
    }
  }, [pendingRequests, waitingQueueCount, pendingNegotiationsCount, clientCounteredCount, scheduledCount]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelModalReason, setCancelModalReason] = useState<string | null>(null);
  const [showNoBalanceModal, setShowNoBalanceModal] = useState(false);
  const [showOnlineTimeModal, setShowOnlineTimeModal] = useState(false);
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
  const cancellationDedupRef = useRef<Map<string, number>>(new Map());

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
        (navigation as any).replace("DriverRide", { rideId: active.ride._id });
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
      syncAvailableRequests().catch(() => {});
      refreshScheduledCount().catch(() => {});

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
    let timeoutId: NodeJS.Timeout;
    
    if (isApproved && userData?.tourSeen === false) {
      timeoutId = setTimeout(() => {
        const currentTourSeen = useAuthStore.getState().userData?.tourSeen;
        if (!currentTourSeen) {
          setShowTour(true);
        }
      }, 1200);
    }
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [isApproved, userData?.tourSeen]);

  const handleNextTourStep = async () => {
    if (tourStep < tourSteps.length - 1) {
      setTourStep(tourStep + 1);
    } else {
      setShowTour(false);
      try {
        await userService.updateProfile({ tourSeen: true });
        useAuthStore.getState().updateUserData({ tourSeen: true });
      } catch {}
    }
  };

  const handleSkipTour = async () => {
    setShowTour(false);
    try {
      await userService.updateProfile({ tourSeen: true });
      useAuthStore.getState().updateUserData({ tourSeen: true });
    } catch {}
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

  // Supabase Realtime: listen for new/updated rides when driver is online.
  // Mantém o canal ativo mesmo sem foco — motorista pode estar em outra aba do app.
  useEffect(() => {
    let mounted = true;

    if (!online) {
      return () => {
        mounted = false;
      };
    }

    const currentDriverId = useAuthStore.getState().userData?.id;
    const dedupMap = cancellationDedupRef.current;
    // Nome único por ciclo de efeito para evitar conflito "cannot add callbacks after subscribe"
    const channelName = `driver-new-rides-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "rides",
        },
        async (payload) => {
          if (!mounted || !isFocused) return;
          const row = payload.new as any;
          console.log("[DriverHome] Realtime INSERT received", { rideId: row.id, status: row.status, serviceType: row.service_type, vehicleType: row.vehicle_type });
          // Only handle rides in 'requesting' state with no driver yet
          if (row.status === "requesting" && !row.driver_id) {
            try {
              const active = await rideService.getActive();
              if (active?.active && active.ride?._id) {
                console.log("[DriverHome] Skipping — already has active ride", { activeRideId: active.ride._id });
                await clearIncoming();
                (navigation as any).replace("DriverRide", { rideId: active.ride._id });
                return;
              }
            } catch {}
            console.log("[DriverHome] Fetching available requests...");
            syncAvailableRequests().catch(() => {});
          } else {
            console.log("[DriverHome] Realtime INSERT ignored", { status: row.status, hasDriver: !!row.driver_id });
          }
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
        },
        async (payload) => {
          if (!mounted) return;
          const row = payload.new as any;
          const rideId = String(row.id || "");

          // Ride was taken by another driver — remove from incoming if it matches
          if (
            row.driver_id &&
            currentDriverId &&
            String(row.driver_id) !== String(currentDriverId) &&
            incomingRequest?.rideId === rideId
          ) {
            await clearIncoming();
            return;
          }

          // Ride was cancelled
          if (String(row.status || "").startsWith("cancelled")) {
            const now = Date.now();
            const lastProcessed = dedupMap.get(rideId);
            if (lastProcessed && now - lastProcessed < 5000) return;
            dedupMap.set(rideId, now);
            setTimeout(() => dedupMap.delete(rideId), 10000);

            if (incomingRequest?.rideId === rideId) {
              await clearIncoming();
              setCancelModalReason(null);
              setShowCancelModal(true);
            }
            return;
          }

          // Terminal status — clear incoming if it matches
          const terminalStatuses = [
            "accepted", "in_progress", "arrived", "completed",
            "rejected", "expired", "no_drivers_available",
          ];
          if (terminalStatuses.includes(String(row.status || "")) && incomingRequest?.rideId === rideId) {
            await clearIncoming();
          }
        },
      )
      .subscribe();

    syncAvailableRequests().catch(() => {});

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [online, incomingRequest?.rideId, isFocused]);

  // ⏱️ Countdown timer para oferta recebida
  useEffect(() => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    if (!incomingRequest?.rideId) {
      setCountdown(null);
      return;
    }

    // Inicializa com 60 segundos ou o valor vindo do payload
    const initialSeconds = Number(incomingRequest?.searchTimeoutSeconds || 60);
    setCountdown(initialSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null || prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [incomingRequest?.rideId]);

  // Trigger dismissIncomingSheet when countdown reaches 0 (moves to pending list, stops sound)
  useEffect(() => {
    if (countdown === 0 && incomingRequest?.rideId && !isIncomingRequestDismissed) {
      dismissIncomingSheet();
    }
  }, [countdown, incomingRequest?.rideId, isIncomingRequestDismissed]);

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

  // Supabase Realtime para notificações instantâneas de novas corridas
  useEffect(() => {
    let mounted = true;
    if (!online || !isFocused) {
      if (pendingSyncIntervalRef.current) {
        clearInterval(pendingSyncIntervalRef.current);
        pendingSyncIntervalRef.current = null;
      }
      return;
    }

    // Primeira sincronização imediata
    syncAvailableRequests().catch(() => {});

    // Fallback de segurança bem espaçado (30s) para garantir resiliência
    if (pendingSyncIntervalRef.current) {
      clearInterval(pendingSyncIntervalRef.current);
    }
    pendingSyncIntervalRef.current = setInterval(() => {
      if (mounted) syncAvailableRequests().catch(() => {});
    }, 30000);

    // Supabase Realtime Subscription na tabela 'rides'
    const channelName = `driver-home-rides-${Math.random().toString(36).slice(2)}`;
    const ridesChannel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "rides" },
        () => {
          if (mounted) syncAvailableRequests().catch(() => {});
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides" },
        () => {
          if (mounted) syncAvailableRequests().catch(() => {});
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      if (pendingSyncIntervalRef.current) {
        clearInterval(pendingSyncIntervalRef.current);
        pendingSyncIntervalRef.current = null;
      }
      supabase.removeChannel(ridesChannel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [online, isFocused]);

  // Declaratively ensure location sharing matches online status
  useEffect(() => {
    if (online) {
      if (!intervalRef.current) {
        startSharing().catch(() => {});
      }
    } else {
      if (intervalRef.current) {
        stopSharing().catch(() => {});
      }
    }
  }, [online]);

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

    setIsSavingPrefs(true);
    try {
      const nextServices = { ...services, [key]: !services[key] };
      setServices(nextServices);
      setError(null); // Limpa erro se a operação foi bem sucedida

      // Sincronizar persistentemente as preferências no perfil do motorista no backend e atualizar o cache local
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

      // se já estiver online, atualizar preferências no backend
      if (online) {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: currentServiceTypesFrom(nextServices),
        }).catch(() => null);
        // ⚡ Sincronizar chamadas disponíveis imediatamente para capturar pedidos compatíveis da fila!
        await syncAvailableRequests().catch(() => null);
      }

      Toast.show({
        type: "success",
        text1: key === "ride"
          ? (nextServices.ride ? "Corridas de Passageiro Ativadas" : "Corridas de Passageiro Desativadas")
          : (nextServices.delivery ? "Entrega de Encomendas Ativada" : "Entrega de Encomendas Desativada"),
        text2: key === "ride"
          ? (nextServices.ride ? "Você receberá chamados para transportar passageiros." : "Você não receberá mais chamados de passageiros.")
          : (nextServices.delivery ? "Você receberá chamados para entregas comerciais." : "Você não receberá mais entregas de comércios."),
        position: "top",
        visibilityTime: 4000,
      });
    } catch (profileErr) {
      console.error("Erro ao salvar preferências no perfil persistentemente:", profileErr);
    } finally {
      setIsSavingPrefs(false);
    }
  };

  const toggleCardMachine = async () => {
    setIsSavingPrefs(true);
    try {
      const currentAccepts = Boolean(userData?.driverPreferences?.acceptsCardMachine);
      const nextAccepts = !currentAccepts;

      const defaultVehicle = (userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle" || userData?.vehicleType === "van" || userData?.vehicleType === "truck")
        ? userData.vehicleType
        : "motorcycle";
      const selectedVehicles: Array<"motorcycle" | "car" | "van" | "truck"> = 
        (userData?.driverPreferences?.selectedVehicles as any) || [defaultVehicle];

      const updatedPrefs = {
        serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        selectedVehicles,
        searchRadiusKm: userData?.driverPreferences?.searchRadiusKm || 8,
        autoAccept: userData?.driverPreferences?.autoAccept || false,
        acceptsCardMachine: nextAccepts,
        acceptsCash: userData?.driverPreferences?.acceptsCash !== false,
        acceptsPix: userData?.driverPreferences?.acceptsPix !== false,
      };

      await userService.updateProfile({
        driverPreferences: updatedPrefs,
      });

      useAuthStore.getState().updateUserData({
        driverPreferences: updatedPrefs,
      });

      Toast.show({
        type: "success",
        text1: nextAccepts ? "Maquininha de Cartão Ativada" : "Maquininha de Cartão Desativada",
        text2: nextAccepts 
          ? "Você agora receberá chamados pagos na maquininha física."
          : "Você não receberá mais chamados pagos na maquininha física.",
        position: "top",
        visibilityTime: 4000,
      });
      
      if (online) {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        }).catch(() => null);
        await syncAvailableRequests().catch(() => null);
      }
    } catch {} finally {
      setIsSavingPrefs(false);
    }
  };

  const toggleCash = async () => {
    setIsSavingPrefs(true);
    try {
      const currentAccepts = userData?.driverPreferences?.acceptsCash !== false;
      const nextAccepts = !currentAccepts;

      const defaultVehicle = (userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle" || userData?.vehicleType === "van" || userData?.vehicleType === "truck")
        ? userData.vehicleType
        : "motorcycle";
      const selectedVehicles: Array<"motorcycle" | "car" | "van" | "truck"> = 
        (userData?.driverPreferences?.selectedVehicles as any) || [defaultVehicle];

      const updatedPrefs = {
        serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        selectedVehicles,
        searchRadiusKm: userData?.driverPreferences?.searchRadiusKm || 8,
        autoAccept: userData?.driverPreferences?.autoAccept || false,
        acceptsCardMachine: Boolean(userData?.driverPreferences?.acceptsCardMachine),
        acceptsCash: nextAccepts,
        acceptsPix: userData?.driverPreferences?.acceptsPix !== false,
      };

      await userService.updateProfile({
        driverPreferences: updatedPrefs,
      });

      useAuthStore.getState().updateUserData({
        driverPreferences: updatedPrefs,
      });

      Toast.show({
        type: "success",
        text1: nextAccepts ? "Dinheiro Físico Ativado" : "Dinheiro Físico Desativado",
        text2: nextAccepts 
          ? "Você receberá chamados pagos com dinheiro em mãos diretamente."
          : "Você não receberá chamados pagos em dinheiro físico.",
        position: "top",
        visibilityTime: 4000,
      });
      
      if (online) {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        }).catch(() => null);
        await syncAvailableRequests().catch(() => null);
      }
    } catch {} finally {
      setIsSavingPrefs(false);
    }
  };

  const togglePix = async () => {
    setIsSavingPrefs(true);
    try {
      const currentAccepts = userData?.driverPreferences?.acceptsPix !== false;
      const nextAccepts = !currentAccepts;

      const defaultVehicle = (userData?.vehicleType === "car" || userData?.vehicleType === "motorcycle" || userData?.vehicleType === "van" || userData?.vehicleType === "truck")
        ? userData.vehicleType
        : "motorcycle";
      const selectedVehicles: Array<"motorcycle" | "car" | "van" | "truck"> = 
        (userData?.driverPreferences?.selectedVehicles as any) || [defaultVehicle];

      const updatedPrefs = {
        serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        selectedVehicles,
        searchRadiusKm: userData?.driverPreferences?.searchRadiusKm || 8,
        autoAccept: userData?.driverPreferences?.autoAccept || false,
        acceptsCardMachine: Boolean(userData?.driverPreferences?.acceptsCardMachine),
        acceptsCash: userData?.driverPreferences?.acceptsCash !== false,
        acceptsPix: nextAccepts,
      };

      await userService.updateProfile({
        driverPreferences: updatedPrefs,
      });

      useAuthStore.getState().updateUserData({
        driverPreferences: updatedPrefs,
      });

      Toast.show({
        type: "success",
        text1: nextAccepts ? "Recebimento via Pix Ativado" : "Recebimento via Pix Desativado",
        text2: nextAccepts 
          ? "Você receberá chamados pagos por transferência Pix direta."
          : "Você não receberá chamados pagos via transferência Pix.",
        position: "top",
        visibilityTime: 4000,
      });
      
      if (online) {
        await driverLocationService.setStatus({
          status: "available",
          serviceTypes: userData?.driverPreferences?.serviceTypes || ["delivery"],
        }).catch(() => null);
        await syncAvailableRequests().catch(() => null);
      }
    } catch {} finally {
      setIsSavingPrefs(false);
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
    setMapStyleMode((prev) => {
      let next: "dark" | "light" | "satellite" = "dark";
      if (prev === "dark") next = "light";
      else if (prev === "light") next = "satellite";
      else next = "dark";
      
      // persistir preferência
      AsyncStorage.setItem("mapStylePref", next).catch(() => {});
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
        if (pref === "dark" || pref === "light" || pref === "satellite") {
          setMapStyleMode(pref as any);
        } else {
          setMapStyleMode(colorScheme === "dark" ? "dark" : "light");
        }
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
        const result = await rideService.respondToOffer(incomingRequest.rideId, { action: "accept" });
        await clearIncoming();
        if (result?.rideMatched) {
          (navigation as any).replace("DriverRide", { rideId: incomingRequest.rideId });
          Toast.show({
            type: "success",
            text1: "Corrida aceita!",
            text2: "Dirija com cuidado!",
          });
          return;
        }
        Toast.show({
          type: "success",
          text1: "Oferta aceita",
          text2: "Aguardando cliente selecionar sua proposta.",
        });
        
        const baseValue = incomingRequest.negotiation?.clientOffer || incomingRequest.pricing?.total || 0;
        const offerParam = {
          _id: incomingRequest.rideId,
          offeredValue: baseValue,
          pickup: incomingRequest.pickup,
          destination: incomingRequest.dropoff,
          dropoff: incomingRequest.dropoff,
          distance: incomingRequest.distance,
          duration: incomingRequest.duration,
          pricing: incomingRequest.pricing,
          client: incomingRequest.client || {
            name: "Cliente Leva Mais",
            rating: "5.0"
          },
          cargoType: incomingRequest.serviceType === "delivery" ? "Delivery" : "Corrida",
          negotiation: {
            ...incomingRequest.negotiation,
            myOffer: {
              amount: baseValue,
              status: "pending"
            }
          }
        };
        (navigation as any).navigate("DriverNegotiation", { offer: offerParam });
        return;
      }

      const ride = await rideService.accept(incomingRequest.rideId);
      await clearIncoming();
      (navigation as any).replace("DriverRide", { rideId: ride._id });
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
      await clearIncoming();
      Toast.show({
        type: "success",
        text1: "Proposta Enviada! 🚀",
        text2: `Sua oferta de R$ ${amount.toFixed(2).replace(".", ",")} foi enviada ao cliente.`,
      });
      
      const offerParam = {
        _id: incomingRequest.rideId,
        offeredValue: incomingRequest.negotiation?.clientOffer || incomingRequest.pricing?.total || 0,
        pickup: incomingRequest.pickup,
        destination: incomingRequest.dropoff,
        dropoff: incomingRequest.dropoff,
        distance: incomingRequest.distance,
        duration: incomingRequest.duration,
        pricing: incomingRequest.pricing,
        client: incomingRequest.client || {
          name: "Cliente Leva Mais",
          rating: "5.0"
        },
        cargoType: incomingRequest.serviceType === "delivery" ? "Delivery" : "Corrida",
        negotiation: {
          ...incomingRequest.negotiation,
          myOffer: {
            amount: amount,
            status: "pending"
          }
        }
      };
      (navigation as any).navigate("DriverNegotiation", { offer: offerParam });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao Propor",
        text2: err?.response?.data?.error || err?.message || "Tente novamente",
      });
      throw err; // Bubbles up to reset card loading state
    }
  };

  const loadRealRoute = async (pickup: LatLng, dropoff: LatLng, stops?: any[]) => {
    try {
      const key = getGoogleMapsApiKey();
      if (!key) {
        setRouteCoords([]);
        return;
      }

      const origin = `${pickup.latitude},${pickup.longitude}`;
      const destination = `${dropoff.latitude},${dropoff.longitude}`;
      
      let waypointsQuery = "";
      if (Array.isArray(stops) && stops.length > 0) {
        const wpString = stops.map((s) => `${s.latitude},${s.longitude}`).join("|");
        waypointsQuery = `&waypoints=${encodeURIComponent(wpString)}`;
      }

      const url =
        `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(
          origin,
        )}&destination=${encodeURIComponent(destination)}${waypointsQuery}` +
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
    const stops = incomingRequest?.stops;
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
        stops,
      );
    } else {
      setRouteCoords([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [incomingRequest?.rideId, isIncomingRequestDismissed]);



  const displayOnlineTime = (() => {
    if (driverStats?.onlineTime == null) return "00:00:00";
    const totalSecs = Math.round(driverStats.onlineTime);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  })();

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
          <StatusBar style="light" />

          {/* 📣 Online/Offline Premium Sliding Notification Banner */}
          <AnimatePresence>
            {onlineBanner.visible && (
              <MotiView
                from={{ translateX: -400, opacity: 0 }}
                animate={{ translateX: 0, opacity: 1 }}
                exit={{ translateX: -400, opacity: 0 }}
                transition={{ type: "timing", duration: 400 }}
                style={{
                  position: "absolute",
                  top: insets.top + 96,
                  left: 16,
                  right: 16,
                  zIndex: 49,
                  backgroundColor: "rgba(9, 26, 47, 0.95)",
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: onlineBanner.type === "online" ? "#02de95" : "#EF4444",
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  flexDirection: "row",
                  alignItems: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
                  elevation: 10,
                }}
              >
                {/* Indicador de Ícone com Pulso */}
                <View
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    backgroundColor: onlineBanner.type === "online" ? "rgba(2, 222, 149, 0.12)" : "rgba(239, 68, 68, 0.12)",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 12,
                  }}
                >
                  {onlineBanner.type === "online" ? (
                    <Wifi size={20} color="#02de95" />
                  ) : (
                    <WifiOff size={20} color="#EF4444" />
                  )}
                </View>

                {/* Conteúdo de Texto */}
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "900",
                      fontSize: 13,
                      letterSpacing: 0.8,
                      textTransform: "uppercase",
                    }}
                  >
                    {onlineBanner.type === "online" ? "Você está Online!" : "Você está Offline!"}
                  </Text>
                  <Text
                    style={{
                      color: "rgba(255, 255, 255, 0.65)",
                      fontWeight: "600",
                      fontSize: 11,
                      marginTop: 2,
                    }}
                  >
                    {onlineBanner.type === "online"
                      ? "Buscando e recebendo ofertas na sua região."
                      : "Fique online para começar a faturar."}
                  </Text>
                </View>

                {/* Botão de Fechar Rápido */}
                <TouchableOpacity
                  onPress={() => setOnlineBanner((prev) => ({ ...prev, visible: false }))}
                  activeOpacity={0.7}
                  style={{
                    padding: 6,
                    marginLeft: 8,
                    borderRadius: 10,
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                  }}
                >
                  <X size={14} color="rgba(255, 255, 255, 0.4)" />
                </TouchableOpacity>
              </MotiView>
            )}
          </AnimatePresence>

          {region && (
            <>
              <GlobalMap
                ref={mapRef}
                region={region}
                onRegionChangeComplete={(r) => {
                  if (!isCentering) setRegion(r);
                }}
                mapStyleMode={mapStyleMode}
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
                    anchor={{ x: 0.35, y: 0.75 }}
                  >
                    <RoutePin 
                      variant="driver"
                      iconNode={
                        (userData?.fotoPerfil || userData?.profilePhoto) ? (
                          <Image 
                            source={{ uri: resolveAssetURL(userData.fotoPerfil || userData.profilePhoto) }}
                            style={{ width: 16, height: 16, borderRadius: 11, resizeMode: "cover" }}
                          />
                        ) : undefined
                      }
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
                    {Array.isArray(incomingRequest?.stops) && incomingRequest.stops.map((stop: any, idx: number) => {
                      const sLat = Number(stop?.latitude);
                      const sLng = Number(stop?.longitude);
                      if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return null;
                      return (
                        <Marker
                          key={`incoming-stop-${idx}`}
                          coordinate={{ latitude: sLat, longitude: sLng }}
                          title={`Parada ${idx + 1}`}
                          anchor={{ x: 0.5, y: 1 }}
                        >
                          <StopPin index={idx + 1} />
                        </Marker>
                      );
                    })}
                    <Marker 
                      coordinate={routeCoords[routeCoords.length - 1]} 
                      title="Destino"
                    >
                      <MapMarker type="dropoff" />
                    </Marker>
                  </>
                )}
              </GlobalMap>

              {/* 🎛️ TOP PREMIUM CARVED HEADER (CLIENT STYLE BUT BLUE) */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  zIndex: 50,
                  backgroundColor: "#0B1D33", // Curved Deep Blue Header
                  borderBottomLeftRadius: 32,
                  borderBottomRightRadius: 32,
                  paddingTop: insets.top + 16,
                  paddingBottom: 20,
                  paddingHorizontal: 20,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 10 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                  elevation: 10,
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                  <TouchableOpacity
                    onPress={() => (navigation as any).openDrawer?.()}
                    activeOpacity={0.8}
                  >
                    {userData?.fotoPerfil || userData?.profilePhoto ? (
                      <Image
                        source={{ uri: resolveAssetURL(userData.fotoPerfil || userData.profilePhoto) }}
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          borderWidth: 2,
                          borderColor: "#FFF",
                        }}
                      />
                    ) : (
                      <View
                        style={{
                          width: 56,
                          height: 56,
                          borderRadius: 28,
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          borderWidth: 1.5,
                          borderColor: "rgba(255, 255, 255, 0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <User size={24} color="#FFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                  
                  <View style={{ justifyContent: "center" }}>
                    <Text style={{ color: "#FFF", fontSize: 22, fontWeight: "bold", lineHeight: 26 }}>Olá,</Text>
                    <Text style={{ color: "#02de95", fontSize: 22, fontWeight: "900", lineHeight: 26 }} numberOfLines={1} ellipsizeMode="tail">
                      {userData?.name ? userData.name.split(" ")[0] : "Motorista"}!
                    </Text>
                  </View>
                </View>

                {/* Right side QrCode button & Optional Incoming request close button */}
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => Alert.alert("QR Code", "Seu código de motorista está ativo para leitura.")}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      borderWidth: 1.5,
                      borderColor: "rgba(255, 255, 255, 0.15)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    accessibilityLabel="Mostrar QR Code"
                    accessibilityRole="button"
                  >
                    <QrCode size={20} color="#02de95" />
                  </TouchableOpacity>

                  {hasActiveIncomingRequest && (
                    <TouchableOpacity
                      onPress={dismissIncomingSheet}
                      style={{
                        height: 44,
                        width: 44,
                        borderRadius: 22,
                        backgroundColor: "rgba(239, 68, 68, 0.15)",
                        borderWidth: 1.5,
                        borderColor: "rgba(239, 68, 68, 0.3)",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                      activeOpacity={0.8}
                    >
                      <X size={20} color="#EF4444" />
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
                  mapStyleMode={mapStyleMode}
                  isCentering={isCentering}
                  isSwitchingStyle={isSwitchingMapStyle}
                  topOffset={280}
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
              onCounter={counterOfferIncoming}
              onViewDetail={() => {
                if (!incomingRequest) return;
                (navigation as any).navigate("DriverNegotiation", {
                  offer: {
                    _id: incomingRequest.rideId,
                    offeredValue: incomingRequest.negotiation?.clientOffer || incomingRequest.pricing?.total || 0,
                    pickup: incomingRequest.pickup,
                    destination: incomingRequest.dropoff,
                    dropoff: incomingRequest.dropoff,
                    distance: incomingRequest.distance,
                    duration: incomingRequest.duration,
                    pricing: incomingRequest.pricing,
                    client: incomingRequest.client || { name: "Cliente", rating: "5.0" }
                  }
                });
              }}
            />
          )}

          {/* 📊 INTELLIGENT OPERATIONAL BASE CAMP */}
          {(!incomingRequest?.rideId || isIncomingRequestDismissed) && (
            <View style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, zIndex: 90 }} pointerEvents="box-none">
              <DriverBottomSheet
                online={online}
                services={services}
                isTogglingOnline={isTogglingOnline}
                onToggleOnline={toggleOnline}
                onToggleService={toggleService}
                acceptsCardMachine={userData?.driverPreferences?.acceptsCardMachine || false}
                onToggleCardMachine={toggleCardMachine}
                acceptsCash={userData?.driverPreferences?.acceptsCash !== false}
                onToggleCash={toggleCash}
                acceptsPix={userData?.driverPreferences?.acceptsPix !== false}
                onTogglePix={togglePix}
                vehicleType={vehicleType}
                stats={driverStats}
                driverBalance={driverBalance}
                onAddBalance={() => setShowDepositModal(true)}
                onPressOffers={() => (navigation as any).navigate("DriverRequests", { initialTab: "realtime" })}
                hasPendingOffer={showPendingOfferHighlight}
                offersPulseToken={offersPulseToken}
                onPressRating={() => (navigation as any).navigate("DriverRatings")}
                onPressBalance={() => (navigation as any).navigate("DriverFinance", { screen: "DriverEarnings" })}
                onPressTime={() => setShowOnlineTimeModal(true)}
              />
            </View>
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

          <Modal
            visible={showOnlineTimeModal}
            title="Tempo Online Hoje"
            message={`Você está conectado há exatamente ${displayOnlineTime} hoje.\n\nSeu tempo online é redefinido automaticamente à meia-noite e o total acumulado é salvo com segurança em seu histórico diário de trabalho!`}
            type="info"
            confirmText="Entendido"
            onClose={() => setShowOnlineTimeModal(false)}
            onConfirm={() => setShowOnlineTimeModal(false)}
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

          {/* ⏳ PREFERENCES LOADING OVERLAY */}
          {isSavingPrefs && (
            <View style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(7, 19, 34, 0.75)",
              justifyContent: "center",
              alignItems: "center",
              zIndex: 99999,
            }}>
              <View style={{
                backgroundColor: "rgba(11, 26, 42, 0.92)",
                paddingHorizontal: 28,
                paddingVertical: 24,
                borderRadius: 20,
                borderWidth: 1.2,
                borderColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                gap: 14,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.5,
                shadowRadius: 15,
                elevation: 10,
              }}>
                <ActivityIndicator size="large" color="#02de95" />
                <Text style={{ color: "#ffffff", fontSize: 13.5, fontWeight: "700", letterSpacing: 0.2 }}>
                  Salvando preferências...
                </Text>
              </View>
            </View>
          )}
        </View>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}



