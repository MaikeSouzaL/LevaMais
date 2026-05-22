import React, { useCallback, useState, useEffect } from "react";
import { StatusBar, Alert, View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { NavigationProp, RouteProp, useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { Info, Search, QrCode, Percent, CreditCard, ChevronRight, User, Bell, Shield, ArrowRight, Car, Package, Wallet, Gift, Home as HomeIcon, Briefcase } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Toast from "react-native-toast-message";

// 📌 Custom Hooks / Global System
import { useAuthStore } from "@/context/authStore";
import favoriteAddressService from "@/services/favoriteAddress.service";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";

// 🛠️ Reused Domain Hooks from Original Flow
import { useMapLocation } from "../Shared/hooks/useMapLocation";

// 🎨 Premium Visual Shell Components
import { ClientRealtimeMap } from "@/components/client/home/ClientRealtimeMap";
import {Modal} from "@/components/Modal";
import { colors } from "@/theme";
import { ClientStackParamList } from "../types/navigation";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "Home">>();
  const { userData: user } = useAuthStore();
  
  const [showHomeSuccessModal, setShowHomeSuccessModal] = useState(false);
  const [showNoDriversModal, setShowNoDriversModal] = useState(false);
  const [showCancelledModal, setShowCancelledModal] = useState(false);
  const [expiredRideId, setExpiredRideId] = useState<string | null>(null);

  useEffect(() => {
    if (route.params?.showSuccessQueueModal) {
       setShowHomeSuccessModal(true);
       navigation.setParams({ showSuccessQueueModal: undefined });
    }
    // Immediate banner: rideId passed directly from OrderSentScreen
    if (route.params?.activeRideId) {
       setActiveRequestingRideId(route.params.activeRideId);
       navigation.setParams({ activeRideId: undefined });
    }
  }, [route.params]);
  
  // Mapping Engine Instance & Actions
  const {
    mapRef,
    region,
    userRegion,
    currentAddress,
    centerOnUser,
    handleRegionChangeComplete
  } = useMapLocation();

  // Component States
  const [favorites, setFavorites] = useState<any[]>([]);
  const [sheetSnapIndex, setSheetSnapIndex] = useState(0);
  const [waitingQueueCount, setWaitingQueueCount] = useState<number>(0);
  const [negotiationRideId, setNegotiationRideId] = useState<string | null>(null);
  const [activeRequestingRideId, setActiveRequestingRideId] = useState<string | null>(null);
  const [availability, setAvailability] = useState<{
    rideDrivers: number;
    deliveryDrivers: number;
    totalNearby: number;
  }>({
    rideDrivers: 0,
    deliveryDrivers: 0,
    totalNearby: 0,
  });
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(null);
  
  // Map Operational Visual States 🎨
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  // Active Service view state & Delivery configurations
  const [activeService, setActiveService] = useState<"ride" | "delivery" | "pay">("ride");
  const [deliveryMode, setDeliveryMode] = useState<"send" | "receive">("send");

  //Background monitoring of active ride (Redirect if driver offers or accepts)
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    const checkActiveRide = async () => {
      try {
        const res = await rideService.getActiveList();
        if (!isMounted) return;
        
        const activeRides = res?.rides || [];
        console.log("[Home] getActiveList response:", JSON.stringify({ active: res?.active, count: res?.count, rides: res?.rides?.map((r: any) => ({ id: r._id, status: r.status, service: r.serviceType })) }));
        
        // Find if any ride has active negotiations/offers (status !== 'rejected')
        const rideWithOffers = activeRides.find((ride: any) => {
          const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
          return offers.some((o: any) => o.status !== "rejected");
        });
        if (rideWithOffers) {
           setNegotiationRideId(rideWithOffers._id);
           setActiveRequestingRideId(null);
        } else {
           setNegotiationRideId(null);
           // Show banner for any ride waiting for drivers (requesting status, any service type)
           const requestingRide = activeRides.find((ride: any) =>
             ride.status === "requesting" || ride.status === "payment_pending" || ride.status === "driver_assigned"
           );
           console.log("[Home] requestingRide:", requestingRide?._id, requestingRide?.status);
           setActiveRequestingRideId(requestingRide?._id || null);
        }

        const queuedRides = activeRides.filter((ride: any) => ride.isWaitingInQueue === true && ride.status === "requesting");
        setWaitingQueueCount(queuedRides.length);

        const primaryRide = activeRides.find((ride: any) => !ride.isWaitingInQueue);
        if (primaryRide) {
          if (primaryRide.driverId && ["accepted", "driver_arriving", "arrived", "in_progress"].includes(primaryRide.status)) {
             navigation.reset({
               index: 0,
               routes: [{ name: "RideTracking", params: { rideId: primaryRide._id } }],
             });
             return;
          }
        }
        
      } catch (err) {
        console.warn("[Home] checkActiveRide ERROR:", (err as any)?.message, (err as any)?.response?.status, JSON.stringify((err as any)?.response?.data));
      }
    };

    // âœ… Call immediately on mount â€” don't wait for WebSocket
    checkActiveRide();

    // WebSocket listeners for real-time updates
    webSocketService.connect().then(() => {
       webSocketService.on("ride-status-updated", checkActiveRide);
              webSocketService.on("ride-offers-updated", checkActiveRide);
       webSocketService.on("driver-accepted-offer", async (data: any) => {
        console.log("[Home] driver-accepted-offer received:", data);
        const rId = data?.rideId;
        const dId = data?.driverId;
        if (rId && dId) {
          try {
            // Auto-select the driver's offer and navigate to payment
            await rideService.selectOffer(rId, dId);
            navigation.navigate("DeliveryPaymentConfirm", { rideId: rId });
          } catch (e: any) {
            // Fallback: navigate to marketplace
            navigation.navigate("RideOffersMarketplace", { rideId: rId });
          }
        } else if (rId) {
          navigation.navigate("RideOffersMarketplace", { rideId: rId });
        }
       });
       webSocketService.on("ride-cancelled", (data: any) => {
       console.log("[Home] ride-cancelled received:", data);
       const rId = data?.rideId || data?.ride?._id || data?._id;
       if (rId) setExpiredRideId(rId);
       if (navigation.isFocused()) { setShowCancelledModal(true); }
       setActiveRequestingRideId(null);
       setNegotiationRideId(null);
       setWaitingQueueCount(0);
     });
       webSocketService.on("ride-payment-expired", (data: any) => {
       console.log("[Home] ride-payment-expired received:", data);
       const rId = data?.rideId || data?.ride?._id || data?._id;
       if (rId) setExpiredRideId(rId);
       if (navigation.isFocused()) { setShowCancelledModal(true); }
       setActiveRequestingRideId(null);
       setNegotiationRideId(null);
       setWaitingQueueCount(0);
       Toast.show({ type: "error", text1: "Pagamento Expirado", text2: data?.reason || "Tempo de confirmacao esgotado." });
     });
    }).catch(() => {});

    // Polling fallback every 6 seconds
    pollInterval = setInterval(checkActiveRide, 6000);
    
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      webSocketService.off("ride-status-updated", checkActiveRide);
             webSocketService.off("ride-offers-updated", checkActiveRide);
       webSocketService.off("driver-accepted-offer");
      webSocketService.off("ride-cancelled", checkActiveRide);
       webSocketService.off("ride-payment-expired", checkActiveRide);
       webSocketService.off("ride-payment-expired", checkActiveRide);
    };
  }, [navigation]);

  // ðŸ” Re-check on every focus (catches rides from other screens)
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;
      const recheckRides = async () => {
        try {
          const res = await rideService.getActiveList();
          if (!isMounted) return;
          const activeRides = res?.rides || [];
          console.log("[Home:focus] getActiveList:", activeRides.length, activeRides.map((r: any) => r.status));
          // Find if any ride has active negotiations/offers (status !== 'rejected')
          const rideWithOffers = activeRides.find((ride: any) => {
            const offers = Array.isArray(ride.negotiation?.offers) ? ride.negotiation.offers : [];
            return offers.some((o: any) => o.status !== "rejected");
          });
          if (rideWithOffers) {
            setNegotiationRideId(rideWithOffers._id);
            setActiveRequestingRideId(null);
          } else {
            setNegotiationRideId(null);
            const requestingRide = activeRides.find((ride: any) =>
              ride.status === "requesting" || ride.status === "payment_pending" || ride.status === "driver_assigned"
            );
            setActiveRequestingRideId(requestingRide?._id || null);
          }
        } catch (err) {
          console.warn("[Home:focus] error:", (err as any)?.message || err);
        }
      };
      recheckRides();
      return () => { isMounted = false; };
    }, [])
  );

  // Load context on focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        try {
          const favs = await favoriteAddressService.list();
          setFavorites(favs || []);
        } catch (e) {
          setFavorites([]);
        }
      })();
    }, [])
  );

  useEffect(() => {
    let mounted = true;

    const loadNearbyAvailability = async () => {
      try {
        setAvailabilityLoading(true);
        setAvailabilityError(null);
        const lat = userRegion?.latitude || region?.latitude;
        const lng = userRegion?.longitude || region?.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        const safeLat = lat as number;
        const safeLng = lng as number;

        const drivers = await rideService.getNearbyDrivers(safeLat, safeLng, 7000);
        if (!mounted) return;

        const rideDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("ride"),
        ).length;
        const deliveryDrivers = drivers.filter((d) =>
          Array.isArray(d.serviceTypes) && d.serviceTypes.includes("delivery"),
        ).length;

        setAvailability({
          rideDrivers,
          deliveryDrivers,
          totalNearby: drivers.length,
        });
      } catch {
        if (!mounted) return;
        setAvailabilityError("Nao foi possivel validar disponibilidade local agora.");
      } finally {
        if (mounted) {
          setAvailabilityLoading(false);
        }
      }
    };

    loadNearbyAvailability();
    const interval = setInterval(loadNearbyAvailability, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [region?.latitude, region?.longitude, userRegion?.latitude, userRegion?.longitude]);

  // Drawer Open
  const handleMenuPress = useCallback(() => {
    const parent = navigation.getParent();
    if (parent && "openDrawer" in parent && typeof parent.openDrawer === "function") {
      parent.openDrawer();
    } else if ("openDrawer" in navigation && typeof navigation.openDrawer === "function") {
      navigation.openDrawer();
    } else {
      Alert.alert("Menu", "Navegador Drawer não encontrado.");
    }
  }, [navigation]);

  // Routing Bridge: Navigates exactly into user's new Premium Search Flow
  const handleServiceSelect = useCallback(
    (
      type: "ride" | "delivery",
      options?: { preferScheduled?: boolean },
    ) => {
    if (type === "delivery") {
      setActiveService("delivery");
      return;
    }
    const isScheduled = Boolean(options?.preferScheduled);
    const defaultVehicle = "car";
    
    navigation.navigate("DestinationSearch", {
      initialVehicle: defaultVehicle,
      preferScheduled: isScheduled,
      serviceType: type,
    });
  }, [navigation]);

    // Quick Links handlers
  const handleActiveOrders = useCallback(() => {
    navigation.navigate("ActiveOrders");
  }, [navigation]);

  const handleWallet = useCallback(() => {
    navigation.navigate("Wallet");
  }, [navigation]);

  const handleSupport = useCallback(() => {
    navigation.navigate("SupportCenter");
  }, [navigation]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate("DestinationSearch", {
      // REMOVED pre-filled pickup to force user verification
    });
  }, [navigation, currentAddress, userRegion, region]);

  const handleWalletPress = useCallback(() => {
    // Example route - if specific wallet exists
    Alert.alert("Carteira", `Olá ${user?.name || "Cliente"}! Seu saldo está disponível.`);
  }, [user?.name]);

  const handleToggleMapStyle = useCallback(() => {
    if (isSwitchingStyle) return;
    setIsSwitchingStyle(true);
    setUseDarkMap(prev => !prev);
    // Graceful throttle matching native animations
    setTimeout(() => setIsSwitchingStyle(false), 350);
  }, [isSwitchingStyle]);

  const handleCenterMyLocation = useCallback(async () => {
    if (isCentering) return;
    setIsCentering(true);
    try {
      await centerOnUser();
    } catch {}
    setTimeout(() => setIsCentering(false), 500);
  }, [centerOnUser, isCentering]);

  const handleSOS = useCallback(() => {
    try {
      // Navigates seamlessly to client-specific safety zone! 🛡️
      navigation.navigate("SafetyCenter");
    } catch {
      Alert.alert("SOS", "Ativando modo de emergência do passageiro...");
    }
  }, [navigation]);

  const handleExpiredConfirm = useCallback(() => {
    setShowCancelledModal(false);
    if (expiredRideId) {
      navigation.navigate("RideOffersMarketplace", { rideId: expiredRideId, autoOpenIncrease: true });
      setExpiredRideId(null);
    }
  }, [navigation, expiredRideId]);

  // Loading Guard while Map Logic warms up
  if (!region) {
    return <LocationLoadingScreen />;
  }

  return (
    <ErrorBoundary componentName="ClientHomeScreen">
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#091A2F" }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        
        {activeService === "ride" && (
          <View className="flex-1 pb-[110px]" style={{ paddingTop: StatusBar.currentHeight || 20 }}>
            {/* 1. Header (Greeting & Actions) */}
            <View className="flex-row justify-between items-center px-5 pb-0">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleMenuPress} className="relative">
                  {user?.fotoPerfil || user?.profilePhoto ? (
                    <Image source={{ uri: user.fotoPerfil || user.profilePhoto }} className="w-11 h-11 rounded-full border-[1.5px] border-[#02de95]" />
                  ) : (
                    <View className="w-11 h-11 rounded-full bg-[#11253E] items-center justify-center border-[1.5px] border-white/10">
                      <User size={20} color="#fff" />
                    </View>
                  )}
                  <View className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ef4444] border-[1.5px] border-[#091A2F]" />
                </TouchableOpacity>
                <Text className="text-white text-[22px] font-bold">Olá, <Text className="text-[#02de95] font-black">{user?.name || "Cliente"}</Text>!</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="bg-[#02de95]/15 px-3 py-1 rounded-xl border border-[#02de95]/30">
                  <Text className="text-[#02de95] text-xs font-bold">Pix</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSOS} className="w-10 h-10 rounded-full bg-[#11253E] items-center justify-center border border-white/5">
                  <QrCode size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 2. Map Card */}
            <View className="flex-1 mx-5 mt-4 rounded-[24px] overflow-hidden border border-white/5 relative z-10">
              <ClientRealtimeMap 
                mapRef={mapRef}
                region={region}
                userRegion={userRegion}
                onRegionChangeComplete={handleRegionChangeComplete}
                useDarkStyle={true}
                avatarUrl={user?.fotoPerfil || user?.profilePhoto || undefined}
              />
              
              {/* Green coupon pill */}
              <View className="absolute bottom-[35px] left-0 right-0 bg-[#02de95] flex-row items-center justify-center py-2">
                <Percent size={14} color="#091A2F" style={{ marginRight: 6 }} />
                <Text className="text-[#091A2F] text-[11px] font-black uppercase tracking-[0.5px]">Corra com cupom de 30% OFF!</Text>
              </View>
            </View>
            
            {/* 3. Overlapping Search Bar */}
            <TouchableOpacity 
              activeOpacity={0.95}
              onPress={handleSearchPress}
              className="bg-[#11253E] mx-5 h-14 rounded-b-[24px] flex-row items-center px-[18px] -mt-10 border border-[#02de95]/20 z-20"
              style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 }}
            >
              <Search size={22} color="#02de95" style={{ marginRight: 12 }} />
              <Text className="text-white text-base font-bold">Para onde vamos?</Text>
            </TouchableOpacity>

            {/* Quick Favorites Pills */}
            <View className="mt-[15px] px-5">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              >
                {favorites.length > 0 ? (
                  favorites.slice(0, 3).map((fav, index) => (
                    <TouchableOpacity
                      key={fav.id || index}
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      onPress={() => {
                        navigation.navigate("DestinationSearch", {
                          pickup: { 
                            address: currentAddress || "Localização Atual",
                            latitude: userRegion?.latitude || region.latitude,
                            longitude: userRegion?.longitude || region.longitude,
                          },
                          dropoff: {
                            address: fav.formattedAddress || fav.address,
                            latitude: Number(fav.latitude),
                            longitude: Number(fav.longitude),
                          }
                        });
                      }}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        {fav.label?.toLowerCase() === "casa" ? (
                          <HomeIcon size={14} color="#02de95" />
                        ) : fav.label?.toLowerCase() === "trabalho" ? (
                          <Briefcase size={14} color="#02de95" />
                        ) : (
                          <Shield size={14} color="#02de95" />
                        )}
                      </View>
                      <Text className="text-white text-xs font-bold" numberOfLines={1}>
                        {fav.label}
                      </Text>
                    </TouchableOpacity>
                  ))
                ) : (
                  <>
                    <TouchableOpacity
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      onPress={() => navigation.navigate("Favorites")}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        <HomeIcon size={14} color="#02de95" />
                      </View>
                      <Text className="text-white text-xs font-bold">Adicionar Casa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      onPress={() => navigation.navigate("Favorites")}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        <Briefcase size={14} color="#02de95" />
                      </View>
                      <Text className="text-white text-xs font-bold">Adicionar Trabalho</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </View>

            {/* 4. Horizontal Gallery (Promo + Finance Cards) */}
            <View className="mt-5 px-5 mb-2.5">
              <Text className="text-white text-sm font-bold mb-2.5">Destaques Leva+</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingRight: 20 }}
              >
                {/* Promo Card */}
                <TouchableOpacity 
                  activeOpacity={0.9}
                  onPress={() => handleServiceSelect("ride")}
                  className="w-[280px] h-[110px] bg-[#11253E] rounded-[20px] p-3.5 flex-row items-center border border-white/[0.03]"
                >
                  <View className="flex-1">
                    <View className="self-start bg-[#02de95]/15 border border-[#02de95]/30 px-2 py-0.5 rounded-md mb-2">
                      <Text className="text-[#02de95] text-[10px] font-black tracking-widest uppercase">Leva+</Text>
                    </View>
                    <Text className="text-white text-[13px] font-black uppercase mb-1" numberOfLines={1}>VÁ COM A LEVA+</Text>
                    <Text className="text-white/60 text-[11px] leading-[14px]" numberOfLines={2}>
                      Escolha mais de uma categoria com preço justo.
                    </Text>
                  </View>
                  <View className="w-12 h-12 rounded-full bg-[#02de95]/5 items-center justify-center ml-2 border border-[#02de95]/15">
                    <Car size={28} color="#02de95" strokeWidth={1.5} />
                  </View>
                </TouchableOpacity>

                {/* Finance Card 1 */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={handleWalletPress}
                  className="w-[180px] h-[110px] bg-[#11253E] rounded-[20px] p-3.5 justify-between border border-white/[0.03]"
                >
                  <View className="w-9 h-9 rounded-[10px] bg-[#02de95]/10 items-center justify-center">
                    <CreditCard size={20} color="#02de95" />
                  </View>
                  <View>
                    <Text className="text-white text-[11px] font-black mb-0.5">PARCELE EM ATÉ 12X</Text>
                    <Text className="text-white/50 text-[10px] leading-[13px]" numberOfLines={2}>Descontos para parcelar seu Pix e saldo!</Text>
                  </View>
                </TouchableOpacity>

                {/* Finance Card 2 */}
                <TouchableOpacity 
                  activeOpacity={0.8}
                  onPress={() => Alert.alert("Indique e Ganhe", "Em breve: Indique amigos e ganhe créditos!")}
                  className="w-[180px] h-[110px] bg-[#11253E] rounded-[20px] p-3.5 justify-between border border-white/[0.03]"
                >
                  <View className="w-9 h-9 rounded-[10px] bg-[#02de95]/10 items-center justify-center">
                    <Gift size={20} color="#02de95" />
                  </View>
                  <View>
                    <Text className="text-white text-[11px] font-black mb-0.5">INDIQUE & GANHE</Text>
                    <Text className="text-white/50 text-[10px] leading-[13px]" numberOfLines={2}>Ative sua conta e ganhe cupons compartilhando!</Text>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {activeService === "delivery" && (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50, paddingBottom: 280 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pb-0">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleMenuPress} className="relative">
                  {user?.fotoPerfil || user?.profilePhoto ? (
                    <Image source={{ uri: user.fotoPerfil || user.profilePhoto }} className="w-11 h-11 rounded-full border-[1.5px] border-[#02de95]" />
                  ) : (
                    <View className="w-11 h-11 rounded-full bg-[#11253E] items-center justify-center border-[1.5px] border-white/10">
                      <User size={20} color="#fff" />
                    </View>
                  )}
                  <View className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ef4444] border-[1.5px] border-[#091A2F]" />
                </TouchableOpacity>
                <Text className="text-white text-[22px] font-bold">Olá, <Text className="text-[#02de95] font-black">{user?.name || "Cliente"}</Text>!</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity className="bg-[#02de95]/15 px-3 py-1 rounded-xl border border-[#02de95]/30">
                  <Text className="text-[#02de95] text-xs font-bold">Pix</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSOS} className="w-10 h-10 rounded-full bg-[#11253E] items-center justify-center border border-white/5">
                  <QrCode size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* VOCÊ PRECISA, -> Leva+ Entrega */}
            <View className="px-5 mt-5 mb-5">
              <Text className="text-white/50 text-sm font-bold tracking-widest uppercase">VOCÊ PRECISA,</Text>
              <View className="flex-row items-center mt-1">
                <ArrowRight size={22} color="#02de95" style={{ marginRight: 6 }} />
                <Text className="text-[#02de95] text-[28px] font-black">Leva+ <Text className="text-white font-bold">Entrega</Text></Text>
              </View>
            </View>

            {/* Illustrations/Cards for Bike and Car */}
            <View className="flex-row px-5 gap-3.5 mb-6">
              <View className="flex-1 bg-[#11253E] rounded-[20px] p-4 items-center border border-white/[0.03]">
                <View className="w-16 h-16 rounded-full bg-white/[0.03] items-center justify-center mb-3">
                  <Car size={36} color="#02de95" />
                </View>
                <Text className="text-white text-sm font-bold mb-1">Moto Entrega</Text>
                <Text className="text-white/40 text-[11px]">Rápido • Econômico</Text>
              </View>

              <View className="flex-1 bg-[#11253E] rounded-[20px] p-4 items-center border border-white/[0.03]">
                <View className="w-16 h-16 rounded-full bg-[#02de95]/10 items-center justify-center mb-3">
                  <Package size={36} color="#02de95" />
                </View>
                <Text className="text-white text-sm font-bold mb-1">Carro Entrega</Text>
                <Text className="text-white/40 text-[11px]">Volumes maiores</Text>
              </View>
            </View>

            {/* Delivery Card with tabs Enviar / Receber */}
            <View className="bg-[#11253E] mx-5 rounded-[24px] p-5 border border-white/[0.03]" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 }}>
              <View className="flex-row border-b border-white/[0.05] mb-5">
                <TouchableOpacity 
                  onPress={() => setDeliveryMode("send")}
                  className="py-2.5 px-4 relative"
                >
                  <Text className={`text-base font-bold ${deliveryMode === 'send' ? 'text-[#02de95]' : 'text-white/40'}`}>
                    Enviar
                  </Text>
                  {deliveryMode === "send" && <View className="absolute bottom-[-1px] left-4 right-4 h-[3px] bg-[#02de95] rounded-t-full" />}
                </TouchableOpacity>

                <TouchableOpacity 
                  onPress={() => setDeliveryMode("receive")}
                  className="py-2.5 px-4 relative"
                >
                  <Text className={`text-base font-bold ${deliveryMode === 'receive' ? 'text-[#02de95]' : 'text-white/40'}`}>
                    Receber
                  </Text>
                  {deliveryMode === "receive" && <View className="absolute bottom-[-1px] left-4 right-4 h-[3px] bg-[#02de95] rounded-t-full" />}
                </TouchableOpacity>
              </View>

              <View className="gap-3.5">
                {/* Pickup / Origin */}
                <View className="flex-row items-center">
                  <View className="w-2.5 h-2.5 rounded-full mr-4 bg-[#02de95]" />
                  <View className="flex-1">
                    <Text className="text-white text-base font-bold mb-1" numberOfLines={1}>
                      {deliveryMode === "send" ? (currentAddress || "Localização Atual") : "Retirar no endereço do remetente"}
                    </Text>
                    <Text className="text-white/40 text-xs" numberOfLines={1}>
                      {user?.name || "Cliente"} • {user?.phone || "Telefone não cadastrado"}
                    </Text>
                  </View>
                </View>

                <View className="h-[1px] bg-white/[0.05] ml-[26px]" />

                {/* Destination / Dropoff */}
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => {
                    navigation.navigate("DestinationSearch", {
                      initialVehicle: "motorcycle",
                      serviceType: "delivery"
                    });
                  }}
                  className="flex-row items-center"
                >
                  <View className="w-2.5 h-2.5 rounded-full mr-4 bg-[#F59E0B]" />
                  <View className="flex-1">
                    <Text className="text-white/50 text-base font-bold">
                      {deliveryMode === "send" ? "Entregar para..." : "Entregar na minha localização"}
                    </Text>
                  </View>
                  <ChevronRight size={20} color="rgba(255, 255, 255, 0.3)" />
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        )}

        {activeService === "pay" && (
          <ScrollView 
            className="flex-1" 
            contentContainerStyle={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 10 : 50, paddingBottom: 280 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View className="flex-row justify-between items-center px-5 pb-0">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleMenuPress} className="relative">
                  {user?.fotoPerfil || user?.profilePhoto ? (
                    <Image source={{ uri: user.fotoPerfil || user.profilePhoto }} className="w-11 h-11 rounded-full border-[1.5px] border-[#02de95]" />
                  ) : (
                    <View className="w-11 h-11 rounded-full bg-[#11253E] items-center justify-center border-[1.5px] border-white/10">
                      <User size={20} color="#fff" />
                    </View>
                  )}
                  <View className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-[#ef4444] border-[1.5px] border-[#091A2F]" />
                </TouchableOpacity>
                <Text className="text-white text-[22px] font-bold">Olá, <Text className="text-[#02de95] font-black">{user?.name || "Cliente"}</Text>!</Text>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleSOS} className="w-10 h-10 rounded-full bg-[#11253E] items-center justify-center border border-white/5">
                  <QrCode size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Wallet Balance Card */}
            <View className="bg-[#11253E] mx-5 mt-3.5 rounded-[24px] p-6 border border-white/[0.03]">
              <Text className="text-white/50 text-[13px] font-bold uppercase tracking-[0.5px] mb-1.5">Saldo Disponível</Text>
              <Text className="text-white text-3xl font-bold mb-5">R$ 0,00</Text>
              
              <View className="flex-row gap-3">
                <TouchableOpacity 
                  className="flex-1 bg-[#02de95] h-12 rounded-2xl items-center justify-center"
                  onPress={() => Alert.alert("Adicionar Saldo", "Recurso em desenvolvimento.")}
                >
                  <Text className="text-[#091A2F] text-sm font-bold">Adicionar Saldo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 bg-transparent h-12 rounded-2xl items-center justify-center border border-white/20"
                  onPress={() => Alert.alert("Transferir", "Recurso em desenvolvimento.")}
                >
                  <Text className="text-white text-sm font-bold">Transferir</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Features Card */}
            <View className="mt-[30px] px-5">
              <Text className="text-white text-base font-bold mb-3.5">Serviços Financeiros</Text>
              
              <TouchableOpacity 
                className="flex-row items-center bg-[#11253E] rounded-[20px] p-4 mb-3 border border-white/[0.03]"
                onPress={() => Alert.alert("Pagar Boleto", "Recurso em desenvolvimento.")}
              >
                <View className="w-11 h-11 rounded-[14px] bg-[#02de95]/10 items-center justify-center mr-4">
                  <CreditCard size={20} color="#02de95" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold mb-1">Pagar com Pix ou Boleto</Text>
                  <Text className="text-white/40 text-xs">Parcele em até 12x no cartão de crédito.</Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.3)" />
              </TouchableOpacity>

              <TouchableOpacity 
                className="flex-row items-center bg-[#11253E] rounded-[20px] p-4 mb-3 border border-white/[0.03]"
                onPress={() => Alert.alert("Cartões", "Gerencie seus cartões de crédito salvos.")}
              >
                <View className="w-11 h-11 rounded-[14px] bg-[#02de95]/10 items-center justify-center mr-4">
                  <Wallet size={20} color="#02de95" />
                </View>
                <View className="flex-1">
                  <Text className="text-white text-base font-bold mb-1">Cartões de Crédito</Text>
                  <Text className="text-white/40 text-xs">Gerencie suas formas de pagamento para viagens.</Text>
                </View>
                <ChevronRight size={18} color="rgba(255, 255, 255, 0.3)" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}

        {/* Floating Navigation Tab Bar */}
        <View className="absolute bottom-6 left-6 right-6 h-[72px] bg-[#11253E] rounded-[36px] flex-row items-center justify-between px-9 border border-white/5 z-[100]" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 15, elevation: 12 }}>
          {/* Option 1: Corrida */}
          <TouchableOpacity 
            onPress={() => setActiveService("ride")}
            className="items-center justify-center min-w-[60px]"
            activeOpacity={0.7}
          >
            <Car size={24} color={activeService === "ride" ? "#02de95" : "rgba(255, 255, 255, 0.4)"} />
            <Text className={`text-[10px] font-bold mt-1 ${activeService === 'ride' ? 'text-[#02de95]' : 'text-white/40'}`}>
              Corrida
            </Text>
          </TouchableOpacity>

          {/* Option 2: Entrega (Central main button) */}
          <TouchableOpacity 
            onPress={() => setActiveService("delivery")}
            className={`w-16 h-16 rounded-full -mt-7 items-center justify-center ${activeService === 'delivery' ? 'bg-[#02de95]' : 'bg-[#1c324e]'}`}
            style={{ borderStyle: 'solid', borderWidth: 3, borderColor: '#091A2F', shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
            activeOpacity={0.85}
          >
            <Package size={28} color={activeService === "delivery" ? "#091A2F" : "#fff"} />
          </TouchableOpacity>

          {/* Option 3: Pay / Wallet */}
          <TouchableOpacity 
            onPress={() => setActiveService("pay")}
            className="items-center justify-center min-w-[60px]"
            activeOpacity={0.7}
          >
            <Wallet size={24} color={activeService === "pay" ? "#02de95" : "rgba(255, 255, 255, 0.4)"} />
            <Text className={`text-[10px] font-bold mt-1 ${activeService === 'pay' ? 'text-[#02de95]' : 'text-white/40'}`}>
              Pay
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Requesting Ride Banner */}
        {!!activeRequestingRideId && !negotiationRideId && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("ActiveOrders")}
              style={{
                backgroundColor: "#F59E0B",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5,
              }}
            >
              <View style={{ backgroundColor: "rgba(9, 26, 47, 0.2)", padding: 8, borderRadius: 12, marginRight: 12 }}>
                 <Info size={20} color="#091A2F" />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                   Oferta Ativa
                 </Text>
                 <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                   Aguardando entregadores analisarem seu pedido
                 </Text>
              </View>
              <View style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                 <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 10 }}>VER</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Yellow Active Proposals Banner */}
        {!!negotiationRideId && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: negotiationRideId })}
              style={{
                backgroundColor: "#F59E0B",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.2)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 5
              }}
            >
              <View style={{ backgroundColor: "rgba(9, 26, 47, 0.2)", padding: 8, borderRadius: 12, marginRight: 12 }}>
                 <Info size={20} color="#091A2F" />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                   Propostas Recebidas
                 </Text>
                 <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                   Toque para avaliar as ofertas dos motoristas
                 </Text>
              </View>
              <View style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                 <Text style={{ color: "#F59E0B", fontWeight: "900", fontSize: 10 }}>VER</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        )}

        {waitingQueueCount > 0 && !negotiationRideId && !activeRequestingRideId && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("ActiveOrders")}
              style={{
                backgroundColor: "#02de95",
                borderRadius: 16,
                padding: 16,
                flexDirection: "row",
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 6,
                elevation: 5
              }}
            >
              <View style={{ backgroundColor: "rgba(9, 26, 47, 0.2)", padding: 8, borderRadius: 12, marginRight: 12 }}>
                 <Info size={20} color="#091A2F" />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                   {waitingQueueCount === 1 ? "1 Pedido em Fila" : `${waitingQueueCount} Pedidos em Fila`}
                 </Text>
                 <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                   {waitingQueueCount === 1 ? "Toque para ver detalhes da busca" : "Toque para acompanhar todas as buscas"}
                 </Text>
              </View>
              <View style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                 <Text style={{ color: "#fff", fontWeight: "900", fontSize: 10 }}>VER</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        )}



        <Modal
          visible={showHomeSuccessModal}
          title="Fila de Espera Ativada!"
          message="Seu pedido foi para a fila pública. Assim que um motorista aceitar ou enviar uma proposta, você será informado na mesma hora sobre a contraproposta ou negociação para aceitar ou não!"
          type="success"
          confirmText="Entendido"
          onClose={() => setShowHomeSuccessModal(false)}
        />
        <Modal
          visible={showCancelledModal}
          title="Pedido Expirado"
          message="Nenhum entregador aceitou sua oferta dentro do prazo de 10 minutos. Tente novamente com uma oferta mais atrativa ou em outro horario."
          type="warning"
          confirmText="Entendido"
          onClose={handleExpiredConfirm}
          onConfirm={handleExpiredConfirm}
        />
        <Modal
          visible={showNoDriversModal}
          title="Entrega indisponível"
          message="Não encontramos entregadores online na sua região agora. Tente novamente em alguns minutos."
          type="warning"
          confirmText="Entendido"
          onClose={() => setShowNoDriversModal(false)}
        />
        
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}













