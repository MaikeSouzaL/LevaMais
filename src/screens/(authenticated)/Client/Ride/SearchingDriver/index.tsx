import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, StatusBar } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MapView, { PROVIDER_GOOGLE, Marker } from "react-native-maps";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { AlertTriangle, RefreshCcw, Home, Settings, Info, Clock } from "lucide-react-native";

import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { darkMapStyle } from "@/utils/mapStyle";

// New High-End Components 🛰️
import { RadarScanner } from "@/components/client/searching-delivery/RadarScanner";
import { SearchingHeader } from "@/components/client/searching-delivery/SearchingHeader";
import { NearbyDriversLayer } from "@/components/client/searching-delivery/NearbyDriversLayer";
import { DeliverySearchBottomSheet } from "@/components/client/searching-delivery/DeliverySearchBottomSheet";
import { useRealtimeDelivery } from "@/hooks/useRealtimeDelivery";

const SEARCH_TIME = 300; // Max extended search loop
const TERMINAL_CANCEL_STATUSES = [
  "cancelled",
  "cancelled_by_client",
  "cancelled_by_driver",
  "cancelled_no_driver",
  "expired",
];

export default function SearchingDriverScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = route.params?.rideId || "";

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

  // Ride Context Persistence
  const [rideData, setRideData] = useState<any>(null);

  const mapRef = useRef<MapView>(null);
  const intervalRef = useRef<any>(null);
  const doneRef = useRef(false);

  // Custom Dynamic Simulation Hook ⚡ - upgraded with continuous tracking
  const pickupCoords = rideData?.pickup?.latitude ? rideData.pickup : null;
  const { drivers, feedMessage, searchState } = useRealtimeDelivery(
    pickupCoords?.latitude,
    pickupCoords?.longitude,
    rideData?.vehicleType || "motorcycle",
    secondsElapsed
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
      } catch (e) {
        console.log("Erro ao buscar dados da corrida", e);
      }
    };
    fetchRide();
  }, [rideId]);

  // 🎥 CINEMATIC AUTO-ZOOM ENTRY EFFECT 
  // Moves the camera from close-up to a broad urban view automatically
  useEffect(() => {
    if (!pickupCoords) return;
    
    const timer = setTimeout(() => {
      mapRef.current?.animateCamera({
        center: {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
        },
        zoom: 14, // Higher altitude for massive urban grid look
        pitch: 35, // Slight isometric tech tilt
        heading: 0,
      }, { duration: 4500 }); // Ultra-smooth cinematic 4.5 second drift
    }, 1500);

    return () => clearTimeout(timer);
  }, [!!pickupCoords]);

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

  const rideExpiredCallback = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    cleanup();
    setTimeoutState(true);
  }, []);

  const rideCancelledCallback = useCallback(
    (data: any) => {
      if (doneRef.current) return;
      doneRef.current = true;
      cleanup();
      if (waitingInQueue || data?.reason?.includes("fila de espera")) {
        setQueueCancelled(true);
        return;
      }
      Toast.show({
        type: "info",
        text1: "Corrida cancelada",
        text2: data?.reason || "Nenhum motorista disponivel",
      });
      navigation.goBack();
    },
    [navigation, waitingInQueue],
  );

  const connectAndSearch = useCallback(async () => {
    if (!rideId) return;
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    setError(null);
    setNetworkUnstable(false);

    try {
      await webSocketService.connect();
      webSocketService.waitingDriver(rideId);
      webSocketService.onDriverFound(driverFoundCallback);
      webSocketService.onRideExpired(rideExpiredCallback);
      webSocketService.onRideCancelled(rideCancelledCallback);
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
          rideCancelledCallback({ reason: "Corrida encerrada", status: ride.status });
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
    };
  }, [connectAndSearch, driverFoundCallback, rideCancelledCallback, rideExpiredCallback]);

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
      setWaitingInQueue(true);
      setTimeoutState(false);
      Toast.show({
        type: "success",
        text1: "Fila de Espera Ativada!",
        text2: "Os motoristas estão visualizando seu pedido.",
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
    try {
      await rideService.cancel(rideId, "Cancelado pelo cliente durante busca");
      doneRef.current = true;
      cleanup();
      Toast.show({ type: "info", text1: "Solicitação cancelada com sucesso." });
      navigation.reset({ index: 0, routes: [{ name: "DestinationSearch" }] });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Falha ao cancelar" });
    } finally {
      setCancelling(false);
    }
  };

  const handleRetry = async () => {
    if (!rideId) return;
    setTimeoutState(false);
    setWaitingInQueue(false);
    setSecondsLeft(SEARCH_TIME);
    doneRef.current = false;
    setSearchCycle((prev) => prev + 1);
    cleanup();
    webSocketService.off("driver-found", driverFoundCallback);
    webSocketService.off("ride-expired", rideExpiredCallback);
    webSocketService.off("ride-cancelled", rideCancelledCallback);
    await connectAndSearch();
  };

  // ⏱️ TIMEOUT FALLBACK VIEW: Handles search ending with zero active results
  if (timeout) {
    return (
      <View className="flex-1 bg-[#091A2F] items-center justify-center p-6">
        <StatusBar barStyle="light-content" />
        <MotiView
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full bg-white/[0.02] border border-white/10 rounded-3xl p-6 items-center"
        >
           <View className="w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 items-center justify-center mb-6">
              <Clock size={36} color="#FBBF24" />
           </View>
           <Text className="text-white font-extrabold text-2xl text-center mb-3">
             Tempo Esgotado
           </Text>
           <Text className="text-white/60 text-center mb-8 text-base px-4">
             Ainda não encontramos motoristas próximos. Deseja tentar novamente ou entrar na fila prioritária?
           </Text>

           {/* Extended Retry Button */}
           <TouchableOpacity 
             onPress={handleRetry}
             className="w-full h-14 bg-[#02de95] rounded-2xl flex-row items-center justify-center mb-3 shadow-2xl shadow-[#02de95]/20"
           >
             <RefreshCcw size={18} color="#091A2F" className="mr-2" />
             <Text className="text-[#091A2F] font-black text-base">Tentar Novamente</Text>
           </TouchableOpacity>

           {/* Active Queue Integration */}
           <TouchableOpacity 
             onPress={handleEnterQueue}
             disabled={enteringQueue}
             className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex-row items-center justify-center mb-6"
           >
             {enteringQueue ? (
               <ActivityIndicator color="#FFF" />
             ) : (
               <>
                 <Settings size={18} color="#FFF" className="mr-2" />
                 <Text className="text-white font-bold text-base">Entrar na Fila Pública</Text>
               </>
             )}
           </TouchableOpacity>

           <TouchableOpacity onPress={handleCancel} className="mt-2">
             <Text className="text-red-500 font-black text-sm uppercase tracking-widest">Cancelar Solicitação</Text>
           </TouchableOpacity>
        </MotiView>
      </View>
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
        customMapStyle={darkMapStyle}
        pitchEnabled={false}
        rotateEnabled={false}
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
              <RadarScanner size={500} />
            </Marker>

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
      />
      
    </GestureHandlerRootView>
  );
}
