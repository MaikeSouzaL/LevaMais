import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import rideService, { CreateRideRequest } from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";

// ✨ Logistical Premium Components Synthesizer
import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { DeliverySummaryCard } from "@/components/client/delivery-setup/DeliverySummaryCard";
import { VehicleSelector, LogisticsVehicleType } from "@/components/client/delivery-setup/VehicleSelector";
import { DeliveryTypeSelector, DeliveryType } from "@/components/client/delivery-setup/DeliveryTypeSelector";
import { CargoSizeSelector } from "@/components/client/delivery-setup/CargoSizeSelector";
import { CargoDescriptionInput } from "@/components/client/delivery-setup/CargoDescriptionInput";
import { DeliveryOfferCard } from "@/components/client/delivery-setup/DeliveryOfferCard";
import { DeliveryPrioritySelector, DeliveryPriority } from "@/components/client/delivery-setup/DeliveryPrioritySelector";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { PaymentMethodSelector, PaymentMethodType } from "@/components/client/delivery-setup/PaymentMethodSelector";

// Visual Foundations 🗺️
import { CargoSize } from "@/components/client/delivery-setup/CargoSizeSelector";

interface DeliverySetupParams {
  vehicleType?: LogisticsVehicleType;
  preferScheduled?: boolean;
  pickup: { address: string; latitude: number; longitude: number };
  dropoff: { address: string; latitude: number; longitude: number };
  initialDistanceKm?: number;
  initialDurationMin?: number;
}

export default function DeliverySetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params as DeliverySetupParams) || {};
  const detectedCity = useClientCityStore((state) => state.city);

  // Logic States
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [creatingDelivery, setCreatingDelivery] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingReloadTick, setPricingReloadTick] = useState(0);
  
  // Dynamic User Entry Store (Delivery Context)
  const [vehicleType, setVehicleType] = useState<LogisticsVehicleType>(params.vehicleType || "motorcycle");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("food");
  const [cargoDescription, setCargoDescription] = useState("");
  const [cargoSize, setCargoSize] = useState<CargoSize>("medium");
  const needsHelper = false;
  const [offerValue, setOfferValue] = useState<number>(20.00);
  const [priority, setPriority] = useState<DeliveryPriority>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cash");
  const [scheduledOffsetMin, setScheduledOffsetMin] = useState<number>(60);
  const [helperAutoSuggested, setHelperAutoSuggested] = useState(false);
  const hasValidRoute = Boolean(params.pickup && params.dropoff);


  // Fetch automated server dynamic pricing guidance upon configuration shifts
  useEffect(() => {
    const refreshPricing = async () => {
      if (!params.pickup || !params.dropoff) {
        setPricingError("Origem e destino nao foram definidos. Volte e selecione os enderecos.");
        setLoadingPricing(false);
        return;
      }
      try {
        setPricingError(null);
        setLoadingPricing(true);
        const res = await rideService.calculatePrice({
          pickup: params.pickup,
          dropoff: params.dropoff,
          vehicleType: vehicleType,
          deliveryType: deliveryType,
          cargoSize: cargoSize,
          priority: priority,
          needsHelper: needsHelper,
          serviceType: "delivery",
          cityId: (detectedCity as any)?._id || undefined,
          // Convert KM -> Meters and Min -> Seconds
          distance: params.initialDistanceKm ? Math.round(params.initialDistanceKm * 1000) : undefined,
          duration: params.initialDurationMin ? Math.round(params.initialDurationMin * 60) : undefined,
        });
        
        setPriceData(res);
        
        // Update floor for initial pricing based on dynamic backend recommendation
        const smartSuggestion = res.smartPricing?.suggestedPrice || res.pricing?.total || 20;
        setOfferValue(Math.round(smartSuggestion));
      } catch (e: any) {
        setPricingError(e?.message || "Falha ao calcular o preco da entrega.");
        setPriceData(null);
      } finally {
        setLoadingPricing(false);
      }
    };
    refreshPricing();
  }, [
    vehicleType,
    deliveryType,
    cargoSize,
    needsHelper,
    priority,
    params.pickup?.latitude,
    params.dropoff?.latitude,
    params.initialDistanceKm,
    params.initialDurationMin,
    detectedCity,
    pricingReloadTick,
  ]);

  // Transmits to the finalized backend CreateRideRequest shape perfectly aligned with service.ts
  const handleLaunchSearch = async () => {
    if (!hasValidRoute) {
      Toast.show({
        type: "error",
        text1: "Rota invalida",
        text2: "Defina origem e destino antes de solicitar a entrega.",
      });
      return;
    }
    if (!priceData) {
      Toast.show({
        type: "error",
        text1: "Preco indisponivel",
        text2: "Aguardando cotacao da entrega. Tente novamente em instantes.",
      });
      return;
    }
    try {
      setCreatingDelivery(true);
      if (!Number.isFinite(offerValue) || offerValue <= 0) {
        Toast.show({
          type: "error",
          text1: "Valor de oferta invalido",
          text2: "Defina uma oferta maior que zero.",
        });
        return;
      }
      
      // Detailed synthesis mapped directly to the backend schema RideDetails & CreateRideRequest
      const backendPayload: CreateRideRequest = {
        serviceType: "delivery", // Explicit logistics toggle
        vehicleType: vehicleType,
        pickup: params.pickup,
        dropoff: params.dropoff,
        cityId: (detectedCity as any)?._id || undefined,
        pricing: {
          ...priceData.pricing,
          total: offerValue // injecting client negotiated value
        },
        distance: priceData.distance,
        duration: priceData.duration,
        details: {
          itemType: deliveryType,
          needsHelper: needsHelper,
          priority: priority,
          specialInstructions: `[Tamanho: ${cargoSize}] ${cargoDescription}`.trim(),
        },
        negotiation: {
          enabled: true,
          clientOffer: offerValue
        },
        payment: {
          method: {
            // Match the backend typing from service.ts
            type: paymentMethod === "card" ? "credit_card" : paymentMethod
          }
        },
        scheduledFor: params.preferScheduled
          ? new Date(Date.now() + scheduledOffsetMin * 60 * 1000).toISOString()
          : undefined,
      };

      const created = await rideService.create(backendPayload);

      if (created?.status === "scheduled") {
        Toast.show({
          type: "success",
          text1: "Entrega agendada",
          text2: "Seu pedido foi agendado e aparecera em pedidos ativos.",
        });
        navigation.replace("ActiveOrders");
        return;
      }

      // Hand off directly into standard Searching lifecycle screen
      navigation.replace("SearchingDriver", {
        rideId: created._id,
        serviceType: "delivery",
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao lançar entrega",
        text2: e?.message || "Verifique sua conexão",
      });
    } finally {
      setCreatingDelivery(false);
    }
  };

  // Leverage Smart Dynamic Backend Hint Ranges
  const minHint = priceData?.smartPricing?.minimumPrice || 15;
  const maxHint = priceData?.smartPricing?.priorityPrice || 35;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : undefined} 
      className="flex-1 bg-[#091A2F]"
    >
      {/* Solid Dark Dashboard Substrate (Map background eradicated per user request) */}
      <View className="absolute inset-0 bg-[#091A2F]" />

      <DeliverySetupHeader />

      {/* The Operation Panel Scroll wrapper now breathes more and groups items elegantly */}
      <ScrollView 
        className="flex-1 pt-28" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 16 }}
      >
        <DeliverySummaryCard 
          originAddress={params.pickup?.address || "Origem nao informada"} 
          dropoffAddress={params.dropoff?.address || "Destino nao informado"} 
          distance={priceData?.distance?.text || (params.initialDistanceKm ? `${params.initialDistanceKm.toFixed(1)} km` : "...")}
          duration={priceData?.duration?.text || (params.initialDurationMin ? `${Math.ceil(params.initialDurationMin)} min` : "...")}
        />
        {!hasValidRoute && (
          <View className="mx-4 mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-3">
            <Text className="text-red-300 text-[12px] font-semibold">
              Origem/destino ausentes. Volte para a tela anterior e selecione os enderecos para continuar.
            </Text>
          </View>
        )}
        {params.preferScheduled && (
          <View className="mx-4 mb-2 rounded-xl border border-[#fbbf24]/35 bg-[#fbbf24]/10 px-3 py-2">
            <Text className="text-[#fbbf24] text-[12px] font-bold">
              Baixa oferta detectada: recomendamos agendar para aumentar chance de aceite.
            </Text>
            <View className="mt-2 flex-row gap-2">
              {[30, 60, 120].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setScheduledOffsetMin(minutes)}
                  className={`rounded-full px-3 py-1 ${
                    scheduledOffsetMin === minutes
                      ? "bg-[#fbbf24]"
                      : "bg-[#fbbf24]/15 border border-[#fbbf24]/40"
                  }`}
                >
                  <Text
                    className={`text-[11px] font-semibold ${
                      scheduledOffsetMin === minutes ? "text-[#091A2F]" : "text-[#fbbf24]"
                    }`}
                  >
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
        
        <View className="h-[1px] bg-white/[0.03] w-full my-2" />

        <VehicleSelector 
          selected={vehicleType} 
          onSelect={setVehicleType} 
          pickupLocation={params.pickup}
        />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6" />

        <DeliveryTypeSelector 
          selected={deliveryType} 
          onSelect={setDeliveryType} 
          vehicleType={vehicleType} 
        />

        {(vehicleType === "van" || vehicleType === "truck") && (
          <View className="mx-6 mb-4 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-3 py-2">
            <Text className="text-[#7dd3fc] text-[12px] font-semibold">
              Frete {vehicleType === "truck" ? "de caminhao" : "de van"}: detalhe acesso no local e o peso da carga para melhorar o aceite.
            </Text>
          </View>
        )}

        <CargoSizeSelector value={cargoSize} onChange={setCargoSize} />



        <CargoDescriptionInput value={cargoDescription} onChange={setCargoDescription} />


        
        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <DeliveryPrioritySelector value={priority} onChange={setPriority} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

        {loadingPricing ? (
          <View className="h-32 items-center justify-center"><ActivityIndicator color="#02de95" /></View>
        ) : pricingError ? (
          <View className="mx-4 mb-4 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-3">
            <Text className="text-amber-200 text-[12px] font-semibold">{pricingError}</Text>
            <TouchableOpacity
              onPress={() => setPricingReloadTick((prev) => prev + 1)}
              className="mt-2 self-start rounded-full border border-amber-300/50 px-3 py-1"
            >
              <Text className="text-amber-200 text-[11px] font-bold">Recarregar cotacao</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <DeliveryOfferCard 
            value={offerValue} 
            suggestedMin={minHint} 
            suggestedMax={maxHint} 
            onChange={setOfferValue} 
          />
        )}
      </ScrollView>

      <SearchDeliveryButton 
        loading={creatingDelivery || loadingPricing} 
        onPress={handleLaunchSearch} 
      />
    </KeyboardAvoidingView>
  );
}
