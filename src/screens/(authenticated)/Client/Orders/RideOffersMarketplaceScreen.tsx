import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, StatusBar, Dimensions, ScrollView, TextInput } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import MapView, { PROVIDER_GOOGLE, Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView, AnimatePresence } from "moti";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, AlertCircle, RefreshCw, MapPin, TrendingUp, Zap, Flame, Coins, TrendingDown, Trash2 } from "lucide-react-native";

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
import { FloatingActions } from "@/components/client/home/FloatingActions";

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
const { width, height } = Dimensions.get("window");

export default function RideOffersMarketplaceScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const rideId = String(route.params?.rideId || "");
  
  const insets = useSafeAreaInsets();

  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [isIncreasing, setIsIncreasing] = useState(false);
  const [pathCoords, setPathCoords] = useState<any[]>([]);
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingIncrement, setPendingIncrement] = useState("5");
  const [isSubtractMode, setIsSubtractMode] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [sheetIndex, setSheetIndex] = useState(0);

  const [rideDetails, setRideDetails] = useState<any>(null);
  const [negotiation, setNegotiation] = useState<any>(null);
  const [offers, setOffers] = useState<RideOffer[]>([]);
  const [isCentering, setIsCentering] = useState(false);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light' | 'hybrid'>('dark');
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);

  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<BottomSheet>(null);
  
  const snapPoints = useMemo(() => ["35%", "86%"], []);

  const handleCenterOnRoute = useCallback(() => {
    if (!mapRef.current || pathCoords.length === 0) return;
    setIsCentering(true);
    mapRef.current.fitToCoordinates(pathCoords, {
      edgePadding: { top: 140, right: 50, bottom: 380, left: 50 },
      animated: true,
    });
    setTimeout(() => setIsCentering(false), 600);
  }, [pathCoords]);

  const handleToggleMapStyle = useCallback(() => {
    if (isSwitchingStyle) return;
    setIsSwitchingStyle(true);
    
    setMapTheme((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'hybrid';
      return 'dark';
    });

    setTimeout(() => setIsSwitchingStyle(false), 350);
  }, [isSwitchingStyle]);

  const openConfirmModal = (val: number) => {
    setPendingIncrement(val > 0 ? String(val) : "");
    setIsSubtractMode(false); // Reseta para somar ao iniciar o ajuste pelas pílulas rápidas
    setShowConfirmModal(true);
  };

  const handleConfirmIncrease = async () => {
    const cleanVal = pendingIncrement.replace(",", ".");
    let numVal = parseFloat(cleanVal);
    
    if (isNaN(numVal) || numVal <= 0) {
      Toast.show({
        type: "error",
        text1: "Valor inválido",
        text2: "Por favor, informe um valor maior que zero.",
      });
      return;
    }

    // Se estiver marcado para subtrair, nega o valor! 📉
    if (isSubtractMode) {
       numVal = -numVal;
    }

    // Proteção contra redução abaixo do valor original da corrida! 🛡️
    const currentBase = Number(negotiation?.clientOffer || 0);
    const minFloor = Number(negotiation?.initialClientOffer || rideDetails?.pricing?.subtotal || 5.00);
    const finalPredict = currentBase + numVal;

    if (finalPredict < minFloor) {
      Toast.show({
        type: "error",
        text1: "Limite Mínimo Atingido",
        text2: `Sua proposta não pode ser menor que o valor inicial de ${formatBRL(minFloor)}.`,
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
          text1: isSubtractMode ? "Oferta Reduzida! 📉" : "Oferta Aumentada! 🚀",
          text2: `Sua nova oferta base agora é ${formatBRL(res.newOffer)}!`,
        });
        await loadOffers();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao ajustar",
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
  const isDeliveryFlow =
    rideDetails?.serviceType === "delivery" || rideDetails?.serviceType === "frete";

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

  const handleDeclineOffer = async (offer: RideOffer) => {
    const driverId = typeof offer.driverId === "string" ? offer.driverId : offer.driverId?._id;
    if (!driverId) return;

    setSelectingId(driverId); // Reutiliza o loader no card do motorista
    try {
      await rideService.declineOffer(rideId, driverId);
      Toast.show({
        type: "info",
        text1: "Oferta Recusada",
        text2: "A proposta do entregador foi removida da lista.",
      });
      await loadOffers(); // Recarrega a lista imediatamente
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao recusar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
    } finally {
      setSelectingId(null);
    }
  };

  const handleConfirmCancel = async () => {
    if (!rideId || isCancelling) return;
    setIsCancelling(true);
    try {
      await rideService.cancel(rideId, "Cancelado pelo cliente no painel de ofertas.");
      setShowCancelModal(false);
      Toast.show({
        type: "success",
        text1: isDeliveryFlow ? "Entrega cancelada" : "Corrida cancelada",
        text2: isDeliveryFlow
          ? "A solicitacao de entrega foi encerrada com sucesso."
          : "O chamado foi encerrado com sucesso.",
      });
      navigation.navigate("Home");
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao cancelar",
        text2: e?.response?.data?.error || "Tente novamente.",
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const routeColor = mapTheme === 'light' 
    ? '#1D4ED8' 
    : mapTheme === 'hybrid' 
      ? '#FFEA00' 
      : '#02de95';

  const routeGlowColor = mapTheme === 'light' 
    ? 'rgba(29, 78, 216, 0.25)'
    : mapTheme === 'hybrid' 
      ? 'rgba(255, 234, 0, 0.3)' 
      : 'rgba(2, 222, 149, 0.2)';

  const routeWidth = mapTheme === 'light' ? 3.5 : 2;
  const glowWidth = mapTheme === 'light' ? 8 : 6;

  return (
    <GestureHandlerRootView className="flex-1 bg-[#091A2F]">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌁 Floating Glass Marketplace HUD */}
      <MarketplaceHeader 
        onBack={() => navigation.goBack()} 
        offerCount={sortedOffers.length} 
        useDarkMap={mapTheme !== 'light'}
      />

      {/* 🗺️ Full Screen Dynamic Topographic Map */}
      <MapView
        ref={mapRef}
        style={{ width, height }}
        provider={PROVIDER_GOOGLE}
        mapType={mapTheme === 'hybrid' ? 'hybrid' : 'standard'}
        customMapStyle={mapTheme === 'dark' ? darkMapStyle : []}
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
                  strokeColor={routeGlowColor} 
                  strokeWidth={glowWidth} 
                />
                <Polyline 
                  coordinates={pathCoords} 
                  strokeColor={routeColor} 
                  strokeWidth={routeWidth} 
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

      {/* 🛸 Floating Camera, Style & Security Control Suite */}
      <FloatingActions 
        onLocationPress={handleCenterOnRoute}
        onSosPress={() => navigation.navigate("ClientSafety")}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={mapTheme !== 'light'}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingStyle}
        topOffset={insets.top + 100}
      />

      {/* 🗂️ Bottom Sliding Ledger (Trading Desk) */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={(index) => setSheetIndex(index)}
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
        <BottomSheetScrollView contentContainerStyle={{ padding: 24, paddingBottom: sheetIndex === 1 ? 120 : 40 }}>
          
          {/* 💡 Dica de Aceleração de Pedido (Mostrada Apenas se Estiver Vazio!) */}
          {!loading && sortedOffers.length === 0 && (
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
                    onDecline={handleDeclineOffer}
                  />
                );
              })
            )}
          </AnimatePresence>

        </BottomSheetScrollView>
      </BottomSheet>
      
      <Modal
        visible={showConfirmModal}
        title="Ajustar Oferta"
        type="info"
        confirmText="Confirmar"
        onClose={() => setShowConfirmModal(false)}
        onConfirm={handleConfirmIncrease}
      >
         <View style={{ width: "100%", marginTop: 12, alignItems: "center" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, marginBottom: 12, textAlign: "center", lineHeight: 18 }}>
               Ajuste o valor da proposta base. (Valor mínimo do seu chamado: <Text style={{ color: "#fff", fontWeight: "bold" }}>{formatBRL(Number(negotiation?.initialClientOffer || rideDetails?.pricing?.subtotal || 5.00))}</Text>)
            </Text>

            {/* Chaveador de Operação (Somar / Subtrair) 🧬 */}
            <View style={{ 
               flexDirection: "row", 
               backgroundColor: "rgba(255,255,255,0.06)", 
               borderRadius: 12, 
               padding: 4, 
               width: "100%", 
               marginBottom: 16 
            }}>
               <TouchableOpacity 
                  onPress={() => setIsSubtractMode(false)}
                  activeOpacity={0.8}
                  style={{ 
                     flex: 1, 
                     height: 40, 
                     borderRadius: 8, 
                     backgroundColor: !isSubtractMode ? "#02de95" : "transparent", 
                     alignItems: "center", 
                     justifyContent: "center", 
                     flexDirection: "row" 
                  }}
               >
                  <Zap size={13} fill={!isSubtractMode ? "#091A2F" : "rgba(255,255,255,0.5)"} color={!isSubtractMode ? "#091A2F" : "rgba(255,255,255,0.5)"} style={{ marginRight: 6 }} />
                  <Text style={{ color: !isSubtractMode ? "#091A2F" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "bold" }}>Somar (+)</Text>
               </TouchableOpacity>

               <TouchableOpacity 
                  onPress={() => setIsSubtractMode(true)}
                  activeOpacity={0.8}
                  style={{ 
                     flex: 1, 
                     height: 40, 
                     borderRadius: 8, 
                     backgroundColor: isSubtractMode ? "#ef4444" : "transparent", 
                     alignItems: "center", 
                     justifyContent: "center", 
                     flexDirection: "row" 
                  }}
               >
                  <TrendingDown size={14} color={isSubtractMode ? "#fff" : "rgba(255,255,255,0.5)"} style={{ marginRight: 6 }} />
                  <Text style={{ color: isSubtractMode ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "bold" }}>Subtrair (-)</Text>
               </TouchableOpacity>
            </View>
            
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
               <Text style={{ 
                  color: !isSubtractMode ? "#02de95" : "#ef4444", 
                  fontSize: 18, 
                  fontWeight: "bold", 
                  marginRight: 8 
               }}>
                  {isSubtractMode ? "- R$" : "R$"}
               </Text>
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

      {/* Luxury Cancel Confirmation Modal 🛑 */}
      <Modal
        visible={showCancelModal}
        title="Cancelar Pedido?"
        type="error"
        confirmText={isCancelling ? "Cancelando..." : "Confirmar Cancelamento"}
        onClose={() => !isCancelling && setShowCancelModal(false)}
        onConfirm={handleConfirmCancel}
      >
         <View style={{ width: "100%", marginTop: 12 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, textAlign: "center", lineHeight: 18 }}>
               Tem certeza que deseja cancelar a sua solicitação? O chamado será encerrado e todos os entregadores próximos deixarão de ver o seu pedido.
            </Text>
         </View>
      </Modal>

      {/* 🛑 Fixed Root-Level Cancel Button (Hoisted beyond BottomSheet off-screen container limits!) */}
      {/* 🛑 Fixed Root-Level Cancel Button (Permanently mounted to solve layout calculation passes) */}
      <View
        style={{ 
          position: "absolute", 
          bottom: 0, 
          left: 0, 
          right: 0,
          paddingHorizontal: 24,
          paddingBottom: Math.max(insets.bottom, 24),
          paddingTop: 16,
          backgroundColor: "#0B1A2A",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.07)",
          zIndex: 9999,
          elevation: 99,
          display: sheetIndex > 0 ? "flex" : "none",
        }}
      >
         <TouchableOpacity 
            onPress={() => setShowCancelModal(true)}
            activeOpacity={0.85}
            style={{ 
               flexDirection: "row", 
               alignItems: "center", 
               justifyContent: "center", 
               width: "100%",
               height: 56,
               borderRadius: 20,
               backgroundColor: "#ef4444",
               shadowColor: "#ef4444",
               shadowOffset: { width: 0, height: 6 },
               shadowOpacity: 0.4,
               shadowRadius: 12,
               elevation: 8,
            }}
         >
            <Trash2 size={20} color="#fff" style={{ marginRight: 10 }} />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "900", letterSpacing: 1 }}>
               CANCELAR ESTE PEDIDO
            </Text>
         </TouchableOpacity>
      </View>

    </GestureHandlerRootView>
  );
}
