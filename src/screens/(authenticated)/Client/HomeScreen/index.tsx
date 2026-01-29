import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Linking,
  Share,
  Text,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  RouteProp,
  useFocusEffect,
} from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import GorhomBottomSheet from "@gorhom/bottom-sheet";
import { LocationHeader } from "../../../../components/LocationHeader";
import { VehicleMarker } from "./components/VehicleMarker";
import { BottomSheet } from "./components/BottomSheet";
import {
  SafetyHelpSheet,
  SafetyHelpSheetRef,
} from "./components/SafetyHelpSheet";
// Removido: SelectVehicleSheet foi convertido para Screen
import { OffersMotoSheet } from "./components/OffersMotoSheet";
import { OffersCarSheet } from "./components/OffersCarSheet";
import type { OffersMotoSheetRef } from "./components/OffersMotoSheet";
import type { OffersCarSheetRef } from "./components/OffersCarSheet";
// Removido: ServicePurposeSheet foi convertido para Screen
import { SearchingDriverModal } from "./components/SearchingDriverModal";
import { OffersVanSheet } from "./components/OffersVanSheet";
import type { OffersVanSheetRef } from "./components/OffersVanSheet";
import { OffersTruckSheet } from "./components/OffersTruckSheet";
import { pinGeocode } from "../../../../utils/pinGeocode";
import FinalOrderSummarySheet, {
  FinalOrderSummaryData,
} from "./components/FinalOrderSummarySheet";
import type { OffersTruckSheetRef } from "./components/OffersTruckSheet";
import GlobalMap from "../../../../components/GlobalMap";
import {
  getCurrentLocation,
  getCurrentLocationAndAddress,
  getAddressFromCoordinates,
  obterEnderecoPorCoordenadas,
  formatarEndereco,
} from "../../../../utils/location";

import {
  DriverFoundSheet,
  DriverFoundInfo,
} from "./components/DriverFoundSheet";
import { useAuthStore } from "../../../../context/authStore";
import rideService from "../../../../services/ride.service";
import webSocketService from "../../../../services/websocket.service";
import { formatBRL as formatBRLUtil } from "../../../../utils/mappers";

// Dados mockados
const MOCK_DATA = {
  user: {
    name: "João Silva",
    photoUrl:
      "https://ui-avatars.com/api/?name=Joao+Silva&background=02de95&color=0f231c&size=128",
  },
  currentLocation: {
    address: "Rua das Flores, 123",
    coordinates: {
      latitude: -23.5505,
      longitude: -46.6333,
    },
  },
  vehicles: [
    {
      id: "1",
      type: "car" as const,
      latitude: -23.5485,
      longitude: -46.635,
      rotation: 45,
    },
    {
      id: "2",
      type: "motorcycle" as const,
      latitude: -23.5525,
      longitude: -46.628,
      rotation: -12,
    },
  ],
};

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const safetyHelpRef = useRef<SafetyHelpSheetRef>(null);
  const offersMotoRef = useRef<OffersMotoSheetRef>(null);
  const offersCarRef = useRef<OffersCarSheetRef>(null);
  const offersVanRef = useRef<OffersVanSheetRef>(null);
  const offersTruckRef = useRef<OffersTruckSheetRef>(null);
  const driverFoundRef = useRef<any>(null); // Ref para o novo sheet

  const [searchingModal, setSearchingModal] = useState<{
    visible: boolean;
    title: string;
    price: string;
    eta: string;
    rideId?: string;
  }>({ visible: false, title: "", price: "", eta: "" });

  const [currentRideId, setCurrentRideId] = useState<string | null>(null);

  // Estado para controlar se o motorista foi encontrado
  const [isDriverFound, setIsDriverFound] = useState(false);
  const [driverLatLng, setDriverLatLng] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [driverInfo, setDriverInfo] = useState<DriverFoundInfo | null>(null);
  const [driverEtaText, setDriverEtaText] = useState<string | undefined>(
    undefined,
  );

  // Controle de Fluxo
  const [serviceMode, setServiceMode] = useState<"ride" | "delivery" | null>(
    null,
  );
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const [selectedVehicleType, setSelectedVehicleType] = useState<
    "motorcycle" | "car" | "van" | "truck" | null
  >(null);
  const [selectedPurposeId, setSelectedPurposeId] = useState<string | null>(
    null,
  );

  const [finalSummaryData, setFinalSummaryData] =
    useState<FinalOrderSummaryData | null>(null);

  const [pickupSelection, setPickupSelection] = useState<any>(null);
  const [dropoffSelection, setDropoffSelection] = useState<any>(null);
  const [priceQuote, setPriceQuote] = useState<any>(null);
  const [priceQuoteLoading, setPriceQuoteLoading] = useState(false);
  const [dragLatLng, setDragLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();
  const walletBalance = useAuthStore((s) => s.walletBalance || 0);

  const formatBRL = (value: number) => {
    // manter compatibilidade, mas preferir util
    return formatBRLUtil(value);
  };

  useEffect(() => {
    // 1. Reabertura de ofertas (vindo de "Voltar" do resumo)
    if (route.params?.reopenOffers && route.params?.vehicleType) {
      const type = route.params.vehicleType;
      // Pequeno delay para garantir que o layout esteja pronto
      setTimeout(() => {
        if (type === "moto") offersMotoRef.current?.snapToIndex(0);
        else if (type === "car") offersCarRef.current?.snapToIndex(0);
        else if (type === "van") offersVanRef.current?.snapToIndex(0);
        else if (type === "truck") offersTruckRef.current?.snapToIndex(0);

        // Resetar params para evitar reabertura indesejada
        navigation.setParams({
          reopenOffers: undefined,
          vehicleType: undefined,
        });
      }, 300);
    }

    // 2. Iniciar busca real (vindo do pagamento confirmado)
    if (route.params?.startSearch && route.params?.searchData) {
      const { title, price, eta, rideId } = route.params.searchData;
      const paramRideId = (route.params.rideId as string | undefined) || rideId;

      // Delay pequeno para garantir transição suave
      setTimeout(() => {
        if (paramRideId) setCurrentRideId(paramRideId);

        setSearchingModal({
          visible: true,
          title: title || "Buscando...",
          price: price || "",
          eta: eta || "",
          rideId: paramRideId,
        });

        // Limpar params
        navigation.setParams({
          startSearch: undefined,
          searchData: undefined,
          rideId: undefined,
        });
      }, 250);
    }

    // 3. Retornar da tela de cancelamento e manter corrida: reabrir "Motorista a caminho"
    if (route.params?.resumeDriverFound) {
      // limpar param
      navigation.setParams({ resumeDriverFound: undefined });
      // garantir estado e abrir sheet
      setIsDriverFound(true);
      setTimeout(() => {
        driverFoundRef.current?.snapToIndex(0);
      }, 200);
    }

    // 4. Abrir ofertas conforme retorno da ServicePurposeScreen
    if (route.params?.openOffersFor) {
      const type = route.params.openOffersFor as
        | "motorcycle"
        | "car"
        | "van"
        | "truck";
      const purposeId = route.params.purposeId as string | undefined;
      const pickup = route.params.pickup;
      const dropoff = route.params.dropoff;

      setSelectedVehicleType(type);
      setSelectedPurposeId(purposeId || null);
      if (pickup) setPickupSelection(pickup);
      if (dropoff) setDropoffSelection(dropoff);

      // calcular preço real (backend)
      (async () => {
        if (
          !pickup?.latitude ||
          !pickup?.longitude ||
          !dropoff?.latitude ||
          !dropoff?.longitude
        ) {
          setPriceQuote(null);
          return;
        }
        try {
          setPriceQuoteLoading(true);
          const resp = await rideService.calculatePrice({
            pickup: {
              address: pickup.address,
              latitude: pickup.latitude,
              longitude: pickup.longitude,
            },
            dropoff: {
              address: dropoff.address,
              latitude: dropoff.latitude,
              longitude: dropoff.longitude,
            },
            vehicleType: type as any,
            purposeId,
          });
          setPriceQuote(resp);
        } catch (e) {
          console.log("Falha ao calcular preço", e);
          setPriceQuote(null);
        } finally {
          setPriceQuoteLoading(false);
        }
      })();

      setTimeout(() => {
        if (type === "motorcycle") {
          offersMotoRef.current?.snapToIndex(0);
        } else if (type === "car") {
          offersCarRef.current?.snapToIndex(0);
        } else if (type === "van") {
          offersVanRef.current?.snapToIndex(0);
        } else if (type === "truck") {
          offersTruckRef.current?.snapToIndex(0);
        }
        navigation.setParams({
          openOffersFor: undefined,
          purposeId: undefined,
          pickup: undefined,
          dropoff: undefined,
        });
      }, 150);
    }
  }, [route.params]);

  // Integração WebSocket: buscar motorista / receber eventos
  useEffect(() => {
    let mounted = true;

    const rideId = searchingModal.rideId || currentRideId || undefined;

    if (!searchingModal.visible || !rideId) {
      return;
    }

    const onDriverFound = (payload: any) => {
      // payload esperado: { rideId, driver: {...}, eta }
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      setSearchingModal((prev) => ({ ...prev, visible: false }));
      setIsDriverFound(true);
      setDriverInfo(payload?.driver || null);

      // ETA pode vir como objeto {value,text} ou string
      const etaText =
        payload?.eta?.text ||
        (typeof payload?.eta === "string" ? payload.eta : undefined);
      setDriverEtaText(etaText);

      // MVP: ir para tela de tracking assim que encontrar motorista
      try {
        (navigation as any).navigate("RideTracking", { rideId });
      } catch {}

      // Mantém o sheet como fallback/preview caso volte para Home
      setTimeout(() => {
        driverFoundRef.current?.snapToIndex(0);
      }, 250);
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      setSearchingModal((prev) => ({ ...prev, visible: false }));
      setIsDriverFound(false);
      setDriverLatLng(null);
      setDriverInfo(null);
      setDriverEtaText(undefined);
    };

    const onDriverLocationUpdated = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;
      const loc = payload?.location;
      if (loc?.latitude && loc?.longitude) {
        setDriverLatLng({ latitude: loc.latitude, longitude: loc.longitude });
      }
    };

    // Conectar e registrar listeners
    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onDriverFound(onDriverFound);
        webSocketService.onRideCancelled(onRideCancelled);
        webSocketService.onDriverLocationUpdated(onDriverLocationUpdated);

        // Sinalizar que está aguardando motorista (backend só loga, mas mantém contrato)
        webSocketService.waitingDriver(rideId);
      } catch (e) {
        console.log("Falha ao conectar WebSocket", e);
      }
    })();

    return () => {
      mounted = false;
      // remover listeners específicos deste ride
      webSocketService.off("driver-found", onDriverFound);
      webSocketService.off("ride-cancelled", onRideCancelled);
      webSocketService.off("driver-location-updated", onDriverLocationUpdated);
    };
  }, [searchingModal.visible, searchingModal.rideId, currentRideId]);

  const [region, setRegion] = useState<{
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } | null>(null);
  const [userRegion, setUserRegion] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [showMyLocationButton, setShowMyLocationButton] =
    useState<boolean>(false);

  // Ao montar, obter localização atual e setar região inicial
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const result = await getCurrentLocationAndAddress();
      if (!result || !isMounted) return;
      const { location, address } = result;
      setRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setCurrentAddress(
        `${address.street}${address.number ? ", " + address.number : ""}`,
      );
      setUserRegion({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setShowMyLocationButton(false);
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Reabre o bottom sheet quando a tela receber foco (voltando de outra tela)
  useFocusEffect(
    useCallback(() => {
      // Pequeno delay para garantir que a animação de transição terminou
      const timer = setTimeout(() => {
        // Só reabre se não estiver em busca ou com motorista encontrado
        if (!searchingModal.visible && !isDriverFound) {
          bottomSheetRef.current?.snapToIndex(1);
        }
      }, 300);

      return () => clearTimeout(timer);
    }, [searchingModal.visible, isDriverFound]),
  );

  const handleRegionChange = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    // Função vazia - não precisa fazer nada durante o arrasto
  };

  const handleRegionChangeComplete = async (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    // Atualiza overlay de debug com coordenadas do centro
    setDragLatLng({ lat: r.latitude, lng: r.longitude });

    // Verifica se o usuário se afastou da localização inicial
    if (!userRegion) return;
    const distanceLat = Math.abs(r.latitude - userRegion.latitude);
    const distanceLng = Math.abs(r.longitude - userRegion.longitude);
    const thresholdLat = r.latitudeDelta * 0.5;
    const thresholdLng = r.longitudeDelta * 0.5;
    const isFar = distanceLat > thresholdLat || distanceLng > thresholdLng;
    setShowMyLocationButton(isFar);
  };

  const [currentAddress, setCurrentAddress] = useState<string>(
    MOCK_DATA.currentLocation.address,
  );

  // Handlers (sem funcionalidade por enquanto)
  const handlePressLocation = () => {
    console.log("Pressed location dropdown");
  };

  const handlePressMenu = () => {
    navigation.openDrawer();
  };

  const handlePressMoreOptions = () => {
    console.log("Pressed more options (3 dots) - Future functionality");
    // TODO: Implementar funcionalidade futura
  };

  const handlePressSafety = () => {
    console.log("Pressed safety button - Opening safety help");
    // Fecha bottom sheet principal
    bottomSheetRef.current?.close();
    // Abre o SafetyHelpSheet com pequeno delay
    setTimeout(() => {
      console.log("Abrindo SafetyHelpSheet...");
      safetyHelpRef.current?.snapToIndex(0);
    }, 150);
  };

  const handlePressMyLocation = async () => {
    console.log("Pressed my location");
    const result = await getCurrentLocationAndAddress();
    if (!result) {
      console.warn("Permissão negada ou falha ao obter localização/endereço");
      return;
    }
    const { location, address } = result;
    setCurrentAddress(
      `${address.street}${address.number ? ", " + address.number : ""}`,
    );
    // Centraliza no usuário
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        600,
      );
    }
    // Não abre o LocationPicker: apenas centraliza no usuário
  };

  const handlePressSearch = () => {
    console.log("Pressed search bar - Opening location picker");
    setServiceMode("ride"); // Default para corrida
    // Fecha o BottomSheet principal
    bottomSheetRef.current?.close();
    // Navega para a tela LocationPicker
    (navigation as any).navigate("LocationPicker");
  };

  const handleChooseOnMap = () => {
    // Navega para MapLocationPicker
    (navigation as any).navigate("MapLocationPicker");
  };

  const handleSelectLocation = (location: string) => {
    console.log("Selected location:", location);
    setDestinationAddress(location);
    navigation.goBack(); // Volta para Home

    // Lógica de fluxo baseada no modo
    setTimeout(() => {
      console.log("Navigating based on mode:", serviceMode);
      // Agora SelectVehicle é uma Screen; navegar para ela quando necessário
      if (serviceMode === "delivery") {
        (navigation as any).navigate("SelectVehicle", {
          pickup: { address: currentAddress },
          dropoff: { address: location },
        });
      } else {
        // Modo "ride" ou default: mantém fluxo de ofertas de carro
        offersCarRef.current?.snapToIndex(0);
      }
    }, 150);
  };

  const handleCloseSafetyHelp = () => {
    console.log("Closed safety help");
    // Reabre o BottomSheet principal
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handlePressRide = () => {
    console.log("Pressed ride service");
    setServiceMode("ride");
    bottomSheetRef.current?.close();
    (navigation as any).navigate("LocationPicker");
  };

  const handlePressDelivery = () => {
    console.log("Pressed delivery service");
    setServiceMode("delivery");
    // Fecha outros sheets e navega para seletor de local
    bottomSheetRef.current?.close();
    (navigation as any).navigate("LocationPicker");
  };

  // Removido: handleSelectVehicle (seleção ocorre na SelectVehicleScreen)

  const handleConfirmMotoOffer = (offerId: string) => {
    console.log("Moto offer confirmed:", offerId);
    offersMotoRef.current?.close();

    // Navegar diretamente para o resumo (sem modal de busca aqui)
    const q = priceQuote;
    const data: FinalOrderSummaryData = {
      pickupAddress: pickupSelection?.address || currentAddress,
      pickupNeighborhood: "Centro, São Paulo - SP", // TODO: real
      pickupLatLng:
        pickupSelection?.latitude && pickupSelection?.longitude
          ? {
              latitude: pickupSelection.latitude,
              longitude: pickupSelection.longitude,
            }
          : userRegion
            ? { latitude: userRegion.latitude, longitude: userRegion.longitude }
            : region
              ? { latitude: region.latitude, longitude: region.longitude }
              : undefined,
      dropoffAddress:
        dropoffSelection?.address || destinationAddress || "Av. Paulista, 1000",
      dropoffNeighborhood: "Bela Vista, São Paulo - SP", // TODO: real
      dropoffLatLng:
        dropoffSelection?.latitude && dropoffSelection?.longitude
          ? {
              latitude: dropoffSelection.latitude,
              longitude: dropoffSelection.longitude,
            }
          : dragLatLng
            ? { latitude: dragLatLng.lat, longitude: dragLatLng.lng }
            : undefined,
      vehicleType: "moto",
      serviceMode: serviceMode || "delivery",
      purposeId: selectedPurposeId || undefined,
      servicePurposeLabel: "Documentos",
      etaMinutes: q?.duration?.value ? Math.round(q.duration.value / 60) : 15,
      pricing: {
        base: q?.pricing?.basePrice ?? 5,
        distanceKm: q?.distance?.value ? q.distance.value / 1000 : 4.2,
        distancePrice: q?.pricing?.distancePrice ?? 8.4,
        serviceFee: q?.pricing?.serviceFee ?? 1.5,
        total: q?.pricing?.total ?? 14.9,
      },
      paymentSummary: "Visa final 4242",
      itemType: "Caixa pequena",
      helperIncluded: false,
      insuranceLevel: "basic",
      etaText: q?.duration?.text,
    };
    setFinalSummaryData(data);
    (navigation as any).navigate("FinalOrderSummary", { data });
  };

  const handleBackFromOffers = () => {
    // Fecha listas de ofertas e volta para a tela de escolha de finalidade
    offersMotoRef.current?.close();
    offersCarRef.current?.close();
    offersVanRef.current?.close?.();
    offersTruckRef.current?.close?.();
    setTimeout(
      () =>
        (navigation as any).navigate("ServicePurpose", {
          vehicleType: selectedVehicleType,
        }),
      150,
    );
  };

  // Removido: handleSelectPurpose (feito na ServicePurposeScreen)

  // Removido: handleClosePurpose (feito na ServicePurposeScreen)

  // Removido: handleBackFromPurpose (feito na ServicePurposeScreen)

  // Removido: handleBackFromSelectVehicle (não há mais sheet de veículo)

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View className="relative h-full w-full flex-col bg-background-dark">
        {/* Container do mapa - ocupa tela toda */}
        <View className="relative flex-1 w-full bg-[#101816] overflow-hidden">
          {/* Mapa com overlay de imagem (background) */}
          <View className="absolute inset-0">
            <GlobalMap
              initialRegion={
                (region ?? {
                  latitude: MOCK_DATA.currentLocation.coordinates.latitude,
                  longitude: MOCK_DATA.currentLocation.coordinates.longitude,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }) as any
              }
              region={region ?? undefined}
              showsUserLocation={true}
              onMapRef={(ref) => (mapRef.current = ref)}
              onMapRegionChange={handleRegionChange}
              onRegionChangeComplete={handleRegionChangeComplete}
            >
              {/* Marcadores de veículos */}
              {MOCK_DATA.vehicles.map((vehicle) => (
                <Marker
                  key={vehicle.id}
                  coordinate={{
                    latitude: vehicle.latitude,
                    longitude: vehicle.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <VehicleMarker
                    type={vehicle.type}
                    rotation={vehicle.rotation}
                    isPulsing={vehicle.id === "1"}
                  />
                </Marker>
              ))}

              {/* Marcador do Motorista (Quando encontrado) */}
              {isDriverFound && (driverLatLng || userRegion || region) && (
                <Marker
                  coordinate={{
                    latitude:
                      driverLatLng?.latitude ??
                      userRegion?.latitude ??
                      region?.latitude ??
                      MOCK_DATA.currentLocation.coordinates.latitude,
                    longitude:
                      driverLatLng?.longitude ??
                      userRegion?.longitude ??
                      region?.longitude ??
                      MOCK_DATA.currentLocation.coordinates.longitude,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={false}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      padding: 6,
                      borderRadius: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.25,
                      shadowRadius: 3.84,
                      elevation: 5,
                      transform: [{ rotate: "45deg" }],
                    }}
                  >
                    <MaterialIcons
                      name="directions-car"
                      size={24}
                      color="black"
                    />
                  </View>
                </Marker>
              )}
            </GlobalMap>
          </View>

          {/* Gradiente superior - escurece o topo */}
          <View
            className="absolute top-0 left-0 right-0 h-40 pointer-events-none z-10"
            style={{
              backgroundColor: "transparent",
            }}
          >
            <View
              className="w-full h-full"
              style={{
                backgroundColor: "rgba(0, 0, 0, 0.5)",
              }}
            />
          </View>

          {/* Gradiente inferior - escurece a base */}
          <View
            className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
            style={{
              backgroundColor: "rgba(15, 35, 28, 0.3)",
            }}
          />

          {/* Botão Menu Hambúrguer - separado, canto superior esquerdo */}
          <View className="absolute top-14 left-4 z-20">
            <TouchableOpacity
              onPress={handlePressMenu}
              className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
              activeOpacity={0.8}
            >
              <MaterialIcons name="menu" size={24} color="#02de95" />
            </TouchableOpacity>
          </View>

          {/* Header com localização - abaixo do menu */}
          <View className="absolute top-28 left-4 right-4 z-20">
            <LocationHeader
              currentAddress={MOCK_DATA.currentLocation.address}
              userPhotoUrl={MOCK_DATA.user.photoUrl}
              onPressLocation={handlePressLocation}
            />
          </View>

          {/* Botão More Options (3 pontos) - canto superior direito + badge de carteira */}
          <View className="absolute top-14 right-4 z-20 flex-row items-center gap-2">
            {/* Badge de carteira (CashLeva) */}
            <View className="flex-row items-center gap-1 px-3 h-12 rounded-full bg-surface-dark/90 border border-white/10">
              <MaterialIcons name="attach-money" size={20} color="#02de95" />
              <Text className="text-white font-semibold">
                {formatBRL(walletBalance)}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handlePressMoreOptions}
              className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
              activeOpacity={0.8}
            >
              <MaterialIcons name="more-vert" size={24} color="#02de95" />
            </TouchableOpacity>
          </View>

          {/* Botões de Ação - posicionados próximos ao Bottom Sheet */}
          <View className="absolute right-4 bottom-[400px] z-20 flex-col gap-3">
            {/* Botão de Segurança */}
            <TouchableOpacity
              onPress={handlePressSafety}
              className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
              activeOpacity={0.8}
            >
              <MaterialIcons name="shield" size={24} color="#60A5FA" />
            </TouchableOpacity>

            {/* Botão de Localização */}
            {showMyLocationButton && (
              <TouchableOpacity
                onPress={handlePressMyLocation}
                className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
                activeOpacity={0.8}
              >
                <MaterialIcons name="my-location" size={24} color="#02de95" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Bottom Sheet - sobrepõe o mapa */}
        <>
          <BottomSheet
            ref={bottomSheetRef}
            onPressSearch={handlePressSearch}
            onPressRide={handlePressRide}
            onPressDelivery={handlePressDelivery}
          />
        </>

        {/* Select Vehicle agora é uma Screen: componente de sheet removido */}

        {/* Service Purpose agora é uma Screen */}

        {/* Offers Moto Sheet - Ofertas de motos mockadas */}
        <OffersMotoSheet
          ref={offersMotoRef}
          onConfirm={handleConfirmMotoOffer}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
          nextPriceText={
            priceQuote?.pricing?.total != null
              ? formatBRL(priceQuote.pricing.total)
              : undefined
          }
          nextEtaText={priceQuote?.duration?.text}
          loadingQuote={priceQuoteLoading}
        />

        {/* Offers Car Sheet - Ofertas de carros mockadas */}
        <OffersCarSheet
          ref={offersCarRef}
          onConfirm={(offerId: string) => {
            console.log("Car offer confirmed:", offerId);
            offersCarRef.current?.close();

            const q = priceQuote;
            const data: FinalOrderSummaryData = {
              pickupAddress: pickupSelection?.address || currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              pickupLatLng:
                pickupSelection?.latitude && pickupSelection?.longitude
                  ? {
                      latitude: pickupSelection.latitude,
                      longitude: pickupSelection.longitude,
                    }
                  : userRegion
                    ? {
                        latitude: userRegion.latitude,
                        longitude: userRegion.longitude,
                      }
                    : region
                      ? {
                          latitude: region.latitude,
                          longitude: region.longitude,
                        }
                      : undefined,
              dropoffAddress:
                dropoffSelection?.address ||
                destinationAddress ||
                "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              dropoffLatLng:
                dropoffSelection?.latitude && dropoffSelection?.longitude
                  ? {
                      latitude: dropoffSelection.latitude,
                      longitude: dropoffSelection.longitude,
                    }
                  : dragLatLng
                    ? { latitude: dragLatLng.lat, longitude: dragLatLng.lng }
                    : undefined,
              vehicleType: "car",
              serviceMode: serviceMode || "delivery",
              purposeId: selectedPurposeId || undefined,
              servicePurposeLabel: "Entrega rápida",
              etaMinutes: q?.duration?.value
                ? Math.round(q.duration.value / 60)
                : 12,
              pricing: {
                base: q?.pricing?.basePrice ?? 7,
                distanceKm: q?.distance?.value ? q.distance.value / 1000 : 4.2,
                distancePrice: q?.pricing?.distancePrice ?? 10.4,
                serviceFee: q?.pricing?.serviceFee ?? 2.5,
                total: q?.pricing?.total ?? 19.9,
              },
              paymentSummary: "Pix",
              itemType: "Caixa pequena",
              helperIncluded: false,
              insuranceLevel: "basic",
              etaText: q?.duration?.text,
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
          nextPriceText={
            priceQuote?.pricing?.total != null
              ? formatBRL(priceQuote.pricing.total)
              : undefined
          }
          nextEtaText={priceQuote?.duration?.text}
          loadingQuote={priceQuoteLoading}
        />

        {/* Safety Help Sheet - Ajuda e Segurança */}
        <SafetyHelpSheet ref={safetyHelpRef} onClose={handleCloseSafetyHelp} />

        {/* Searching Driver Modal */}
        <SearchingDriverModal
          visible={searchingModal.visible}
          serviceTitle={searchingModal.title}
          price={searchingModal.price}
          etaText={searchingModal.eta}
          onCancel={async () => {
            try {
              const rideId = searchingModal.rideId || currentRideId;
              if (rideId)
                await rideService.cancel(rideId, "cancelled_by_client");
            } catch (e) {
              console.log("Falha ao cancelar corrida", e);
            } finally {
              setSearchingModal((prev) => ({ ...prev, visible: false }));
            }
          }}
          onBack={() =>
            setSearchingModal((prev) => ({ ...prev, visible: false }))
          }
          onHelp={handlePressSafety}
        />

        {/* Offers Van Sheet - Ofertas de vans */}
        <OffersVanSheet
          ref={offersVanRef}
          onConfirm={(offerId: string) => {
            console.log("Van offer confirmed:", offerId);
            offersVanRef.current?.close();

            const q = priceQuote;
            const data: FinalOrderSummaryData = {
              pickupAddress: pickupSelection?.address || currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              pickupLatLng:
                pickupSelection?.latitude && pickupSelection?.longitude
                  ? {
                      latitude: pickupSelection.latitude,
                      longitude: pickupSelection.longitude,
                    }
                  : userRegion
                    ? {
                        latitude: userRegion.latitude,
                        longitude: userRegion.longitude,
                      }
                    : region
                      ? {
                          latitude: region.latitude,
                          longitude: region.longitude,
                        }
                      : undefined,
              dropoffAddress:
                dropoffSelection?.address ||
                destinationAddress ||
                "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              dropoffLatLng:
                dropoffSelection?.latitude && dropoffSelection?.longitude
                  ? {
                      latitude: dropoffSelection.latitude,
                      longitude: dropoffSelection.longitude,
                    }
                  : dragLatLng
                    ? { latitude: dragLatLng.lat, longitude: dragLatLng.lng }
                    : undefined,
              vehicleType: "van",
              serviceMode: serviceMode || "delivery",
              purposeId: selectedPurposeId || undefined,
              servicePurposeLabel: "Mudança leve",
              etaMinutes: q?.duration?.value
                ? Math.round(q.duration.value / 60)
                : 18,
              pricing: {
                base: q?.pricing?.basePrice ?? 12,
                distanceKm: q?.distance?.value ? q.distance.value / 1000 : 4.2,
                distancePrice: q?.pricing?.distancePrice ?? 15.4,
                serviceFee: q?.pricing?.serviceFee ?? 3.5,
                total: q?.pricing?.total ?? 30.9,
              },
              paymentSummary: "Dinheiro",
              itemType: "Caixa pequena",
              helperIncluded: true,
              insuranceLevel: "basic",
              etaText: q?.duration?.text,
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
          nextPriceText={
            priceQuote?.pricing?.total != null
              ? formatBRL(priceQuote.pricing.total)
              : undefined
          }
          nextEtaText={priceQuote?.duration?.text}
          loadingQuote={priceQuoteLoading}
        />

        {/* Offers Truck Sheet - Ofertas de caminhões */}
        <OffersTruckSheet
          ref={offersTruckRef}
          onConfirm={(offerId: string) => {
            console.log("Truck offer confirmed:", offerId);
            offersTruckRef.current?.close();

            const q = priceQuote;
            const data: FinalOrderSummaryData = {
              pickupAddress: pickupSelection?.address || currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              pickupLatLng:
                pickupSelection?.latitude && pickupSelection?.longitude
                  ? {
                      latitude: pickupSelection.latitude,
                      longitude: pickupSelection.longitude,
                    }
                  : userRegion
                    ? {
                        latitude: userRegion.latitude,
                        longitude: userRegion.longitude,
                      }
                    : region
                      ? {
                          latitude: region.latitude,
                          longitude: region.longitude,
                        }
                      : undefined,
              dropoffAddress:
                dropoffSelection?.address ||
                destinationAddress ||
                "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              dropoffLatLng:
                dropoffSelection?.latitude && dropoffSelection?.longitude
                  ? {
                      latitude: dropoffSelection.latitude,
                      longitude: dropoffSelection.longitude,
                    }
                  : dragLatLng
                    ? { latitude: dragLatLng.lat, longitude: dragLatLng.lng }
                    : undefined,
              vehicleType: "truck",
              serviceMode: serviceMode || "delivery",
              purposeId: selectedPurposeId || undefined,
              servicePurposeLabel: "Frete",
              etaMinutes: q?.duration?.value
                ? Math.round(q.duration.value / 60)
                : 22,
              pricing: {
                base: q?.pricing?.basePrice ?? 20,
                distanceKm: q?.distance?.value ? q.distance.value / 1000 : 4.2,
                distancePrice: q?.pricing?.distancePrice ?? 22.4,
                serviceFee: q?.pricing?.serviceFee ?? 4.5,
                total: q?.pricing?.total ?? 46.9,
              },
              paymentSummary: "Cartão",
              itemType: "Caixa pequena",
              helperIncluded: true,
              insuranceLevel: "basic",
              etaText: q?.duration?.text,
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
          nextPriceText={
            priceQuote?.pricing?.total != null
              ? formatBRL(priceQuote.pricing.total)
              : undefined
          }
          nextEtaText={priceQuote?.duration?.text}
          loadingQuote={priceQuoteLoading}
        />
        {/* Driver Found Sheet - Tela de Motorista Encontrado */}
        <DriverFoundSheet
          ref={driverFoundRef}
          driver={driverInfo}
          etaText={driverEtaText}
          onClose={() => {
            console.log("Fechou driver found sheet");
          }}
          onCall={() => {
            const phone = driverInfo?.phone;
            if (!phone) return;
            try {
              Linking.openURL(`tel:${phone}`);
            } catch (e) {
              console.log("Falha ao iniciar chamada", e);
            }
          }}
          onChat={() => {
            (navigation as any).navigate("Chat", {
              driverName: driverInfo?.name || "Motorista",
            });
          }}
          onShare={async () => {
            try {
              const message = `Estou em uma corrida. Motorista: ${
                driverInfo?.name || "Motorista"
              }. Acompanhe pelo app.`;
              await Share.share({ message });
            } catch (e) {
              console.log("Falha ao compartilhar", e);
            }
          }}
          onCancel={async () => {
            const total = finalSummaryData?.pricing.total ?? 0;
            const rideId = currentRideId;

            try {
              if (rideId) {
                await rideService.cancel(rideId, "cancelled_by_client");
              }
            } catch (e) {
              console.log("Falha ao cancelar corrida", e);
            }

            (navigation as any).navigate("CancelFee", { total });

            driverFoundRef.current?.close();
            setIsDriverFound(false);
          }}
          onDetails={() => {
            if (finalSummaryData) {
              (navigation as any).navigate("OrderDetails", {
                data: finalSummaryData,
              });
              return;
            }

            const data = {
              pickupAddress: currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              dropoffAddress: destinationAddress || "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              vehicleType: "car",
              servicePurposeLabel: "Entrega",
              etaMinutes: 6,
              pricing: {
                base: 10,
                distanceKm: 4.2,
                distancePrice: 12.4,
                serviceFee: 3.5,
                total: 25.9,
              },
              paymentSummary: "Pix",
              itemType: "Documento",
              helperIncluded: false,
              insuranceLevel: "basic",
            } as any;
            (navigation as any).navigate("OrderDetails", { data });
          }}
        />

        {/* Resumo final agora é uma Screen dedicada; sheet não é mais renderizado aqui */}
      </View>
    </GestureHandlerRootView>
  );
}
