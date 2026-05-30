import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";

export default function RideBiddingScreen({ route, navigation }: any) {
  const {
    pickup,
    dropoff,
    routeCoordinates,
    vehicleType,
    clientOffer,
    estimate,
  } = route.params || {};

  const [ride, setRide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [creatingRide, setCreatingRide] = useState(true);
  const [offers, setOffers] = useState<any[]>([]);
  const [showCounterModal, setShowCounterModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [counterAmount, setCounterAmount] = useState("");

  useEffect(() => {
    createRide();
  }, []);

  useEffect(() => {
    if (ride?._id) {
      const cleanupSocket = setupWebSocket();
      loadOffers();

      const interval = setInterval(loadOffers, 5000);
      return () => {
        if (cleanupSocket) cleanupSocket();
        clearInterval(interval);
      };
    }
  }, [ride?._id]);

  const createRide = async () => {
    try {
      setCreatingRide(true);
      const rideData = {
        serviceType: "ride" as const,
        vehicleType,
        pickup,
        dropoff,
        routeCoordinates,
        pricing: {
          basePrice: estimate.pricingBreakdown.baseFare,
          distancePrice: estimate.pricingBreakdown.distancePrice,
          serviceFee: 0,
          total: clientOffer,
          currency: "BRL",
        },
        distance: {
          value: estimate.distanceKm * 1000,
          text: `${estimate.distanceKm.toFixed(1)} km`,
        },
        duration: {
          value: estimate.durationMin * 60,
          text: `${estimate.durationMin} min`,
        },
        negotiation: {
          enabled: true,
          clientOffer,
        },
      };

      const created = await rideService.create(rideData);
      setRide(created);
      setCreatingRide(false);
      setLoading(false);

      Toast.show({
        type: "success",
        text1: "Lance enviado!",
        text2: "Aguardando propostas de motoristas...",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao criar corrida",
        text2: error.message,
      });
      navigation.goBack();
    }
  };

  const setupWebSocket = () => {
    if (!ride?._id) return;

    // Eventos alinhados com o backend (ride.controller.js)
    webSocketService.on("ride-offers-updated", (data: any) => {
      if (data.rideId === ride._id) {
        loadOffers();
      }
    });

    webSocketService.on("ride_negotiated", (data: any) => {
      if (data.rideId === ride._id) {
        loadOffers();
        if (data.action === "proposal_received") {
          Toast.show({
            type: "info",
            text1: "Nova proposta!",
            text2: "Um motorista enviou uma proposta",
          });
        }
      }
    });

    webSocketService.on("ride-offer-selected", (data: any) => {
      if (data.rideId === ride._id) {
        Toast.show({
          type: "success",
          text1: "Corrida aceita!",
          text2: "Redirecionando para acompanhamento...",
        });
        navigation.replace("RideTracking", { rideId: ride._id });
      }
    });

    return () => {
      webSocketService.off("ride-offers-updated");
      webSocketService.off("ride_negotiated");
      webSocketService.off("ride-offer-selected");
    };
  };

  const loadOffers = async () => {
    if (!ride?._id) return;
    try {
      const offersData = await rideService.getOffers(ride._id);
      setOffers(offersData.offers || []);
    } catch (error) {
      console.error("Erro ao carregar ofertas:", error);
    }
  };

  const handleAcceptOffer = async (offer: any) => {
    try {
      await rideService.selectOffer(ride._id, offer.driverId._id || offer.driverId);

      Toast.show({
        type: "success",
        text1: "Proposta aceita!",
        text2: "Redirecionando para acompanhamento...",
      });

      navigation.replace("RideTracking", { rideId: ride._id });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao aceitar proposta",
        text2: error.message,
      });
    }
  };

  const handleRejectOffer = async (offer: any) => {
    try {
      await rideService.declineOffer(ride._id, offer.driverId._id || offer.driverId);

      Toast.show({
        type: "info",
        text1: "Proposta recusada",
      });

      loadOffers();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao recusar proposta",
        text2: error.message,
      });
    }
  };

  const handleCounterOffer = async () => {
    if (!selectedOffer || !counterAmount) return;

    const amount = parseFloat(counterAmount);
    if (isNaN(amount)) {
      Toast.show({
        type: "error",
        text1: "Valor inválido",
        text2: "Digite um valor válido",
      });
      return;
    }

    try {
      await rideService.clientCounterOffer(ride._id, selectedOffer.driverId, amount);

      Toast.show({
        type: "success",
        text1: "Contra-proposta enviada!",
        text2: "Aguardando resposta do motorista...",
      });

      setShowCounterModal(false);
      setSelectedOffer(null);
      setCounterAmount("");
      loadOffers();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao enviar contra-proposta",
        text2: error.message,
      });
    }
  };

  const handleCancel = async () => {
    try {
      await rideService.cancel(ride._id, "cancelled_by_client");
      Toast.show({
        type: "info",
        text1: "Corrida cancelada",
      });
      navigation.goBack();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao cancelar",
        text2: error.message,
      });
    }
  };

  if (creatingRide || loading) {
    return (
      <SafeAreaView className="flex-1 bg-[#091A2F] items-center justify-center">
        <ActivityIndicator size="large" color="#02de95" />
        <Text className="text-white mt-4 text-base">
          {creatingRide ? "Criando corrida..." : "Carregando propostas..."}
        </Text>
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
          Propostas de Motoristas
        </Text>
        <TouchableOpacity
          onPress={handleCancel}
          className="bg-red-500/20 px-4 py-2 rounded-xl border border-red-500/50"
        >
          <Text className="text-red-400 text-sm font-bold">Cancelar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Info do Lance */}
        <View className="mx-5 mt-5 bg-[#11253E] rounded-3xl p-5 border border-white/10">
          <Text className="text-white/60 text-xs font-bold uppercase mb-2">
            Seu lance
          </Text>
          <Text className="text-[#02de95] text-4xl font-black mb-2">
            R$ {clientOffer.toFixed(2)}
          </Text>
          <Text className="text-white/60 text-sm">
            {vehicleType === "motorcycle" ? "Moto" : "Carro"} •{" "}
            {estimate.distanceKm.toFixed(1)} km • {estimate.durationMin} min
          </Text>
        </View>

        {/* Lista de Propostas */}
        <View className="mx-5 mt-5 mb-5">
          <Text className="text-white/60 text-xs font-bold uppercase mb-3">
            {offers.length === 0
              ? "Aguardando propostas..."
              : `${offers.length} proposta${offers.length > 1 ? "s" : ""} recebida${offers.length > 1 ? "s" : ""}`}
          </Text>

          {offers.length === 0 ? (
            <View className="bg-[#11253E] rounded-3xl p-8 items-center border border-white/10">
              <Ionicons name="time-outline" size={64} color="#ffffff40" />
              <Text className="text-white/60 text-center mt-4 text-base">
                Aguardando motoristas enviarem propostas...
              </Text>
              <Text className="text-white/40 text-center mt-2 text-sm">
                As propostas aparecerão aqui em tempo real
              </Text>
            </View>
          ) : (
            offers.map((offer) => {
              const driver = offer.driverId || {};
              const priceDiff = offer.amount - clientOffer;
              const priceDiffText =
                priceDiff > 0
                  ? `+ R$ ${priceDiff.toFixed(2)}`
                  : priceDiff < 0
                  ? `- R$ ${Math.abs(priceDiff).toFixed(2)}`
                  : "Preço igual";

              return (
                <View
                  key={offer._id}
                  className="bg-[#11253E] rounded-3xl p-5 mb-4 border border-white/10"
                >
                  {/* Info do Motorista */}
                  <View className="flex-row items-center mb-4">
                    {driver.profilePhoto ? (
                      <Image
                        source={{ uri: driver.profilePhoto }}
                        className="w-16 h-16 rounded-full border-2 border-[#02de95]"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-full bg-[#02de95]/20 items-center justify-center border-2 border-[#02de95]">
                        <Ionicons name="person" size={32} color="#02de95" />
                      </View>
                    )}
                    <View className="flex-1 ml-4">
                      <Text className="text-white text-lg font-bold">
                        {driver.name || "Motorista"}
                      </Text>
                      <View className="flex-row items-center mt-1">
                        <Ionicons name="star" size={16} color="#FFD700" />
                        <Text className="text-white/80 text-sm ml-1">
                          {driver.rating?.toFixed(1) || "Novo"}
                        </Text>
                        {driver.totalRides && (
                          <Text className="text-white/60 text-sm ml-2">
                            ({driver.totalRides} corridas)
                          </Text>
                        )}
                      </View>
                      {offer.vehicleInfo && (
                        <Text className="text-white/60 text-xs mt-1">
                          {offer.vehicleInfo.model} • {offer.vehicleInfo.color}
                        </Text>
                      )}
                    </View>
                  </View>

                  {/* Preço da Proposta */}
                  <View className="bg-[#091A2F] rounded-2xl p-4 mb-4">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-white/60 text-xs">Proposta</Text>
                        <Text className="text-white text-2xl font-black">
                          R$ {offer.amount.toFixed(2)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white/60 text-xs">Diferença</Text>
                        <Text
                          className={`text-lg font-bold ${
                            priceDiff > 0
                              ? "text-red-400"
                              : priceDiff < 0
                              ? "text-[#02de95]"
                              : "text-white"
                          }`}
                        >
                          {priceDiffText}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Mensagem do Motorista */}
                  {offer.message && (
                    <View className="bg-[#091A2F] rounded-2xl p-3 mb-4">
                      <Text className="text-white/60 text-xs mb-1">Mensagem:</Text>
                      <Text className="text-white text-sm">{offer.message}</Text>
                    </View>
                  )}

                  {/* Botões de Ação */}
                  <View className="flex-row gap-2">
                    <TouchableOpacity
                      className="flex-1 bg-[#02de95] rounded-xl py-3 items-center"
                      onPress={() => handleAcceptOffer(offer)}
                    >
                      <Text className="text-[#091A2F] text-sm font-bold">
                        ACEITAR
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 bg-blue-500/20 rounded-xl py-3 items-center border border-blue-500/50"
                      onPress={() => {
                        setSelectedOffer(offer);
                        setCounterAmount(offer.amount.toFixed(2));
                        setShowCounterModal(true);
                      }}
                    >
                      <Text className="text-blue-400 text-sm font-bold">
                        CONTRA-PROPOSTA
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-red-500/20 rounded-xl px-4 py-3 items-center border border-red-500/50"
                      onPress={() => handleRejectOffer(offer)}
                    >
                      <Ionicons name="close" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Modal de Contra-Proposta */}
      <Modal visible={showCounterModal} transparent animationType="slide">
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-[#11253E] rounded-t-3xl p-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-white text-xl font-bold">Contra-Proposta</Text>
              <TouchableOpacity onPress={() => setShowCounterModal(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {selectedOffer && (
              <>
                <Text className="text-white/60 text-sm mb-4">
                  Motorista ofereceu: R$ {selectedOffer.amount.toFixed(2)}
                </Text>

                <Text className="text-white/60 text-xs font-bold uppercase mb-2">
                  Seu novo valor
                </Text>
                <TextInput
                  className="bg-[#091A2F] text-white text-2xl font-bold rounded-2xl p-4 mb-4 border border-white/10"
                  value={counterAmount}
                  onChangeText={setCounterAmount}
                  keyboardType="decimal-pad"
                  placeholder="0.00"
                  placeholderTextColor="#ffffff40"
                />

                <TouchableOpacity
                  className="bg-[#02de95] rounded-2xl py-4 items-center"
                  onPress={handleCounterOffer}
                >
                  <Text className="text-[#091A2F] text-lg font-black">
                    ENVIAR CONTRA-PROPOSTA
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
