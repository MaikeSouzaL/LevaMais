import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, ScrollView, ActivityIndicator, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";

import { darkMapStyle } from "@/utils/mapStyle";
import rideService, { CreateRideRequest } from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";

// ✨ Logistical Premium Components Synthesizer
import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { DeliverySummaryCard } from "@/components/client/delivery-setup/DeliverySummaryCard";
import { VehicleSelector, LogisticsVehicleType } from "@/components/client/delivery-setup/VehicleSelector";
import { DeliveryTypeSelector, DeliveryType } from "@/components/client/delivery-setup/DeliveryTypeSelector";
import { CargoDescriptionInput } from "@/components/client/delivery-setup/CargoDescriptionInput";
import { DeliveryOfferCard } from "@/components/client/delivery-setup/DeliveryOfferCard";
import { DeliveryPrioritySelector, DeliveryPriority } from "@/components/client/delivery-setup/DeliveryPrioritySelector";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { PaymentMethodSelector, PaymentMethodType } from "@/components/client/delivery-setup/PaymentMethodSelector";

// Visual Foundations 🗺️
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";
import { CargoSize } from "@/components/client/delivery-setup/CargoSizeSelector";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface DeliverySetupParams {
  vehicleType?: LogisticsVehicleType;
  pickup: { address: string; latitude: number; longitude: number };
  dropoff: { address: string; latitude: number; longitude: number };
  initialDistanceKm?: number;
  initialDurationMin?: number;
}

export default function DeliverySetupScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const params = (route.params as DeliverySetupParams) || {};
  const mapRef = useRef<MapView>(null);
  const detectedCity = useClientCityStore((state) => state.city);

  // Logic States
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [creatingDelivery, setCreatingDelivery] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  
  // Dynamic User Entry Store (Delivery Context)
  const [vehicleType, setVehicleType] = useState<LogisticsVehicleType>(params.vehicleType || "motorcycle");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("food");
  const [cargoDescription, setCargoDescription] = useState("");
  const [cargoSize, setCargoSize] = useState<CargoSize>("medium");
  const [needsHelper, setNeedsHelper] = useState(false);
  const [offerValue, setOfferValue] = useState<number>(20.00);
  const [priority, setPriority] = useState<DeliveryPriority>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>("cash");

  const [path, setPath] = useState<any[]>([]);

  // Fetch automated server dynamic pricing guidance upon configuration shifts
  useEffect(() => {
    const refreshPricing = async () => {
      if (!params.pickup || !params.dropoff) return;
      try {
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
      } catch (e) {
              } finally {
        setLoadingPricing(false);
      }
    };
    refreshPricing();
  }, [
    vehicleType, 
    priority, 
    params.pickup?.latitude, 
    params.dropoff?.latitude
  ]);

  const handlePathReady = (res: any) => {
    setPath(res.coordinates);
    mapRef.current?.fitToCoordinates(res.coordinates, {
      edgePadding: { top: 100, right: 60, bottom: 360, left: 60 },
      animated: true,
    });
  };

  // Transmits to the finalized backend CreateRideRequest shape perfectly aligned with service.ts
  const handleLaunchSearch = async () => {
    if (!priceData) return;
    try {
      setCreatingDelivery(true);
      
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
        }
      };

      const created = await rideService.create(backendPayload);
      
      // Hand off directly into standard Searching lifecycle screen
      navigation.replace("SearchingDriver", { rideId: created._id });
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
          originAddress={params.pickup.address} 
          dropoffAddress={params.dropoff.address} 
          distance={priceData?.distance?.text || (params.initialDistanceKm ? `${params.initialDistanceKm.toFixed(1)} km` : "...")}
          duration={priceData?.duration?.text || (params.initialDurationMin ? `${Math.ceil(params.initialDurationMin)} min` : "...")}
        />
        
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

        <CargoDescriptionInput value={cargoDescription} onChange={setCargoDescription} />


        
        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <DeliveryPrioritySelector value={priority} onChange={setPriority} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <PaymentMethodSelector value={paymentMethod} onChange={setPaymentMethod} />

        {loadingPricing ? (
          <View className="h-32 items-center justify-center"><ActivityIndicator color="#02de95" /></View>
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
