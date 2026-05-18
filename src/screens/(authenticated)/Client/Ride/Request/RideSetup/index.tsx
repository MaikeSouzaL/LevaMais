import React, { useState, useEffect, useRef } from "react";
import { View, Dimensions, ScrollView, ActivityIndicator } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { BlurView } from "expo-blur";
import Toast from "react-native-toast-message";

import { darkMapStyle } from "@/utils/mapStyle";
import rideService from "@/services/ride.service";
import type { CalculatePriceRequest } from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { ClientStackParamList } from "../../../types/navigation";

// Core UI Atoms ⚛️
import { RideSetupHeader } from "@/components/client/ride-setup/RideSetupHeader";
import { RideSummaryCard } from "@/components/client/ride-setup/RideSummaryCard";
import { CategorySelector, CategoryType } from "@/components/client/ride-setup/CategorySelector";
import { PriceInputCard } from "@/components/client/ride-setup/PriceInputCard";
import { AISuggestionCard } from "@/components/client/ride-setup/AISuggestionCard";
import { RidePrioritySlider, PriorityLevel } from "@/components/client/ride-setup/RidePrioritySlider";
import { SearchDriversButton } from "@/components/client/ride-setup/SearchDriversButton";

// Visual Atoms 🎨
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";

const { width, height } = Dimensions.get("window");
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

interface RideSetupRouteParams {
  vehicleType?: "car" | "motorcycle" | "van" | "truck";
  pickup: { address: string; latitude: number; longitude: number };
  dropoff: { address: string; latitude: number; longitude: number };
}

export default function RideSetupScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "RideSetup">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "RideSetup">>();
  const params = (route.params as RideSetupRouteParams) || {};
  
  const detectedCity = useClientCityStore((state) => state.city);
  const mapRef = useRef<MapView>(null);

  // Logic States
  const [loadingPricing, setLoadingPricing] = useState(true);
  const [creatingRide, setCreatingRide] = useState(false);
  const [priceData, setPriceData] = useState<any>(null);
  
  // Interaction States
  const [selectedCat, setSelectedCat] = useState<CategoryType>((params.vehicleType as CategoryType) || "car");
  const [offerPrice, setOfferPrice] = useState<number>(15.00);
  const [priority, setPriority] = useState<PriorityLevel>(1); // default Balanced

  // Background Geometry track data
  const [pathCoords, setPathCoords] = useState<any[]>([]);

  // 1. Initialize Price Calculation from Backend upon loading
  useEffect(() => {
    const calculate = async () => {
      try {
        setLoadingPricing(true);
        const payload: CalculatePriceRequest = {
          pickup: params.pickup,
          dropoff: params.dropoff,
          vehicleType: selectedCat === "motorcycle" ? "motorcycle" : "car",
          cityId: detectedCity?.cityId || undefined,
        };

        const resp = await rideService.calculatePrice(payload);
        setPriceData(resp);
        
        // Align starting offer to suggested total from server
        const serverTotal = resp.pricing?.total || 20;
        setOfferPrice(Math.round(serverTotal));
      } catch (e: any) {
                Toast.show({ type: "error", text1: "Erro ao calcular", text2: e.message });
      } finally {
        setLoadingPricing(false);
      }
    };

    if (params.pickup && params.dropoff) calculate();
  }, [selectedCat, params.pickup?.latitude, params.dropoff?.latitude]);

  // Handle geometry capture for rendering path behind the blur
  const onDirectionsReady = (res: any) => {
    setPathCoords(res.coordinates);
    mapRef.current?.fitToCoordinates(res.coordinates, {
      edgePadding: { top: 100, right: 50, bottom: 400, left: 50 },
      animated: true,
    });
  };

  // 2. Final Call: Initiate Real-time Ride Request aligned with Backend model
  const handleSearchDrivers = async () => {
    if (!priceData) return;
    try {
      setCreatingRide(true);

      // Construct fully compliant CreateRideRequest 
      const orderPayload: any = {
        serviceType: "ride",
        vehicleType: selectedCat === "motorcycle" ? "motorcycle" : "car",
        pickup: params.pickup,
        dropoff: params.dropoff,
        pricing: {
          ...priceData.pricing,
          total: offerPrice, // Override with client specific offer 
        },
        distance: priceData.distance,
        duration: priceData.duration,
        cityId: detectedCity?.cityId || undefined,
        negotiation: {
          enabled: true,
          clientOffer: offerPrice
        }
      };

      const created = await rideService.create(orderPayload);
      
      // Successfully handoff to global tracking search sequence
      navigation.replace("SearchingDriver", { rideId: created._id });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao criar pedido",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setCreatingRide(false);
    }
  };

  // Derived IA Sugesstion range for UI pill logic
  const minSuggest = priceData?.pricing?.total ? Math.max(5, Math.round(priceData.pricing.total * 0.9)) : 12;
  const maxSuggest = priceData?.pricing?.total ? Math.round(priceData.pricing.total * 1.2) : 18;

  return (
    <View className="flex-1 bg-[#050F0C]">
      {/* 🌌 BACKGROUND LAYER: Dark Blured Active Map 🗺️ */}
      <View className="absolute inset-0 opacity-60">
        <GlobalMap
          ref={mapRef}
          
          style={{ width: '100%', height: '100%' }}
          useDarkStyle={true}
          showsCompass={false}
          initialRegion={{
            latitude: params.pickup?.latitude || 0,
            longitude: params.pickup?.longitude || 0,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02
          }}
        >
          {pathCoords.length > 0 && (
             <>
               <Polyline 
                 coordinates={pathCoords} 
                 strokeColor="rgba(2, 222, 149, 0.2)" 
                 strokeWidth={6} 
               />
               <Polyline 
                 coordinates={pathCoords} 
                 strokeColor="#02de95" 
                 strokeWidth={2} 
                 lineDashPattern={[2, 8]} 
               />
             </>
          )}
          
          <Marker coordinate={params.pickup} anchor={{ x: 0.5, y: 0.5 }}>
            <PremiumMapMarker type="origin" />
          </Marker>
          
          <Marker coordinate={params.dropoff} anchor={{ x: 0.5, y: 0.5 }}>
            <PremiumMapMarker type="destination" />
          </Marker>

          <MapViewDirections
            origin={params.pickup}
            destination={params.dropoff}
            apikey={GOOGLE_API_KEY}
            mode="DRIVING"
            strokeWidth={0}
            strokeColor="transparent"
            onReady={onDirectionsReady}
          />
        </GlobalMap>
      </View>

      {/* 🌫️ BLUR LAYER covering the raw map, providing consistent readability over visual depth */}
      <BlurView intensity={65} tint="dark" className="absolute inset-0" />

      {/* 🛠️ UI FOREGROUND: Layout Scroll area above floating button container */}
      <View className="flex-1 pt-24">
        <RideSetupHeader onBack={navigation.goBack} />

        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 160 }}
        >
          <RideSummaryCard 
             originAddress={params.pickup?.address}
             dropoffAddress={params.dropoff?.address}
             distance={priceData?.distance?.text}
             duration={priceData?.duration?.text}
          />

          <CategorySelector 
            selected={selectedCat}
            onSelect={setSelectedCat}
          />

          {loadingPricing ? (
            <View className="h-48 justify-center items-center">
               <ActivityIndicator color="#02de95" size="large" />
            </View>
          ) : (
            <>
              <PriceInputCard 
                value={offerPrice} 
                onChange={setOfferPrice} 
              />

              <AISuggestionCard 
                min={minSuggest} 
                max={maxSuggest} 
                onApplySuggested={() => setOfferPrice(Math.round(priceData?.pricing?.total || offerPrice))}
              />
            </>
          )}

          <RidePrioritySlider 
            level={priority} 
            onChange={setPriority} 
          />

        </ScrollView>
      </View>

      {/* 💡 Fixed Execution Container */}
      <SearchDriversButton 
        loading={creatingRide || loadingPricing} 
        onPress={handleSearchDrivers} 
      />
    </View>
  );
}
