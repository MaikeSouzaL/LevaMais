import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import MapView, { Marker } from "react-native-maps";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
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
import { ServicePurposeScreen } from "./components/ServicePurposeScreen";
import type { SelectVehicleSheetRef } from "./components/SelectVehicleSheet";
import { SearchingDriverModal } from "./components/SearchingDriverModal";
import { OffersVanSheet } from "./components/OffersVanSheet";
import type { OffersVanSheetRef } from "./components/OffersVanSheet";
import { OffersTruckSheet } from "./components/OffersTruckSheet";
import FinalOrderSummarySheet, {
  FinalOrderSummaryData,
} from "./components/FinalOrderSummarySheet";
import type { OffersTruckSheetRef } from "./components/OffersTruckSheet";
import GlobalMap from "../../../../components/GlobalMap";
import {
  getCurrentLocation,
  getCurrentLocationAndAddress,
} from "../../../../utils/location";

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

// Estilo do mapa escuro (dark mode)
const darkMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#101816" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#746855" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#101816" }],
  },
  {
    featureType: "administrative",
    elementType: "geometry",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5a3" }],
  },
  {
    featureType: "poi",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#1b2823" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#16201d" }],
  },
  {
    featureType: "road",
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#1f2d29" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#23332d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2d29" }],
  },
  {
    featureType: "transit",
    stylers: [{ visibility: "off" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a1410" }],
  },
];

export default function HomeScreen() {
  const mapRef = useRef<MapView>(null);
  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const locationPickerRef = useRef<GorhomBottomSheet>(null);
  const safetyHelpRef = useRef<SafetyHelpSheetRef>(null);
  const selectVehicleRef = useRef<SelectVehicleSheetRef>(null);
  const offersMotoRef = useRef<OffersMotoSheetRef>(null);
  const offersCarRef = useRef<OffersCarSheetRef>(null);
  const offersVanRef = useRef<OffersVanSheetRef>(null);
  const offersTruckRef = useRef<OffersTruckSheetRef>(null);
  const finalSummaryRef = useRef<any>(null);
  const [showPurposeScreen, setShowPurposeScreen] = useState(false);
  const [searchingModal, setSearchingModal] = useState<{
    visible: boolean;
    title: string;
    price: string;
    eta: string;
  }>({ visible: false, title: "", price: "", eta: "" });
  const [selectedVehicleType, setSelectedVehicleType] = useState<
    "motorcycle" | "car" | "van" | "truck" | null
  >(null);
  const [finalSummaryData, setFinalSummaryData] =
    useState<FinalOrderSummaryData | null>(null);
  const navigation = useNavigation<DrawerNavigationProp<any>>();

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

  const handleRegionChangeComplete = (r: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }) => {
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
    // Fecha o BottomSheet principal
    bottomSheetRef.current?.close();
    // Abre o LocationPickerSheet
    locationPickerRef.current?.snapToIndex(0);
  };

  const handleSelectLocation = (location: string) => {
    console.log("Selected location:", location);
    // TODO: Atualizar localização selecionada
    locationPickerRef.current?.close();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleCloseLocationPicker = () => {
    console.log("Closed location picker");
    // Reabre o BottomSheet principal
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleCloseSafetyHelp = () => {
    console.log("Closed safety help");
    // Reabre o BottomSheet principal
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handlePressRide = () => {
    console.log("Pressed ride service");
  };

  const handlePressDelivery = () => {
    console.log("Pressed delivery service - open vehicle select");
    // Fecha outros sheets
    locationPickerRef.current?.close();
    bottomSheetRef.current?.close();
    // Abre o seletor de veículo
    selectVehicleRef.current?.snapToIndex(0);
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
      setTimeout(() => setShowPurposeScreen(true), 150);
      return;
    }
    // Demais tipos ainda não implementados: apenas fecha e volta ao principal
    selectVehicleRef.current?.close();
    bottomSheetRef.current?.snapToIndex(1);
  };

  const handleConfirmMotoOffer = (offerId: string) => {
    console.log("Moto offer confirmed:", offerId);
    offersMotoRef.current?.close();
    setSearchingModal({
      visible: true,
      title: "Leva+ Moto",
      price: "R$ 15,90",
      eta: "Chegada em ~5 min",
    });
    // Simula encontrar um motorista e abre o resumo final
    setTimeout(() => {
      setSearchingModal((s) => ({ ...s, visible: false }));
      const data: FinalOrderSummaryData = {
        pickupAddress: currentAddress,
        pickupNeighborhood: "Centro, São Paulo - SP",
        dropoffAddress: "Av. Paulista, 1000",
        dropoffNeighborhood: "Bela Vista, São Paulo - SP",
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
    }, 10000);
  };

  const handleBackFromOffers = () => {
    // Fecha listas de ofertas e volta para a tela de escolha de finalidade
    offersMotoRef.current?.close();
    offersCarRef.current?.close();
    offersVanRef.current?.close?.();
    offersTruckRef.current?.close?.();
    setTimeout(() => setShowPurposeScreen(true), 150);
  };

  const handleSelectPurpose = (purposeId: string) => {
    console.log("Purpose selected:", purposeId);
    setShowPurposeScreen(false);
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
    setShowPurposeScreen(false);
    bottomSheetRef.current?.snapToIndex(1);
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

          {/* Botão More Options (3 pontos) - canto superior direito */}
          <View className="absolute top-14 right-4 z-20">
            <TouchableOpacity
              onPress={handlePressMoreOptions}
              className="w-12 h-12 rounded-full bg-surface-dark/90 border border-white/10 items-center justify-center shadow-2xl"
              activeOpacity={0.8}
            >
              <MaterialIcons name="more-vert" size={24} color="#02de95" />
            </TouchableOpacity>
          </View>

          {/* Botões de Ação - mais abaixo na direita */}
          <View className="absolute top-44 right-4 z-20 flex-col gap-3">
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
        <BottomSheet
          ref={bottomSheetRef}
          onPressSearch={handlePressSearch}
          onPressRide={handlePressRide}
          onPressDelivery={handlePressDelivery}
        />

        {/* Location Picker Sheet - Seleção de Endereço */}
        <LocationPickerSheet
          ref={locationPickerRef}
          onClose={handleCloseLocationPicker}
          onSelectLocation={handleSelectLocation}
          currentLocation={currentAddress}
          currentAddress={currentAddress}
        />

        {/* Select Vehicle Sheet - Tipo de serviço */}
        <SelectVehicleSheet
          ref={selectVehicleRef}
          onSelect={handleSelectVehicle}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
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
            setSearchingModal({
              visible: true,
              title: "Leva+ Carro",
              price: "R$ 19,90",
              eta: "Chegada em ~7 min",
            });
            setTimeout(() => {
              setSearchingModal((s) => ({ ...s, visible: false }));
              const data: FinalOrderSummaryData = {
                pickupAddress: currentAddress,
                pickupNeighborhood: "Centro, São Paulo - SP",
                dropoffAddress: "Av. Paulista, 1000",
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
            }, 10000);
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />

        {/* Safety Help Sheet - Ajuda e Segurança */}
        <SafetyHelpSheet ref={safetyHelpRef} onClose={handleCloseSafetyHelp} />

        {/* Service Purpose Screen - Tela de seleção de finalidade do serviço */}
        {showPurposeScreen && selectedVehicleType && (
          <ServicePurposeScreen
            vehicleType={selectedVehicleType as any}
            onClose={handleClosePurpose}
            onSelect={handleSelectPurpose}
          />
        )}

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
            setSearchingModal({
              visible: true,
              title: "Leva+ Van",
              price: "R$ 30,90",
              eta: "Chegada em ~10 min",
            });
            setTimeout(() => {
              setSearchingModal((s) => ({ ...s, visible: false }));
              const data: FinalOrderSummaryData = {
                pickupAddress: currentAddress,
                pickupNeighborhood: "Centro, São Paulo - SP",
                dropoffAddress: "Av. Paulista, 1000",
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
            }, 10000);
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
            setSearchingModal({
              visible: true,
              title: "Leva+ Caminhão",
              price: "R$ 46,90",
              eta: "Chegada em ~15 min",
            });
            setTimeout(() => {
              setSearchingModal((s) => ({ ...s, visible: false }));
              const data: FinalOrderSummaryData = {
                pickupAddress: currentAddress,
                pickupNeighborhood: "Centro, São Paulo - SP",
                dropoffAddress: "Av. Paulista, 1000",
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
            }, 10000);
          }}
          onClose={() => bottomSheetRef.current?.snapToIndex(1)}
          onBack={handleBackFromOffers}
        />
        {/* Resumo final agora é uma Screen dedicada; sheet não é mais renderizado aqui */}
      </View>
    </GestureHandlerRootView>
  );
}
