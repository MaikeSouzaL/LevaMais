import React, { useState, useEffect, useRef } from "react";
import { View, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Components
import { DeliveryOfferMap } from "@/components/driver/delivery-offer/DeliveryOfferMap";
import { DeliveryOfferHeader } from "@/components/driver/delivery-offer/DeliveryOfferHeader";
import { DeliveryOfferCard } from "@/components/driver/delivery-offer/DeliveryOfferCard";
import { NegotiationModal } from "@/components/driver/negotiation/NegotiationModal";

// Services
import rideService from "@/services/ride.service";
import Toast from "react-native-toast-message";

export default function DeliveryOfferScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { offerId, initialOffer } = route.params || {};

  const [offer, setOffer] = useState<any>(initialOffer || null);
  const [loading, setLoading] = useState(!initialOffer);
  const [timeLeft, setTimeLeft] = useState<number | null>(30); 
  
  // 💼 Negotiation Logic Hooks
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [sendingCounter, setSendingCounter] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ⚡ Synchronized Initial Data Loading
  useEffect(() => {
    const fetchOffer = async () => {
      try {
        if (offerId && !initialOffer) {
           setLoading(true);
           const data = await rideService.getById(offerId);
           setOffer(data);
        }
      } catch (error) {
        Toast.show({ type: "error", text1: "Ops!", text2: "Não foi possível carregar a oferta." });
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [offerId]);

  // ⏱️ Continuous Realtime Decay Engine
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timerRef.current!);
          handleOfferExpired();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const handleOfferExpired = () => {
    Toast.show({ type: "info", text1: "Oferta Expirada", text2: "O tempo limite esgotou." });
    navigation.goBack();
  };

  // 🏦 Standard Acceptance Sequences
  const handleAccept = async () => {
    try {
      if (!offer?._id) return;
      await rideService.accept(offer._id);
      Toast.show({ type: "success", text1: "Sucesso!", text2: "Corrida aceita. Dirija com cuidado!" });
      if (timerRef.current) clearInterval(timerRef.current);
      navigation.replace("DriverRide", { rideId: offer._id });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Falha no Aceite", text2: err.message || "Tente novamente." });
    }
  };

  // 🚀 Negotiation Pipeline Operations
  const handleNegotiate = () => {
    setIsNegotiationOpen(true);
  };

  const handleSendCounterOffer = async (newValue: number, message?: string) => {
    try {
      if (!offer?._id) return;
      setSendingCounter(true);

      await rideService.respondToOffer(offer._id, {
        action: "counter",
        amount: newValue,
        message: message
      });

      Toast.show({ type: "success", text1: "Proposta Enviada", text2: "Cliente já foi notificado!" });
      setIsNegotiationOpen(false);
      if (timerRef.current) clearInterval(timerRef.current);
      navigation.goBack(); // Return to operational feed awaiting responses
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Falha na Proposta", text2: "Ocorreu um erro." });
    } finally {
      setSendingCounter(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#091A2F] items-center justify-center">
         <ActivityIndicator size="large" color="#02de95" />
      </View>
    );
  }

  const pickup = offer?.pickup || { latitude: 0, longitude: 0, address: "Carregando..." };
  const destination = offer?.dropoff || offer?.destination || { latitude: 0, longitude: 0, address: "Carregando..." };
  const baseValue = offer?.offeredValue || offer?.pricing?.total || 0;

  return (
    <GestureHandlerRootView className="flex-1 bg-[#091A2F]">
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <View className="absolute inset-0 z-0">
        <DeliveryOfferMap pickup={pickup} destination={destination} />
      </View>

      <DeliveryOfferHeader expiresInSeconds={timeLeft} />

      <DeliveryOfferCard 
        offer={offer} 
        onAccept={handleAccept}
        onNegotiate={handleNegotiate}
      />

      {/* 🏦 FUTURISTIC NEGOTIATION LAYER (Absolute Modal) */}
      <NegotiationModal
        isVisible={isNegotiationOpen}
        onClose={() => setIsNegotiationOpen(false)}
        currentValue={baseValue}
        loading={sendingCounter}
        onSendCounterOffer={handleSendCounterOffer}
      />

    </GestureHandlerRootView>
  );
}
