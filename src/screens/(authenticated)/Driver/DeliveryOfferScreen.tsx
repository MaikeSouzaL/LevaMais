import React, { useState, useEffect, useRef } from "react";
import { View, StatusBar, ActivityIndicator, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Components
import { DeliveryOfferMap } from "@/components/driver/delivery-offer/DeliveryOfferMap";
import { DeliveryOfferHeader } from "@/components/driver/delivery-offer/DeliveryOfferHeader";
import { DeliveryOfferCard } from "@/components/driver/delivery-offer/DeliveryOfferCard";
// Removed local legacy modal import in favor of standalone DriverNegotiationScreen


// Services
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import Toast from "react-native-toast-message";

export default function DeliveryOfferScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { offerId, initialOffer } = route.params || {};

  const [offer, setOffer] = useState<any>(initialOffer || null);
  const [loading, setLoading] = useState(!initialOffer);
  const [timeLeft, setTimeLeft] = useState<number | null>(30); 
  
  // 💼 Negotiation Logic Hooks
  // Counter offer hooks migrated to standalone DriverNegotiationScreen

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

  // 🛰️ Real-time Cancellation Sync
  useEffect(() => {
    if (!offer?._id) return;

    let active = true;

    const handleRideCancelled = (payload: any) => {
      if (!active) return;
      if (payload?.rideId === offer._id) {
        active = false;
        Toast.show({
          type: "error",
          text1: "Corrida Cancelada",
          text2: "Esta solicitação foi cancelada pelo solicitante."
        });
        navigation.goBack();
      }
    };

    webSocketService.on("ride-cancelled", handleRideCancelled);
    webSocketService.connect().catch(() => {});

    // Polling backup
    const checkStatus = setInterval(async () => {
      try {
        const fresh = await rideService.getById(offer._id);
        if (!active) return;
        if (["cancelled", "cancelled_by_client", "cancelled_by_driver", "cancelled_no_driver", "expired"].includes(fresh.status)) {
          active = false;
          clearInterval(checkStatus);
          Toast.show({
            type: "error",
            text1: "Corrida Cancelada",
            text2: "Esta solicitação foi cancelada pelo solicitante."
          });
          navigation.goBack();
        }
      } catch (err: any) {
        // Se der 404 (corrida apagada ou não encontrada), cancela também
        if (err?.response?.status === 404) {
          active = false;
          clearInterval(checkStatus);
          Toast.show({
            type: "error",
            text1: "Corrida Cancelada",
            text2: "Esta solicitação foi cancelada pelo solicitante."
          });
          navigation.goBack();
        }
      }
    }, 3500);

    return () => {
      active = false;
      clearInterval(checkStatus);
      webSocketService.off("ride-cancelled", handleRideCancelled);
    };
  }, [offer?._id]);

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

      if (offer.negotiation?.enabled) {
        await rideService.respondToOffer(offer._id, {
          action: "accept",
          amount: offer.negotiation?.clientOffer || offer.pricing?.total || 20,
          message: "Aceito pelo valor sugerido",
        });

        if (timerRef.current) clearInterval(timerRef.current);

        navigation.replace("DriverNegotiation", {
          offerId: offer._id,
          initialOffer: offer,
        });

        Toast.show({
          type: "success",
          text1: "Interesse enviado! 🚀",
          text2: "Aguardando confirmação de pagamento do cliente.",
        });
        return;
      }

      await rideService.accept(offer._id);
      Toast.show({ type: "success", text1: "Sucesso!", text2: "Corrida aceita. Dirija com cuidado!" });
      if (timerRef.current) clearInterval(timerRef.current);
      navigation.replace("DriverRide", { rideId: offer._id });
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Falha no Aceite", text2: err.message || "Tente novamente." });
    }
  };

  // 🚀 Unified In-Place Negotiation Execution
  const handleCounterOffer = async (counterValue: number, message: string) => {
    try {
      if (!offer?._id) return;
      
      await rideService.respondToOffer(offer._id, {
        action: "counter",
        amount: counterValue,
        message: message || "Negociação justa",
      });

      if (timerRef.current) clearInterval(timerRef.current);

      // Pop to Top to return to feed, with active status
      setTimeout(() => {
        Toast.show({ 
          type: "success", 
          text1: "Proposta Enviada! 🚀", 
          text2: `Sua oferta de R$ ${counterValue.toFixed(2).replace(".", ",")} foi enviada ao cliente.` 
        });
        navigation.popToTop();
      }, 3000);
    } catch (err: any) {
      Toast.show({ type: "error", text1: "Falha ao Propor", text2: err.message || "Tente novamente." });
      throw err; // Re-throw so card can revert its internal loading state
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
        onCounterOffer={handleCounterOffer}
      />

      {/* Standing Negotiation Screen has replaced legacy modal layer */}

    </GestureHandlerRootView>
  );
}
