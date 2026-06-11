import React, { useCallback, useState, useEffect } from "react";
import { StatusBar, Alert, View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import { NavigationProp, RouteProp, useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { MotiView } from "moti";
import { Info, Search, QrCode, Percent, CreditCard, ChevronRight, User, Bell, Shield, ArrowRight, Car, Package, Wallet, Gift, Home as HomeIcon, Briefcase, Sparkles, Bike, Check } from "lucide-react-native";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Toast from "react-native-toast-message";
import { resolveAssetURL } from "@/utils/mappers";

// 📌 Custom Hooks / Global System
import { useAuthStore } from "@/context/authStore";
import favoriteAddressService from "@/services/favoriteAddress.service";
import rideService from "@/services/ride.service";
import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";

// 🛠️ Reused Domain Hooks from Original Flow
import { useMapLocation } from "../Shared/hooks/useMapLocation";
import { useFavorites } from "../Shared/hooks/useFavorites";
import { useAvailability } from "../Shared/hooks/useAvailability";
import { useActiveRideMonitor } from "../Shared/hooks/useActiveRideMonitor";
import { useRegisterPushToken } from "@/hooks/useRegisterPushToken";

// 🎨 Premium Visual Shell Components
import { ClientRealtimeMap } from "@/components/client/home/ClientRealtimeMap";
import {Modal} from "@/components/Modal";
import { colors } from "@/theme";
import { ClientStackParamList, DeliveryAddressProfile } from "../types/navigation";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "Home">>();
  const { userData: user } = useAuthStore();
  const insets = useSafeAreaInsets();

  useRegisterPushToken();

  const [showHomeSuccessModal, setShowHomeSuccessModal] = useState(false);
  const [showNoDriversModal, setShowNoDriversModal] = useState(false);

  useEffect(() => {
    if (route.params?.showSuccessQueueModal) {
       setShowHomeSuccessModal(true);
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

  // Custom Hooks para lógica complexa
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { availability, loading: availabilityLoading, error: availabilityError } = useAvailability({
    region,
    userRegion,
  });
  const {
    negotiationRideId,
    activeRequestingRideId,
    activeServiceType,
    activeRideCreatedAt,
    activeRideSearchTimeout,
    waitingQueueCount,
    showCancelledModal,
    allRejected,
    activeTrackingRideId,
    activeTrackingServiceType,
    activeTrackingStatus,
    dismissCancelledModal,
    confirmExpiredAction,
    setActiveRequestingRideId,
  } = useActiveRideMonitor();

  // Component States
  const [sheetSnapIndex, setSheetSnapIndex] = useState(0);
  const [countdownText, setCountdownText] = useState("");

  useEffect(() => {
    if (!activeRequestingRideId || !activeRideCreatedAt) {
      setCountdownText("");
      return;
    }

    const updateTimer = () => {
      const timeoutSecs = activeRideSearchTimeout || 300;
      const createdTime = new Date(activeRideCreatedAt).getTime();
      const expireTime = createdTime + timeoutSecs * 1000;
      const diffMs = expireTime - Date.now();
      
      if (diffMs <= 0) {
        setCountdownText("00:00");
        return;
      }

      const totalSecs = Math.floor(diffMs / 1000);
      const mins = Math.floor(totalSecs / 60);
      const secs = totalSecs % 60;
      setCountdownText(`${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeRequestingRideId, activeRideCreatedAt, activeRideSearchTimeout]);

  // Map Operational Visual States 🎨
  const [useDarkMap, setUseDarkMap] = useState(true);
  const [isSwitchingStyle, setIsSwitchingStyle] = useState(false);
  const [isCentering, setIsCentering] = useState(false);

  // Active Service view state & Delivery configurations
  const [activeService, setActiveService] = useState<"ride" | "delivery" | "pay">("ride");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<"send" | "receive">("send");
  const [selectedDeliveryVehicle, setSelectedDeliveryVehicle] = useState<"motorcycle" | "car" | "van" | "truck">("motorcycle");
  const [pickupProfile, setPickupProfile] = useState<DeliveryAddressProfile | null>(null);
  const [dropoffProfile, setDropoffProfile] = useState<DeliveryAddressProfile | null>(null);

  useEffect(() => {
    const draft = route.params?.deliveryDraftProfile;
    if (!draft) return;

    setActiveService("delivery");
    if (draft.flow === "send" || draft.flow === "receive") {
      setDeliveryMode(draft.flow);
    }
    if (["motorcycle", "car", "van", "truck"].includes(String(draft.vehicleType))) {
      setSelectedDeliveryVehicle(draft.vehicleType as "motorcycle" | "car" | "van" | "truck");
    }
    if (draft.role === "pickup") {
      setPickupProfile(draft.profile);
    } else {
      setDropoffProfile(draft.profile);
    }

    navigation.setParams({ deliveryDraftProfile: undefined });
  }, [navigation, route.params?.deliveryDraftProfile]);

  useEffect(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => {
      setIsTransitioning(false);
    }, 150);
    return () => clearTimeout(timer);
  }, [activeService]);

  // Lida com parâmetros da rota (ex: activeRideId vindo de OrderSentScreen)
  useEffect(() => {
    if (route.params?.activeRideId) {
      setActiveRequestingRideId(route.params.activeRideId);
      navigation.setParams({ activeRideId: undefined });
    }
  }, [route.params, setActiveRequestingRideId, navigation]);

  // Auto-navegar para tela de negociação se houver propostas (proposta de motorista recebida).
  // Defesa em profundidade: NUNCA abrir o marketplace se já existe uma corrida/entrega
  // comprometida (com motorista). Nesse caso a corrida já tem dono e deve ir ao tracking,
  // nunca ao "Escolher Entregador".
  useEffect(() => {
    if (negotiationRideId && !activeTrackingRideId) {
      navigation.navigate("RideOffersMarketplace", { rideId: negotiationRideId });
    }
  }, [negotiationRideId, activeTrackingRideId, navigation]);

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
      setSelectedDeliveryVehicle("motorcycle");
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

  const handleOpenFavoriteShortcut = useCallback(
    (mode: "home" | "work" | "favorite") => {
      navigation.navigate("FavoriteAddressFlow", {
        initialSearchMode: mode,
      });
    },
    [navigation],
  );

  const openDeliveryAddressInfo = useCallback(
    (role: "pickup" | "dropoff") => {
      navigation.navigate("DeliverySenderInfo", {
        mode: role === "pickup" ? "sender" : "receiver",
        vehicleType: selectedDeliveryVehicle,
        flow: deliveryMode,
        pickupProfile,
        dropoffProfile,
      });
    },
    [deliveryMode, dropoffProfile, navigation, pickupProfile, selectedDeliveryVehicle],
  );

  const formatDeliveryContact = (profile: DeliveryAddressProfile | null) => {
    if (!profile) return "Toque para preencher as informações";
    return [profile.contactName, profile.contactPhone].filter(Boolean).join(" • ");
  };

  const deliveryVehicles = [
    {
      id: "motorcycle" as const,
      title: "Moto Entrega",
      subtitle: "Rápido • Econômico",
      image: require("../../../../assets/Logo/leva_moto.png"),
    },
    {
      id: "car" as const,
      title: "Carro Entrega",
      subtitle: "Pacotes médios",
      image: require("../../../../assets/Logo/leva-carro.png"),
    },
    {
      id: "van" as const,
      title: "Van Entrega",
      subtitle: "Volumes maiores",
      image: require("../../../../assets/Logo/leva_van.png"),
    },
    {
      id: "truck" as const,
      title: "Baú entrega",
      subtitle: "Cargas grandes",
      image: require("../../../../assets/Logo/leva_bau.png"),
    },
  ];

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
    navigation.navigate("SafetyCenter");
  }, [navigation]);


  return (
    <ErrorBoundary componentName="ClientHomeScreen">
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#091A2F" }}>
        <StatusBar barStyle={activeService === "ride" ? "dark-content" : "dark-content"} backgroundColor="transparent" translucent />
        
        {activeService === "ride" && (
          <View className="flex-1 pb-[110px]" style={{ paddingTop: StatusBar.currentHeight || 20 }}>
            {/* Green Background behind Header and top of Map */}
            <View className="absolute top-0 left-0 right-0 h-[220px] bg-[#02de95]" style={{ borderBottomLeftRadius: 32, borderBottomRightRadius: 32 }} />

            {/* 1. Header (Greeting & Actions) */}
            <View className="flex-row justify-between items-center px-5 pb-0 mt-2 relative z-10">
              <View className="flex-row items-center gap-3">
                <TouchableOpacity onPress={handleMenuPress} className="relative" accessibilityLabel="Abrir menu" accessibilityRole="button">
                  {user?.fotoPerfil || user?.profilePhoto ? (
                    <Image source={{ uri: resolveAssetURL(user.fotoPerfil || user.profilePhoto) }} className="w-14 h-14 rounded-full border-[2px] border-white" />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-[#091A2F]/10 items-center justify-center border-[1.5px] border-[#091A2F]/20">
                      <User size={24} color="#091A2F" />
                    </View>
                  )}
                </TouchableOpacity>
                <View className="justify-center">
                  <Text className="text-white text-[22px] font-bold leading-6">Olá,</Text>
                  <Text className="text-[#091A2F] text-[22px] font-black leading-6" numberOfLines={1} ellipsizeMode="tail">{user?.name || "Cliente"}!</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handleActiveOrders}
                  className="w-11 h-11 rounded-full bg-[#091A2F]/10 items-center justify-center border border-[#091A2F]/20 relative"
                  accessibilityLabel="Ver pedidos ativos"
                  accessibilityRole="button"
                >
                  <Bell size={20} color="#091A2F" />
                  {(activeRequestingRideId !== null || negotiationRideId !== null) && (
                    <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
                  )}
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
                useDarkStyle={user?.mapTheme === "dark"}
                avatarUrl={resolveAssetURL(user?.fotoPerfil || user?.profilePhoto) || undefined}
                rideDrivers={availability.rideDrivers}
                deliveryDrivers={availability.deliveryDrivers}
                totalNearby={availability.totalNearby}
                availabilityLoading={availabilityLoading}
                availabilityError={availabilityError}
              />
            </View>
            
            {/* 3. Overlapping Search Bar */}
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={handleSearchPress}
              className="bg-[#02de95] mx-5 h-[64px] rounded-[36px] flex-row items-center px-6 -mt-16 z-20"
              style={{
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.22,
                shadowRadius: 12,
                elevation: 10
              }}
              accessibilityLabel="Buscar destino"
              accessibilityRole="search"
            >
              <Search size={28} color="#FFFFFF" style={{ marginRight: 14 }} />
              <Text className="text-white text-xl font-black">Para onde vamos?</Text>
            </TouchableOpacity>

            {/* Quick Favorites Pills */}
            <View className="mt-4 px-5">
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false} 
                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              >
                <>
                    <TouchableOpacity
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      accessibilityLabel="Adicionar endereço de casa"
                      accessibilityRole="button"
                      onPress={() => handleOpenFavoriteShortcut("home")}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        <HomeIcon size={14} color="#02de95" />
                      </View>
                      <Text className="text-white text-xs font-bold">Adicionar Casa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      accessibilityLabel="Adicionar endereço de trabalho"
                      accessibilityRole="button"
                      onPress={() => handleOpenFavoriteShortcut("work")}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        <Briefcase size={14} color="#02de95" />
                      </View>
                      <Text className="text-white text-xs font-bold">Adicionar Trabalho</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-row items-center bg-[#11253E] px-3.5 py-2 rounded-[20px] border border-white/[0.03]"
                      accessibilityLabel="Adicionar endereço favorito"
                      accessibilityRole="button"
                      onPress={() => handleOpenFavoriteShortcut("favorite")}
                    >
                      <View className="w-6 h-6 rounded-full bg-[#02de95]/10 items-center justify-center mr-2">
                        <Sparkles size={14} color="#02de95" />
                      </View>
                      <Text className="text-white text-xs font-bold">Adicionar Favoritos Extras</Text>
                    </TouchableOpacity>
                  </>
              </ScrollView>
             </View>

             {/* ─── Banner: Entrega / Corrida já em andamento ─────────────────────
                  Aparece quando o cliente tem um motorista comprometido e voltou
                  intencionalmente para a Home (ex: usou "Início" no tracking).
                  Permite retornar ao tracking a qualquer momento, igual ao Uber/99. */}
             {!!activeTrackingRideId && !activeRequestingRideId && !negotiationRideId && activeService === "ride" && (() => {
               const isDelivery = activeTrackingServiceType === "delivery";
               const trackingStatusLabel: Record<string, string> = {
                 accepted:        isDelivery ? "Motorista a caminho da coleta" : "Motorista aceitou sua corrida",
                 driver_arriving: isDelivery ? "Motorista indo para a coleta"  : "Motorista a caminho",
                 arrived:         isDelivery ? "Motorista chegou à coleta"     : "Motorista chegou",
                 in_progress:     isDelivery ? "Entrega a caminho do destino"  : "Corrida em andamento",
               };
               const subtitle = trackingStatusLabel[activeTrackingStatus ?? ""] || "Toque para acompanhar";
               const trackScreen = isDelivery ? "DeliveryTracking" : "RideTracking";
               return (
                 <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                   <TouchableOpacity
                     activeOpacity={0.9}
                     accessibilityLabel={isDelivery ? "Acompanhar entrega em andamento" : "Acompanhar corrida em andamento"}
                     accessibilityRole="button"
                     onPress={() => navigation.navigate(trackScreen, { rideId: activeTrackingRideId })}
                     style={{
                       backgroundColor: "#02de95",
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
                       {isDelivery
                         ? <Package size={20} color="#091A2F" />
                         : <Car size={20} color="#091A2F" />}
                     </View>
                     <View style={{ flex: 1 }}>
                       <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                         {isDelivery ? "Entrega em Andamento" : "Corrida em Andamento"}
                       </Text>
                       <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                         {subtitle}
                       </Text>
                     </View>
                     <View style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                       <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 10 }}>VER</Text>
                     </View>
                   </TouchableOpacity>
                 </View>
               );
             })()}

             {/* Active Requesting Ride Banner (Inline for Map Tab) */}
             {!!activeRequestingRideId && !negotiationRideId && activeService === "ride" && (
               <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                 <TouchableOpacity
                   activeOpacity={0.9}
                   accessibilityLabel="Ver oferta ativa de corrida"
                   accessibilityRole="button"
                   onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: activeRequestingRideId })}
                   style={{
                     backgroundColor: allRejected ? "#EF4444" : "#F59E0B",
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
                      <Info size={20} color={allRejected ? "#FFF" : "#091A2F"} />
                   </View>
                   <View style={{ flex: 1 }}>
                      <Text style={{ color: allRejected ? "#FFF" : "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                        {allRejected ? (activeServiceType === "delivery" ? "Nenhum Entregador Disponível" : "Nenhum Motorista Disponível") : (activeServiceType === "delivery" ? "Oferta Ativa: Entrega" : "Oferta Ativa: Corrida")}{countdownText ? ` (${countdownText})` : ""}
                      </Text>
                      <Text style={{ color: allRejected ? "rgba(255, 255, 255, 0.9)" : "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                        {activeServiceType === "delivery"
                          ? allRejected ? "Seu pedido foi recusado. Toque aqui para AUMENTAR a oferta." : "Aguardando entregadores analisarem seu pedido"
                          : allRejected ? "Seu pedido foi recusado. Toque aqui para AUMENTAR a oferta." : "Aguardando motoristas analisarem seu pedido"}
                      </Text>
                   </View>
                   <View style={{ backgroundColor: allRejected ? "#FFF" : "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ color: allRejected ? "#EF4444" : "#F59E0B", fontWeight: "900", fontSize: 10 }}>VER</Text>
                   </View>
                 </TouchableOpacity>
               </View>
             )}

             {/* Active Proposals Banner (Inline for Map Tab) */}
             {!!negotiationRideId && activeService === "ride" && (
               <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                 <TouchableOpacity
                   activeOpacity={0.9}
                   accessibilityLabel="Ver propostas recebidas"
                   accessibilityRole="button"
                   onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: negotiationRideId })}
                   style={{
                     backgroundColor: "#02de95",
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
                        Propostas Recebidas
                      </Text>
                      <Text style={{ color: "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                        Toque para avaliar as ofertas dos motoristas
                      </Text>
                   </View>
                   <View style={{ backgroundColor: "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                      <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 10 }}>VER</Text>
                   </View>
                 </TouchableOpacity>
               </View>
             )}

             {/* Queue Count Banner (Inline for Map Tab) */}
             {waitingQueueCount > 0 && !negotiationRideId && !activeRequestingRideId && activeService === "ride" && (
               <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
                 <TouchableOpacity
                   activeOpacity={0.9}
                   accessibilityLabel="Ver pedidos em fila de espera"
                   accessibilityRole="button"
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
                     elevation: 5,
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
               </View>
             )}

            {/* 4. Horizontal Gallery (Promo + Finance Cards) */}
            <View className="mt-5 px-5 mb-2.5">
              <Text className="text-white text-sm font-bold mb-2.5">Destaques Leva+</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingLeft: 20, paddingRight: 20 }}
              >
                {/* Promo Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  accessibilityLabel="Solicitar corrida agora"
                  accessibilityRole="button"
                  onPress={() => handleServiceSelect("ride")}
                  className="w-[325px] h-[135px] bg-[#11253E] rounded-[24px] p-4 flex-row items-center border border-white/[0.04] overflow-hidden"
                >
                  <View className="flex-1 justify-between h-full pr-1">
                    <View className="self-start bg-[#02de95]/10 border border-[#02de95]/20 px-2 py-0.5 rounded-md">
                      <Text className="text-white text-[9px] font-black tracking-widest uppercase">Leva+</Text>
                    </View>
                    <View className="mt-1">
                      <Text className="text-white text-lg font-black tracking-tight mb-0.5">Vá com a Leva+</Text>
                      <Text className="text-white/60 text-[11px] leading-[15px]" numberOfLines={2}>
                        Escolha entre entrega ou corrida com preço justo.
                      </Text>
                    </View>
                  </View>

                  {/* Rich Right Graphic Container */}
                  <View className="flex-row items-center ml-2 h-full">
                    {/* Stylized Glowing Illustration */}
                    <View className="w-[70px] h-[70px] justify-center items-center relative mr-3">
                      <View className="absolute w-[68px] h-[68px] rounded-full border border-[#02de95]/15 bg-[#02de95]/5" />
                      <View className="absolute w-[50px] h-[50px] rounded-full bg-[#02de95]/10 opacity-70" />
                      <Car size={32} color="#02de95" strokeWidth={1.5} style={{ opacity: 0.8, transform: [{ translateY: -6 }, { translateX: -6 }] }} />
                      <Package size={28} color="#ffffff" strokeWidth={2} style={{ position: 'absolute', bottom: 10, right: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }} />
                    </View>

                    {/* Small circular chevron indicator */}
                    <View className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 items-center justify-center">
                      <ChevronRight size={16} color="#02de95" strokeWidth={3} />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* Indique e Ganhe Card */}
                <TouchableOpacity
                  activeOpacity={0.9}
                  accessibilityLabel="Indique e ganhe"
                  accessibilityRole="button"
                  onPress={() => Alert.alert("Indique e Ganhe", "Em breve: Indique amigos e ganhe créditos!")}
                  className="w-[325px] h-[135px] bg-[#11253E] rounded-[24px] p-4 flex-row items-center border border-white/[0.04] overflow-hidden"
                >
                  <View className="flex-1 justify-between h-full pr-1">
                    <View className="self-start bg-[#02de95]/10 border border-[#02de95]/20 px-2 py-0.5 rounded-md">
                      <Text className="text-white text-[9px] font-black tracking-widest uppercase">Promoção</Text>
                    </View>
                    <View className="mt-1">
                      <Text className="text-white text-lg font-black tracking-tight mb-0.5">Indique & Ganhe</Text>
                      <Text className="text-white/60 text-[11px] leading-[15px]" numberOfLines={2}>
                        Ative sua conta e ganhe cupons compartilhando!
                      </Text>
                    </View>
                  </View>

                  {/* Rich Right Graphic Container */}
                  <View className="flex-row items-center ml-2 h-full">
                    {/* Stylized Glowing Illustration */}
                    <View className="w-[70px] h-[70px] justify-center items-center relative mr-3">
                      <View className="absolute w-[68px] h-[68px] rounded-full border border-[#02de95]/15 bg-[#02de95]/5" />
                      <View className="absolute w-[50px] h-[50px] rounded-full bg-[#02de95]/10 opacity-70" />
                      <Gift size={32} color="#02de95" strokeWidth={1.5} style={{ opacity: 0.8, transform: [{ translateY: -2 }] }} />
                      <Sparkles size={16} color="#ffffff" style={{ position: 'absolute', top: 12, right: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 4 }} />
                    </View>

                    {/* Small circular chevron indicator */}
                    <View className="w-8 h-8 rounded-full bg-white/[0.03] border border-white/10 items-center justify-center">
                      <ChevronRight size={16} color="#02de95" strokeWidth={3} />
                    </View>
                  </View>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        )}

        {activeService === "delivery" && (
          <View className="flex-1">
            {/* Curved Green Header */}
            <View 
              className="bg-[#02de95] pb-6 rounded-b-[36px]"
              style={{ paddingTop: StatusBar.currentHeight ? StatusBar.currentHeight + 16 : 56 }}
            >
              <View className="flex-row justify-between items-center px-5 pb-0">
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity onPress={handleMenuPress} className="relative" accessibilityLabel="Abrir menu" accessibilityRole="button">
                    {user?.fotoPerfil || user?.profilePhoto ? (
                      <Image source={{ uri: resolveAssetURL(user.fotoPerfil || user.profilePhoto) }} className="w-14 h-14 rounded-full border-[1.5px] border-[#091A2F]" />
                    ) : (
                      <View className="w-14 h-14 rounded-full bg-[#11253E] items-center justify-center border-[1.5px] border-white/10">
                        <User size={24} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                  <View className="justify-center">
                    <Text className="text-white text-[22px] font-bold leading-6">Olá,</Text>
                    <Text className="text-[#091A2F] text-[22px] font-black leading-6" numberOfLines={1} ellipsizeMode="tail">{user?.name || "Cliente"}!</Text>
                  </View>
                </View>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={handleActiveOrders}
                    className="w-11 h-11 rounded-full bg-[#091A2F]/10 items-center justify-center border border-[#091A2F]/15 relative"
                    accessibilityLabel="Ver pedidos ativos"
                    accessibilityRole="button"
                  >
                    <Bell size={20} color="#091A2F" />
                    {(activeRequestingRideId !== null || negotiationRideId !== null) && (
                      <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#02de95]" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* O QUE VAMOS ENVIAR HOJE? -> Leva+ Logo & Entrega (Centered & Highlighted) */}
            <View className="px-5 mt-[120px] mb-9 items-center justify-center">
              <Text className="text-white/80 text-[14px] font-black tracking-[4px] uppercase text-center">O QUE VAMOS ENVIAR HOJE?</Text>
              <View className="flex-row items-center justify-center mt-3">
                <Image 
                  source={require("../../../../assets/Logo/logo.png")} 
                  style={{ width: 120, height: 35 }} 
                  resizeMode="contain"
                />
                <Text className="text-white text-[28px] font-black tracking-tight ml-2.5">
                  Entrega
                </Text>
              </View>
            </View>

            {/* Vehicle selector */}
            <View className="mb-6">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingRight: 28 }}
              >
                {deliveryVehicles.map((vehicle) => {
                  const isSelected = selectedDeliveryVehicle === vehicle.id;
                  return (
                    <TouchableOpacity
                      key={vehicle.id}
                      activeOpacity={0.88}
                      onPress={() => setSelectedDeliveryVehicle(vehicle.id)}
                      className="w-[150px] rounded-[24px] p-3 border"
                      style={{
                        backgroundColor: "transparent",
                        borderColor: isSelected ? "#02de95" : "transparent",
                      }}
                      accessibilityLabel={`Veículo de entrega: ${vehicle.title}`}
                      accessibilityRole="button"
                    >
                      <View
                        className="absolute top-2 right-2 z-20 w-6.5 h-6.5 rounded-full items-center justify-center"
                        style={{ backgroundColor: isSelected ? "#02de95" : "rgba(255,255,255,0.08)" }}
                      >
                        {isSelected ? (
                          <Check size={14} color="#091A2F" strokeWidth={3.5} />
                        ) : (
                          <View className="w-2 h-2 rounded-full bg-white/20" />
                        )}
                      </View>
                      <View className="h-[104px] items-center justify-center mb-2">
                        <Image
                          source={vehicle.image}
                          style={{ width: 132, height: 104 }}
                          resizeMode="contain"
                        />
                      </View>
                      <Text className="text-white text-[15px] font-black mb-0.5 text-center" numberOfLines={1}>{vehicle.title}</Text>
                      <Text className="text-white/40 text-[11px] font-bold text-center" numberOfLines={1}>{vehicle.subtitle}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            <View className="px-5 mb-4">
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10, paddingRight: 20 }}
              >
                <TouchableOpacity
                  className="flex-row items-center bg-white px-3.5 py-2 rounded-[20px]"
                  accessibilityLabel="Adicionar endereço de casa"
                  accessibilityRole="button"
                  onPress={() => handleOpenFavoriteShortcut("home")}
                >
                  <View className="w-6 h-6 rounded-full bg-[#091A2F]/10 items-center justify-center mr-2">
                    <HomeIcon size={14} color="#091A2F" />
                  </View>
                  <Text className="text-[#091A2F] text-xs font-bold">Adicionar Casa</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center bg-white px-3.5 py-2 rounded-[20px]"
                  accessibilityLabel="Adicionar endereço de trabalho"
                  accessibilityRole="button"
                  onPress={() => handleOpenFavoriteShortcut("work")}
                >
                  <View className="w-6 h-6 rounded-full bg-[#091A2F]/10 items-center justify-center mr-2">
                    <Briefcase size={14} color="#091A2F" />
                  </View>
                  <Text className="text-[#091A2F] text-xs font-bold">Adicionar Trabalho</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="flex-row items-center bg-white px-3.5 py-2 rounded-[20px]"
                  accessibilityLabel="Adicionar endereço favorito"
                  accessibilityRole="button"
                  onPress={() => handleOpenFavoriteShortcut("favorite")}
                >
                  <View className="w-6 h-6 rounded-full bg-[#091A2F]/10 items-center justify-center mr-2">
                    <Sparkles size={14} color="#091A2F" />
                  </View>
                  <Text className="text-[#091A2F] text-xs font-bold">Adicionar Favoritos Extras</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Delivery Card with tabs Enviar / Receber */}
            <View className="bg-[#11253E] mx-5 rounded-[24px] p-5 border border-white/[0.03]" style={{ shadowColor: "#000", shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 8 }}>
              <View className="flex-row border-b border-white/[0.05] mb-5">
                <TouchableOpacity
                  onPress={() => setDeliveryMode("send")}
                  className="py-2.5 px-4 relative"
                  accessibilityLabel="Modo enviar entrega"
                  accessibilityRole="button"
                  accessibilityState={{ selected: deliveryMode === "send" }}
                >
                  <Text className={`text-base font-bold ${deliveryMode === 'send' ? 'text-[#02de95]' : 'text-white/40'}`}>
                    Enviar
                  </Text>
                  {deliveryMode === "send" && <View className="absolute bottom-[-1px] left-4 right-4 h-[3px] bg-[#02de95] rounded-t-full" />}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setDeliveryMode("receive")}
                  className="py-2.5 px-4 relative"
                  accessibilityLabel="Modo receber entrega"
                  accessibilityRole="button"
                  accessibilityState={{ selected: deliveryMode === "receive" }}
                >
                  <Text className={`text-base font-bold ${deliveryMode === 'receive' ? 'text-[#02de95]' : 'text-white/40'}`}>
                    Receber
                  </Text>
                  {deliveryMode === "receive" && <View className="absolute bottom-[-1px] left-4 right-4 h-[3px] bg-[#02de95] rounded-t-full" />}
                </TouchableOpacity>
              </View>

              <View className="flex-row pl-2 h-[110px] relative overflow-hidden">
                {/* Fixed Bullet Indicators (Left) */}
                <View className="w-[18px] items-center relative mr-3">
                  {/* Decorative connecting vertical line */}
                  <View className="absolute left-[8px] top-[14px] bottom-[14px] w-[1.5px] bg-white/[0.1] z-0" />
                  
                  {/* Top Green Bullet */}
                  <View className="w-[8px] h-[8px] rounded-full bg-[#02de95] mt-[20px] z-10" style={{ shadowColor: '#02de95', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 3 }} />
                  
                  {/* Bottom Orange Bullet */}
                  <View className="w-[8px] h-[8px] rounded-full bg-[#F59E0B] absolute bottom-[20px] z-10" style={{ shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 3 }} />
                </View>

                {/* Animated Contents (Right) */}
                <View className="flex-1 relative h-full py-1">
                  {/* Divider line fixed in the middle */}
                  <View className="absolute left-0 right-0 top-[55px] h-[1px] bg-white/[0.05] z-0" />

                  {/* Slot A: origem/coleta */}
                  <MotiView
                    animate={{ translateY: 0 }}
                    transition={{ type: "timing", duration: 350 }}
                    style={{ position: 'absolute', left: 0, right: 0, height: 48, top: 4, justifyContent: 'center' }}
                    className="z-10"
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      className="flex-1 justify-center"
                      accessibilityLabel="Selecionar local de retirada"
                      accessibilityRole="button"
                      onPress={() => openDeliveryAddressInfo("pickup")}
                    >
                      <Text className="text-[9px] font-black uppercase tracking-wider mb-0.5 text-[#02de95]">
                        RETIRADA (ORIGEM)
                      </Text>
                      <Text className="text-white text-sm font-bold mb-0.5" numberOfLines={1}>
                        {pickupProfile ? pickupProfile.address : (deliveryMode === "receive" ? "Enviar de" : "Selecionar local de retirada")}
                      </Text>
                      <Text className="text-white/40 text-[11px] font-bold" numberOfLines={1}>
                        {formatDeliveryContact(pickupProfile)}
                      </Text>
                    </TouchableOpacity>
                  </MotiView>

                  {/* Slot B: destino/entrega */}
                  <MotiView
                    animate={{ translateY: 0 }}
                    transition={{ type: "timing", duration: 350 }}
                    style={{ position: 'absolute', left: 0, right: 0, height: 48, bottom: 4 }}
                    className="z-10"
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => openDeliveryAddressInfo("dropoff")}
                      className="flex-row items-center h-full justify-between"
                      accessibilityLabel="Selecionar local de entrega"
                      accessibilityRole="button"
                    >
                      <View className="flex-1 justify-center pr-3">
                        <Text className="text-[9px] font-black uppercase tracking-wider mb-0.5 text-[#F59E0B]">
                          ENTREGA (DESTINO)
                        </Text>
                        <Text className="text-white text-base font-black" numberOfLines={1}>
                          {dropoffProfile ? dropoffProfile.address : (deliveryMode === "receive" ? "Receber em" : "Entregar para")}
                        </Text>
                        <Text className="text-white/40 text-[11px] font-bold" numberOfLines={1}>
                          {formatDeliveryContact(dropoffProfile)}
                        </Text>
                      </View>
                      <View className="w-[30px] h-[30px] rounded-full bg-[#02de95] items-center justify-center" style={{ shadowColor: '#02de95', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.35, shadowRadius: 6, elevation: 4 }}>
                        <ArrowRight size={18} color="#091A2F" strokeWidth={4.5} />
                      </View>
                    </TouchableOpacity>
                  </MotiView>
                </View>
              </View>
            </View>
          </View>
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
                <TouchableOpacity onPress={handleMenuPress} className="relative" accessibilityLabel="Abrir menu" accessibilityRole="button">
                  {user?.fotoPerfil || user?.profilePhoto ? (
                    <Image source={{ uri: resolveAssetURL(user.fotoPerfil || user.profilePhoto) }} className="w-14 h-14 rounded-full border-[1.5px] border-[#02de95]" />
                  ) : (
                    <View className="w-14 h-14 rounded-full bg-[#11253E] items-center justify-center border-[1.5px] border-white/10">
                      <User size={24} color="#fff" />
                    </View>
                  )}
                </TouchableOpacity>
                <View className="justify-center">
                  <Text className="text-white text-[22px] font-bold leading-6">Olá,</Text>
                  <Text className="text-[#02de95] text-[22px] font-black leading-6" numberOfLines={1} ellipsizeMode="tail">{user?.name || "Cliente"}!</Text>
                </View>
              </View>
              <View className="flex-row items-center gap-3">
                <TouchableOpacity
                  onPress={handleActiveOrders}
                  className="w-11 h-11 rounded-full bg-[#11253E] items-center justify-center border border-white/5 relative"
                  accessibilityLabel="Ver pedidos ativos"
                  accessibilityRole="button"
                >
                  <Bell size={20} color="#fff" />
                  {(activeRequestingRideId !== null || negotiationRideId !== null) && (
                    <View className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#11253E]" />
                  )}
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
                  accessibilityLabel="Adicionar saldo"
                  accessibilityRole="button"
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
                accessibilityLabel="Pagar com Pix ou Boleto"
                accessibilityRole="button"
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
        <View 
          className="absolute h-[72px] bg-white rounded-[36px] flex-row items-center justify-between px-2 z-[100]" style={{ bottom: (insets?.bottom || 0) + 24, width: 250, alignSelf: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 12 }} 
          
        >
          {/* Fluid Water-Drop Indicator Dot */}
          <MotiView
            animate={{
              translateX: activeService === "ride" ? 0 : activeService === "delivery" ? 78 : 156,
              scaleX: isTransitioning ? 1.35 : 1,
              scaleY: isTransitioning ? 0.85 : 1,
            }}
            transition={{
              translateX: {
                type: "spring",
                damping: 18,
                mass: 0.8,
                stiffness: 130,
              },
              scaleX: {
                type: "spring",
                damping: 10,
                stiffness: 220,
              },
              scaleY: {
                type: "spring",
                damping: 10,
                stiffness: 220,
              }
            }}
            style={{
              position: "absolute",
              left: 15,
              top: 4,
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: "#02de95",
              shadowColor: "#02de95",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.35,
              shadowRadius: 8,
              elevation: 5,
              zIndex: 1,
            }}
          />

          {/* Option 1: Corrida */}
          <TouchableOpacity
            onPress={() => setActiveService("ride")}
            className="flex-1 items-center justify-center h-full z-10"
            activeOpacity={0.8}
            accessibilityLabel="Modo corrida"
            accessibilityRole="button"
          >
            {activeService === "ride" ? (
              <View className="items-center justify-center">
                <Car size={24} color="#091A2F" />
                <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 2, color: "#091A2F" }}>
                  Corrida
                </Text>
              </View>
            ) : (
              <View className="items-center justify-center">
                <Car size={24} color="rgba(9, 26, 47, 0.5)" />
                <Text className="text-[10px] font-bold mt-1 text-[#091A2F]/50">
                  Corrida
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Option 2: Entrega */}
          <TouchableOpacity
            onPress={() => {
              setActiveService("delivery");
              setSelectedDeliveryVehicle("motorcycle");
            }}
            className="flex-1 items-center justify-center h-full z-10"
            activeOpacity={0.8}
            accessibilityLabel="Modo entrega"
            accessibilityRole="button"
          >
            {activeService === "delivery" ? (
              <View className="items-center justify-center">
                <Package size={24} color="#091A2F" />
                <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 2, color: "#091A2F" }}>
                  Entrega
                </Text>
              </View>
            ) : (
              <View className="items-center justify-center">
                <Package size={24} color="rgba(9, 26, 47, 0.5)" />
                <Text className="text-[10px] font-bold mt-1 text-[#091A2F]/50">
                  Entrega
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Option 3: Pay / Wallet */}
          <TouchableOpacity
            onPress={() => setActiveService("pay")}
            className="flex-1 items-center justify-center h-full z-10"
            activeOpacity={0.8}
            accessibilityLabel="Pagamentos"
            accessibilityRole="button"
          >
            {activeService === "pay" ? (
              <View className="items-center justify-center">
                <Wallet size={24} color="#091A2F" />
                <Text style={{ fontSize: 10, fontWeight: "bold", marginTop: 2, color: "#091A2F" }}>
                  Pay
                </Text>
              </View>
            ) : (
              <View className="items-center justify-center">
                <Wallet size={24} color="rgba(9, 26, 47, 0.5)" />
                <Text className="text-[10px] font-bold mt-1 text-[#091A2F]/50">
                  Pay
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Active Requesting Ride Banner */}
        {!!activeRequestingRideId && !negotiationRideId && activeService !== "ride" && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: activeRequestingRideId })}
              style={{
                backgroundColor: allRejected ? "#EF4444" : "#F59E0B",
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
                 <Info size={20} color={allRejected ? "#FFF" : "#091A2F"} />
              </View>
              <View style={{ flex: 1 }}>
                 <Text style={{ color: allRejected ? "#FFF" : "#091A2F", fontWeight: "900", fontSize: 14, textTransform: "uppercase" }}>
                   {allRejected ? (activeServiceType === "delivery" ? "Nenhum Entregador Disponível" : "Nenhum Motorista Disponível") : (activeServiceType === "delivery" ? "Oferta Ativa: Entrega" : "Oferta Ativa: Corrida")}{countdownText ? ` (${countdownText})` : ""}
                 </Text>
                 <Text style={{ color: allRejected ? "rgba(255, 255, 255, 0.9)" : "rgba(9, 26, 47, 0.8)", fontWeight: "700", fontSize: 12 }}>
                   {activeServiceType === "delivery"
                     ? allRejected ? "Seu pedido foi recusado. Toque aqui para AUMENTAR a oferta." : "Aguardando entregadores analisarem seu pedido"
                     : allRejected ? "Seu pedido foi recusado. Toque aqui para AUMENTAR a oferta." : "Aguardando motoristas analisarem seu pedido"}
                 </Text>
              </View>
              <View style={{ backgroundColor: allRejected ? "#FFF" : "#091A2F", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }}>
                 <Text style={{ color: allRejected ? "#EF4444" : "#F59E0B", fontWeight: "900", fontSize: 10 }}>VER</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        )}

        {/* Yellow Active Proposals Banner */}
        {!!negotiationRideId && activeService !== "ride" && (
          <MotiView
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={{ position: 'absolute', top: 135, left: 16, right: 16, zIndex: 50, elevation: 10 }}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate("RideOffersMarketplace", { rideId: negotiationRideId })}
              style={{
                backgroundColor: "#02de95",
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
                 <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 10 }}>VER</Text>
              </View>
            </TouchableOpacity>
          </MotiView>
        )}

        {waitingQueueCount > 0 && !negotiationRideId && !activeRequestingRideId && activeService !== "ride" && (
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
          message="Nenhum entregador aceitou sua oferta dentro do prazo de 5 minutos. Tente novamente com uma oferta mais atrativa ou em outro horario."
          type="warning"
          confirmText="Entendido"
          onClose={dismissCancelledModal}
          onConfirm={confirmExpiredAction}
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













