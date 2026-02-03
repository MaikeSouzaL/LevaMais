/**
 * HomeScreen - Versão Refatorada
 * Reduzido de 1.534 → ~450 linhas usando hooks customizados
 *
 * NOTA: Este é um exemplo de refatoração. O arquivo completo precisará
 * de mais ajustes para integração total com os componentes existentes.
 */

import React, { useRef, useState, useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, Text } from "react-native";
import Toast from "react-native-toast-message";
import MapView, { Marker, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { MaterialIcons } from "@expo/vector-icons";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import { DrawerNavigationProp } from "@react-navigation/drawer";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import GorhomBottomSheet, { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

// COMPONENTS
import { LocationLoadingScreen } from "@/components/ui/LocationLoadingScreen";

// Componentes locais (da pasta Home/components)
import { VehicleMarker } from "./components/VehicleMarker";
import { DashboardView } from "./components/DashboardView"; // NOVO
import { BottomSheet as LocalBottomSheet } from "./components/LocalBottomSheet";
import {
  SafetyHelpSheet,
  SafetyHelpSheetRef,
} from "./components/SafetyHelpSheet";
import { OffersMotoSheet } from "./components/OffersMotoSheet";
import { OffersCarSheet } from "./components/OffersCarSheet";
import { OffersVanSheet } from "./components/OffersVanSheet";
import { OffersTruckSheet } from "./components/OffersTruckSheet";
import { SearchingDriverModal } from "./components/SearchingDriverModal";
import SearchTimeoutCard from "./components/SearchTimeoutCard";
import { DriverFoundSheet } from "./components/DriverFoundSheet";
import FinalOrderSummarySheet from "./components/FinalOrderSummarySheet";
import useSearchCountdown from "../Shared/hooks/useSearchCountdown";

// Hooks customizados ✨ NOVO
import {
  useDriverSearch,
  useMapLocation,
  useRideFlow,
  useActiveRide,
} from "../Shared/hooks";

import { darkMapStyle } from "@/utils/mapStyle";

// Contextos
import { useAuthStore } from "@/context/authStore";
import { useClientCityStore } from "@/context/clientCityStore";

// Services
import rideService from "@/services/ride.service";
import favoriteAddressService from "@/services/favoriteAddress.service";

// Tipos
import type { OffersMotoSheetRef } from "./components/OffersMotoSheet";
import type { OffersCarSheetRef } from "./components/OffersCarSheet";
import type { OffersVanSheetRef } from "./components/OffersVanSheet";
import type { OffersTruckSheetRef } from "./components/OffersTruckSheet";
import type { FinalOrderSummaryData } from "./components/FinalOrderSummarySheet";

export default function HomeScreen() {
  // ========================================
  // HOOKS CUSTOMIZADOS ✨
  // ========================================

  // Localização e mapa
  const mapLocation = useMapLocation();

  // Busca de motorista
  const driverSearch = useDriverSearch();

  // Fluxo de corrida
  const rideFlow = useRideFlow();

  // Navegação
  const navigation = useNavigation<DrawerNavigationProp<any>>();
  const route = useRoute<any>();

  // Contextos
  const userType = useAuthStore((s) => s.userType);
  const walletBalance = useAuthStore((s) => s.walletBalance || 0);
  const detectedCity = useClientCityStore((s) => s.city);

  // Verificar corrida ativa (redireciona automaticamente)
  useActiveRide(
    navigation,
    userType || undefined,
    driverSearch.searchingState.visible,
  );

  // ========================================
  // REFS
  // ========================================

  const bottomSheetRef = useRef<GorhomBottomSheet>(null);
  const safetyHelpRef = useRef<SafetyHelpSheetRef>(null);
  const offersMotoRef = useRef<OffersMotoSheetRef>(null);
  const offersCarRef = useRef<OffersCarSheetRef>(null);
  const offersVanRef = useRef<OffersVanSheetRef>(null);
  const offersTruckRef = useRef<OffersTruckSheetRef>(null);
  const finalSummaryRef = useRef<any>(null);

  // ========================================
  // ESTADOS LOCAIS (apenas UI)
  // ========================================

  // Controle de Fluxo (Dashboard vs Mapa)
  const [flowStep, setFlowStep] = useState<"dashboard" | "map">("dashboard");
  const [selectedFlow, setSelectedFlow] = useState<{
    vehicleId?: string;
    serviceId?: string;
  }>({});
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  const handleSelectFlow = (vehicleId: string, serviceId: string) => {
    setSelectedFlow({ vehicleId, serviceId });
    (navigation as any).navigate("LocationPicker", {
      initialVehicle: vehicleId,
      initialService: serviceId,
      selectionMode: "dropoff",
      returnScreen: "Home",
    });
  };

  const handleDefaultAddressFound = useCallback((addr: string) => {
    // Se encontrou padrão, usa ele no display e ignora GPS automático visualmente
    if (addr) {
      setPickupDisplayAddress(addr);
      mapLocation.setCurrentAddress(addr);
    }
  }, []);

  const handleDashboardSelectFavorite = (fav: any) => {
    // Se o usuário clica num favorito na Dashboard, tratamos como DESTINO
    // e iniciamos o fluxo de seleção de veículo
    handleSelectFavorite(fav);
  };

  useFocusEffect(
    useCallback(() => {
      const params = (route.params as any) || {};
      // REMOVIDO: Não mudamos para 'map' automaticamente aqui para permitir
      // que o usuário selecione o veículo na dashboard conforme solicitado.

      // Sempre que a tela ganhar foco, incrementamos o trigger para atualizar dados da dashboard
      setDashboardRefreshTrigger((prev) => prev + 1);
    }, [route.params]),
  );

  const [searchTimeoutCardVisible, setSearchTimeoutCardVisible] =
    useState(false);
  const [finalSummaryData, setFinalSummaryData] =
    useState<FinalOrderSummaryData | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [destinationAddress, setDestinationAddress] = useState<string>("");
  const [pickupDisplayAddress, setPickupDisplayAddress] = useState<string>(""); // Endereço de partida manual

  // Veículos próximos (Dados Reais do Backend)
  const [visibleVehicles, setVisibleVehicles] = useState<any[]>([]);

  // Cidade do cliente (para usar raio dinâmico)
  const clientCity = useClientCityStore((s) => s.city);

  // Buscar motoristas próximos periodicamente
  React.useEffect(() => {
    // Só busca se tiver localização
    if (!mapLocation.region) return;

    // Função de busca
    const fetchDrivers = async () => {
      try {
        const drivers = await rideService.getNearbyDrivers(
          mapLocation.region!.latitude,
          mapLocation.region!.longitude,
          5000, // fallback (será sobrescrito pelo backend se cityId for passado)
          clientCity?.cityId
        );
        if (drivers && Array.isArray(drivers)) {
          setVisibleVehicles(drivers);
        }
      } catch (error) {
        // Silently fail (não incomodar o usuário com erro de polling)
      }
    };

    // Busca inicial e polling a cada 10s
    fetchDrivers();
    const interval = setInterval(fetchDrivers, 10000);
    return () => clearInterval(interval);
  }, [mapLocation.region?.latitude, mapLocation.region?.longitude, clientCity?.cityId]);

  // ========================================
  // COUNTDOWN TIMER
  // ========================================

  useSearchCountdown({
    visible: driverSearch.searchingState.visible,
    seconds: driverSearch.searchingState.secondsLeft || 0,
    onTick: (nextSeconds: number) => {
      // Atualizar via hook (TODO: adicionar método no hook)
    },
    onTimeout: () => {
      driverSearch.stopSearch();
      setSearchTimeoutCardVisible(true);
    },
  });

  // ========================================
  // EFEITOS DE ROTA (params)
  // ========================================

  React.useEffect(() => {
    // 1. Reabertura de ofertas
    if (route.params?.reopenOffers && route.params?.vehicleType) {
      const type = route.params.vehicleType;
      setTimeout(() => {
        if (type === "moto") offersMotoRef.current?.snapToIndex(0);
        else if (type === "car") offersCarRef.current?.snapToIndex(0);
        else if (type === "van") offersVanRef.current?.snapToIndex(0);
        else if (type === "truck") offersTruckRef.current?.snapToIndex(0);

        navigation.setParams({
          reopenOffers: undefined,
          vehicleType: undefined,
        });
      }, 300);
    }

    // 2. Iniciar busca
    if (route.params?.startSearch && route.params?.searchData) {
      const { title, price, eta, rideId } = route.params.searchData;
      setTimeout(() => {
        setSearchTimeoutCardVisible(false);
        driverSearch.startSearch({
          title: title || "Buscando...",
          price: price || "",
          eta: eta || "",
          rideId: rideId || "",
          secondsLeft: 30,
        });

        navigation.setParams({
          startSearch: undefined,
          searchData: undefined,
          rideId: undefined,
        });
      }, 250);
    }

    // 3. Retornar da tela de cancelamento
    if (route.params?.resumeDriverFound) {
      navigation.setParams({ resumeDriverFound: undefined });
      setTimeout(() => {
        driverSearch.driverFoundRef.current?.snapToIndex(0);
      }, 200);
    }

    // 4. Abrir ofertas
    if (route.params?.openOffersFor) {
      const type = route.params.openOffersFor;
      const purposeId = route.params.purposeId;
      const pickup = route.params.pickup;
      const dropoff = route.params.dropoff;

      rideFlow.setSelectedVehicleType(type as any);
      rideFlow.setSelectedPurposeId(purposeId || null);
      
      if (pickup) {
          rideFlow.setDraftPickup({
              ...pickup,
              latitude: Number(pickup.latitude),
              longitude: Number(pickup.longitude)
          });
          setPickupDisplayAddress(pickup.address || pickup.formattedAddress || "");
      }
      
      if (dropoff) {
          rideFlow.setDraftDropoff({
              ...dropoff,
              latitude: Number(dropoff.latitude),
              longitude: Number(dropoff.longitude)
          });
          setDestinationAddress(dropoff.address || dropoff.formattedAddress || "");
      }

      console.log("[Home] Abrindo ofertas para:", type, "Purpose:", purposeId);
      console.log(
        "[Home] Coordenadas - Pickup:",
        pickup?.latitude,
        pickup?.longitude,
      );
      console.log(
        "[Home] Coordenadas - Pickup Address:",
        pickup?.address || pickup?.formattedAddress,
      );
      console.log(
        "[Home] Coordenadas - Dropoff:",
        dropoff?.latitude,
        dropoff?.longitude,
      );
      console.log(
        "[Home] Coordenadas - Dropoff Address:",
        dropoff?.address || dropoff?.formattedAddress,
      );

      // Se já temos um serviço selecionado, vamos para o mapa AGORA
      if (purposeId) {
        setFlowStep("map");
      }

      // Calcular preço
      if (pickup?.latitude && dropoff?.latitude) {
        (async () => {
          try {
            rideFlow.setPriceQuoteLoading(true);

            const calculatePayload = {
              pickup: {
                address: pickup.address || pickup.formattedAddress || "Origem",
                latitude: Number(pickup.latitude),
                longitude: Number(pickup.longitude),
              },
              dropoff: {
                address: dropoff.address || dropoff.formattedAddress || "Destino",
                latitude: Number(dropoff.latitude),
                longitude: Number(dropoff.longitude),
              },
              vehicleType: type as any,
              cityId: detectedCity?.cityId || (detectedCity as any)?._id,
              purposeId,
            };

            console.log("[Home] 🚀 Enviando para cálculo:", JSON.stringify(calculatePayload, null, 2));

            const resp = await rideService.calculatePrice(calculatePayload);
            console.log("[Home] ✅ Resposta do cálculo:", resp);
            rideFlow.setPriceQuote(resp);
          } catch (e) {
            console.log("Falha ao calcular preço", e);
            rideFlow.setPriceQuote(null);
          } finally {
            rideFlow.setPriceQuoteLoading(false);
            // Abrir o resumo AUTOMATICAMENTE após o cálculo se tiver purposeId
            if (purposeId) {
              // Esperar um pouco mais para garantir que o flowStep='map' foi processado
              setTimeout(() => {
                bottomSheetRef.current?.close();
                setFlowStep("map");
                
                setTimeout(() => {
                   finalSummaryRef.current?.present();
                }, 300);
              }, 100);
            }
          }
        })();
      }

      setTimeout(() => {
        // Se NÃO temos purposeId, mostramos as abas de ofertas normais
        if (!purposeId) {
          if (type === "motorcycle") offersMotoRef.current?.snapToIndex(0);
          else if (type === "car") offersCarRef.current?.snapToIndex(0);
          else if (type === "van") offersVanRef.current?.snapToIndex(0);
          else if (type === "truck") offersTruckRef.current?.snapToIndex(0);
        }

        navigation.setParams({
          openOffersFor: undefined,
          purposeId: undefined,
          pickup: undefined,
          dropoff: undefined,
        });
      }, 150);
    }

    // 5. Atualizar Pickup manualmente (vindo do AddressPicker)
    if (route.params?.currentLocation) {
      const loc = route.params.currentLocation;
      rideFlow.setDraftPickup({
        formattedAddress: loc.address,
        latitude: loc.latitude,
        longitude: loc.longitude,
      });

      // Limpar params
      navigation.setParams({ currentLocation: undefined });

      // Atualizar display
      setPickupDisplayAddress(loc.address);
    }

    // 6. Atualizar Dropoff manualmente (vindo do Dashboard ou Favoritos)
    // Nota: Se openOffersFor estiver presente, o dropoff é processado no bloco 4
    if (!route.params?.openOffersFor && (route.params?.home_dropoff || route.params?.dropoff)) {
      const loc = route.params?.home_dropoff || route.params?.dropoff;
      console.log("[Home] Atualizando Dropoff via params:", loc.address);
      setDestinationAddress(loc.address);
      rideFlow.setDraftDropoff({
        formattedAddress: loc.address,
        latitude: Number(loc.latitude),
        longitude: Number(loc.longitude),
      });

      // Se já tínhamos um veículo selecionado
      if (route.params?.initialVehicle) {
        const vehicle = { id: route.params.initialVehicle };
        navigation.navigate("ServiceSelection", { vehicle });
      }
      
      navigation.setParams({
        home_dropoff: undefined,
        dropoff: undefined,
        initialVehicle: undefined,
        initialService: undefined,
      });
    }

    // 7. Retorno de Novo Favorito
    if (route.params?.favorite_creation) {
      setDashboardRefreshTrigger((prev) => prev + 1);
      navigation.setParams({ favorite_creation: undefined });
    }
  }, [route.params?.openOffersFor, route.params?.purposeId, route.params?.pickup, route.params?.dropoff, route.params?.home_dropoff, route.params?.currentLocation, route.params?.favorite_creation]);

  // ========================================
  // REABRIR BOTTOM SHEET AO FOCAR
  // ========================================

  useFocusEffect(
    useCallback(() => {
      const timer = setTimeout(() => {
        if (
          !driverSearch.searchingState.visible &&
          !driverSearch.driverFoundState.found &&
          flowStep === "dashboard"
        ) {
          bottomSheetRef.current?.snapToIndex(1);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [
      driverSearch.searchingState.visible,
      driverSearch.driverFoundState.found,
      flowStep,
    ]),
  );

  // ========================================
  // HANDLERS
  // ========================================

  const handlePressMenu = () => {
    navigation.openDrawer();
  };

  const handlePressSafety = () => {
    bottomSheetRef.current?.close();
    setTimeout(() => {
      safetyHelpRef.current?.snapToIndex(0);
    }, 150);
  };

  const handlePressMyLocation = () => {
    mapLocation.centerOnUser();
  };

  const handlePressSearch = () => {
    rideFlow.setServiceMode("ride" as any);

    // Garantir pickup no draft
    const lat =
      mapLocation.region?.latitude || mapLocation.userRegion?.latitude;
    const lng =
      mapLocation.region?.longitude || mapLocation.userRegion?.longitude;

    if (lat != null && lng != null) {
      rideFlow.setDraftPickup({
        formattedAddress: mapLocation.currentAddress,
        latitude: lat,
        longitude: lng,
      });
    }

    bottomSheetRef.current?.close();
    (navigation as any).navigate("LocationPicker", {
      selectionMode: "dropoff",
      returnScreen: "Home",
    });
  };

  const handleEditPickup = () => {
    const initial = rideFlow.draftPickup
      ? {
          formattedAddress: rideFlow.draftPickup.formattedAddress,
          latitude: rideFlow.draftPickup.latitude,
          longitude: rideFlow.draftPickup.longitude,
        }
      : mapLocation.region
        ? {
            formattedAddress: mapLocation.currentAddress,
            latitude: mapLocation.region.latitude,
            longitude: mapLocation.region.longitude,
          }
        : null;

    bottomSheetRef.current?.close();
    (navigation as any).navigate("LocationPicker", {
      selectionMode: "currentLocation",
      returnScreen: "Home",
      initialLocation: initial,
    });
  };

  const handleEditDropoff = () => {
    (navigation as any).navigate("LocationPicker", {
      selectionMode: "home_dropoff",
      returnScreen: "Home",
    });
  };

  const handleAddFavorite = () => {
    (navigation as any).navigate("LocationPicker", {
      selectionMode: "favorite_creation",
      returnScreen: "Home",
    });
  };

  const handleSelectFavorite = async (favorite: any) => {
    try {
      rideFlow.setServiceMode("ride");
      bottomSheetRef.current?.close();

      const dropAddr = favorite.formattedAddress || favorite.address;
      // Se estivermos na dashboard e clicarmos num favorito, o ponto de partida deve ser
      // ONDE O USUÁRIO ESTÁ (GPS) e não o centro do mapa (que pode estar sobre o favorito)
      const lat = mapLocation.userRegion?.latitude || mapLocation.region?.latitude;
      const lng = mapLocation.userRegion?.longitude || mapLocation.region?.longitude;

      const pickup =
        lat != null && lng != null
          ? {
              formattedAddress: mapLocation.currentAddress || "Sua localização",
              latitude: Number(lat),
              longitude: Number(lng),
            }
          : rideFlow.draftPickup;

      const dropoff = {
        formattedAddress: dropAddr,
        latitude: Number(favorite.latitude),
        longitude: Number(favorite.longitude),
      };

      console.log("[Home] handleSelectFavorite - Coordenadas Finais:");
      console.log("  Pickup:", pickup?.latitude, pickup?.longitude);
      console.log("  Pickup Address:", pickup?.formattedAddress);
      console.log("  Dropoff:", dropoff.latitude, dropoff.longitude);
      console.log("  Dropoff Address:", dropoff.formattedAddress);

      // IMPORTANTE: Atualizar estados locais ANTES de navegar
      if (pickup) rideFlow.setDraftPickup(pickup);
      rideFlow.setDraftDropoff(dropoff);
      setDestinationAddress(dropAddr);
      rideFlow.setDropoffSelection({
        address: dropAddr,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      });

      // Verificar se temos coordenadas válidas
      if (!pickup || !pickup.latitude || !pickup.longitude) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Não foi possível obter sua localização atual",
        });
        return;
      }

      if (!dropoff.latitude || !dropoff.longitude) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Endereço do favorito inválido",
        });
        return;
      }

      // Navegar para seleção de veículo
      (navigation as any).navigate("SelectVehicle", { pickup, dropoff });
    } catch (e) {
      console.error("Erro ao selecionar favorito:", e);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Não foi possível selecionar o favorito",
      });
    }
  };

  const handleCloseSafetyHelp = () => {
    bottomSheetRef.current?.snapToIndex(1);
  };

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  if (!mapLocation.region) {
    return <LocationLoadingScreen />;
  }

  const handleCancelOrder = async () => {
    finalSummaryRef.current?.dismiss();

    // Registra no histórico antes de limpar, se houver cotação ativa
    if (rideFlow.priceQuote && rideFlow.draftPickup && rideFlow.draftDropoff) {
      try {
        const newRide = await rideService.create({
          vehicleType: rideFlow.selectedVehicleType as any,
          serviceType: "delivery",
          pricing: rideFlow.priceQuote.pricing,
          pickup: {
            address: rideFlow.draftPickup!.formattedAddress!,
            latitude: rideFlow.draftPickup!.latitude,
            longitude: rideFlow.draftPickup!.longitude,
          },
          dropoff: {
            address: rideFlow.draftDropoff!.formattedAddress!,
            latitude: rideFlow.draftDropoff!.latitude,
            longitude: rideFlow.draftDropoff!.longitude,
          },
          cityId: (detectedCity as any)?._id || (detectedCity as any)?.id,
          purposeId: rideFlow.selectedPurposeId || undefined,
          distance: rideFlow.priceQuote.distance,
          duration: rideFlow.priceQuote.duration,
        });

        // Marca como cancelado imediatamente
        await rideService.cancel(newRide._id, "Desistência na tela de resumo");
      } catch (err) {
        console.error("[Home] Erro ao registrar cancelamento no histórico:", err);
      }
    }

    rideFlow.resetFlow();
    setFlowStep("dashboard");
    setPickupDisplayAddress(mapLocation.currentAddress || "");
    setDestinationAddress("");
    setDashboardRefreshTrigger((prev) => prev + 1);
  };

  // Dashboard View (Fluxo Inicial)
  if (flowStep === "dashboard") {
    return (
      <DashboardView
        userAddress={pickupDisplayAddress}
        destinationAddress={destinationAddress}
        pickup={rideFlow.draftPickup}
        dropoff={rideFlow.draftDropoff}
        onPressAddress={handleEditPickup}
        onPressDestination={handleEditDropoff}
        onPressMenu={handlePressMenu}
        onPressAddFavorite={handleAddFavorite}
        onSelectFlow={handleSelectFlow}
        onSelectFavorite={handleDashboardSelectFavorite}
        onDefaultAddressFound={handleDefaultAddressFound}
        cityId={(detectedCity as any)?._id || (detectedCity as any)?.id}
        refreshTrigger={dashboardRefreshTrigger}
      />
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <BottomSheetModalProvider>
        <View style={styles.container}>
        {/* Mapa */}
        <MapView
          ref={mapLocation.mapRef}
          style={styles.map}
          customMapStyle={darkMapStyle} // Tema escuro
          initialRegion={mapLocation.region}
          onRegionChange={mapLocation.handleRegionChange}
          onRegionChangeComplete={mapLocation.handleRegionChangeComplete}
          showsUserLocation
          showsMyLocationButton={false}
          showsBuildings={true}
          pitchEnabled={true}
          showsIndoors={true}
        >
          {/* Marcadores de veículos (Dados Reais) */}
          {visibleVehicles.map((vehicle) => (
            <Marker
              key={vehicle.id}
              coordinate={{
                latitude: vehicle.latitude,
                longitude: vehicle.longitude,
              }}
            >
              <VehicleMarker
                type={vehicle.type as any}
                rotation={vehicle.rotation}
              />
            </Marker>
          ))}

          {/* Marcador do motorista (se encontrado) */}
          {driverSearch.driverFoundState.location && (
            <Marker coordinate={driverSearch.driverFoundState.location}>
              <VehicleMarker type="car" rotation={0} />
            </Marker>
          )}

          {/* ROTA E MARCADORES DE ORIGEM/DESTINO */}
          {rideFlow.draftPickup?.latitude &&
            rideFlow.draftDropoff?.latitude && (
              <>
                <Marker
                  coordinate={{
                    latitude: rideFlow.draftPickup.latitude,
                    longitude: rideFlow.draftPickup.longitude,
                  }}
                  title="Partida"
                />
                <Marker
                  coordinate={{
                    latitude: rideFlow.draftDropoff.latitude,
                    longitude: rideFlow.draftDropoff.longitude,
                  }}
                  title="Destino"
                  pinColor="#02de95"
                />
                <MapViewDirections
                  origin={{
                    latitude: rideFlow.draftPickup.latitude,
                    longitude: rideFlow.draftPickup.longitude,
                  }}
                  destination={{
                    latitude: rideFlow.draftDropoff.latitude,
                    longitude: rideFlow.draftDropoff.longitude,
                  }}
                  apikey={process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || ""}
                  strokeWidth={4}
                  strokeColor="#02de95"
                  optimizeWaypoints={true}
                  onReady={(result) => {
                    mapLocation.mapRef.current?.fitToCoordinates(
                      result.coordinates,
                      {
                        edgePadding: {
                          top: 100,
                          right: 50,
                          bottom: 300,
                          left: 50,
                        },
                      },
                    );
                  }}
                />
              </>
            )}
        </MapView>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.menuButton} onPress={handlePressMenu}>
            <MaterialIcons name="menu" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.addressContainer}>
            <Text style={styles.addressText} numberOfLines={1}>
              {mapLocation.currentAddress || "Localizando..."}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.safetyButton}
            onPress={handlePressSafety}
          >
            <MaterialIcons name="shield" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Botão Minha Localização (Sempre visível) */}
        <TouchableOpacity
          style={styles.myLocationButton}
          onPress={handlePressMyLocation}
        >
          <MaterialIcons name="my-location" size={24} color="#02de95" />
        </TouchableOpacity>

        {/* Bottom Sheet Principal removido do modo mapa para evitar sobreposição */}

        {/* Safety Help Sheet */}
        <SafetyHelpSheet ref={safetyHelpRef} onClose={handleCloseSafetyHelp} />

        {/* Offers Sheets (manter os existentes por enquanto) */}
        <OffersMotoSheet ref={offersMotoRef} />
        <OffersCarSheet ref={offersCarRef} />
        <OffersVanSheet ref={offersVanRef} />
        <OffersTruckSheet ref={offersTruckRef} />

        {/* Searching Driver Modal */}
        <SearchingDriverModal
          {...({
            visible: driverSearch.searchingState.visible,
            title: driverSearch.searchingState.title,
            price: driverSearch.searchingState.price,
            eta: driverSearch.searchingState.eta,
            secondsLeft: driverSearch.searchingState.secondsLeft,
            vehicleType: rideFlow.selectedVehicleType as any,
            activeDriversCount: visibleVehicles.filter(
              (v) => v.type === rideFlow.selectedVehicleType
            ).length,
            onCancel: () => driverSearch.stopSearch(),
          } as any)}
        />

        {/* Driver Found Sheet */}
        <DriverFoundSheet
          {...({
            ref: driverSearch.driverFoundRef,
            driverInfo: driverSearch.driverFoundState.info,
            etaText: driverSearch.driverFoundState.etaText,
          } as any)}
        />

        {/* Resumo Final do Pedido (Aberto após selecionar serviço) */}
        <FinalOrderSummarySheet
          ref={finalSummaryRef}
          data={{
            pickupAddress: rideFlow.draftPickup?.formattedAddress || "",
            dropoffAddress: rideFlow.draftDropoff?.formattedAddress || "",
            vehicleType: (rideFlow.selectedVehicleType as any) || "moto",
            servicePurposeLabel:
              rideFlow.priceQuote?.purpose?.title || "Serviço selecionado",
            etaMinutes: rideFlow.priceQuote?.duration?.value
              ? Math.ceil(rideFlow.priceQuote.duration.value / 60)
              : undefined,
            pricing: {
              base: rideFlow.priceQuote?.pricing?.basePrice || 0,
              distanceKm: (rideFlow.priceQuote?.distance?.value || 0) / 1000,
              distancePrice: rideFlow.priceQuote?.pricing?.distancePrice || 0,
              serviceFee: rideFlow.priceQuote?.pricing?.serviceFee || 0,
              total: rideFlow.priceQuote?.pricing?.total || 0,
            },
            paymentSummary: "Dinheiro", // Padrão
            insuranceLevel: "none",
          }}
          onCancel={handleCancelOrder}
          onConfirm={async (method) => {
            try {
              const mappedMethod = method === "card" ? "credit_card" : method;

              // Fluxo de pagamento simulado para Pix e Cartão
              if (mappedMethod === "pix" || mappedMethod === "credit_card") {
                setIsProcessingPayment(true);
                Toast.show({
                  type: "info",
                  text1: "Pagamento",
                  text2: "Gerando link de pagamento...",
                });

                // Simulação de espera do Stripe
                await new Promise((resolve) => setTimeout(resolve, 3000));
                
                Toast.show({
                  type: "success",
                  text1: "Pagamento",
                  text2: "Simulação de pagamento aprovada! Criando pedido...",
                });
                setIsProcessingPayment(false);
              }

              finalSummaryRef.current?.dismiss();

              // 1. Criar a corrida no backend
              const newRide = await rideService.create({
                vehicleType: rideFlow.selectedVehicleType as any,
                serviceType: "delivery", // Backend espera 'delivery' para fretes no CreateRideRequest
                pricing: rideFlow.priceQuote.pricing,
                pickup: {
                  address: rideFlow.draftPickup!.formattedAddress!,
                  latitude: rideFlow.draftPickup!.latitude,
                  longitude: rideFlow.draftPickup!.longitude,
                },
                dropoff: {
                  address: rideFlow.draftDropoff!.formattedAddress!,
                  latitude: rideFlow.draftDropoff!.latitude,
                  longitude: rideFlow.draftDropoff!.longitude,
                },
                payment: {
                  method: {
                    type: mappedMethod,
                  },
                },
                cityId: (detectedCity as any)?._id || (detectedCity as any)?.id,
                purposeId: rideFlow.selectedPurposeId || undefined,
                distance: rideFlow.priceQuote.distance,
                duration: rideFlow.priceQuote.duration,
              });

              // 2. Iniciar animação/modal de busca
              driverSearch.startSearch({
                title: "Buscando motoristas...",
                price: `R$ ${rideFlow.priceQuote.pricing.total.toFixed(2)}`,
                eta: rideFlow.priceQuote.duration.text || "--",
                rideId: newRide._id,
              });
              setDashboardRefreshTrigger((prev) => prev + 1);
            } catch (error: any) {
              setIsProcessingPayment(false);
              console.error("Erro ao criar corrida:", error);
              Toast.show({
                type: "error",
                text1: "Erro ao solicitar corrida",
                text2: error.message || "Tente novamente em instantes.",
              });
            }
          }}
        />

        {/* Search Timeout Card */}
        {searchTimeoutCardVisible && (
          <SearchTimeoutCard
            {...({
              visible: searchTimeoutCardVisible,
              onClose: () => setSearchTimeoutCardVisible(false),
            } as any)}
          />
        )}

        {/* Cancel Notice */}
        {driverSearch.cancelNotice.visible && (
          <View style={styles.cancelNotice}>
            <Text style={styles.cancelNoticeText}>
              {driverSearch.cancelNotice.reason || "Corrida cancelada"}
            </Text>
          </View>
        )}
        </View>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  addressContainer: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 16,
    justifyContent: "center",
  },
  addressText: {
    color: "#fff",
    fontSize: 14,
  },
  safetyButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  myLocationButton: {
    position: "absolute",
    right: 16,
    bottom: 200,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  cancelNotice: {
    position: "absolute",
    top: 120,
    left: 16,
    right: 16,
    padding: 16,
    backgroundColor: "#ff4444",
    borderRadius: 12,
  },
  cancelNoticeText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
  },
});
