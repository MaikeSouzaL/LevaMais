import React, { useState, useRef, useEffect } from "react";
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
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import GorhomBottomSheet from "@gorhom/bottom-sheet";
import { LocationHeader } from "../../../../components/LocationHeader";
import { VehicleMarker } from "./components/VehicleMarker";
import { BottomSheet } from "./components/BottomSheet";
import { LocationPickerSheet } from "./components/LocationPickerSheet";
import {
  SafetyHelpSheet,
  SafetyHelpSheetRef,
} from "./components/SafetyHelpSheet";
import { SelectVehicleSheet } from "./components/SelectVehicleSheet";
import { OffersMotoSheet } from "./components/OffersMotoSheet";
import { OffersCarSheet } from "./components/OffersCarSheet";
import type { OffersMotoSheetRef } from "./components/OffersMotoSheet";
import type { OffersCarSheetRef } from "./components/OffersCarSheet";
import { ServicePurposeSheet } from "./components/ServicePurposeSheet";
import type { SelectVehicleSheetRef } from "./components/SelectVehicleSheet";
import type { ServicePurposeSheetRef } from "./components/ServicePurposeSheet";
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

import { DriverFoundSheet } from "./components/DriverFoundSheet";
import { MapLocationPickerOverlay } from "./components/MapLocationPickerOverlay";
import { useAuthStore } from "../../../../context/authStore";

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
  const locationPickerRef = useRef<GorhomBottomSheet>(null);
  const safetyHelpRef = useRef<SafetyHelpSheetRef>(null);
  const selectVehicleRef = useRef<SelectVehicleSheetRef>(null);
  const servicePurposeRef = useRef<ServicePurposeSheetRef>(null);
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
  }>({ visible: false, title: "", price: "", eta: "" });

  // Estado para controlar o modo de seleção no mapa
  const [isMapPickerMode, setIsMapPickerMode] = useState(false);
  // Estado para armazenar o endereço sendo selecionado no mapa (reverse geocoding)
  const [mapPickerAddress, setMapPickerAddress] = useState<string>("");
  // Estado para controlar loading do geocoding
  const [isGeocodingLoading, setIsGeocodingLoading] = useState(false);

  // Estado para controlar se o motorista foi encontrado
  const [isDriverFound, setIsDriverFound] = useState(false);

  // Controle de Fluxo
  const [serviceMode, setServiceMode] = useState<"ride" | "delivery" | null>(
    null
  );
  const [destinationAddress, setDestinationAddress] = useState<string>("");

  const [selectedVehicleType, setSelectedVehicleType] = useState<
    "motorcycle" | "car" | "van" | "truck" | null
  >(null);

  const [finalSummaryData, setFinalSummaryData] =
    useState<FinalOrderSummaryData | null>(null);
  const [dragLatLng, setDragLatLng] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();
  const walletBalance = useAuthStore((s) => s.walletBalance || 0);

  const formatBRL = (value: number) => {
    try {
      return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(value);
    } catch {
      return `R$ ${value.toFixed(2)}`;
    }
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
      const { title, price, eta } = route.params.searchData;

      // Delay pequeno para garantir transição suave
      setTimeout(() => {
        setSearchingModal({
          visible: true,
          title: title || "Buscando...",
          price: price || "",
          eta: eta || "",
        });

        // Limpar params
        navigation.setParams({
          startSearch: undefined,
          searchData: undefined,
        });

        // SIMULAÇÃO: Encontrar motorista após 10 segundos
        setTimeout(() => {
          setSearchingModal((prev) => ({ ...prev, visible: false }));
          setIsDriverFound(true);

          // Pequeno delay para garantir que o modal de busca fechou
          setTimeout(() => {
            driverFoundRef.current?.snapToIndex(0); // Abre o sheet de motorista encontrado
          }, 300);
        }, 10000); // 10 segundos
      }, 300);
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
  }, [route.params]);

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
        `${address.street}${address.number ? ", " + address.number : ""}`
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

  const handleRegionChange = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    // Opcional: Atualizar algo visual enquanto arrasta
    if (isMapPickerMode) {
      // Evita setar estado repetidamente se já estiver com o texto
      if (mapPickerAddress !== "Localizando...") {
        setMapPickerAddress("Localizando...");
      }
    }
  };

  const handleRegionChangeComplete = async (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
    // Atualiza overlay de debug com coordenadas do centro
    setDragLatLng({ lat: r.latitude, lng: r.longitude });
    
    if (isMapPickerMode) {
      setIsGeocodingLoading(true);
      try {
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("🗺️  PIN MOVIDO - BUSCANDO ENDEREÇO...");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("📍 Coordenadas:");
        console.log(`   Latitude: ${r.latitude}`);
        console.log(`   Longitude: ${r.longitude}`);
        console.log("");

        // Buscar endereço completo com TODOS os dados
        const enderecoCompleto = await obterEnderecoPorCoordenadas(
          r.latitude,
          r.longitude
        );

        if (enderecoCompleto) {
          console.log("✅ DADOS COMPLETOS DO REVERSE GEOCODING:");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("📌 Campos principais:");
          console.log(`   🏠 Nome: ${enderecoCompleto.name || "❌ não disponível"}`);
          console.log(`   🛣️  Rua: ${enderecoCompleto.street || "❌ não disponível"}`);
          console.log(`   🔢 Número: ${enderecoCompleto.streetNumber || "❌ não disponível"}`);
          console.log(`   🏘️  Bairro: ${enderecoCompleto.district || "❌ não disponível"}`);
          console.log(`   🏙️  Cidade: ${enderecoCompleto.city || "❌ não disponível"}`);
          console.log(`   🗺️  Estado: ${enderecoCompleto.region || "❌ não disponível"}`);
          console.log(`   📮 CEP: ${enderecoCompleto.postalCode || "❌ não disponível"}`);
          console.log("");
          console.log("📌 Campos secundários:");
          console.log(`   🌍 País: ${enderecoCompleto.country || "❌ não disponível"}`);
          console.log(`   🏳️  Código ISO: ${enderecoCompleto.isoCountryCode || "❌ não disponível"}`);
          console.log(`   🗂️  Sub-região: ${enderecoCompleto.subregion || "❌ não disponível"}`);
          console.log(`   🕐 Timezone: ${enderecoCompleto.timezone || "❌ não disponível"}`);
          console.log("");
          console.log("📌 Objeto completo (JSON):");
          console.log(JSON.stringify(enderecoCompleto, null, 2));
          console.log("");
          
          // Formatação final
          const enderecoFormatado = formatarEndereco(enderecoCompleto);
          console.log("✨ ENDEREÇO FORMATADO:");
          console.log(`   ${enderecoFormatado}`);
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("");

          // Atualizar UI
          setMapPickerAddress(enderecoFormatado);
        } else {
          console.log("❌ ERRO: Endereço não encontrado");
          console.log("   O reverse geocoding retornou null");
          console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
          console.log("");
          setMapPickerAddress("Endereço não encontrado");
        }
      } catch (error) {
        console.log("❌ ERRO NO REVERSE GEOCODING:");
        console.log(error);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("");
        setMapPickerAddress("Erro ao buscar endereço");
      } finally {
        setIsGeocodingLoading(false);
      }
    }

    if (!userRegion) return;
    const distanceLat = Math.abs(r.latitude - userRegion.latitude);
    const distanceLng = Math.abs(r.longitude - userRegion.longitude);
    const thresholdLat = r.latitudeDelta * 0.5;
    const thresholdLng = r.longitudeDelta * 0.5;
    const isFar = distanceLat > thresholdLat || distanceLng > thresholdLng;
    setShowMyLocationButton(isFar);
  };

  const [currentAddress, setCurrentAddress] = useState<string>(
    MOCK_DATA.currentLocation.address
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
    // Fecha outros bottom sheets
    bottomSheetRef.current?.close();
    locationPickerRef.current?.close();
    // Abre o SafetyHelpSheet com pequeno delay para garantir que os outros fecharam
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
      `${address.street}${address.number ? ", " + address.number : ""}`
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
        600
      );
    }
    // Não abre o LocationPicker: apenas centraliza no usuário
  };

  const handlePressSearch = () => {
    console.log("Pressed search bar - Opening location picker");
    setServiceMode("ride"); // Default para corrida
    // Fecha o BottomSheet principal
    bottomSheetRef.current?.close();
    // Abre o LocationPickerSheet
    locationPickerRef.current?.snapToIndex(0);
  };

  const handleChooseOnMap = () => {
    // Fecha o LocationPicker e ativa o modo mapa
    locationPickerRef.current?.close();
    setIsMapPickerMode(true);
  };

  const handleConfirmMapLocation = (location: string) => {
    console.log("Location confirmed from map:", location);
    setDestinationAddress(location);
    setIsMapPickerMode(false);

    // Lógica de fluxo baseada no modo
    setTimeout(() => {
      if (serviceMode === "delivery") {
        selectVehicleRef.current?.snapToIndex(0);
      } else {
        // Modo "ride" ou default
        offersCarRef.current?.snapToIndex(0);
      }
    }, 150);
  };

  const handleBackFromMapPicker = () => {
    setIsMapPickerMode(false);
    // Reabre o LocationPicker
    locationPickerRef.current?.snapToIndex(0);
  };

  const handleSelectLocation = (location: string) => {
    console.log("Selected location:", location);
    setDestinationAddress(location);
    locationPickerRef.current?.close();

    // Lógica de fluxo baseada no modo
    setTimeout(() => {
      if (serviceMode === "delivery") {
        selectVehicleRef.current?.snapToIndex(0);
      } else {
        // Modo "ride" ou default
        offersCarRef.current?.snapToIndex(0);
      }
    }, 150);
  };

  const handleCloseLocationPicker = () => {
    console.log("Closed location picker");
    // Reabre o BottomSheet principal
    bottomSheetRef.current?.snapToIndex(1);
    setServiceMode(null);
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
    locationPickerRef.current?.snapToIndex(0);
  };

  const handlePressDelivery = () => {
    console.log("Pressed delivery service");
    setServiceMode("delivery");
    // Fecha outros sheets e abre seletor de local (agora obrigatório antes do veículo)
    bottomSheetRef.current?.close();
    locationPickerRef.current?.snapToIndex(0);
  };

  const handleSelectVehicle = (
    type: "motorcycle" | "car" | "van" | "truck"
  ) => {
    console.log("Vehicle selected:", type);
    // Para qualquer veículo suportado, abrir tela de finalidade
    if (
      type === "motorcycle" ||
      type === "car" ||
      type === "van" ||
      type === "truck"
    ) {
      setSelectedVehicleType(type);
      selectVehicleRef.current?.close();
      setTimeout(() => servicePurposeRef.current?.snapToIndex(0), 150);
      return;
    }
    // Demais tipos ainda não implementados: apenas fecha e volta ao principal
    selectVehicleRef.current?.close();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleConfirmMotoOffer = (offerId: string) => {
    console.log("Moto offer confirmed:", offerId);
    offersMotoRef.current?.close();

    // Navegar diretamente para o resumo (sem modal de busca aqui)
    const data: FinalOrderSummaryData = {
      pickupAddress: currentAddress,
      pickupNeighborhood: "Centro, São Paulo - SP", // Mock
      dropoffAddress: destinationAddress || "Av. Paulista, 1000",
      dropoffNeighborhood: "Bela Vista, São Paulo - SP", // Mock
      vehicleType: "moto",
      servicePurposeLabel: "Documentos",
      etaMinutes: 15,
      pricing: {
        base: 5,
        distanceKm: 4.2,
        distancePrice: 8.4,
        serviceFee: 1.5,
        total: 14.9,
      },
      paymentSummary: "Visa final 4242",
      itemType: "Caixa pequena",
      helperIncluded: false,
      insuranceLevel: "basic",
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
    setTimeout(() => servicePurposeRef.current?.snapToIndex(0), 150);
  };

  const handleSelectPurpose = (purposeId: string) => {
    console.log("Purpose selected:", purposeId);
    servicePurposeRef.current?.close();
    // Após escolher propósito, abrir lista de ofertas conforme veículo
    setTimeout(() => {
      if (selectedVehicleType === "motorcycle") {
        offersMotoRef.current?.snapToIndex(0);
      } else if (selectedVehicleType === "car") {
        offersCarRef.current?.snapToIndex(0);
      } else if (selectedVehicleType === "van") {
        offersVanRef.current?.snapToIndex(0);
      } else if (selectedVehicleType === "truck") {
        offersTruckRef.current?.snapToIndex(0);
      }
    }, 150);
  };

  const handleClosePurpose = () => {
    servicePurposeRef.current?.close();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleBackFromPurpose = () => {
    servicePurposeRef.current?.close();
    // Volta para seleção de veículo
    setTimeout(() => selectVehicleRef.current?.snapToIndex(0), 150);
  };

  const handleBackFromSelectVehicle = () => {
    selectVehicleRef.current?.close();
    // Volta para seleção de local
    setTimeout(() => locationPickerRef.current?.snapToIndex(0), 150);
  };

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
              {isDriverFound && (
                <Marker
                  coordinate={{
                    latitude:
                      MOCK_DATA.currentLocation.coordinates.latitude - 0.002, // Perto do usuário
                    longitude:
                      MOCK_DATA.currentLocation.coordinates.longitude - 0.002,
                  }}
                  anchor={{ x: 0.5, y: 0.5 }}
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
          {!isMapPickerMode && (
            <View
              className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none z-10"
              style={{
                backgroundColor: "rgba(15, 35, 28, 0.3)",
              }}
            />
          )}

          {/* Botão Menu Hambúrguer - separado, canto superior esquerdo */}
          {!isMapPickerMode && (
            <View className="absolute top-14 left-4 z-20">
              <TouchableOpacity
                onPress={handlePressMenu}
                className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
                activeOpacity={0.8}
              >
                <MaterialIcons name="menu" size={24} color="#02de95" />
              </TouchableOpacity>
            </View>
          )}

          {/* Header com localização - abaixo do menu */}
          {!isMapPickerMode && (
            <View className="absolute top-28 left-4 right-4 z-20">
              <LocationHeader
                currentAddress={MOCK_DATA.currentLocation.address}
                userPhotoUrl={MOCK_DATA.user.photoUrl}
                onPressLocation={handlePressLocation}
              />
            </View>
          )}

          {/* Botão More Options (3 pontos) - canto superior direito + badge de carteira */}
          {!isMapPickerMode && (
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
          )}

          {/* Botões de Ação - posicionados próximos ao Bottom Sheet */}
          {!isMapPickerMode && (
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
          )}

          {/* Map Location Picker Overlay */}
          {isMapPickerMode && (
            <MapLocationPickerOverlay
              onBack={handleBackFromMapPicker}
              onConfirm={handleConfirmMapLocation}
              currentAddress={
                mapPickerAddress || destinationAddress || currentAddress
              }
              currentLatLng={dragLatLng}
              isLoading={isGeocodingLoading}
            />
          )}
        </View>

        {/* Bottom Sheet - sobrepõe o mapa */}
        {!isMapPickerMode && (
          <>
            {/* Overlay de debug: lat/lng ao arrastar o pin */}
            {dragLatLng && (
              <View className="absolute bottom-28 left-4 right-4 z-20">
                <View className="bg-surface-dark/90 border border-white/10 rounded-xl px-3 py-2">
                  <Text className="text-xs text-white font-semibold">
                    Lat: {dragLatLng.lat.toFixed(6)} | Lng:{" "}
                    {dragLatLng.lng.toFixed(6)}
                  </Text>
                </View>
              </View>
            )}

            <BottomSheet
              ref={bottomSheetRef}
              onPressSearch={handlePressSearch}
              onPressRide={handlePressRide}
              onPressDelivery={handlePressDelivery}
            />
          </>
        )}

        {/* Location Picker Sheet - Seleção de Endereço */}
        <LocationPickerSheet
          ref={locationPickerRef}
          onClose={handleCloseLocationPicker}
          onSelectLocation={handleSelectLocation}
          onChooseOnMap={handleChooseOnMap}
          currentLocation={currentAddress}
          currentAddress={currentAddress}
        />

        {/* Select Vehicle Sheet - Tipo de serviço */}
        <SelectVehicleSheet
          ref={selectVehicleRef}
          onSelect={handleSelectVehicle}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromSelectVehicle}
        />

        {/* Service Purpose Sheet - Substitui a Screen anterior */}
        <ServicePurposeSheet
          ref={servicePurposeRef}
          vehicleType={selectedVehicleType as any}
          onSelect={handleSelectPurpose}
          onClose={handleClosePurpose}
          onBack={handleBackFromPurpose}
        />

        {/* Offers Moto Sheet - Ofertas de motos mockadas */}
        <OffersMotoSheet
          ref={offersMotoRef}
          onConfirm={handleConfirmMotoOffer}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />

        {/* Offers Car Sheet - Ofertas de carros mockadas */}
        <OffersCarSheet
          ref={offersCarRef}
          onConfirm={(offerId: string) => {
            console.log("Car offer confirmed:", offerId);
            offersCarRef.current?.close();

            const data: FinalOrderSummaryData = {
              pickupAddress: currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              dropoffAddress: destinationAddress || "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              vehicleType: "car",
              servicePurposeLabel: "Entrega rápida",
              etaMinutes: 12,
              pricing: {
                base: 7,
                distanceKm: 4.2,
                distancePrice: 10.4,
                serviceFee: 2.5,
                total: 19.9,
              },
              paymentSummary: "Pix",
              itemType: "Caixa pequena",
              helperIncluded: false,
              insuranceLevel: "basic",
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />

        {/* Safety Help Sheet - Ajuda e Segurança */}
        <SafetyHelpSheet ref={safetyHelpRef} onClose={handleCloseSafetyHelp} />

        {/* Searching Driver Modal */}
        <SearchingDriverModal
          visible={searchingModal.visible}
          serviceTitle={searchingModal.title}
          price={searchingModal.price}
          etaText={searchingModal.eta}
          onCancel={() =>
            setSearchingModal({ ...searchingModal, visible: false })
          }
          onBack={() =>
            setSearchingModal({ ...searchingModal, visible: false })
          }
          onHelp={handlePressSafety}
        />

        {/* Offers Van Sheet - Ofertas de vans */}
        <OffersVanSheet
          ref={offersVanRef}
          onConfirm={(offerId: string) => {
            console.log("Van offer confirmed:", offerId);
            offersVanRef.current?.close();

            const data: FinalOrderSummaryData = {
              pickupAddress: currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              dropoffAddress: destinationAddress || "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              vehicleType: "van",
              servicePurposeLabel: "Mudança leve",
              etaMinutes: 18,
              pricing: {
                base: 12,
                distanceKm: 4.2,
                distancePrice: 15.4,
                serviceFee: 3.5,
                total: 30.9,
              },
              paymentSummary: "Dinheiro",
              itemType: "Caixa pequena",
              helperIncluded: true,
              insuranceLevel: "basic",
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />

        {/* Offers Truck Sheet - Ofertas de caminhões */}
        <OffersTruckSheet
          ref={offersTruckRef}
          onConfirm={(offerId: string) => {
            console.log("Truck offer confirmed:", offerId);
            offersTruckRef.current?.close();

            const data: FinalOrderSummaryData = {
              pickupAddress: currentAddress,
              pickupNeighborhood: "Centro, São Paulo - SP",
              dropoffAddress: destinationAddress || "Av. Paulista, 1000",
              dropoffNeighborhood: "Bela Vista, São Paulo - SP",
              vehicleType: "truck",
              servicePurposeLabel: "Frete",
              etaMinutes: 22,
              pricing: {
                base: 20,
                distanceKm: 4.2,
                distancePrice: 22.4,
                serviceFee: 4.5,
                total: 46.9,
              },
              paymentSummary: "Cartão",
              itemType: "Caixa pequena",
              helperIncluded: true,
              insuranceLevel: "basic",
            };
            setFinalSummaryData(data);
            (navigation as any).navigate("FinalOrderSummary", { data });
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />
        {/* Driver Found Sheet - Tela de Motorista Encontrado */}
        <DriverFoundSheet
          ref={driverFoundRef}
          onClose={() => {
            // Lógica ao fechar, talvez cancelar ou minimizar
            console.log("Fechou driver found sheet");
          }}
          onCall={() => {
            // Sim número do motorista mockado
            const phone = "+5511999999999";
            try {
              Linking.openURL(`tel:${phone}`);
            } catch (e) {
              console.log("Falha ao iniciar chamada", e);
            }
          }}
          onChat={() => {
            // Navegar para Chat
            (navigation as any).navigate("Chat", {
              driverName: "Carlos Silva",
            });
          }}
          onShare={async () => {
            try {
              const message = `Estou em uma corrida com ETA ~6 min. Motorista: Carlos Silva. Acompanhe pelo app.`;
              await Share.share({ message });
            } catch (e) {
              console.log("Falha ao compartilhar", e);
            }
          }}
          onCancel={() => {
            // Ir para tela de taxa de cancelamento
            const total = finalSummaryData?.pricing.total ?? 30.9;
            (navigation as any).navigate("CancelFee", { total });
            // mantém sheet fechada
            driverFoundRef.current?.close();
            setIsDriverFound(false);
          }}
          onDetails={() => {
            // Navegar para detalhes do pedido
            if (finalSummaryData) {
              (navigation as any).navigate("OrderDetails", {
                data: finalSummaryData,
              });
            } else {
              // fallback: construir dados mínimos
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
            }
          }}
        />

        {/* Resumo final agora é uma Screen dedicada; sheet não é mais renderizado aqui */}
      </View>
    </GestureHandlerRootView>
  );
}
