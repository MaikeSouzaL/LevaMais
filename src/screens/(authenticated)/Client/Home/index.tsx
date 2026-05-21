import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, StatusBar, Alert, View, Text, TouchableOpacity } from "react-native";
import { NavigationProp, RouteProp, useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { Info } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Toast from "react-native-toast-message";

// ðŸ“ Custom Hooks / Global System
import { useAuthStore } from "@/context/authStore";
import favoriteAddressService from "@/services/favoriteAddress.service";
import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";

// ðŸ› ï¸ Reused Domain Hooks from Original Flow
import { useMapLocation } from "../Shared/hooks/useMapLocation";

// ðŸŽ¨ Premium Visual Shell Components
import { ClientRealtimeMap } from "@/components/client/home/ClientRealtimeMap";
import {Modal} from "@/components/Modal";
import { ClientFloatingHeader } from "@/components/client/home/ClientFloatingHeader";
import { ClientBottomSheet } from "@/components/client/home/ClientBottomSheet";
import { MapActionButtons } from "@/components/MapActionButtons";
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
  
  // Map Operational Visual States ðŸŽ¨
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

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
    const isScheduled = Boolean(options?.preferScheduled);
    if (!isScheduled && type === "delivery" && availability.deliveryDrivers <= 0) {
      setShowNoDriversModal(true);
      return;
    }
    const defaultVehicle = type === "ride" ? "car" : "motorcycle";
    
    navigation.navigate("DestinationSearch", {
      initialVehicle: defaultVehicle,
      preferScheduled: isScheduled,
      serviceType: type,
      // REMOVED pre-filled pickup to force user verification
    });
  }, [navigation, availability.deliveryDrivers]);

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

  // â³ Loading Guard while Map Logic warms up
  if (!region) {
    return <LocationLoadingScreen />;
  }


  return (
    <ErrorBoundary componentName="ClientHomeScreen">
      <GestureHandlerRootView style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 1. Background Map Layer (The World View) */}
      <ClientRealtimeMap 
        mapRef={mapRef}
        region={region}
        userRegion={userRegion}
        onRegionChangeComplete={handleRegionChangeComplete}
        useDarkStyle={useDarkMap}
        avatarUrl={user?.fotoPerfil || user?.profilePhoto || undefined}
      />

      {/* 2. Floating Controls Layer */}
      <ClientFloatingHeader 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onWalletPress={handleWalletPress}
        currentAddress={currentAddress}
      />

      {/* ðŸŸ¡ Active Requesting Ride Banner (awaiting drivers, no offers yet) */}
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

      {/* ðŸŒŸ Yellow Active Proposals Banner */}
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

      <MapActionButtons 
        onLocationPress={handleCenterMyLocation}
        onSosPress={handleSOS}
        onMapStylePress={handleToggleMapStyle}
        useDarkMap={useDarkMap}
        isCentering={isCentering}
        isSwitchingStyle={isSwitchingStyle}
      />

      {/* 3. Bottom User-Action Sheet */}
      <ClientBottomSheet 
        onSelectService={handleServiceSelect}
        onActiveOrdersPress={handleActiveOrders}
        onWalletPress={handleWallet}
        onSupportPress={handleSupport}
        activeOrdersCount={activeRequestingRideId ? 1 : 0}
        favorites={favorites}
        availability={availability}
        availabilityLoading={availabilityLoading}
        availabilityError={availabilityError}
        onSelectFavorite={(fav) => {
          // Emulates handling of legacy favorite flow triggers
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
        onChangeSnap={(idx) => setSheetSnapIndex(idx)}
      />
      {/* ðŸ† Premium Dynamic Success Modal (Transferred Context) */}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  }
});









