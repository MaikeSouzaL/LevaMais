import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Linking, Animated, Modal, ActivityIndicator, Clipboard, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Marker, Polyline } from "react-native-maps";
import { Phone, MessageCircle, Home, User, Shield, Info, MapPin, Package, Calendar, Star, QrCode } from "lucide-react-native";
import { createAudioPlayer } from "expo-audio";
import { GlobalMap } from "@/components/GlobalMap";
import RoutePin from "@/components/maps/RoutePin";
import StopPin from "@/components/maps/StopPin";

import { ClientStackParamList } from "../../../types/navigation";
import { getStatusMeta } from "@/utils/statusMeta";
import StatusBadge from "@/components/shared/StatusBadge";
import DeliveryTimeline from "@/components/shared/DeliveryTimeline";
import PINsCard from "@/components/shared/PINsCard";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import chatService from "@/services/chat.service";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/context/authStore";
import { useChatStore } from "@/context/chatStore";
import { resolveAssetURL } from "@/utils/mappers";
import { getPaymentMethodType } from "@/utils/payment";

const getMemberSince = (dateStr?: string) => {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const months = [
      "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
      "Jul", "Ago", "Set", "Out", "Nov", "Dez"
    ];
    return `Parceiro desde ${months[date.getMonth()]}/${date.getFullYear()}`;
  } catch {
    return "";
  }
};

type DeliveryTrackingRouteProp = RouteProp<ClientStackParamList, "DeliveryTracking">;

export default function DeliveryTracking() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const route = useRoute<DeliveryTrackingRouteProp>();
  const { rideId } = route.params as { rideId: string };

  const insets = useSafeAreaInsets();
  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [traveledPath, setTraveledPath] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [liveEtaText, setLiveEtaText] = useState("");
  const [liveDistanceText, setLiveDistanceText] = useState("");
  const [loading, setLoading] = useState(true);
  const [showPixModal, setShowPixModal] = useState(false);
  const [confirmingPix, setConfirmingPix] = useState(false);
  const mapRef = useRef<any>(null);

  useEffect(() => {
    if (mapRef.current && ride) {
      const coords: any[] = [];
      if (ride.pickup?.latitude && ride.pickup?.longitude) {
        coords.push({ latitude: Number(ride.pickup.latitude), longitude: Number(ride.pickup.longitude) });
      }
      if (ride.dropoff?.latitude && ride.dropoff?.longitude) {
        coords.push({ latitude: Number(ride.dropoff.latitude), longitude: Number(ride.dropoff.longitude) });
      }
      if (driverLocation?.latitude && driverLocation?.longitude) {
        coords.push({ latitude: Number(driverLocation.latitude), longitude: Number(driverLocation.longitude) });
      }
      if (ride.routeCoordinates && ride.routeCoordinates.length > 0) {
        ride.routeCoordinates.forEach((pt: any) => {
          if (pt.latitude && pt.longitude) {
            coords.push({ latitude: Number(pt.latitude), longitude: Number(pt.longitude) });
          }
        });
      }

      if (coords.length > 0) {
        const t = setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
            animated: true,
          });
        }, 800);
        return () => clearTimeout(t);
      }
    }
  }, [
    ride?.pickup?.latitude, 
    ride?.pickup?.longitude, 
    ride?.dropoff?.latitude, 
    ride?.dropoff?.longitude, 
    driverLocation?.latitude, 
    driverLocation?.longitude, 
    ride?.routeCoordinates
  ]);

  const currentUserId = useAuthStore((s) => s.userData?.id) || "";
  const [chatNotification, setChatNotification] = useState<{ sender: string; text: string } | null>(null);
  const notificationTimeoutRef = useRef<any>(null);
  const slideAnim = useRef(new Animated.Value(-400)).current;

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
      useChatStore.getState().clearUnread(rideId);
      navigation.navigate("Chat", { rideId, driverName: chatNotification?.sender });
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

  // Refs for stable closure access in WebSocket callbacks and cleanup
  const mountedRef = useRef(true);
  const redirectedRef = useRef(false);
  const rideIdRef = useRef(rideId);
  rideIdRef.current = rideId;

  const loadRide = useCallback(async () => {
    try {
      const data = await rideService.getById(rideIdRef.current);
      if (!mountedRef.current) return;

      if (data && data.status === "completed") {
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        navigation.replace("ClientRateDriver", {
          rideId: data._id || (data as any).id || rideIdRef.current,
          driverName: typeof data.driverId === "string" ? undefined : data.driverId?.name,
          serviceType: data.serviceType || "delivery",
        });
        return;
      } else if (data && String(data.status).startsWith("cancelled")) {
        if (redirectedRef.current) return;
        redirectedRef.current = true;
        Toast.show({
          type: "info",
          text1: "Entrega cancelada",
          text2: "A entrega foi cancelada.",
        });
        navigation.reset({
          index: 0,
          routes: [{ name: "Home" }],
        });
        return;
      }

      setRide(data);
      if ((data as any)?.driverLocation) {
        setDriverLocation((data as any).driverLocation);
      }
    } catch (error) {
      console.error("Erro ao carregar entrega:", error);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [navigation]);

  useEffect(() => {
    mountedRef.current = true;
    redirectedRef.current = false;

    loadRide();

    const onNewMsg = (data: any) => {
      if (!mountedRef.current) return;
      if (String(data?.senderId) === currentUserId) return;

      const sender = data?.senderName || (data?.senderType === "driver" ? "Motorista" : "Cliente");
      const preview = String(data?.message || "").slice(0, 80);

      const navState = navigation.getState?.();
      const activeRoute =
        navState?.routes?.[
          typeof navState?.index === "number" ? navState.index : (navState?.routes?.length || 1) - 1
        ];
      const activeRouteName = String(activeRoute?.name || "");

      if (activeRouteName !== "Chat") {
        useChatStore.getState().incrementUnread(rideIdRef.current);

        // Play sound
        try {
          const player = createAudioPlayer(require("../../../../../../assets/sound/notification.mp3"));
          player.volume = 1.0;
          player.loop = false;
          player.play();
          const subscription = player.addListener("playbackStatusUpdate", (status) => {
            if (status.didJustFinish) {
              subscription.remove();
              player.release();
            }
          });
        } catch (error) {
          console.log("Falha ao reproduzir som:", error);
        }

        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        setChatNotification({ sender, text: preview });
        slideAnim.setValue(-400);
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 40,
          friction: 8,
        }).start();

        notificationTimeoutRef.current = setTimeout(() => {
          if (mountedRef.current) {
            Animated.timing(slideAnim, {
              toValue: 400,
              duration: 300,
              useNativeDriver: true,
            }).start(() => {
              setChatNotification(null);
            });
          }
        }, 10000);
      }
    };

    // Supabase Realtime: escuta mudanças na corrida.
    // Nome de canal ÚNICO por instância: evita "cannot add postgres_changes callbacks
    // after subscribe()" quando o efeito re-roda antes do removeChannel (async) concluir.
    const rideChannel = supabase
      .channel(`ride-delivery:${rideIdRef.current}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "rides", filter: `id=eq.${rideIdRef.current}` },
        (payload) => {
          if (!mountedRef.current) return;
          const row = payload.new as any;
          if (row?.payment?.status === "paid") {
            Toast.show({
              type: "success",
              text1: "Pagamento Confirmado!",
              text2: "Seu pagamento via PIX foi processado com sucesso.",
            });
            setShowPixModal(false);
          }
          loadRide();
        },
      )
      .subscribe();

    // Chat via chatService Supabase Realtime
    const cleanupChat = chatService.onNewMessage(rideIdRef.current, (msg) => {
      onNewMsg(msg);
    });

    return () => {
      mountedRef.current = false;
      supabase.removeChannel(rideChannel);
      cleanupChat();
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, [currentUserId, loadRide, navigation, rideId, slideAnim]);

  // Breadcrumb: trajeto realmente percorrido pelo motorista (route-audit)
  useEffect(() => {
    const activeStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
    if (!activeStatuses.includes(String(ride?.status || ""))) return;

    let active = true;
    const loadTrack = async () => {
      try {
        const audit = await rideService.getRouteAudit(rideIdRef.current);
        if (!active) return;
        const pts = Array.isArray(audit?.track) ? audit.track : [];
        const path = pts
          .filter((p: any) => Number.isFinite(Number(p?.latitude)) && Number.isFinite(Number(p?.longitude)))
          .map((p: any) => ({ latitude: Number(p.latitude), longitude: Number(p.longitude) }));
        if (path.length >= 2) setTraveledPath(path);
      } catch {}
    };
    loadTrack();
    const timer = setInterval(loadTrack, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ride?.status]);

  // Supabase Realtime: posição do motorista em tempo real (complementa o socket)
  useEffect(() => {
    const driverRaw = ride?.driverId;
    const driverId = typeof driverRaw === "string"
      ? driverRaw
      : (driverRaw as any)?._id || (driverRaw as any)?.id;
    if (!driverId) return;

    const channel = supabase
      .channel(`driver-location-delivery:${driverId}:${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "driver_locations", filter: `id=eq.${driverId}` },
        (payload) => {
          const row = payload.new as any;
          const lat = Number(row?.latitude);
          const lng = Number(row?.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          setDriverLocation({ latitude: lat, longitude: lng });
        },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [ride?.driverId]);

  // Métricas em tempo real (ETA + distância): motorista -> alvo atual (coleta ou destino)
  useEffect(() => {
    const status = String(ride?.status || "");
    const activeStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
    if (!activeStatuses.includes(status)) {
      setLiveEtaText("");
      setLiveDistanceText("");
      return;
    }
    if (!driverLocation) return;

    const target =
      status === "in_progress"
        ? ride?.dropoff?.latitude && ride?.dropoff?.longitude
          ? { latitude: Number(ride.dropoff.latitude), longitude: Number(ride.dropoff.longitude) }
          : null
        : ride?.pickup?.latitude && ride?.pickup?.longitude
          ? { latitude: Number(ride.pickup.latitude), longitude: Number(ride.pickup.longitude) }
          : null;
    if (!target) return;

    const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (!key) return;

    let active = true;
    const run = async () => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/directions/json?origin=${encodeURIComponent(`${driverLocation.latitude},${driverLocation.longitude}`)}` +
          `&destination=${encodeURIComponent(`${target.latitude},${target.longitude}`)}&mode=driving&key=${encodeURIComponent(key)}`;
        const res = await fetch(url);
        const data = await res.json();
        if (!active) return;
        const leg = data?.routes?.[0]?.legs?.[0];
        if (leg) {
          setLiveEtaText(String(leg?.duration?.text || ""));
          setLiveDistanceText(String(leg?.distance?.text || ""));
        }
      } catch {}
    };
    run();
    const timer = setInterval(run, 8000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [ride?.status, driverLocation?.latitude, driverLocation?.longitude, ride?.pickup?.latitude, ride?.dropoff?.latitude]);

  const statusMeta = useMemo(() => {
    if (!ride?.status) return null;
    return getStatusMeta(ride.status, "delivery");
  }, [ride?.status]);

  const liveTargetLabel = String(ride?.status || "") === "in_progress" ? "Chegada no destino" : "Chegada na coleta";

  const handleCallDriver = () => {
    if (ride?.driverPhone) {
      Linking.openURL(`tel:${ride.driverPhone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate("Chat", { rideId });
  };

  const handleGoHome = () => {
    // Reset limpa o histórico de navegação — o usuário não volta ao tracking ao pressionar "voltar"
    navigation.reset({
      index: 0,
      routes: [{ name: "Home", params: { suppressAutoRedirect: rideId } }],
    });
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <Text className="text-white text-lg">Carregando...</Text>
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <Text className="text-white text-lg">Entrega nao encontrada</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      {/* Status bar branca (ícones de bateria, hora, sinal visíveis sobre fundo escuro) */}
      <StatusBar barStyle="light-content" backgroundColor="#091A2F" translucent={false} />
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Mapa com cantos arredondados na parte inferior */}
        <View className="h-[280px] bg-[#091A2F] overflow-hidden rounded-b-[32px] border-b border-white/[0.06] shadow-lg shadow-black/50">
          {ride.pickup?.latitude && ride.pickup?.longitude && (
            <GlobalMap
              ref={mapRef}
              showsUserLocation={false}
              useDarkStyle={true}
              initialRegion={{
                latitude: ride.pickup.latitude,
                longitude: ride.pickup.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
            >
              <Marker
                coordinate={{
                  latitude: ride.pickup.latitude,
                  longitude: ride.pickup.longitude,
                }}
                anchor={{ x: 0.35, y: 0.75 }}
                tracksViewChanges={true}
              >
                <RoutePin variant="pickup" />
              </Marker>

              {/* Paradas */}
              {Array.isArray(ride.stops) && ride.stops.map((stop: any, idx: number) => {
                const sLat = Number(stop?.latitude);
                const sLng = Number(stop?.longitude);
                if (!Number.isFinite(sLat) || !Number.isFinite(sLng)) return null;
                return (
                  <Marker
                    key={`stop-${idx}`}
                    coordinate={{ latitude: sLat, longitude: sLng }}
                    anchor={{ x: 0.5, y: 1 }}
                    tracksViewChanges={true}
                  >
                    <StopPin index={idx + 1} />
                  </Marker>
                );
              })}

              {/* Driver location marker */}
              {driverLocation && (
                <Marker
                  coordinate={driverLocation}
                  anchor={{ x: 0.35, y: 0.75 }}
                  tracksViewChanges={true}
                >
                  <RoutePin variant="driver" />
                </Marker>
              )}

              {ride.dropoff?.latitude && ride.dropoff?.longitude && (
                <>
                  <Marker
                    coordinate={{
                      latitude: ride.dropoff.latitude,
                      longitude: ride.dropoff.longitude,
                    }}
                    anchor={{ x: 0.35, y: 0.75 }}
                    tracksViewChanges={true}
                  >
                    <RoutePin variant="dropoff" />
                  </Marker>
                  {traveledPath.length >= 2 && (
                    <Polyline
                      coordinates={traveledPath}
                      strokeColor="rgba(148,163,184,0.65)"
                      strokeWidth={6}
                      lineCap="round"
                      lineJoin="round"
                      zIndex={1}
                    />
                  )}
                  <Polyline
                    coordinates={
                      ride.routeCoordinates && ride.routeCoordinates.length >= 2
                        ? ride.routeCoordinates
                        : [
                            { latitude: ride.pickup.latitude, longitude: ride.pickup.longitude },
                            ...(Array.isArray(ride.stops) ? ride.stops : [])
                              .filter((s: any) => Number.isFinite(Number(s?.latitude)) && Number.isFinite(Number(s?.longitude)))
                              .map((s: any) => ({ latitude: Number(s.latitude), longitude: Number(s.longitude) })),
                            { latitude: ride.dropoff.latitude, longitude: ride.dropoff.longitude },
                          ]
                    }
                    strokeColor="#02de95"
                    strokeWidth={5}
                    lineCap="round"
                    lineJoin="round"
                  />
                </>
              )}
            </GlobalMap>
          )}

          {/* Métricas em tempo real (ETA + distância até o alvo atual) */}
          {(!!liveEtaText || !!liveDistanceText) && (
            <View className="absolute left-3 top-3 flex-row items-center gap-2 px-3 py-2 rounded-full bg-[#091A2F]/90 border border-[#02de95]/25">
              <View className="w-1.5 h-1.5 rounded-full bg-[#02de95]" />
              <Text className="text-white text-[11px] font-extrabold">
                {liveTargetLabel}: {liveEtaText || "--"}{liveDistanceText ? ` • ${liveDistanceText}` : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Timeline */}
        <View className="px-4 pt-4 mb-4">
          <DeliveryTimeline
            status={ride.status}
            arrivedAtDropoff={Boolean(ride.arrivedAtDropoff)}
            rideId={ride._id}
            pickupAddress={ride.pickup?.address}
            dropoffAddress={ride.dropoff?.address}
            durationText={liveEtaText || ride.duration?.text}
            distanceText={liveDistanceText || ride.distance?.text}
            price={ride.pricing?.total}
          />
        </View>

        {/* PINs */}
        <View className="px-4 mb-4">
          <PINsCard
            pickupPin={ride.details?.pickupPin}
            deliveryPin={ride.details?.deliveryPin}
            pickupPinValidated={ride.proofs?.pickupPinValidated}
            deliveryPinValidated={ride.proofs?.deliveryPinValidated}
          />
        </View>

        {/* Detalhes da Entrega */}
        <View className="px-4 mb-4">
          <View className="p-4 rounded-2xl bg-[#11253E] border border-white/[0.05]">
            <View className="flex-row items-center gap-2 mb-4">
              <Package size={16} color="#02de95" />
              <Text className="text-white text-base font-bold">Detalhes da Entrega</Text>
            </View>

            {/* Serviço Contratado */}
            <View className="mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5 flex-row items-center justify-between">
              <View>
                <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Serviço Contratado</Text>
                <Text className="text-[#02de95] text-sm font-extrabold mt-1">
                  {ride.serviceType === "frete" ? "Frete Express" : "Entrega Express"}
                </Text>
              </View>
              <View className="bg-[#02de95]/10 px-3 py-1 rounded-full border border-[#02de95]/20">
                <Text className="text-[#02de95] text-[10px] font-bold uppercase">Ativo</Text>
              </View>
            </View>

            {/* Dados do Motorista (Integrado nos Detalhes) */}
            {ride.driverId && typeof ride.driverId !== "string" ? (
              <View className="mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5">
                <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2.5">Profissional Responsável</Text>
                <View className="flex-row items-center">
                  {ride.driverId.profilePhoto ? (
                    <View className="relative">
                      <Image
                        source={{ uri: resolveAssetURL(ride.driverId.profilePhoto) }}
                        className="w-12 h-12 rounded-full border-2 border-[#02de95]/40"
                      />
                      <View className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#02de95] border-2 border-[#11253E] items-center justify-center" />
                    </View>
                  ) : (
                    <View className="w-12 h-12 rounded-full bg-[#02de95]/15 border border-[#02de95]/30 items-center justify-center">
                      <User size={22} color="#02de95" />
                    </View>
                  )}
                  <View className="flex-1 ml-3">
                    <Text className="text-white text-[14px] font-bold">{ride.driverId.name}</Text>
                    
                    {/* Estrelas e Avaliação do Motorista */}
                    <View className="flex-row items-center gap-1 mt-0.5">
                      <Star size={11} color="#f59e0b" fill="#f59e0b" />
                      <Text className="text-amber-500 text-[11px] font-bold">
                        {(ride.driverId.ratingStats?.averageStars ?? 5.0).toFixed(1)}
                      </Text>
                      <Text className="text-white/30 text-[10px]">
                        ({ride.driverId.ratingStats?.totalRatings ?? 0} avaliações)
                      </Text>
                    </View>

                    {ride.driverId.vehicleInfo && (
                      <Text className="text-white/50 text-[11px] mt-1">
                        {ride.driverId.vehicleInfo.model}
                        {ride.driverId.vehicleInfo.color ? ` · ${ride.driverId.vehicleInfo.color}` : ""}
                        {ride.driverId.vehicleInfo.year ? ` (${ride.driverId.vehicleInfo.year})` : ""}
                        {" · "}
                        <Text className="text-white/80 font-bold" style={{ fontFamily: "monospace" }}>
                          {ride.driverId.vehicleInfo.plate}
                        </Text>
                      </Text>
                    )}

                    {ride.driverId.createdAt && (
                      <Text className="text-white/30 text-[10px] mt-1">
                        {getMemberSince(ride.driverId.createdAt)}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            ) : (
              <View className="mb-4 bg-white/[0.01] border border-white/[0.03] border-dashed rounded-xl p-3.5 items-center justify-center py-5">
                <View className="w-9 h-9 rounded-full bg-amber-500/10 items-center justify-center mb-2">
                  <User size={18} color="#f59e0b" />
                </View>
                <Text className="text-white/80 text-xs font-bold">Aguardando Entregador</Text>
                <Text className="text-white/40 text-[10px] mt-0.5">Buscando o profissional ideal...</Text>
              </View>
            )}

            {/* Grid de Detalhes */}
            {ride.details?.cargoSize && (
              <View className="mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5">
                <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Tamanho do Pacote</Text>
                <Text className="text-white text-sm font-bold mt-1 capitalize">
                  {ride.details.cargoSize === "small"
                    ? "Pequeno"
                    : ride.details.cargoSize === "medium"
                    ? "Médio"
                    : "Grande"}
                </Text>
              </View>
            )}

            {(ride.details?.weight || ride.details?.fragile) && (
              <View className="flex-row mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3.5">
                {ride.details?.weight && (
                  <View className="flex-1">
                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Peso Estimado</Text>
                    <Text className="text-white text-sm font-bold mt-1">{ride.details.weight} kg</Text>
                  </View>
                )}
                {ride.details?.fragile && (
                  <View className={`flex-1 ${ride.details?.weight ? "border-l border-white/[0.06] pl-4" : ""}`}>
                    <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider">Frágil</Text>
                    <View className="flex-row items-center gap-1 mt-1">
                      <View className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <Text className="text-red-400 text-sm font-bold">Sim</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </View>



        {/* Fotos de Prova */}
        {(ride.proofs?.pickupPhoto || ride.proofs?.deliveryPhoto) && (
          <View className="px-4 mb-4">
            <View className="p-4 rounded-2xl bg-[#11253E] border border-white/[0.05]">
              <View className="flex-row items-center gap-2 mb-4">
                <Calendar size={16} color="#02de95" />
                <Text className="text-white text-base font-bold">Comprovantes da Entrega</Text>
              </View>

              {ride.proofs?.pickupPhoto && (
                <View className="mb-4 bg-white/[0.01] border border-white/[0.03] rounded-xl p-3">
                  <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Comprovante de Coleta</Text>
                  <Image
                    source={{ uri: ride.proofs.pickupPhoto }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                </View>
              )}

              {ride.proofs?.deliveryPhoto && (
                <View className="bg-white/[0.01] border border-white/[0.03] rounded-xl p-3">
                  <Text className="text-white/40 text-[10px] font-bold uppercase tracking-wider mb-2">Comprovante de Entrega</Text>
                  <Image
                    source={{ uri: ride.proofs.deliveryPhoto }}
                    className="w-full h-48 rounded-lg"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botoes de Acao Rodapé */}
      <View
        className="px-4 pt-3.5 bg-[#091A2F] border-t border-white/[0.06]"
        style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}
      >
        {getPaymentMethodType(ride?.payment) === "pix" && !!ride?.payment?.pixCode && ride?.payment?.status !== "paid" && (
          <TouchableOpacity
            activeOpacity={0.8}
            className="mb-3 w-full flex-row items-center justify-center gap-2.5 h-14 rounded-2xl bg-[#32BCAD] shadow-lg shadow-[#32BCAD]/15"
            onPress={() => setShowPixModal(true)}
            accessibilityLabel="Pagar com PIX"
            accessibilityRole="button"
          >
            <QrCode size={18} color="#091A2F" />
            <Text className="text-[#091A2F] text-[14px] font-black">PAGAR COM PIX</Text>
          </TouchableOpacity>
        )}

        <View className="flex-row gap-3">
          <TouchableOpacity
            onPress={handleGoHome}
            activeOpacity={0.85}
            className="flex-1 flex-row items-center justify-center h-14 rounded-2xl bg-[#1E2D3D] border border-white/[0.06] shadow-lg shadow-black/20"
          >
            <Home size={18} color="#fff" />
            <Text className="text-white text-[14px] font-black ml-2.5">Início</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChat}
            activeOpacity={0.85}
            className="flex-[1.2] flex-row items-center justify-center h-14 rounded-2xl bg-[#02de95] shadow-lg shadow-[#02de95]/15"
          >
            <MessageCircle size={18} color="#091A2F" />
            <Text className="text-[#091A2F] text-[14px] font-black ml-2.5">Chat</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de Pagamento PIX para o Cliente */}
      <Modal
        visible={showPixModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowPixModal(false)}
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
              Escaneie o QR Code ou copie o código abaixo
            </Text>

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
                {ride?.payment?.qrCodeData ? (
                  <Image
                    source={{ uri: ride.payment.qrCodeData }}
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
                R$ {ride?.pricing?.total ? Number(ride.pricing.total).toFixed(2).replace(".", ",") : "0,00"}
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
                  Clipboard.setString(ride?.payment?.pixCode || "");
                  Toast.show({ type: "success", text1: "PIX Copia e Cola copiado!" });
                }}
              >
                <Text
                  style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600", flex: 1, marginRight: 8 }}
                  numberOfLines={1}
                >
                  {ride?.payment?.pixCode || "Código PIX"}
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
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    borderWidth: 1,
                    borderColor: "rgba(255, 255, 255, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onPress={() => setShowPixModal(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
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
                  disabled={confirmingPix}
                  onPress={async () => {
                    try {
                      setConfirmingPix(true);
                      await rideService.confirmRidePixPaymentMock(rideId);
                      Toast.show({
                        type: "success",
                        text1: "Pagamento confirmado!",
                        text2: "Simulação de pagamento PIX concluída.",
                      });
                      setShowPixModal(false);
                      loadRide();
                    } catch (err: any) {
                      Toast.show({
                        type: "error",
                        text1: "Erro ao confirmar pagamento",
                        text2: err?.message || "Erro desconhecido",
                      });
                    } finally {
                      setConfirmingPix(false);
                    }
                  }}
                >
                  {confirmingPix ? (
                    <ActivityIndicator size="small" color="#091A2F" />
                  ) : (
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14 }}>
                      Simular Pago
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      {/* Floating Chat Notification Banner */}
      {chatNotification && (
        <Animated.View
          style={{
            position: "absolute",
            top: insets.top + 10,
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
