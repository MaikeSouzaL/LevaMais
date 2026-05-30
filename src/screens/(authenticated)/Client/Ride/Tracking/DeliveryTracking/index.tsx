import React, { useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Image, ScrollView, TouchableOpacity, Linking } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Phone, MessageCircle, Home, User } from "lucide-react-native";

import { ClientStackParamList } from "../../../types/navigation";
import { getStatusMeta } from "@/utils/statusMeta";
import StatusBadge from "@/components/shared/StatusBadge";
import DeliveryTimeline from "@/components/shared/DeliveryTimeline";
import PINsCard from "@/components/shared/PINsCard";
import Toast from "react-native-toast-message";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";

type DeliveryTrackingRouteProp = RouteProp<ClientStackParamList, "DeliveryTracking">;

export default function DeliveryTracking() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList>>();
  const route = useRoute<DeliveryTrackingRouteProp>();
  const { rideId } = route.params;

  const [ride, setRide] = useState<any>(null);
  const [driverLocation, setDriverLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(true);

  // Refs for stable closure access in WebSocket callbacks and cleanup
  const mountedRef = useRef(true);
  const redirectedRef = useRef(false);
  const rideIdRef = useRef(rideId);
  rideIdRef.current = rideId;

  useEffect(() => {
    mountedRef.current = true;
    redirectedRef.current = false;

    const loadRide = async () => {
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
    };

    loadRide();

    // Named callbacks for proper WebSocket listener cleanup
    const onDriverLocation = (data: any) => {
      if (data?.rideId === rideIdRef.current && data?.location) {
        setDriverLocation({
          latitude: data.location.latitude ?? data.location.lat,
          longitude: data.location.longitude ?? data.location.lng,
        });
      }
    };

    const onRideStatusUpdated = (data: any) => {
      if (data?.rideId === rideIdRef.current || data?._id === rideIdRef.current) {
        loadRide();
      }
    };

    const onDriverArrived = (data: any) => {
      if (data?.rideId === rideIdRef.current || data?._id === rideIdRef.current) {
        loadRide();
      }
    };

    // WebSocket listeners
    webSocketService.on("driver-location-updated", onDriverLocation);
    webSocketService.on("ride-status-updated", onRideStatusUpdated);
    webSocketService.on("driver-arrived", onDriverArrived);

    // Polling fallback every 4 seconds
    const interval = setInterval(loadRide, 4000);

    return () => {
      mountedRef.current = false;
      clearInterval(interval);
      webSocketService.off("driver-location-updated", onDriverLocation);
      webSocketService.off("ride-status-updated", onRideStatusUpdated);
      webSocketService.off("driver-arrived", onDriverArrived);
    };
  }, [rideId]);

  const statusMeta = useMemo(() => {
    if (!ride?.status) return null;
    return getStatusMeta(ride.status, "delivery");
  }, [ride?.status]);

  const handleCallDriver = () => {
    if (ride?.driverPhone) {
      Linking.openURL(`tel:${ride.driverPhone}`);
    }
  };

  const handleChat = () => {
    navigation.navigate("Chat", { rideId });
  };

  const handleGoHome = () => {
    navigation.navigate("Home");
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
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Mapa */}
        <View className="h-[300px] bg-[#1E293B]">
          {ride.pickup?.latitude && ride.pickup?.longitude && (
            <MapView
              style={{ flex: 1 }}
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
                pinColor="#02de95"
                title="Coleta"
              />

              {/* Driver location marker */}
              {driverLocation && (
                <Marker
                  coordinate={driverLocation}
                  title="Motorista"
                >
                  <View className="w-8 h-8 rounded-full bg-[#02de95] items-center justify-center border-2 border-white">
                    <User size={14} color="#091A2F" />
                  </View>
                </Marker>
              )}

              {ride.dropoff?.latitude && ride.dropoff?.longitude && (
                <>
                  <Marker
                    coordinate={{
                      latitude: ride.dropoff.latitude,
                      longitude: ride.dropoff.longitude,
                    }}
                    pinColor="#ef4444"
                    title="Entrega"
                  />
                  <Polyline
                    coordinates={[
                      { latitude: ride.pickup.latitude, longitude: ride.pickup.longitude },
                      { latitude: ride.dropoff.latitude, longitude: ride.dropoff.longitude },
                    ]}
                    strokeColor="#02de95"
                    strokeWidth={3}
                  />
                </>
              )}
            </MapView>
          )}
        </View>

        {/* Status + Banners */}
        <View className="px-4 py-4">
          {statusMeta && <StatusBadge status={ride.status} serviceType="delivery" />}

          {/* Banner: Motorista chegou na coleta */}
          {ride.status === "arrived" && (
            <View className="bg-[rgba(2,222,149,0.12)] border border-[#02de95]/30 rounded-xl p-4 mt-3">
              <Text className="text-[#02de95] text-sm font-extrabold">
                Motorista chegou na coleta!
              </Text>
              <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                Va ao encontro para entregar o pacote.
              </Text>
            </View>
          )}

          {/* Banner: Entrega em andamento */}
          {ride.status === "in_progress" && (
            <View className="bg-[rgba(2,222,149,0.12)] border border-[#02de95]/30 rounded-xl p-4 mt-3">
              <Text className="text-[#02de95] text-sm font-extrabold">
                Entrega em andamento
              </Text>
              <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                A caminho do destino.
              </Text>
            </View>
          )}

          {/* Banner: Entregador chegou no destino (arrived_at_dropoff flag or status) */}
          {(Boolean(ride.arrivedAtDropoff) || ride.status === "arrived_at_dropoff") && ride.status !== "completed" && (
            <View className="bg-[rgba(249,115,22,0.12)] border border-[#f97316]/30 rounded-xl p-4 mt-3">
              <Text className="text-[#f97316] text-sm font-extrabold">
                Entregador chegou no destino!
              </Text>
              <Text className="text-[rgba(255,255,255,0.7)] text-xs mt-1">
                Aguardando finalizacao da entrega.
              </Text>
            </View>
          )}

          {statusMeta?.subtitle && (
            <Text className="text-[rgba(255,255,255,0.7)] text-sm mt-2">{statusMeta.subtitle}</Text>
          )}
        </View>

        {/* Informacoes do Motorista */}
        {ride.driver && (
          <View className="px-4 mb-4">
            <View className="flex-row items-center p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
              {ride.driver.profilePhoto ? (
                <Image
                  source={{ uri: ride.driver.profilePhoto }}
                  className="w-14 h-14 rounded-full"
                />
              ) : (
                <View className="w-14 h-14 rounded-full bg-[#02de95] items-center justify-center">
                  <User size={24} color="#091A2F" />
                </View>
              )}
              <View className="flex-1 ml-3">
                <Text className="text-white text-base font-bold">{ride.driver.name}</Text>
                {ride.driver.vehicle && (
                  <Text className="text-[rgba(255,255,255,0.6)] text-sm">
                    {ride.driver.vehicle.model} . {ride.driver.vehicle.plate}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={handleCallDriver}
                className="w-10 h-10 rounded-full bg-[#02de95] items-center justify-center ml-2"
              >
                <Phone size={20} color="#091A2F" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Timeline */}
        <View className="px-4 mb-4">
          <DeliveryTimeline status={ride.status} arrivedAtDropoff={Boolean(ride.arrivedAtDropoff)} />
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
          <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
            <Text className="text-white text-base font-bold mb-3">Detalhes da Entrega</Text>

            {/* Tipo e Tamanho */}
            <View className="flex-row mb-3">
              <View className="flex-1">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Tipo</Text>
                <Text className="text-white text-sm font-bold">
                  {ride.vehicleType === "motorcycle" ? "Moto" : "Carro"}
                </Text>
              </View>
              {ride.details?.cargoSize && (
                <View className="flex-1">
                  <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Tamanho</Text>
                  <Text className="text-white text-sm font-bold capitalize">
                    {ride.details.cargoSize === "small"
                      ? "Pequeno"
                      : ride.details.cargoSize === "medium"
                      ? "Medio"
                      : "Grande"}
                  </Text>
                </View>
              )}
            </View>

            {/* Peso e Fragil */}
            <View className="flex-row mb-3">
              {ride.details?.weight && (
                <View className="flex-1">
                  <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Peso</Text>
                  <Text className="text-white text-sm font-bold">{ride.details.weight} kg</Text>
                </View>
              )}
              {ride.details?.fragile && (
                <View className="flex-1">
                  <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Fragil</Text>
                  <Text className="text-white text-sm font-bold">Sim</Text>
                </View>
              )}
            </View>

            {/* Destinatario */}
            {ride.details?.recipientName && (
              <View className="pt-3 border-t border-[rgba(255,255,255,0.1)]">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Destinatario</Text>
                <Text className="text-white text-sm font-bold mb-1">{ride.details.recipientName}</Text>
                {ride.details?.recipientPhone && (
                  <TouchableOpacity
                    onPress={() => Linking.openURL(`tel:${ride.details.recipientPhone}`)}
                    className="flex-row items-center"
                  >
                    <Phone size={14} color="#02de95" />
                    <Text className="text-[#02de95] text-sm ml-1">{ride.details.recipientPhone}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Enderecos */}
        <View className="px-4 mb-4">
          <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
            <Text className="text-white text-base font-bold mb-3">Enderecos</Text>

            <View className="flex-row mb-3">
              <View className="w-2 h-2 rounded-full bg-[#02de95] mt-2 mr-3" />
              <View className="flex-1">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Coleta</Text>
                <Text className="text-white text-sm">{ride.pickup?.address}</Text>
              </View>
            </View>

            <View className="flex-row">
              <View className="w-2 h-2 rounded-full bg-[#ef4444] mt-2 mr-3" />
              <View className="flex-1">
                <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-1">Entrega</Text>
                <Text className="text-white text-sm">{ride.dropoff?.address}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Fotos de Prova */}
        {(ride.proofs?.pickupPhoto || ride.proofs?.deliveryPhoto) && (
          <View className="px-4 mb-4">
            <View className="p-4 rounded-2xl bg-[rgba(255,255,255,0.05)]">
              <Text className="text-white text-base font-bold mb-3">Fotos de Prova</Text>

              {ride.proofs?.pickupPhoto && (
                <View className="mb-3">
                  <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-2">Foto de Coleta</Text>
                  <Image
                    source={{ uri: ride.proofs.pickupPhoto }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              )}

              {ride.proofs?.deliveryPhoto && (
                <View>
                  <Text className="text-[rgba(255,255,255,0.6)] text-xs mb-2">Foto de Entrega</Text>
                  <Image
                    source={{ uri: ride.proofs.deliveryPhoto }}
                    className="w-full h-48 rounded-xl"
                    resizeMode="cover"
                  />
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Botoes de Acao */}
      <View className="px-4 py-4 bg-[#091A2F] border-t border-[rgba(255,255,255,0.1)]">
        <View className="flex-row">
          <TouchableOpacity
            onPress={handleGoHome}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-[rgba(255,255,255,0.05)] mr-2"
          >
            <Home size={20} color="#fff" />
            <Text className="text-white text-sm font-bold ml-2">Inicio</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleChat}
            className="flex-1 flex-row items-center justify-center py-3 rounded-xl bg-[#02de95] ml-2"
          >
            <MessageCircle size={20} color="#091A2F" />
            <Text className="text-[#091A2F] text-sm font-bold ml-2">Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
