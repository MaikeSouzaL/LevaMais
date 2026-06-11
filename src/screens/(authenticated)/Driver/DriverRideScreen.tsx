import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, TouchableOpacity, AppState, Alert, Modal, TextInput, StyleSheet, Animated, Image, ActivityIndicator, Clipboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { createAudioPlayer } from "expo-audio";
import { MessageCircle } from "lucide-react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, Polyline } from "react-native-maps";
import { smoothHeading } from "@/utils/heading";
import { getPaymentMethodType } from "@/utils/payment";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import { DriverStatusCard } from "./components/DriverStatusCard";
import { ActiveDeliveryHeader } from "./components/ActiveDeliveryHeader";
import { FloatingMapControls } from "./components/FloatingMapControls";
import { ActiveDeliveryBottomSheet } from "./components/ActiveDeliveryBottomSheet";
import {
  DriverCancelReasonModal,
  CancelReason,
} from "./components/DriverCancelReasonModal";

import rideService, { Ride } from "../../../services/ride.service";
import driverLocationService from "../../../services/driverLocation.service";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "../../../context/authStore";
import { useChatStore } from "../../../context/chatStore";
import { decodePolyline, LatLng } from "../../../utils/polyline";
import { VehicleMarker } from "@/components/maps/VehicleMarker";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";

type Params = {
  DriverRide: {
    rideId: string;
  };
};

export default function DriverRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverRide">>();
  const rideId = route.params?.rideId;
  const currentUserId = useAuthStore((s) => s.userData?.id) || "";
  const vehicleType = useAuthStore((s) => s.userData?.vehicleType) || "motorcycle";
  const unreadCount = useChatStore((s) => s.unreadCounts[rideId || ""]) || 0;
  const [chatNotification, setChatNotification] = useState<{ sender: string; text: string } | null>(null);
  const slideAnim = useRef(new Animated.Value(-400)).current;
  const notificationTimeoutRef = useRef<any>(null);

  const [ride, setRide] = useState<Ride | null>(null);
  const [status, setStatus] = useState<string>("accepted");
  const [driverCoords, setDriverCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [clientCoords, setClientCoords] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [liveEtaText, setLiveEtaText] = useState<string>("");
  const [liveDistanceText, setLiveDistanceText] = useState<string>("");
  const [liveSpeedKmh, setLiveSpeedKmh] = useState<number>(0);
  const intervalRef = useRef<any>(null);
  const mapRef = useRef<MapView | null>(null);
  const lastCameraUpdateRef = useRef(0);
  const cancelHandledRef = useRef(false);
  const statusRef = useRef<string>("accepted");
  const lastAppStateRef = useRef(AppState.currentState);
  const autoArrivingRequestedRef = useRef(false);

  // Bússola física (magnetômetro) para girar mapa + puck suavemente (estilo Uber)
  const [navHeading, setNavHeading] = useState(0);
  const lastHeadingRef = useRef<number | null>(null);
  const lastHeadingSetRef = useRef(0);
  const lastRotateRef = useRef(0);
  // Modo "seguir motorista": desliga quando o usuário mexe no mapa, religa no botão de GPS
  const followingRef = useRef(true);
  const [isFollowing, setIsFollowing] = useState(true);

  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);
  const [navigationModeEnabled, setNavigationModeEnabled] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const didInitial3DRef = useRef(false);
  const realTrajectoryRef = useRef<Array<{ latitude: number; longitude: number; timestamp?: string }>>([]);
  // Garante que o puck (View customizada) renderize no Android e depois congela para performance
  const [puckRendered, setPuckRendered] = useState(false);
  // Mesmo tratamento para os pins de coleta/destino (evita o ícone "sumir" no Android)
  const [markersReady, setMarkersReady] = useState(false);
  // Altura medida do bottom sheet para empurrar o conteúdo do mapa para cima (mapPadding)
  const [sheetHeight, setSheetHeight] = useState(300);

  // Security PIN Verification States 🔐
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinType, setPinType] = useState<"pickup" | "delivery">("pickup");
  const [pinValue, setPinValue] = useState("");
  const [onPinSubmit, setOnPinSubmit] = useState<((pin: string) => void) | null>(null);
  const [onPinCancel, setOnPinCancel] = useState<(() => void) | null>(null);

  // PIX QR Code States 📱
  const [pixModalVisible, setPixModalVisible] = useState(false);
  const [pixData, setPixData] = useState<{
    pixCode: string;
    qrCodeData: string;
    amount: number;
    transactionId?: string;
  } | null>(null);
  const [pixGenerating, setPixGenerating] = useState(false);
  const [pixConfirming, setPixConfirming] = useState(false);

  const handleShowPixModal = async () => {
    if (!rideId) return;
    setPixGenerating(true);
    setPixModalVisible(true);
    try {
      const data = await rideService.createRidePixPayment(rideId);
      if (data?.success) {
        setPixData({
          pixCode: data.pixCode,
          qrCodeData: data.qrCodeData,
          amount: data.amount,
          transactionId: data.transactionId,
        });
      } else {
        Toast.show({ type: "error", text1: "Erro ao gerar PIX", text2: "Resposta inválida do servidor" });
        setPixModalVisible(false);
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao gerar PIX", text2: e?.message || "Tente novamente" });
      setPixModalVisible(false);
    } finally {
      setPixGenerating(false);
    }
  };

  const handleConfirmPixMock = async () => {
    if (!rideId) return;
    setPixConfirming(true);
    try {
      const res = await rideService.confirmRidePixPaymentMock(rideId);
      if (res?.success) {
        Toast.show({ type: "success", text1: "PIX Simulado com sucesso!" });
        setPixModalVisible(false);
        // Avançar corrida após simulação de pagamento bem-sucedida
        setTimeout(() => {
          update("completed");
        }, 800);
      } else {
        Toast.show({ type: "error", text1: "Erro ao simular", text2: res?.message });
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao simular", text2: e?.message });
    } finally {
      setPixConfirming(false);
    }
  };


  const promptForPin = (type: "pickup" | "delivery"): Promise<string> => {
    return new Promise((resolve, reject) => {
      setPinType(type);
      setPinValue("");
      setPinModalVisible(true);
      setOnPinSubmit(() => (submittedPin: string) => {
        setPinModalVisible(false);
        resolve(submittedPin);
      });
      setOnPinCancel(() => () => {
        setPinModalVisible(false);
        reject(new Error("PIN nao verificado. Digite o PIN correto para prosseguir."));
      });
    });
  };

  useEffect(() => {
    AsyncStorage.getItem("mapStylePref").then((pref) => {
      if (pref) setUseDarkMap(pref === "dark");
    }).catch(() => {});
  }, []);

  const handleToggleMapStyle = () => {
    if (isSwitchingMapStyle) return;
    setIsSwitchingMapStyle(true);
    setUseDarkMap((prev) => {
      const next = !prev;
      AsyncStorage.setItem("mapStylePref", next ? "dark" : "light").catch(() => {});
      return next;
    });
    setTimeout(() => setIsSwitchingMapStyle(false), 300);
  };

  const handleCenterMyLocation = () => {
    if (!driverCoords) return;
    setIsCentering(true);

    // Religa o modo "seguir motorista"
    followingRef.current = true;
    setIsFollowing(true);
    lastCameraUpdateRef.current = 0;

    const navMode =
      statusRef.current === "driver_arriving" ||
      statusRef.current === "in_progress";

    // Vista de topo (sem inclinação), seguindo o motorista
    mapRef.current?.animateCamera(
      {
        center: driverCoords,
        pitch: 0,
        heading: lastHeadingRef.current ?? 0,
        zoom: navMode ? 18.4 : 16.5,
      },
      { duration: 600 },
    );
    setTimeout(() => setIsCentering(false), 700);
  };

  // Desliga o "seguir" quando o usuário arrasta/dá zoom no mapa
  const handleUserMapGesture = useCallback(() => {
    if (followingRef.current) {
      followingRef.current = false;
      setIsFollowing(false);
    }
  }, []);

  const handleMapReady = useCallback(() => {
    setMapReady(true);
  }, []);


  const handleSOS = () => {
    try {
      (navigation as any).navigate("DriverSafety");
    } catch {}
  };

  const [actionLoading, setActionLoading] = useState<
    null | "cancel" | "driver_arriving" | "arrived" | "in_progress" | "completed" | "arrived_at_dropoff"
  >(null);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedCancelReason, setSelectedCancelReason] = useState<
    string | null
  >(null);

  const cancelReasons = useMemo<CancelReason[]>(
    () => [
      { id: "client_no_show", label: "Cliente nao apareceu" },
      { id: "wrong_pickup", label: "Local de coleta incorreto" },
      { id: "vehicle_issue", label: "Problema com o veiculo" },
      { id: "safety", label: "Problema de seguranca" },
      { id: "accident", label: "Acidente / imprevisto" },
      { id: "other", label: "Outro" },
    ],
    [],
  );

  // Problema na ENTREGA no destino (destinatário ausente / endereço errado).
  const [deliveryProblemOpen, setDeliveryProblemOpen] = useState(false);
  const [selectedProblemReason, setSelectedProblemReason] = useState<string | null>(null);
  const deliveryProblemReasons = useMemo<CancelReason[]>(
    () => [
      { id: "recipient_absent", label: "Destinatário ausente" },
      { id: "wrong_address", label: "Endereço incorreto" },
      { id: "refused", label: "Destinatário recusou receber" },
      { id: "inaccessible", label: "Local inacessível" },
      { id: "other", label: "Outro motivo" },
    ],
    [],
  );

  const isDelivery = ride?.serviceType === "delivery";

  const statusLabel = useMemo(() => {
    if (!status) return "-";
    if (status === "payment_pending") return "Aguardando pagamento do cliente";
    if (status === "driver_arriving") return isDelivery ? "A caminho da coleta" : "A caminho do embarque";
    if (status === "driver_assigned") return isDelivery ? "Entrega reservada" : "Corrida reservada";
    if (status === "accepted") return "Aceita";
    if (status === "arrived") return "Cheguei";
    if (status === "in_progress") return "Em andamento";
    if (status === "completed") return "Finalizada";
    if (String(status).startsWith("cancelled")) return "Cancelada";
    return status;
  }, [status, isDelivery]);

  const isAwaitingPayment = status === "payment_pending";
  const arrivedAtDropoff = Boolean(ride?.arrivedAtDropoff);

  const handleNotificationPress = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setChatNotification(null);
      if (rideId) {
        useChatStore.getState().clearUnread(rideId);
        (navigation as any).navigate("DriverChat", {
          rideId,
          clientName: chatNotification?.sender || "Cliente",
        });
      }
    });
  };

  const handleNotificationClose = () => {
    if (notificationTimeoutRef.current) {
      clearTimeout(notificationTimeoutRef.current);
    }
    Animated.timing(slideAnim, {
      toValue: 400,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setChatNotification(null);
    });
  };

  const canArrive =
    status === "accepted" ||
    status === "driver_assigned" ||
    status === "driver_arriving";
  const canStart = status === "arrived";
  const canComplete = status === "in_progress" && (!isDelivery || arrivedAtDropoff);
  const canArriveDropoff = isDelivery && status === "in_progress" && !arrivedAtDropoff;
  const canCancel =
    status === "payment_pending" ||
    status === "accepted" ||
    status === "driver_assigned" ||
    status === "driver_arriving" ||
    status === "arrived" ||
    status === "in_progress";

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  const recoverActiveRide = useCallback(async () => {
    try {
      const active = await rideService.getActive();
      if (active?.active && active.ride?._id) {
        const activeRideId = String(active.ride._id);
        if (!rideId || activeRideId !== String(rideId)) {
          (navigation as any).reset({
            index: 0,
            routes: [{ name: "DriverRide", params: { rideId: activeRideId } }],
          });
        }
        return;
      }
    } catch {}

    (navigation as any).reset({
      index: 0,
      routes: [{ name: "DriverHome" }],
    });
  }, [navigation, rideId]);

  useEffect(() => {
    if (!rideId) return;
    if (!["accepted", "driver_assigned"].includes(status)) return;
    if (autoArrivingRequestedRef.current) return;

    autoArrivingRequestedRef.current = true;

    (async () => {
      try {
        const updated = await rideService.updateStatus(rideId, "driver_arriving");
        setRide(updated as any);
        setStatus(updated?.status || "driver_arriving");
      } catch {
        // fallback silencioso: mantem fluxo com status atual
      }
    })();
  }, [rideId, status]);

  async function takePhotoBase64() {
    if (AppState.currentState !== "active") {
      throw new Error("Abra o app e tente novamente para usar a camera.");
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      throw new Error("Permissao de camera negada");
    }

    let result: ImagePicker.ImagePickerResult;
    try {
      result = await ImagePicker.launchCameraAsync({
        quality: 0.6,
        base64: true,
      });
    } catch (e: any) {
      const msg = String(e?.message || "");
      if (msg.toLowerCase().includes("current activity")) {
        throw new Error(
          "Nao foi possivel abrir a camera agora. Volte para o app e tente novamente.",
        );
      }
      throw e;
    }

    if (result.canceled) {
      throw new Error("Foto cancelada");
    }

    const asset = result.assets?.[0];
    if (!asset?.base64) {
      throw new Error("Nao foi possivel ler a foto");
    }

    return `data:image/jpeg;base64,${asset.base64}`;
  }

  async function askContinueWithoutPhoto(): Promise<boolean> {
    return new Promise((resolve) => {
      Alert.alert(
        "Camera indisponivel",
        "Nao foi possivel abrir a camera agora. Deseja continuar sem enviar foto?",
        [
          { text: "Voltar", style: "cancel", onPress: () => resolve(false) },
          { text: "Continuar", style: "default", onPress: () => resolve(true) },
        ],
        { cancelable: true },
      );
    });
  }

  useEffect(() => {
    let mounted = true;
    if (!rideId) {
      recoverActiveRide().catch(() => {});
      return;
    }
    autoArrivingRequestedRef.current = false;
    cancelHandledRef.current = false;

    (async () => {
      try {
        const r = await rideService.getById(rideId);
        if (!mounted) return;
        setRide(r as any);
        setStatus(r?.status || "accepted");
      } catch (e) {
                if (mounted) {
          recoverActiveRide().catch(() => {});
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [recoverActiveRide, rideId]);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    let timer: any = null;
    const handleCancelledOnce = (message?: string) => {
      if (!mounted || cancelHandledRef.current) return;
      cancelHandledRef.current = true;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      Toast.show({
        type: "info",
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
        text2: message,
      });
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "DriverHome" }],
      });
    };

    const syncRide = async () => {
      try {
        const current = await rideService.getById(rideId);
        if (!mounted) return;

        setRide(current as any);
        setStatus(current?.status || "accepted");

        if (String(current?.status || "").startsWith("cancelled")) {
          handleCancelledOnce(
            isDelivery
              ? "O cliente encerrou a entrega."
              : "O cliente encerrou a corrida.",
          );
        }
      } catch {
        // segue silencioso para evitar loop de erro em polling
      }
    };

    timer = setInterval(syncRide, 7000);

    return () => {
      mounted = false;
      if (timer) clearInterval(timer);
    };
  }, [navigation, rideId]);

  useEffect(() => {
    if (!rideId) return;

    let mounted = true;
    const handleCancelledOnce = (message?: string) => {
      if (!mounted || cancelHandledRef.current) return;
      cancelHandledRef.current = true;
      Toast.show({
        type: "info",
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
        text2: message,
      });
      (navigation as any).reset({
        index: 0,
        routes: [{ name: "DriverHome" }],
      });
    };

    const onPaymentConfirmedLocal = () => {
      if (!mounted) return;
      Toast.show({
        type: "success",
        text1: "Pagamento recebido!",
        text2: "O cliente efetuou o pagamento via PIX.",
      });
      setPixModalVisible(false);
      setTimeout(() => {
        update("completed");
      }, 500);
    };

    const channel = supabase
      .channel(`ride:${rideId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rides",
          filter: `id=eq.${rideId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as any;
          if (row.status) {
            setStatus(String(row.status));
            setRide({
              ...row,
              serviceType: row.service_type || row.serviceType,
              vehicleType: row.vehicle_type || row.vehicleType,
            } as any);
          }
          if (String(row.status || "").startsWith("cancelled")) {
            handleCancelledOnce(
              isDelivery
                ? "O cliente encerrou a entrega."
                : "O cliente encerrou a corrida.",
            );
          }
          if (
            row.payment?.status === "paid" ||
            row.status === "payment_confirmed"
          ) {
            onPaymentConfirmedLocal();
          }
        },
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [navigation, rideId, currentUserId]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      const prevState = lastAppStateRef.current;
      lastAppStateRef.current = nextState;

      const resumed =
        prevState.match(/inactive|background/) && nextState === "active";

      if (!resumed) return;

      (async () => {
        if (!rideId) {
          await recoverActiveRide();
          return;
        }

        try {
          const current = await rideService.getById(rideId);
          setRide(current as any);
          setStatus(current?.status || "accepted");

          const currentStatus = String(current?.status || "");
          if (currentStatus === "completed") {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: "DriverRateClient", params: { rideId } }],
            });
            return;
          }

          if (currentStatus.startsWith("cancelled")) {
            (navigation as any).reset({
              index: 0,
              routes: [{ name: "DriverHome" }],
            });
          }
        } catch {
          await recoverActiveRide();
        }
      })().catch(() => {});
    });

    return () => subscription.remove();
  }, [navigation, recoverActiveRide, rideId]);

  useEffect(() => {
    const start = async () => {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      if (permissionStatus !== "granted") return;

      const tick = async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          const current = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
          setDriverCoords(current);
          setLiveSpeedKmh(
            typeof pos.coords.speed === "number" && pos.coords.speed > 0
              ? Math.max(0, pos.coords.speed * 3.6)
              : 0,
          );

          // Salvar telemetria na trajetória real
          realTrajectoryRef.current.push({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            timestamp: new Date().toISOString(),
          });

          driverLocationService.update({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            heading: pos.coords.heading ?? undefined,
            speed: pos.coords.speed ?? undefined,
            status: "busy",
            vehicleType: vehicleType as any,
          }).catch(() => {});

          const navMode =
            statusRef.current === "driver_arriving" ||
            statusRef.current === "in_progress";

          const now = Date.now();
          if (followingRef.current && now - lastCameraUpdateRef.current > 700) {
            lastCameraUpdateRef.current = now;
            // Prioriza a bússola suavizada; cai para o heading do GPS se ainda não houver leitura
            const camHeading =
              lastHeadingRef.current ?? pos.coords.heading ?? 0;
            mapRef.current?.animateCamera(
              {
                center: current,
                pitch: 0,
                heading: camHeading,
                zoom: navMode ? (statusRef.current === "in_progress" ? 18.6 : 18.3) : 17,
              },
              { duration: 450 },
            );
          }
        } catch {}
      };

      await tick();
      intervalRef.current = setInterval(tick, 4000);
    };

    start();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  // Bússola física: gira o mapa e o puck suavemente entre as atualizações de posição (estilo Uber)
  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;
    let active = true;

    (async () => {
      try {
        const { status: permissionStatus } =
          await Location.requestForegroundPermissionsAsync();
        if (permissionStatus !== "granted" || !active) return;

        subscription = await Location.watchHeadingAsync((data) => {
          if (!active) return;
          const raw = data.trueHeading !== -1 ? data.trueHeading : data.magHeading;
          if (raw == null || raw === -1) return;

          const smoothed = smoothHeading(lastHeadingRef.current, raw, 0.4);
          lastHeadingRef.current = smoothed;

          const now = Date.now();
          // Atualiza a rotação do puck (re-render) no máximo a cada 120ms
          if (now - lastHeadingSetRef.current > 120) {
            lastHeadingSetRef.current = now;
            setNavHeading(smoothed);
          }

          // Gira a câmera entre os ticks de posição, no máximo a cada 250ms
          const navMode =
            statusRef.current === "driver_arriving" ||
            statusRef.current === "in_progress";
          if (followingRef.current && navMode && mapRef.current && now - lastRotateRef.current > 250) {
            lastRotateRef.current = now;
            mapRef.current.animateCamera({ heading: smoothed }, { duration: 250 });
          }
        });
      } catch (e) {
        console.warn("watchHeading falhou:", e);
      }
    })();

    return () => {
      active = false;
      subscription?.remove();
    };
  }, []);


  const handleArriveDropoff = async () => {
    if (!rideId) return;
    setActionLoading("arrived_at_dropoff");
    try {
      const r = await rideService.updateStatus(rideId, undefined as any, true);
      setRide(r as any);
      setStatus(r?.status || status);
      Toast.show({ type: "success", text1: "Chegada no destino registrada" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setActionLoading(null);
    }
  };
  const update = async (
    nextStatus: "driver_arriving" | "arrived" | "in_progress" | "completed",
  ) => {
    if (!rideId) return;

    // validacoes do fluxo (estilo Uber/99)
    if (
      nextStatus === "driver_arriving" &&
      !["accepted", "driver_assigned"].includes(status)
    ) return;
    if (nextStatus === "arrived" && !canArrive) return;
    if (nextStatus === "in_progress" && !canStart) return;
    if (nextStatus === "completed" && !canComplete) return;

    let inputPickupPin: string | undefined = undefined;
    let inputDeliveryPin: string | undefined = undefined;

    // PIN de Coleta: motorista já visualiza o PIN, validar automaticamente via backend
    if (nextStatus === "in_progress" && ride?.details?.pickupPin) {
      inputPickupPin = ride.details.pickupPin;
      try {
        const pinResult = await rideService.validatePin(rideId, "pickup", inputPickupPin);
        if (!pinResult?.valid) {
          Toast.show({ type: "error", text1: "Erro ao validar PIN de coleta" });
          return;
        }
      } catch (pinErr: any) {
        // Se já foi validado anteriormente, ignorar o erro e prosseguir
        const msg = String(pinErr?.message || "");
        if (!msg.includes("já validado") && !msg.includes("already validated")) {
          Toast.show({ type: "error", text1: "Erro ao validar PIN", text2: pinErr?.message });
          return;
        }
      }
    }
    if (nextStatus === "completed" && ride?.details?.deliveryPin) {
      try {
        inputDeliveryPin = await promptForPin("delivery");
      } catch {
        return;
      }
    }

    setActionLoading(nextStatus);
    try {
      const r = await rideService.updateStatus(
        rideId,
        nextStatus,
        false,
        {
          pickupPin: inputPickupPin,
          deliveryPin: inputDeliveryPin,
        },
        nextStatus === "completed" ? realTrajectoryRef.current : undefined
      );
      setRide(r as any);
      setStatus(r?.status || nextStatus);

      if (nextStatus === "driver_arriving") {
        Toast.show({ type: "success", text1: "Voce esta a caminho da coleta" });
      }
      if (nextStatus === "arrived") {
        Toast.show({ type: "success", text1: "Voce marcou: Cheguei" });
        // Redirecionar para confirmacao de coleta (delivery)
        if (isDelivery) {
          setTimeout(() => {
            (navigation as any).navigate("DeliveryPickupConfirm", { rideId });
          }, 500);
          return;
        }
      }
      if (nextStatus === "in_progress") {
        Toast.show({
          type: "success",
          text1: isDelivery ? "Entrega iniciada" : "Corrida iniciada",
        });
      }
      if (nextStatus === "completed") {
        Toast.show({
          type: "success",
          text1: isDelivery ? "Entrega finalizada" : "Corrida finalizada",
        });
        // estilo Uber/99: pedir avaliacao
        (navigation as any).replace("DriverRateClient", { rideId: r._id });
      }
    } catch (e: any) {
      // se o motorista cancelou a foto, nao tratar como erro grave
      const msg = e?.message || "Tente novamente";
      Toast.show({
        type: "error",
        text1: "Nao foi possivel continuar",
        text2: msg,
      });
          } finally {
      setActionLoading(null);
    }
  };

  const cancel = async (reasonId: string) => {
    if (!rideId) return;
    if (!canCancel) return;

    setActionLoading("cancel");
    try {
      await rideService.cancel(rideId, reasonId);
      Toast.show({
        type: "success",
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      });
      setCancelModalOpen(false);
      setSelectedCancelReason(null);
      (navigation as any).reset({ index: 0, routes: [{ name: "DriverHome" }] });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel cancelar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setActionLoading(null);
    }
  };

  // Relatar problema na ENTREGA (destinatário ausente / endereço errado) → devolução.
  const reportDeliveryProblem = async (reasonId: string) => {
    if (!rideId) return;
    setActionLoading("cancel");
    try {
      await rideService.reportDeliveryProblem(rideId, { reason: reasonId });
      Toast.show({
        type: "success",
        text1: "Problema registrado",
        text2: "Devolução acionada. Você foi remunerado pela entrega + retorno.",
      });
      setDeliveryProblemOpen(false);
      setSelectedProblemReason(null);
      (navigation as any).reset({ index: 0, routes: [{ name: "DriverHome" }] });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível registrar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const initialRegion = {
    latitude: ride?.pickup?.latitude ?? -23.5505,
    longitude: ride?.pickup?.longitude ?? -46.6333,
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };
  const pickupLat = Number(ride?.pickup?.latitude);
  const pickupLng = Number(ride?.pickup?.longitude);
  const dropoffLat = Number(ride?.dropoff?.latitude);
  const dropoffLng = Number(ride?.dropoff?.longitude);
  const hasPickupCoords = Number.isFinite(pickupLat) && Number.isFinite(pickupLng);
  const hasDropoffCoords = Number.isFinite(dropoffLat) && Number.isFinite(dropoffLng);
  const rideStops = Array.isArray(ride?.stops) ? (ride!.stops as any[]) : [];

  const targetCoords =
    status === "in_progress"
      ? hasDropoffCoords
        ? {
            latitude: dropoffLat,
            longitude: dropoffLng,
          }
        : null
      : hasPickupCoords
        ? {
            latitude: pickupLat,
            longitude: pickupLng,
          }
        : null;

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const run = async () => {
      if (!driverCoords || !targetCoords) return;
      const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
      if (!key) return;

      try {
        const origin = `${driverCoords.latitude},${driverCoords.longitude}`;
        const destination = `${targetCoords.latitude},${targetCoords.longitude}`;
        
        let waypointsQuery = "";
        if (status === "in_progress" && Array.isArray(rideStops) && rideStops.length > 0) {
          const wpString = rideStops.map((s: any) => `${s.latitude},${s.longitude}`).join("|");
          waypointsQuery = `&waypoints=${encodeURIComponent(wpString)}`;
        }

        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(origin)}` +
          `&destination=${encodeURIComponent(destination)}${waypointsQuery}&mode=driving&key=${encodeURIComponent(key)}`;

        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;

        const route = data?.routes?.[0];
        const leg = route?.legs?.[0];
        const points = route?.overview_polyline?.points;
        if (!route || !leg || !points) return;

        setLiveEtaText(String(leg?.duration?.text || ""));
        setLiveDistanceText(String(leg?.distance?.text || ""));
        setRouteCoords(decodePolyline(points));
      } catch {}
    };

    run();
    timer = setInterval(run, 8000);

    return () => {
      active = false;
      if (timer) clearInterval(timer);
    };
  }, [
    driverCoords?.latitude,
    driverCoords?.longitude,
    targetCoords?.latitude,
    targetCoords?.longitude,
    status,
    JSON.stringify(rideStops),
  ]);

  const isNavMode =
    navigationModeEnabled &&
    (status === "driver_arriving" || status === "in_progress");

  // Câmera 3D inicial: garante a perspectiva inclinada assim que o mapa carrega,
  // mesmo antes do GPS travar (evita a tela ficar achatada em 2D / topo).
  useEffect(() => {
    if (!mapReady || didInitial3DRef.current || !mapRef.current) return;

    const center =
      driverCoords ??
      targetCoords ??
      { latitude: initialRegion.latitude, longitude: initialRegion.longitude };
    if (!center) return;

    didInitial3DRef.current = true;
    mapRef.current.animateCamera(
      {
        center,
        pitch:0,
        heading: 0,
        zoom: isNavMode ? 18.2 : 16,
      },
      { duration: 800 },
    );
  }, [mapReady, driverCoords, targetCoords, isNavMode]);

  // Após o puck aparecer pela primeira vez, congela o tracking de mudanças (performance)
  useEffect(() => {
    if (driverCoords && !puckRendered) {
      const t = setTimeout(() => setPuckRendered(true), 1500);
      return () => clearTimeout(t);
    }
  }, [driverCoords, puckRendered]);

  // Deixa os pins (coleta/destino) renderizarem e depois congela (evita o ícone sumir no Android)
  useEffect(() => {
    const t = setTimeout(() => setMarkersReady(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const driverAvatar = useAuthStore((s) => s.userData?.profilePhoto || s.userData?.fotoPerfil);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }} edges={["top"]}>
      <ActiveDeliveryHeader
        driverPhoto={driverAvatar}
        isDelivery={isDelivery}
        canCancel={canCancel}
        status={status}
        onCancelPress={() => {
          try {
            (navigation as any).navigate("DriverCancelRide", { rideId });
          } catch {
            setCancelModalOpen(true);
          }
        }}
      />

      <View style={{ flex: 1 }}>
        <GlobalMap
          initialRegion={initialRegion as any}
          showsUserLocation={false}
          useDarkStyle={useDarkMap}
          mapPadding={{ top: 0, right: 0, left: 0, bottom: Math.max(sheetHeight - 24, 0) }}
          onPanDrag={handleUserMapGesture}
          onRegionChange={(_region: any, details: any) => {
            // Só desliga o follow em gestos do usuário (não em animações programáticas)
            if (details?.isGesture) handleUserMapGesture();
          }}
          onMapRef={(ref) => {
            mapRef.current = ref;
          }}
          onMapReady={handleMapReady}
        >
          {/* TRAÇADO DE ROTA */}
          {routeCoords.length >= 2 ? (
            <Polyline
              coordinates={routeCoords as any}
              strokeWidth={isNavMode ? 9 : 5}
              strokeColor={isNavMode ? "#0A0A0A" : "#02de95"}
              lineCap="round"
              lineJoin="round"
            />
          ) : !!driverCoords && !!targetCoords ? (
            <Polyline
              coordinates={[driverCoords, targetCoords] as any}
              strokeWidth={isNavMode ? 9 : 5}
              strokeColor={isNavMode ? "#0A0A0A" : "#02de95"}
              lineCap="round"
              lineJoin="round"
            />
          ) : null}

          {/* MARCADOR DO MOTORISTA */}
          {!!driverCoords && (
            <Marker
              key={`driver-puck-${vehicleType}`}
              coordinate={{
                latitude: driverCoords.latitude,
                longitude: driverCoords.longitude,
              }}
              flat={true}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges={true}
              style={{ width: 40, height: 40 }}
            >
              <VehicleMarker
                type={vehicleType as any}
                isOnline={true}
              />
            </Marker>
          )}

          {/* Cliente em tempo real (apenas fora do modo navegação) */}
          {!isNavMode && !!clientCoords && (
             <Marker
               coordinate={{
                 latitude: clientCoords.latitude,
                 longitude: clientCoords.longitude,
               }}
               title="Cliente"
               tracksViewChanges={!markersReady}
               anchor={{ x: 0.35, y: 0.75 }}
             >
               <RoutePin variant="client" />
             </Marker>
          )}

          {/* PARADAS: marcador distinto ao longo do trajeto */}
          {rideStops.map((stop, idx) => {
            const sLat = Number(stop?.latitude);
            const sLng = Number(stop?.longitude);
            if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return null;
            return (
              <Marker
                key={`stop-${idx}`}
                coordinate={{ latitude: sLat, longitude: sLng }}
                title={`Parada ${idx + 1}`}
                tracksViewChanges={!markersReady}
                anchor={{ x: 0.5, y: 1 }}
              >
                <StopPin index={idx + 1} />
              </Marker>
            );
          })}

          {/* PIN DE COLETA: mostra enquanto o alvo é a coleta */}
          {hasPickupCoords && status !== "in_progress" && (
            <Marker
              coordinate={{
                latitude: pickupLat,
                longitude: pickupLng,
              }}
              title="Coleta"
              tracksViewChanges={true}
              anchor={{ x: 0.35, y: 0.75 }}
            >
              <RoutePin variant="pickup" />
            </Marker>
          )}

          {/* PIN DE DESTINO (desenhado com Views — sempre renderiza no Android) */}
          {hasDropoffCoords && (
            <Marker
              coordinate={{
                latitude: dropoffLat,
                longitude: dropoffLng,
              }}
              title="Destino"
              tracksViewChanges={true}
              anchor={{ x: 0.35, y: 0.75 }}
            >
              <RoutePin variant="dropoff" />
            </Marker>
          )}
        </GlobalMap>


        {/* Floating GPS Map Controls */}
        <FloatingMapControls
          duration={liveEtaText || ride?.duration?.text}
          onCenterLocation={handleCenterMyLocation}
          onToggleStyle={handleToggleMapStyle}
          isCentering={isCentering}
          isSwitchingStyle={isSwitchingMapStyle}
        />

        {/* Active Delivery Bottom Sheet */}
        <View
          style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 0 && Math.abs(h - sheetHeight) > 4) setSheetHeight(h);
          }}
        >
          <ActiveDeliveryBottomSheet
            status={status}
            pickupAddress={ride?.pickup?.address}
            dropoffAddress={ride?.dropoff?.address}
            distance={liveDistanceText || ride?.distance?.text}
            duration={liveEtaText || ride?.duration?.text}
            earnings={ride?.pricing?.total || ride?.pricing?.driverValue}
            paymentLabel={getPaymentMethodType(ride?.payment)}
            recipientPhone={ride?.details?.recipientPhone}
            unreadCount={unreadCount}
            onChat={() => {
              if (!rideId) return;
              useChatStore.getState().clearUnread(rideId);
              (navigation as any).navigate("DriverChat", {
                rideId,
                clientName: (ride?.clientId as any)?.name || "Cliente",
              });
            }}
            onReportProblem={() => {
              // Entrega em andamento no destino → fluxo de problema/devolução.
              if (isDelivery && status === "in_progress") {
                setDeliveryProblemOpen(true);
                return;
              }
              try {
                (navigation as any).navigate("DriverCancelRide", { rideId });
              } catch {
                setCancelModalOpen(true);
              }
            }}
            onPrimaryActionPress={() => {
              if (canArrive) {
                update("arrived");
              } else if (canStart) {
                // Para entregas, abrir tela de confirmação de coleta (PIN + dados)
                if (isDelivery) {
                  (navigation as any).navigate("DeliveryPickupConfirm", { rideId });
                } else {
                  update("in_progress");
                }
              } else if (canComplete) {
                // Para entregas, abrir tela de confirmação de entrega (PIN de entrega)
                if (isDelivery) {
                  (navigation as any).navigate("DeliveryDropoffConfirm", { rideId });
                } else {
                  update("completed");
                }
              }
            }}
            actionLoading={actionLoading != null}
            canArrive={canArrive}
            canStart={canStart}
            canComplete={canComplete}
            isDelivery={isDelivery}
            canArriveDropoff={canArriveDropoff}
            onArriveDropoff={handleArriveDropoff}
          />
        </View>
      </View>

      <DriverCancelReasonModal
        visible={cancelModalOpen}
        reasons={cancelReasons}
        selectedReasonId={selectedCancelReason}
        onSelectReason={setSelectedCancelReason}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={() => {
          if (!selectedCancelReason) return;
          cancel(selectedCancelReason);
        }}
        confirmDisabled={!selectedCancelReason || actionLoading != null}
        confirmLabel={
          actionLoading === "cancel" ? "Cancelando..." : "Confirmar"
        }
      />

      <DriverCancelReasonModal
        visible={deliveryProblemOpen}
        title="Problema na entrega"
        subtitle="O que aconteceu no destino?"
        infoNote={
          "Confirme apenas após tentar contato com o cliente. Você devolverá o pacote à origem e será remunerado pela entrega + retorno (com acréscimo). O cliente é cobrado pela tentativa."
        }
        reasons={deliveryProblemReasons}
        selectedReasonId={selectedProblemReason}
        onSelectReason={setSelectedProblemReason}
        onClose={() => setDeliveryProblemOpen(false)}
        onConfirm={() => {
          if (!selectedProblemReason) return;
          reportDeliveryProblem(selectedProblemReason);
        }}
        confirmDisabled={!selectedProblemReason || actionLoading != null}
        confirmLabel={actionLoading === "cancel" ? "Registrando..." : "Confirmar devolução"}
      />

      <Modal
        visible={pinModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => onPinCancel?.()}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(9, 26, 47, 0.85)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <View style={{
            width: "100%",
            maxWidth: 340,
            backgroundColor: "#0c1927",
            borderRadius: 16,
            borderWidth: 1,
            borderColor: "rgba(2, 222, 149, 0.25)",
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <Text style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 8,
            }}>
              {pinType === "pickup" ? "Segurança na Coleta" : "Segurança na Entrega"}
            </Text>
            
            <Text style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 13,
              textAlign: "center",
              lineHeight: 18,
              marginBottom: 20,
            }}>
              {pinType === "pickup" 
                ? "Use o código exibido para identificar o pedido no estabelecimento." 
                : "Solicite o PIN de Entrega com o recebedor para poder finalizar a corrida."}
            </Text>

            <TextInput
              style={{
                width: 160,
                height: 52,
                backgroundColor: "rgba(255,255,255,0.05)",
                borderWidth: 1.5,
                borderColor: "#02de95",
                borderRadius: 8,
                color: "#fff",
                fontSize: 22,
                fontWeight: "900",
                textAlign: "center",
                letterSpacing: 8,
                paddingLeft: 8,
                marginBottom: 24,
              }}
              value={pinValue}
              onChangeText={(txt) => setPinValue(txt.replace(/[^0-9]/g, ""))}
              placeholder="0000"
              placeholderTextColor="rgba(255,255,255,0.2)"
              keyboardType="number-pad"
              maxLength={4}
              autoFocus={true}
            />

            <View style={{
              flexDirection: "row",
              width: "100%",
              gap: 12,
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: "rgba(239, 68, 68, 0.12)",
                  borderWidth: 1,
                  borderColor: "rgba(239, 68, 68, 0.3)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                onPress={() => onPinCancel?.()}
              >
                <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 13 }}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  height: 44,
                  borderRadius: 8,
                  backgroundColor: pinValue.length === 4 ? "#02de95" : "rgba(2, 222, 149, 0.2)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                disabled={pinValue.length !== 4}
                onPress={() => {
                  if (pinValue.length === 4) {
                    onPinSubmit?.(pinValue);
                  }
                }}
              >
                <Text style={{ color: pinValue.length === 4 ? "#091A2F" : "rgba(255,255,255,0.5)", fontWeight: "900", fontSize: 13 }}>
                  Confirmar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Chat Notification Banner */}
      {/* Modal do QR Code PIX para o motorista */}
      <Modal
        visible={pixModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPixModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(9, 26, 47, 0.9)",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}>
          <View style={{
            width: "100%",
            maxWidth: 345,
            backgroundColor: "#0c1927",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "rgba(50, 188, 173, 0.25)",
            padding: 24,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.4,
            shadowRadius: 12,
            elevation: 10,
          }}>
            <Text style={{
              color: "#fff",
              fontSize: 20,
              fontWeight: "900",
              textAlign: "center",
              marginBottom: 4,
            }}>
              Pagamento via PIX
            </Text>
            
            <Text style={{
              color: "#32BCAD",
              fontSize: 13,
              fontWeight: "700",
              textAlign: "center",
              marginBottom: 20,
            }}>
              Mostre o QR Code ao cliente para pagar
            </Text>

            {pixGenerating ? (
              <View style={{ height: 200, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color="#32BCAD" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginTop: 12, fontWeight: "600" }}>
                  Gerando QR Code PIX...
                </Text>
              </View>
            ) : pixData ? (
              <View style={{ alignItems: "center", width: "100%" }}>
                {/* QR Code Container */}
                <View style={{
                  backgroundColor: "#fff",
                  padding: 12,
                  borderRadius: 16,
                  marginBottom: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 8,
                }}>
                  {pixData.qrCodeData ? (
                    <Image
                      source={{ uri: pixData.qrCodeData }}
                      style={{ width: 180, height: 180 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={{ width: 180, height: 180, justifyContent: "center", alignItems: "center" }}>
                      <ActivityIndicator size="small" color="#091A2F" />
                    </View>
                  )}
                </View>

                {/* Valor */}
                <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginBottom: 16 }}>
                  R$ {pixData.amount ? Number(pixData.amount).toFixed(2).replace(".", ",") : "0,00"}
                </Text>

                {/* Copia e Cola */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: "rgba(255,255,255,0.05)",
                    borderWidth: 1.2,
                    borderColor: "rgba(255,255,255,0.12)",
                    borderRadius: 12,
                    paddingVertical: 12,
                    paddingHorizontal: 16,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    width: "100%",
                    marginBottom: 24,
                  }}
                  onPress={() => {
                    Clipboard.setString(pixData.pixCode || "");
                    Toast.show({ type: "success", text1: "PIX Copia e Cola copiado!" });
                  }}
                >
                  <Text
                    style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }}
                    numberOfLines={1}
                  >
                    {pixData.pixCode || "Código PIX"}
                  </Text>
                  <Text style={{ color: "#32BCAD", fontSize: 12, fontWeight: "900" }}>
                    COPIAR
                  </Text>
                </TouchableOpacity>

                {/* Actions */}
                <View style={{ flexDirection: "row", width: "100%", gap: 12 }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "rgba(239, 68, 68, 0.12)",
                      borderWidth: 1,
                      borderColor: "rgba(239, 68, 68, 0.3)",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => setPixModalVisible(false)}
                  >
                    <Text style={{ color: "#ef4444", fontWeight: "700", fontSize: 14 }}>
                      Fechar
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={{
                      flex: 1,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: "#32BCAD",
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                    disabled={pixConfirming}
                    onPress={handleConfirmPixMock}
                  >
                    {pixConfirming ? (
                      <ActivityIndicator size="small" color="#091A2F" />
                    ) : (
                      <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14 }}>
                        Confirmar PIX
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={{ height: 100, justifyContent: "center", alignItems: "center" }}>
                <Text style={{ color: "#ef4444", fontWeight: "700" }}>Erro ao carregar dados do PIX</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {chatNotification && (
        <Animated.View
          style={{
            position: "absolute",
            top: 50, // driver screen uses safe area or top spacing
            left: 16,
            right: 16,
            transform: [{ translateX: slideAnim }],
            zIndex: 9999,
          }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleNotificationPress}
            style={{
              backgroundColor: "#11253E",
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              borderWidth: 1,
              borderColor: "rgba(2,222,149,0.3)",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 10,
            }}
          >
            <View style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "rgba(2,222,149,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}>
              <MessageCircle size={20} color="#02de95" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "800", textTransform: "uppercase" }}>
                Nova mensagem
              </Text>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                {chatNotification.sender}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, marginTop: 1 }} numberOfLines={1}>
                {chatNotification.text}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleNotificationClose}
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: "rgba(255,255,255,0.08)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, fontWeight: "bold" }}>✕</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const puckStyles = StyleSheet.create({
  wrapper: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  // Halo/sombra suave de chão (estilo Uber)
  glow: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0000",
  },
  // Círculo branco com borda clara discreta e sombra (estilo Uber)
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(17, 37, 62, 0.10)",
    borderWidth: 1.5,
    borderColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  // Seta (chevron) escura apontando para cima, igual à da Uber
  arrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 14,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#ffff",
    marginTop: -1,
  },
});


