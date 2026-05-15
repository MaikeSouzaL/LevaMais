import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MapView, { PROVIDER_GOOGLE, Marker, Circle } from "react-native-maps";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { AlertTriangle, RefreshCcw, Home, Settings, Info, Clock } from "lucide-react-native";

import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { darkMapStyle } from "@/utils/mapStyle";
import { MapActionButtons } from "@/components/MapActionButtons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// New High-End Components 🛰️
import { RadarScanner } from "@/components/client/searching-delivery/RadarScanner";
import { SearchingHeader } from "@/components/client/searching-delivery/SearchingHeader";
import { NearbyDriversLayer } from "@/components/client/searching-delivery/NearbyDriversLayer";
import { DeliverySearchBottomSheet } from "@/components/client/searching-delivery/DeliverySearchBottomSheet";
import { useRealtimeDelivery } from "@/hooks/useRealtimeDelivery";
import {Modal} from "@/components/Modal";
import { SearchTimeoutView } from "@/components/client/searching-delivery/timeout/SearchTimeoutView";

const SEARCH_TIME = 60; // Tempo de busca padrão caso o banco de dados venha vazio (60 segundos)
const TERMINAL_CANCEL_STATUSES = [
  "cancelled",
  "cancelled_by_client",
  "cancelled_by_driver",
  "cancelled_no_driver",
  "expired",
];

export default function SearchingDriverScreen() {
  const [showQueueModal, setShowQueueModal] = useState(false);
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = route.params?.rideId || "";
  const initialServiceType = route.params?.serviceType;

  const [secondsLeft, setSecondsLeft] = useState(SEARCH_TIME);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [timeout, setTimeoutState] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [adjusting, setAdjusting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkUnstable, setNetworkUnstable] = useState(false);
  const [searchCycle, setSearchCycle] = useState(0);
  const [waitingInQueue, setWaitingInQueue] = useState(false);
  const [enteringQueue, setEnteringQueue] = useState(false);
  const [queueCancelled, setQueueCancelled] = useState(false);
  const [allDriversRejected, setAllDriversRejected] = useState(false);
  const [boostCount, setBoostCount] = useState(0);

  // Ride Context Persistence
  const [rideData, setRideData] = useState<any>(null);
  const effectiveServiceType =
    rideData?.serviceType || initialServiceType || "ride";

  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<any>(null);
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingMapStyle, setIsSwitchingMapStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

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
    if (!pickupCoords) return;
    setIsCentering(true);
    mapRef.current?.animateCamera({
      center: {
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
      },
      zoom: 14,
      pitch: 35,
      heading: 0,
    }, { duration: 800 });
    setTimeout(() => setIsCentering(false), 900);
  };

  const handleSOS = () => {
    try {
      navigation.navigate("ClientSafety");
    } catch {}
  };

  const doneRef = useRef(false);

  // Custom Dynamic Simulation Hook ⚡ - upgraded with continuous tracking
  const pickupCoords = rideData?.pickup?.latitude ? rideData.pickup : null;
  const { drivers, feedMessage, searchState } = useRealtimeDelivery(
    pickupCoords?.latitude,
    pickupCoords?.longitude,
    rideData?.vehicleType || "motorcycle",
    secondsElapsed,
    effectiveServiceType
  );

  const cleanup = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  // 1. Hydrate initial dynamic contextual data from RideID
  useEffect(() => {
    const fetchRide = async () => {
      if (!rideId) return;
      try {
        const data = await rideService.getById(rideId);
        setRideData(data);
        // ⏱️ Sincronização Vital: Seta a contagem regressiva inicial EXATAMENTE com o tempo configurado no banco!
        if (data?.searchTimeoutSeconds && secondsElapsed === 0) {
          setSecondsLeft(data.searchTimeoutSeconds);
        }
      } catch (e) {
              }
    };
    fetchRide();
  }, [rideId]);

  // 🎥 DYNAMIC AUTO-ZOOM & LOGARITHMIC RADIUS EXPANSION
  // Whenever the search radius increases, the camera smoothly floats up to fit the entire radius circle!
  useEffect(() => {
    if (!pickupCoords || !mapRef.current) return;
    
    // 🧠 Cálculo logarítmico preciso de Nível de Zoom baseado no raio dinâmico da busca!
    // Base: Raio de 2.5km mapeia para o zoom ideal 14.2. Para cada dobra do raio, diminuímos 1 nível de zoom.
    const radiusKm = searchState.radius;
    const dynamicZoom = 13.5 - Math.log2(radiusKm / 2.5);

    const timer = setTimeout(() => {
      mapRef.current?.animateCamera({
        center: {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
        },
        zoom: Math.max(2, Math.min(20, dynamicZoom)), // Proteção matemática de limites
        pitch: 35, // Mantém o belíssimo visual técnico 3D inclinado!
        heading: 0,
      }, { duration: 3000 }); // 3 segundos de flutuação super suave e premium
    }, 200);

    return () => clearTimeout(timer);
  }, [searchState.radius, !!pickupCoords]);

  const driverFoundCallback = useCallback(
    (data: any) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cleanup();
      const foundRideId = data?.rideId || data?.ride?._id || rideId;
      navigation.reset({
        index: 0,
        routes: [{ name: "RideTracking", params: { rideId: foundRideId } }],
      });
    },
    [navigation, rideId],
  );

  const rideExpiredCallback = useCallback(async () => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setTimeoutState(true);
    if (rideId) {
      try {
        await rideService.cancel(rideId, "tempo_limite_esgotado");
      } catch (err) {
              }
    }
  }, [rideId]);
  
  const offersUpdatedCallback = useCallback((data: any) => {
    if (data?.rideId === rideId && !doneRef.current) {
      doneRef.current = true;
      cleanup();
      navigation.replace("RideOffersMarketplace", { rideId });
    }
  }, [navigation, rideId]);

  const rideCancelledCallback = useCallback(
    (data: any) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cleanup();
      if (data?.reason === "todos_recusaram") {
        setAllDriversRejected(true);
        setTimeoutState(true);
        return;
      }
      if (data?.reason === "no_driver_found" || data?.reason === "tempo_limite_esgotado") {
        setTimeoutState(true);
        return;
      }
      if (waitingInQueue || data?.reason?.includes("fila de espera")) {
        setQueueCancelled(true);
        return;
      }
      const isDeliveryFlow =
        effectiveServiceType === "delivery" || effectiveServiceType === "frete";
      Toast.show({
        type: "info",
        text1: isDeliveryFlow ? "Entrega cancelada" : "Corrida cancelada",
        text2: data?.reason || "Nenhum motorista disponivel",
      });
      navigation.goBack();
    },
    [navigation, waitingInQueue, effectiveServiceType],
  );

  const connectAndSearch = useCallback(async () => {
    if (!rideId) return;
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    webSocketService.off("ride-offers-updated", offersUpdatedCallback);
    setError(null);
    setNetworkUnstable(false);

    try {
      await webSocketService.connect();
      webSocketService.waitingDriver(rideId);
      webSocketService.onDriverFound(driverFoundCallback);
      webSocketService.onRideExpired(rideExpiredCallback);
      webSocketService.onRideCancelled(rideCancelledCallback);
      webSocketService.on("ride-offers-updated", offersUpdatedCallback);
    } catch (e: any) {
      setError("Conexao instavel. Mantendo busca pelo servidor.");
    }

    let pollFailures = 0;
    const pollInterval = setInterval(async () => {
      if (doneRef.current) {
        clearInterval(pollInterval);
        return;
      }

      try {
        const ride = await rideService.getById(rideId);
        pollFailures = 0;
        setNetworkUnstable(false);
        if (!ride || doneRef.current) {
          clearInterval(pollInterval);
          return;
        }

        // Re-update price/details dynamic if needed
        setRideData(ride);

        // ⚡ NEW: If dynamic negotiation materialized (offers arriving), forward to Marketplace!
        const offerCount = ride.negotiation?.offers?.length || 0;
        if (offerCount > 0 && !doneRef.current) {
           doneRef.current = true;
           clearInterval(pollInterval);
           cleanup();
           navigation.replace("RideOffersMarketplace", { rideId: ride._id });
           return;
        }

        if (
          ride.driverId &&
          ["accepted", "driver_arriving", "arrived", "in_progress"].includes(ride.status)
        ) {
          doneRef.current = true;
          clearInterval(pollInterval);
          driverFoundCallback({ rideId: ride._id, ride });
          return;
        }

        if (TERMINAL_CANCEL_STATUSES.includes(String(ride.status || ""))) {
          doneRef.current = true;
          clearInterval(pollInterval);
          if (String(ride.status) === "cancelled_no_driver") {
            if (ride.isWaitingInQueue || waitingInQueue) {
              setQueueCancelled(true);
            } else {
              rideExpiredCallback();
            }
            return;
          }
          const closedReason =
            ride?.serviceType === "delivery" || ride?.serviceType === "frete"
              ? "Entrega encerrada"
              : "Corrida encerrada";
          rideCancelledCallback({ reason: closedReason, status: ride.status });
        }
      } catch {
        pollFailures += 1;
        if (pollFailures >= 2) {
          setNetworkUnstable(true);
          setError("Conexão instável. Tentando reconectar...");
        }
      }
    }, 4000);

    intervalRef.current = pollInterval;
  }, [rideId, driverFoundCallback, rideExpiredCallback, rideCancelledCallback, waitingInQueue]);

  useEffect(() => {
    connectAndSearch();
    return () => {
      cleanup();
      webSocketService.off("driver-found", driverFoundCallback);
      webSocketService.off("ride-expired", rideExpiredCallback);
      webSocketService.off("ride-cancelled", rideCancelledCallback);
      webSocketService.off("ride-offers-updated", offersUpdatedCallback);
    };
  }, [connectAndSearch, driverFoundCallback, rideCancelledCallback, rideExpiredCallback, offersUpdatedCallback]);

  useEffect(() => {
    const timer = setInterval(() => {
      // Track total lifetime of search for logic progression ⌚
      setSecondsElapsed((prev) => prev + 1);

      setSecondsLeft((prev) => {
        if (prev <= 1) {
          // 🚨 Hit zero! Trigger logical expiration so the UI fallback shows up instead of staying stuck.
          clearInterval(timer);
          rideExpiredCallback();
          return 0; 
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [searchCycle]);

  const handleEnterQueue = async () => {
    if (!rideId || enteringQueue) return;
    setEnteringQueue(true);
    try {
      await rideService.enterWaitingQueue(rideId);
      cleanup();
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { showSuccessQueueModal: true } }],
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao entrar na fila",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setEnteringQueue(false);
    }
  };

  const handleCancel = async () => {
    if (cancelling) return;
    setCancelling(true);
    
    // 🧠 Se o pedido já atingiu um estado terminal no servidor (Timeout, Rejeitado por todos, ou Fila Encerrada),
    // a corrida já está inativa no banco. Não chamamos a API para evitar erros desnecessários de HTTP 400!
    const isAlreadyTerminated = timeout || queueCancelled || allDriversRejected;

    try {
      if (!isAlreadyTerminated) {
        await rideService.cancel(rideId, "Cancelado pelo cliente durante busca");
      }
      
      doneRef.current = true;
      cleanup();
      
      if (!isAlreadyTerminated) {
        Toast.show({ type: "info", text1: "Solicitação cancelada com sucesso." });
      }
      navigation.reset({
        index: 1,
        routes: [
          { name: "Home" },
          { name: "DestinationSearch" },
        ],
      });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Falha ao cancelar" });
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    if (!rideId) return;
    setTimeoutState(false);
    setAllDriversRejected(false);
    setWaitingInQueue(false);
    setSecondsLeft(rideData?.searchTimeoutSeconds || SEARCH_TIME);
    doneRef.current = false;
    setSearchCycle((prev) => prev + 1);
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    // 🔄 EXPLICIT REACTIVATION: Wake up the backend dispatch cycle for this ride again!
    try {
      await rideService.retry(rideId);
    } catch (e: any) {
            Toast.show({ type: "error", text1: "Erro", text2: "Não foi possível reconectar o pedido." });
      return; // Stop restart loop if backend failed to reactivate
    }

    await connectAndSearch();
  };

  const handleIncreaseOffer = useCallback(async (incrementAmount: number) => {
    if (!rideId || adjusting) return;
    try {
      setAdjusting(true);
      const res = await rideService.increaseOffer(rideId, incrementAmount);
      
      // Trigger special golden radar blast ✨🛸
      setBoostCount((prev) => prev + 1);

      // Hydrate local context with latest payload from backend directly
      if (res?.ride) {
        setRideData(res.ride);
      } else {
        const fresh = await rideService.getById(rideId);
        setRideData(fresh);
      }
      
      Toast.show({
        type: "success",
        text1: "Oferta Impulsionada! 🚀",
        text2: `Sua entrega agora oferece +R$ ${incrementAmount},00.`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao impulsionar",
        text2: err?.message || "Não foi possível alterar a oferta.",
      });
    } finally {
      setAdjusting(false);
    }
  }, [rideId, adjusting]);


  // ⏱️ TIMEOUT FALLBACK VIEW: Handles search ending with zero active results
  if (timeout) {
    return (
      <SearchTimeoutView
        allDriversRejected={allDriversRejected}
        enteringQueue={enteringQueue}
        onRetry={handleRetry}
        onEnterQueue={handleEnterQueue}
        onCancel={handleCancel}
        pickupCoords={pickupCoords}
      />
    );
  }

  // Logic for rendering HARD terminal fallback states elegantly with nativewind 🍃
  if (queueCancelled) {
    return (
      <View className="flex-1 bg-[#091A2F] items-center justify-center p-6">
        <StatusBar barStyle="light-content" />
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-6 items-center"
        >
           <View className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-6">
              <AlertTriangle size={36} color="#F59E0B" />
           </View>
           <Text className="text-white font-extrabold text-2xl text-center mb-3">
             Busca Finalizada
           </Text>
           <Text className="text-white/60 text-center mb-8 text-base">
             Não foi possível estabelecer conexão a tempo. Sua solicitação foi removida da fila ativa.
           </Text>

           <TouchableOpacity 
             onPress={() => navigation.reset({ index: 0, routes: [{ name: "Home" }] })}
             className="w-full h-14 bg-[#02de95] rounded-2xl flex-row items-center justify-center mb-4"
           >
             <Home size={18} color="#091A2F" className="mr-2" />
             <Text className="text-[#091A2F] font-bold text-base">Voltar para Início</Text>
           </TouchableOpacity>

           <TouchableOpacity onPress={handleCancel} className="mt-4">
             <Text className="text-red-500 font-bold text-sm">Sair</Text>
           </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  // 🚀 MAIN RENDER: HIGH FIDELITY RADAR MAP VIEWPORT 
  return (
    <GestureHandlerRootView className="flex-1 bg-[#091A2F]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Floating Glass Header */}
      <SearchingHeader 
        onBack={handleCancel}
        secondsLeft={secondsLeft}
        networkUnstable={networkUnstable}
      />

      {/* Background Deep Mapping Topology */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={useDarkMap ? darkMapStyle : undefined}
        pitchEnabled={false}
        rotateEnabled={false}
        mapPadding={{ top: 110, right: 0, bottom: 390, left: 0 }}
        initialRegion={pickupCoords ? {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        } : undefined}
      >
        {pickupCoords && (
          <>
            {/* Center Radar Pulse Overlay (Mounted on Anchor) */}
            <Marker 
              coordinate={{ 
                latitude: pickupCoords.latitude, 
                longitude: pickupCoords.longitude 
              }}
              anchor={{ x: 0.5, y: 0.5 }}
              flat
            >
              <RadarScanner size={500} boostCount={boostCount} />
            </Marker>

            {/* Visual Pulse Search Radius Circle 🟢 */}
            <Circle
              center={{ 
                latitude: pickupCoords.latitude, 
                longitude: pickupCoords.longitude 
              }}
              radius={searchState.radius * 1000}
              fillColor="rgba(2, 222, 149, 0.06)" 
              strokeColor="rgba(2, 222, 149, 0.35)" 
              strokeWidth={1.8}
              zIndex={1}
            />

            {/* Simulated Realtime Nearby Layer 🛰️ */}
            <NearbyDriversLayer drivers={drivers} />
          </>
        )}
      </MapView>

      {/* Realtime Dynamic System Error Banner (Inline) */}
      {!!error && (
        <MotiView 
          from={{ opacity: 0, translateY: 50 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="absolute bottom-[40%] left-6 right-6 bg-amber-500/90 rounded-2xl p-4 flex-row items-center z-20"
        >
          <Info size={20} color="#FFF" className="mr-3" />
          <Text className="text-white font-bold flex-1 text-sm">{error}</Text>
        </MotiView>
      )}


      <MapActionButtons
        onSosPress={handleSOS}
        onLocationPress={handleCenterMyLocation}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingMapStyle}
        bottomOffset={390}
      />

      {/* Integrated Logistics Control Panel */}
      <DeliverySearchBottomSheet
        feedMessage={feedMessage}
        offerValue={rideData?.pricing?.total || rideData?.offeredValue || 0}
        vehicleType={rideData?.vehicleType || "motorcycle"}
        pickupAddress={rideData?.pickup?.address}
        dropoffAddress={rideData?.dropoff?.address}
        onCancel={handleCancel}
        cancelling={cancelling}
        searchState={searchState}
        secondsElapsed={secondsElapsed}
        distanceText={rideData?.distance?.text}
        durationText={rideData?.duration?.text}
        drivers={drivers}
        onBoost={handleIncreaseOffer}
      />
      
    </GestureHandlerRootView>
  );
}
