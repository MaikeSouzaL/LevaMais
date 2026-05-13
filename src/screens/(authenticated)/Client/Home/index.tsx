import React, { useCallback, useState, useEffect } from "react";
import { StyleSheet, StatusBar, Alert, View, Text, TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
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
import { FloatingActions } from "@/components/client/home/FloatingActions";
import { colors } from "@/theme";

export default function HomeScreen() {
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();
  const { userData: user } = useAuthStore();
  
  const [showHomeSuccessModal, setShowHomeSuccessModal] = useState(false);

  useEffect(() => {
    if (route.params?.showSuccessQueueModal) {
       setShowHomeSuccessModal(true);
       // Consumes the param so it doesn't retrigger on subsequent renders
       navigation.setParams({ showSuccessQueueModal: undefined } as any);
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
  const [activeQueueRideId, setActiveQueueRideId] = useState<string | null>(null);
  
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
        const res = await rideService.getActive();
        if (!isMounted) return;
        
        if (res?.active && res.ride) {
          const ride = res.ride;
          
          // Scenario 1: Negotiations Exist -> GO TO MARKETPLACE IMMEDIATELY!
          const offerCount = ride.negotiation?.offers?.length || 0;
          if (offerCount > 0) {
             navigation.navigate("RideOffersMarketplace", { rideId: ride._id } as never);
             return;
          }
          
          // Scenario 2: Driver Assigned -> GO TO TRACKING IMMEDIATELY!
          if (ride.driverId && ["accepted", "driver_arriving", "arrived", "in_progress"].includes(ride.status)) {
             navigation.reset({
               index: 0,
               routes: [{ name: "RideTracking", params: { rideId: ride._id } }],
             });
             return;
          }
          
          // Scenario 3: Still waiting in queue -> Show Floating Banner locally on Home!
          if (ride.status === "requesting") {
             setActiveQueueRideId(ride._id);
          } else {
             setActiveQueueRideId(null);
          }
        } else {
          setActiveQueueRideId(null);
        }
      } catch (err) {
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

  // Drawer Open
  const handleMenuPress = useCallback(() => {
    const parent = navigation.getParent();
    if (parent && "openDrawer" in parent) {
      (parent as any).openDrawer();
    } else if ("openDrawer" in navigation) {
      (navigation as any).openDrawer();
    } else {
      Alert.alert("Menu", "Navegador Drawer não encontrado.");
    }
  }, [navigation]);

  // Routing Bridge: Navigates exactly into user's new Premium Search Flow
  const handleServiceSelect = useCallback((type: "ride" | "delivery") => {
    const defaultVehicle = type === "ride" ? "car" : "motorcycle";
    
    navigation.navigate("DestinationSearch", {
      initialVehicle: defaultVehicle,
      // REMOVED pre-filled pickup to force user verification
    } as never);
  }, [navigation, currentAddress, userRegion, region]);

  const handleSearchPress = useCallback(() => {
    navigation.navigate("DestinationSearch", {
      // REMOVED pre-filled pickup to force user verification
    } as never);
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
      navigation.navigate("ClientSafety" as any);
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

      {/* 🚁 Premium Background Queue Awareness Banner */}
      {activeQueueRideId && (
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          className="absolute top-[135px] left-4 right-4 z-50 shadow-2xl"
        >
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate("SearchingDriver", { rideId: activeQueueRideId } as never)}
            className="bg-[#02de95] rounded-2xl p-4 flex-row items-center border border-white/10 shadow-xl"
          >
            <View className="bg-[#091A2F]/20 p-2 rounded-xl mr-3">
               <Info size={20} color="#091A2F" />
            </View>
            <View className="flex-1">
               <Text className="text-[#091A2F] font-black text-sm">BUSCA EM FILA ATIVA</Text>
               <Text className="text-[#091A2F]/80 font-bold text-xs">Toque para ver detalhes do pedido</Text>
            </View>
            <View className="bg-[#091A2F] rounded-xl px-3 py-2">
               <Text className="text-white font-black text-[10px]">VER</Text>
            </View>
          </TouchableOpacity>
        </MotiView>
      )}

      <FloatingActions 
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
          } as never);
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
