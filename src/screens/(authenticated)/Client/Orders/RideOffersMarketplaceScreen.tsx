import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StatusBar, Dimensions, ScrollView, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView, AnimatePresence } from "moti";
import { Search, AlertCircle, RefreshCw, MapPin, TrendingUp, Zap, Flame, Coins } from "lucide-react-native";

import rideService, { RideOffer } from "@/services/ride.service";
import { darkMapStyle } from "@/utils/mapStyle";
import { formatBRL } from "@/utils/mappers";

// Custom Premium Hooks & Components ✨
import { Modal } from "@/components/Modal";
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
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingIncrement, setPendingIncrement] = useState("5");

  const [rideDetails, setRideDetails] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ["35%", "86%"], []);

  const openConfirmModal = (val: number) => {
    setPendingIncrement(val > 0 ? String(val) : "");
    setShowConfirmModal(true);
  };

  const handleConfirmIncrease = async () => {
    const cleanVal = pendingIncrement.replace(",", ".");
    const numVal = parseFloat(cleanVal);
    
    if (isNaN(numVal) || numVal <= 0) {
      Toast.show({
        type: "error",
        text1: "Valor inválido",
        text2: "Por favor, informe um valor maior que zero.",
      });
      return;
    }

    setShowConfirmModal(false);
    if (isIncreasing || !rideId) return;
    setIsIncreasing(true);
    try {
      const res = await rideService.increaseOffer(rideId, numVal);
      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Oferta Aumentada! 🚀",
          text2: `Sua nova oferta base agora é ${formatBRL(res.newOffer)}!`,
        });
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
        <View className="px-6 pt-5 pb-4 border-b border-white/[0.04]">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white/40 text-[9px] font-black uppercase tracking-wider mb-0.5">
                Sua Proposta Base
              </Text>
              <Text className="text-white font-black text-2xl">
                {formatBRL(Number(negotiation?.clientOffer || 0))}
              </Text>
            </View>
            
            <View className="bg-[#02de95]/10 rounded-full px-3 py-1 border border-[#02de95]/20">
               <Text className="text-[#02de95] text-[10px] font-bold uppercase tracking-wide">⚡ Negociação</Text>
            </View>
          </View>

          <View className="flex-row items-center mb-3 mt-1">
             <TrendingUp size={12} color="#02de95" className="mr-1.5" />
             <Text className="text-white/50 text-[9px] font-black uppercase tracking-widest">Acelerar Pedido (Aumentar Oferta)</Text>
          </View>
          
          <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={false} 
             className="flex-row overflow-visible"
             contentContainerStyle={{ paddingRight: 24 }}
          >
            <View className="flex-row gap-3">
              {/* 🚀 + R$ 2 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(2)}
                className="bg-[#02de95] rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-lg shadow-[#02de95]/20"
              >
                 <Zap size={13} fill="#091A2F" color="#091A2F" className="mr-1.5" />
                 <Text className="text-[#091A2F] text-[13px] font-black">+R$ 2</Text>
              </TouchableOpacity>

              {/* ⚡ + R$ 5 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(5)}
                className="bg-[#02de95] rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-lg shadow-[#02de95]/20"
              >
                 <Zap size={13} fill="#091A2F" color="#091A2F" className="mr-1.5" />
                 <Text className="text-[#091A2F] text-[13px] font-black">+R$ 5</Text>
              </TouchableOpacity>

              {/* 🔥 + R$ 10 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(10)}
                className="bg-[#02de95] rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-lg shadow-[#02de95]/20"
              >
                 <Zap size={13} fill="#091A2F" color="#091A2F" className="mr-1.5" />
                 <Text className="text-[#091A2F] text-[13px] font-black">+R$ 10</Text>
              </TouchableOpacity>

              {/* 💰 + R$ 15 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(15)}
                className="bg-[#02de95] rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-lg shadow-[#02de95]/20"
              >
                 <Zap size={13} fill="#091A2F" color="#091A2F" className="mr-1.5" />
                 <Text className="text-[#091A2F] text-[13px] font-black">+R$ 15</Text>
              </TouchableOpacity>

              {/* 💎 + R$ 20 */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(20)}
                className="bg-[#02de95] rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-lg shadow-[#02de95]/20"
              >
                 <Zap size={13} fill="#091A2F" color="#091A2F" className="mr-1.5" />
                 <Text className="text-[#091A2F] text-[13px] font-black">+R$ 20</Text>
              </TouchableOpacity>

              {/* ✏️ Outro Valor */}
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openConfirmModal(0)}
                className="bg-[#02de95]/10 border border-[#02de95]/50 rounded-2xl h-[44px] px-4 flex-row items-center justify-center shadow-sm"
              >
                 <TrendingUp size={14} color="#02de95" className="mr-1.5" />
                 <Text className="text-[#02de95] text-[13px] font-black">✏️ Outro Valor</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Section 2: Scrollable Offers Matrix 🧬 */}
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: 40 }}>
          
          {/* 💡 Dica de Aceleração de Pedido */}
          {!loading && (
            <MotiView 
              from={{ opacity: 0, translateY: -10 }} 
              animate={{ opacity: 1, translateY: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-5 flex-row items-center"
            >
              <View className="w-8 h-8 rounded-full bg-amber-500/20 items-center justify-center mr-3 flex-shrink-0">
                 <AlertCircle size={16} color="#FBBF24" />
              </View>
              <View className="flex-1">
                 <Text className="text-amber-500/90 text-[11px] font-bold leading-relaxed">
                   Caso esteja demorando muito, tente aumentar a sua oferta acima para que o seu pedido seja aceito mais rapidamente pelos motoristas!
                 </Text>
              </View>
            </MotiView>
          )}

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
      
      <Modal
        visible={showConfirmModal}
        title="Aumentar Oferta"
        type="success"
        confirmText="Confirmar"
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmIncrease}
      >
         <View style={{ width: "100%", marginTop: 12, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 14, marginBottom: 16, textAlign: "center", lineHeight: 20 }}>
               Insira o valor Adicional (em Reais) que deseja somar à sua proposta base atual:
            </Text>
            
            <View style={{
               width: "100%",
               flexDirection: "row",
               alignItems: "center",
               backgroundColor: "rgba(255,255,255,0.05)",
               borderWidth: 1,
               borderColor: "rgba(255, 255, 255, 0.1)",
               borderRadius: 16,
               paddingHorizontal: 16,
               height: 56,
            }}>
               <Text style={{ color: "#02de95", fontSize: 18, fontWeight: "bold", marginRight: 8 }}>R$</Text>
               <TextInput
                  value={pendingIncrement}
                  onChangeText={setPendingIncrement}
                  keyboardType="decimal-pad"
                  autoFocus
                  style={{
                     flex: 1,
                     color: "#fff",
                     fontSize: 18,
                     fontWeight: "bold",
                  }}
                  placeholder="0,00"
                  placeholderTextColor="rgba(255,255,255,0.3)"
               />
            </View>
         </View>
      </Modal>

    </GestureHandlerRootView>
  );
}
