import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, StatusBar, Alert, View, Text, TouchableOpacity } from "react-native";
import { NavigationProp, RouteProp, useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { Info } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";

// 📍 Custom Hooks / Global System
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

  useEffect(() => {
    if (route.params?.showSuccessQueueModal) {
       setShowHomeSuccessModal(true);
       // Consumes the param so it doesn't retrigger on subsequent renders
       navigation.setParams({ showSuccessQueueModal: undefined });
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
  const [availability, setAvailability] = useState<{
    rideDrivers: number;
    deliveryDrivers: number;
    totalNearby: number;
  }>({
    rideDrivers: 0,
    deliveryDrivers: 0,
    totalNearby: 0,
  });
  
  // Map Operational Visual States 🎨
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  // 🛰️ Background monitoring of active ride (Redirect if driver offers or accepts)
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    const checkActiveRide = async () => {
      try {
        // 1. Sincroniza a lista completa de corridas do cliente
        const res = await rideService.getActiveList();
        if (!isMounted) return;
        
        const activeRides = res?.rides || [];
        
        // Find if any ride has active negotiations/offers
        const rideWithOffers = activeRides.find(ride => (ride.negotiation?.offers?.length || 0) > 0);
        if (rideWithOffers) {
           setNegotiationRideId(rideWithOffers._id);
        } else {
           setNegotiationRideId(null);
        }

        // 2. Filtra Fila de Espera Geral (isWaitingInQueue)
        const queuedRides = activeRides.filter(ride => ride.isWaitingInQueue === true && ride.status === "requesting");
        setWaitingQueueCount(queuedRides.length);

        // 3. Busca um pedido primário (que NÃO esteja em fila silenciosa)
        const primaryRide = activeRides.find(ride => !ride.isWaitingInQueue);

        if (primaryRide) {
          // Motorista aceitou? VAI DIRETO AO TRACKING/MAPA DE CORRIDA!
          if (primaryRide.driverId && ["accepted", "driver_arriving", "arrived", "in_progress"].includes(primaryRide.status)) {
             navigation.reset({
               index: 0,
               routes: [{ name: "RideTracking", params: { rideId: primaryRide._id } }],
             });
             return;
          }
        }
        
      } catch (err) {
        // Captura silenciosa de rede
      }
    };

    // ⚡ Add Socket Listener to check instantaneously when backend notifies ANY update!
    webSocketService.connect().then(() => {
       webSocketService.on("ride-status-updated", checkActiveRide);
       // Re-check on connect
       checkActiveRide();
    }).catch(() => {});

    // Polling fallback every 8 seconds for perfect safety
    pollInterval = setInterval(checkActiveRide, 8000);
    
    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
      webSocketService.off("ride-status-updated", checkActiveRide);
    };
  }, [navigation]);

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
        setAvailability((prev) => prev);
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
    const defaultVehicle = type === "ride" ? "car" : "motorcycle";
    
    navigation.navigate("DestinationSearch", {
      initialVehicle: defaultVehicle,
      preferScheduled: Boolean(options?.preferScheduled),
      serviceType: type,
      // REMOVED pre-filled pickup to force user verification
    });
  }, [navigation, currentAddress, userRegion, region]);

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

  // ⏳ Loading Guard while Map Logic warms up
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
      />

      {/* 2. Floating Controls Layer */}
      <ClientFloatingHeader 
        onMenuPress={handleMenuPress}
        onSearchPress={handleSearchPress}
        onWalletPress={handleWalletPress}
        currentAddress={currentAddress}
      />

      {/* 🌟 Yellow Active Proposals Banner */}
      {negotiationRideId && (
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

      {/* 🚁 Premium Background Queue Awareness Banner */}
      {waitingQueueCount > 0 && !negotiationRideId && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("ActiveOrders")}
            className="bg-[#02de95] rounded-2xl p-4 flex-row items-center border border-white/10 shadow-xl"
          >
            <View className="bg-[#091A2F]/20 p-2 rounded-xl mr-3">
               <Info size={20} color="#091A2F" />
            </View>
            <View className="flex-1">
               <Text className="text-[#091A2F] font-black text-sm uppercase">
                 {waitingQueueCount === 1 ? "1 Pedido em Fila" : `${waitingQueueCount} Pedidos em Fila`}
               </Text>
               <Text className="text-[#091A2F]/80 font-bold text-xs">
                 {waitingQueueCount === 1 ? "Toque para ver detalhes da busca" : "Toque para acompanhar todas as buscas"}
               </Text>
            </View>
            <View className="bg-[#091A2F] rounded-xl px-3 py-2">
               <Text className="text-white font-black text-[10px]">VER</Text>
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
        favorites={favorites}
        availability={availability}
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
      {/* 🏆 Premium Dynamic Success Modal (Transferred Context) */}
      <Modal
        visible={showHomeSuccessModal}
        title="Fila de Espera Ativada!"
        message="Seu pedido foi para a fila pública. Assim que um motorista aceitar ou enviar uma proposta, você será informado na mesma hora sobre a contraproposta ou negociação para aceitar ou não!"
        type="success"
        confirmText="Entendido"
        onClose={() => setShowHomeSuccessModal(false)}
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
