import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StatusBar, Dimensions } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView, AnimatePresence } from "moti";
import { Search, AlertCircle, RefreshCw, MapPin, TrendingUp, Zap } from "lucide-react-native";

import rideService, { RideOffer } from "@/services/ride.service";
import { darkMapStyle } from "@/utils/mapStyle";
import { formatBRL } from "@/utils/mappers";

// Custom Premium Hooks & Components ✨
import { MarketplaceHeader } from "@/components/client/offers/MarketplaceHeader";
import { DriverOfferListItem } from "@/components/client/offers/DriverOfferListItem";
import { NearbyDriversLayer } from "@/components/client/searching-delivery/NearbyDriversLayer";
import { useRealtimeDelivery } from "@/hooks/useRealtimeDelivery";
import { PremiumMapMarker } from "@/components/maps/PremiumMapMarker";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const { width, height } = Dimensions.get("window");

export default function RideOffersMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");

  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [pathCoords, setPathCoords] = useState<any[]>([]);
  
  const [rideDetails, setRideDetails] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ["45%", "90%"], []);

  const handleIncreaseOffer = async (increment = 2) => {
    if (isIncreasing || !rideId) return;
    setIsIncreasing(true);
    try {
      const res = await rideService.increaseOffer(rideId, increment);
      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Oferta Aumentada! 🚀",
          text2: `O valor da sua oferta subiu para ${formatBRL(res.newOffer)}!`,
        });
        // Recarrega localmente no mesmo instante!
        await loadOffers();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao aumentar",
        text2: e?.response?.data?.error || e?.message || "Tente novamente.",
      });
    } finally {
      setIsIncreasing(false);
    }
  };

  // Fetch Ride Data for Map Orientation 🗺️
  const loadRideDetails = useCallback(async () => {
    try {
      const details = await rideService.getById(rideId);
      setRideDetails(details);
    } catch (e) {
          }
  }, [rideId]);

  // Live Bidding Fetch Function 💸
  const loadOffers = useCallback(async () => {
    if (!rideId) return;
    const data = await rideService.getOffers(rideId);
    setNegotiation(data.negotiation);
    setOffers((data.offers || []).filter((o) => o.status !== "rejected"));
  }, [rideId]);

  // Init Sequences
  useEffect(() => {
    loadRideDetails();
  }, [loadRideDetails]);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      try {
        await loadOffers();
      } catch (e: any) {
        if (mounted) {
          Toast.show({ type: "error", text1: "Erro", text2: "Falha ao atualizar propostas." });
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    
    init();

    // Continuous Active Auction Polling 🔁
    const interval = setInterval(() => {
      loadOffers().catch(() => {});
    }, 6000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [loadOffers]);

  // Simulate visual traffic near the pickup while negotiating 🛰️
  const pickup = rideDetails?.pickup;
  const dropoff = rideDetails?.dropoff;
  
  const { drivers } = useRealtimeDelivery(
    pickup?.latitude,
    pickup?.longitude,
    rideDetails?.vehicleType || "motorcycle",
    0,
    rideDetails?.serviceType || "ride"
  );

  const sortedOffers = useMemo(() => {
    // Sort by cheapest first
    return [...offers].sort((a, b) => Number(a.amount || 0) - Number(b.amount || 0));
  }, [offers]);

  const handleSelectOffer = async (offer: RideOffer) => {
    const driverId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id;
    if (!driverId) return;

    setSelectingId(driverId);
    try {
      await rideService.selectOffer(rideId, driverId);
      Toast.show({
        type: "success",
        text1: "Proposta aceita!",
        text2: "Aguardando a conexão com o entregador.",
      });
      // Automatically transition to full live tracking or search success container
      navigation.navigate("SearchingDriver", { rideId });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao selecionar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
      setSelectingId(null);
    }
  };

  return (
    <GestureHandlerRootView className="flex-1 bg-[#091A2F]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌁 Floating Glass Marketplace HUD */}
      <MarketplaceHeader 
        onBack={() => navigation.goBack()} 
        offerCount={sortedOffers.length} 
      />

      {/* 🗺️ Full Screen Dynamic Topographic Map */}
      <MapView
        ref={mapRef}
        style={{ width, height }}
        provider={PROVIDER_GOOGLE}
        customMapStyle={darkMapStyle}
        initialRegion={pickup ? {
          latitude: pickup.latitude,
          longitude: pickup.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        } : undefined}
      >
        {pickup && dropoff && (
          <>
            {/* Main Pickup / Dropoff Vector Pipeline 🛣️ */}
            <MapViewDirections
              origin={{ latitude: pickup.latitude, longitude: pickup.longitude }}
              destination={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
              apikey={GOOGLE_API_KEY}
              strokeWidth={0}
              strokeColor="transparent"
              mode="DRIVING"
              onReady={(result) => {
                setPathCoords(result.coordinates);
                mapRef.current?.fitToCoordinates(result.coordinates, {
                  edgePadding: { top: 140, right: 50, bottom: 380, left: 50 },
                  animated: true,
                });
              }}
            />

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

            {/* Premium Origin Pointer */}
            <Marker 
              coordinate={{ latitude: pickup.latitude, longitude: pickup.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
               <PremiumMapMarker type="origin" />
            </Marker>

            {/* Premium Destination Pointer */}
            <Marker 
              coordinate={{ latitude: dropoff.latitude, longitude: dropoff.longitude }}
              anchor={{ x: 0.5, y: 0.5 }}
            >
               <PremiumMapMarker type="destination" />
            </Marker>

            {/* Live Dynamic Negotiation Traffic 🛰️ */}
            <NearbyDriversLayer drivers={drivers} />
          </>
        )}
      </MapView>

      {/* 🗂️ Bottom Sliding Ledger (Trading Desk) */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        backgroundStyle={{ backgroundColor: "#0B1A2A", borderRadius: 36 }}
        handleIndicatorStyle={{ backgroundColor: "rgba(255,255,255,0.15)", width: 40, height: 5 }}
      >
        
        {/* Section 1: Internal Static Header within Sheet */}
        <View className="px-6 py-4 border-b border-white/[0.04] flex-row items-center justify-between">
          <View>
            <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">
              Sua Proposta Base
            </Text>
            <Text className="text-white font-bold text-xl">
              {formatBRL(Number(negotiation?.clientOffer || 0))}
            </Text>
          </View>
          
          {/* ⚡ Bidding Quick Actions! */}
          <View className="flex-row items-center gap-2">
            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isIncreasing}
              onPress={() => handleIncreaseOffer(2)}
              className="bg-[#02de95]/10 border border-[#02de95]/25 rounded-xl px-3 py-2 flex-row items-center"
            >
               <TrendingUp size={12} color="#02de95" className="mr-1" />
               <Text className="text-[#02de95] text-xs font-black">+R$ 2</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              disabled={isIncreasing}
              onPress={() => handleIncreaseOffer(5)}
              className="bg-[#02de95] shadow-lg rounded-xl px-3 py-2 flex-row items-center"
            >
               <Zap size={11} fill="#091A2F" color="#091A2F" className="mr-1.5" />
               <Text className="text-[#091A2F] text-xs font-black">+R$ 5</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Section 2: Scrollable Offers Matrix 🧬 */}
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          <AnimatePresence>
            {loading ? (
              <MotiView 
                from={{ opacity: 0 }} animate={{ opacity: 1 }} 
                className="py-12 items-center justify-center"
              >
                <RefreshCw size={24} color="#02de95" className="animate-spin" />
                <Text className="text-white/60 text-sm font-medium mt-4">
                  Sincronizando marketplace...
                </Text>
              </MotiView>
            ) : sortedOffers.length === 0 ? (
              <MotiView 
                from={{ opacity: 0, scale: 0.95 }} 
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white/[0.02] border border-white/10 rounded-3xl p-8 items-center justify-center"
              >
                <View className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full items-center justify-center mb-5">
                   <AlertCircle size={28} color="#FBBF24" />
                </View>
                <Text className="text-white font-bold text-lg mb-2">
                  Aguardando Propostas
                </Text>
                <Text className="text-white/50 text-center text-sm leading-relaxed">
                  Os entregadores da região estão visualizando sua oferta agora. Em breve as propostas aparecerão aqui.
                </Text>
              </MotiView>
            ) : (
              sortedOffers.map((offer, idx) => {
                const dId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id || `${idx}`;
                return (
                  <DriverOfferListItem
                    key={`${dId}-${idx}`}
                    offer={offer}
                    clientBudget={Number(negotiation?.clientOffer || 0)}
                    loading={selectingId === dId}
                    onSelect={handleSelectOffer}
                  />
                );
              })
            )}
          </AnimatePresence>

        </BottomSheetScrollView>
      </BottomSheet>
      
    </GestureHandlerRootView>
  );
}
