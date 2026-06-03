import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";

export default function RideBidSetupScreen({ route, navigation }: any) {
  const { pickup, dropoff, stops, routeCoordinates, initialDistanceKm, initialDurationMin, rideCategory, presetOffer } = route.params || {};

  const initialVehicle: "motorcycle" | "car" =
    route.params?.vehicleType === "motorcycle" ? "motorcycle" : "car";
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "car">(initialVehicle);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientOffer, setClientOffer] = useState("");
  const presetAppliedRef = React.useRef(false);

  useEffect(() => {
    loadEstimate();
  }, [vehicleType]);

  const loadEstimate = async () => {
    try {
      setLoading(true);
      const result = await rideService.calculateRideEstimate({
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude },
        vehicleType,
        distance: initialDistanceKm,
        duration: initialDurationMin,
      });
      setEstimate(result);
      // Usa o valor da categoria escolhida na 1ª carga; depois segue o sugerido.
      if (!presetAppliedRef.current && typeof presetOffer === "number" && presetOffer > 0) {
        presetAppliedRef.current = true;
        setClientOffer(presetOffer.toFixed(2));
      } else {
        setClientOffer(result.suggestedPrice.toFixed(2));
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao calcular estimativa",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const offer = parseFloat(clientOffer);
    if (isNaN(offer) || offer < estimate.minPrice || offer > estimate.maxPrice) {
      Toast.show({
        type: "error",
        text1: "Lance inválido",
        text2: `O lance deve estar entre R$ ${estimate.minPrice.toFixed(2)} e R$ ${estimate.maxPrice.toFixed(2)}`,
      });
      return;
    }

    navigation.navigate("RideBiddingScreen", {
      pickup,
      dropoff,
      stops,
      routeCoordinates,
      vehicleType,
      rideCategory,
      clientOffer: offer,
      estimate,
    });
  };

  const adjustOffer = (amount: number) => {
    const current = parseFloat(clientOffer) || estimate?.suggestedPrice || 0;
    const newOffer = Math.max(
      estimate?.minPrice || 0,
      Math.min(estimate?.maxPrice || 9999, current + amount)
    );
    setClientOffer(newOffer.toFixed(2));
  };

  if (loading || !estimate) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <ActivityIndicator size="large" color="#02de95" />
        <Text className="text-white mt-4 text-base">Calculando estimativa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-white/10">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text className="text-white text-xl font-bold flex-1">
          Configure sua corrida
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Mapa */}
        <View className="h-64 mx-5 mt-5 rounded-3xl overflow-hidden border border-white/10">
          <MapView
            className="flex-1"
            initialRegion={{
              latitude: pickup.latitude,
              longitude: pickup.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
          >
            <Marker
              coordinate={{
                latitude: pickup.latitude,
                longitude: pickup.longitude,
              }}
              title="Embarque"
              description={pickup.address}
              pinColor="#02de95"
            />
            <Marker
              coordinate={{
                latitude: dropoff.latitude,
                longitude: dropoff.longitude,
              }}
              title="Desembarque"
              description={dropoff.address}
              pinColor="#ef4444"
            />
            {routeCoordinates && routeCoordinates.length > 1 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#02de95"
                strokeWidth={4}
              />
            )}
          </MapView>
        </View>

        {/* Resumo da Rota */}
        <View className="mx-5 mt-5 bg-[#11253E] rounded-3xl p-5 border border-white/10">
          <Text className="text-white/60 text-xs font-bold uppercase mb-3">
            Resumo da rota
          </Text>

          <View className="flex-row items-start mb-3">
            <View className="w-3 h-3 rounded-full bg-[#02de95] mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-white/60 text-xs">Embarque</Text>
              <Text className="text-white text-sm font-bold" numberOfLines={2}>
                {pickup.address}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-white/60 text-xs">Desembarque</Text>
              <Text className="text-white text-sm font-bold" numberOfLines={2}>
                {dropoff.address}
              </Text>
            </View>
          </View>

          <View className="flex-row mt-4 pt-4 border-t border-white/10">
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Distância</Text>
              <Text className="text-white text-lg font-bold">
                {estimate.distanceKm.toFixed(1)} km
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-white/60 text-xs">Tempo estimado</Text>
              <Text className="text-white text-lg font-bold">
                {estimate.durationMin} min
              </Text>
            </View>
          </View>
        </View>

        {/* Seleção de Veículo */}
        <View className="mx-5 mt-5">
          <Text className="text-white/60 text-xs font-bold uppercase mb-3">
            Tipo de veículo
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className={`flex-1 bg-[#11253E] rounded-2xl p-4 border-2 ${
                vehicleType === "motorcycle"
                  ? "border-[#02de95]"
                  : "border-transparent"
              }`}
              onPress={() => setVehicleType("motorcycle")}
            >
              <View className="items-center">
                <Ionicons
                  name="bicycle"
                  size={40}
                  color={vehicleType === "motorcycle" ? "#02de95" : "#fff"}
                />
                <Text className="text-white text-base font-bold mt-2">Moto</Text>
                <Text className="text-white/60 text-xs text-center mt-1">
                  Rápido e econômico
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              className={`flex-1 bg-[#11253E] rounded-2xl p-4 border-2 ${
                vehicleType === "car"
                  ? "border-[#02de95]"
                  : "border-transparent"
              }`}
              onPress={() => setVehicleType("car")}
            >
              <View className="items-center">
                <Ionicons
                  name="car"
                  size={40}
                  color={vehicleType === "car" ? "#02de95" : "#fff"}
                />
                <Text className="text-white text-base font-bold mt-2">Carro</Text>
                <Text className="text-white/60 text-xs text-center mt-1">
                  Conforto e segurança
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Estimativa de Preço */}
        <View className="mx-5 mt-5 bg-[#11253E] rounded-3xl p-5 border border-white/10">
          <Text className="text-white/60 text-xs font-bold uppercase mb-3">
            Preço sugerido
          </Text>
          <View className="items-center">
            <Text className="text-[#02de95] text-4xl font-black">
              R$ {estimate.suggestedPrice.toFixed(2)}
            </Text>
            <Text className="text-white/60 text-sm mt-2">
              Faixa: R$ {estimate.minPrice.toFixed(2)} - R$ {estimate.maxPrice.toFixed(2)}
            </Text>
          </View>

          <View className="mt-4 pt-4 border-t border-white/10">
            <View className="flex-row justify-between mb-2">
              <Text className="text-white/60 text-sm">Tarifa base</Text>
              <Text className="text-white text-sm font-bold">
                R$ {estimate.pricingBreakdown.baseFare.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-white/60 text-sm">Distância</Text>
              <Text className="text-white text-sm font-bold">
                R$ {estimate.pricingBreakdown.distancePrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Lance do Cliente */}
        <View className="mx-5 mt-5 mb-5 bg-[#11253E] rounded-3xl p-5 border-2 border-[#02de95]">
          <Text className="text-white/60 text-xs font-bold uppercase mb-3">
            Seu lance
          </Text>
          <Text className="text-white/40 text-xs mb-3">
            💡 Lances próximos ao preço sugerido têm mais chances de aceitação
          </Text>

          <View className="items-center mb-4">
            <Text className="text-white/60 text-sm mb-2">R$</Text>
            <Text className="text-[#02de95] text-5xl font-black">
              {clientOffer}
            </Text>
          </View>

          {/* Botões de ajuste */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              className="flex-1 bg-red-500/20 rounded-xl py-3 items-center border border-red-500/50"
              onPress={() => adjustOffer(-2)}
            >
              <Text className="text-red-400 text-sm font-bold">- R$ 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-500/20 rounded-xl py-3 items-center border border-red-500/50"
              onPress={() => adjustOffer(-1)}
            >
              <Text className="text-red-400 text-sm font-bold">- R$ 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-[#02de95]/20 rounded-xl py-3 items-center border border-[#02de95]/50"
              onPress={() => setClientOffer(estimate.suggestedPrice.toFixed(2))}
            >
              <Text className="text-[#02de95] text-sm font-bold">Sugerido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-500/20 rounded-xl py-3 items-center border border-blue-500/50"
              onPress={() => adjustOffer(1)}
            >
              <Text className="text-blue-400 text-sm font-bold">+ R$ 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-500/20 rounded-xl py-3 items-center border border-blue-500/50"
              onPress={() => adjustOffer(2)}
            >
              <Text className="text-blue-400 text-sm font-bold">+ R$ 2</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Botão Continuar */}
      <View className="px-5 py-5 bg-[#091A2F] border-t border-white/10">
        <TouchableOpacity
          className="bg-[#02de95] rounded-2xl py-4 items-center flex-row justify-center"
          onPress={handleContinue}
        >
          <Text className="text-[#091A2F] text-lg font-black">
            ENVIAR LANCE PARA MOTORISTAS
          </Text>
          <Ionicons name="arrow-forward" size={24} color="#091A2F" className="ml-2" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
