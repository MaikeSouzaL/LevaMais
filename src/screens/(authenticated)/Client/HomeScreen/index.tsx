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
import SearchTimeoutCard from "./components/SearchTimeoutCard";
import useSearchCountdown from "./useSearchCountdown";
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
    secondsLeft?: number;
  }>({ visible: false, title: "", price: "", eta: "", secondsLeft: undefined });

  const [searchTimeoutCardVisible, setSearchTimeoutCardVisible] =
    useState(false);

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

  // Card de cancelamento (estilo Uber/99)
  const [cancelNotice, setCancelNotice] = useState<{
    visible: boolean;
    reason?: string;
  }>({ visible: false });

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
  const userType = useAuthStore((s) => s.userType);

  const formatBRL = (value: number) => {
    // manter compatibilidade, mas preferir util
    return formatBRLUtil(value);
  };

  useSearchCountdown({
    visible: searchingModal.visible,
    seconds: searchingModal.secondsLeft || 0,
    onTick: function onTick(nextSeconds) {
      setSearchingModal(function update(prev) {
        if (!prev.visible) return prev;
        return { ...prev, secondsLeft: nextSeconds };
      });
    },
    onTimeout: function onTimeout() {
      setSearchingModal(function update(prev) {
        return { ...prev, visible: false };
      });
      setSearchTimeoutCardVisible(true);
    },
  });

  // Se o cliente já tiver corrida ativa, ir direto para a tela de acompanhamento
  useFocusEffect(
    useCallback(() => {
      if (userType !== "client") return;

      let cancelled = false;

      (async () => {
        try {
          const res = await rideService.getActive();
          if (cancelled) return;

          if (res?.active && res.ride?._id) {
            // Evita interromper o modal de busca (caso esteja no fluxo)
            if (searchingModal.visible) return;

            (navigation as any).navigate("RideTracking", {
              rideId: res.ride._id,
            });
          }
        } catch (e) {
          // silencioso: falha de rede não deve travar a Home
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [userType, searchingModal.visible]),
  );

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

        setSearchTimeoutCardVisible(false);

        setSearchingModal({
          visible: true,
          title: title || "Buscando...",
          price: price || "",
          eta: eta || "",
          rideId: paramRideId,
          secondsLeft: 30,
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

      // UX estilo Uber/99: mostrar imediatamente o sheet de "Motorista encontrado"
      // (com o tempo estimado) sem trocar de tela.
      setTimeout(() => {
        driverFoundRef.current?.snapToIndex(0);
      }, 150);
    };

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      setSearchingModal((prev) => ({ ...prev, visible: false }));
      setIsDriverFound(false);
      setDriverLatLng(null);
      setDriverInfo(null);
      setDriverEtaText(undefined);

      // Fechar o card/sheet atual (ex.: "chega em X") e mostrar aviso de cancelamento
      try {
        driverFoundRef.current?.close?.();
      } catch {}

      const cancelledBy = payload?.cancelledBy;
      const reason = payload?.reason;

      // Card no estilo Uber/99 (não some sozinho)
      if (cancelledBy === "driver") {
        setCancelNotice({
          visible: true,
          reason: reason ? String(reason) : undefined,
        });
      }

      // Toast como complemento (não substitui o card)
      try {
        const Toast = require("react-native-toast-message").default;
        Toast.show({
          type: "error",
          text1:
            cancelledBy === "driver"
              ? "O motorista cancelou"
              : "Corrida cancelada",
          text2: reason ? String(reason) : "Tente novamente.",
        });
      } catch {}
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

  // Listener global da corrida atual (realtime), mesmo quando não está mais "procurando"
  // Ex.: motorista aceitou e depois cancelou -> cliente precisa ver na hora.
  useEffect(() => {
    let mounted = true;

    const rideId = currentRideId || undefined;
    if (!rideId) return;

    const onRideCancelled = (payload: any) => {
      if (!mounted) return;
      if (payload?.rideId && payload.rideId !== rideId) return;

      // limpar UI de corrida/driver
      setSearchingModal((prev) => ({ ...prev, visible: false }));
      setIsDriverFound(false);
      setDriverLatLng(null);
      setDriverInfo(null);
      setDriverEtaText(undefined);

      try {
        driverFoundRef.current?.close?.();
      } catch {}

      const cancelledBy = payload?.cancelledBy;
      const reason = payload?.reason;

      // Card estilo Uber/99 (motivo)
      if (cancelledBy === "driver") {
        setCancelNotice({
          visible: true,
          reason: reason ? String(reason) : undefined,
        });
        setTimeout(() => {
          setCancelNotice({ visible: false });
        }, 6000);
      }

      // Toast complementar
      try {
        const Toast = require("react-native-toast-message").default;
        Toast.show({
          type: "error",
          text1:
            cancelledBy === "driver"
              ? "O motorista cancelou"
              : "Corrida cancelada",
          text2: reason ? String(reason) : "Tente novamente.",
        });
      } catch {}
    };

    (async () => {
      try {
        await webSocketService.connect();
        webSocketService.onRideCancelled(onRideCancelled);
      } catch {}
    })();

    return () => {
      mounted = false;
      webSocketService.off("ride-cancelled", onRideCancelled);
    };
  }, [currentRideId]);

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
    // Navega para a tela LocationPicker (agora é a tela unificada)
    (navigation as any).navigate("LocationPicker");
  };

  const handleSelectFavorite = async (favorite: any) => {
    try {
      setServiceMode("ride");
      bottomSheetRef.current?.close();

      const dropAddr = favorite.formattedAddress || favorite.address;
      setDestinationAddress(dropAddr);
      setDropoffSelection({
        address: dropAddr,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      });

      // pickup: usa o endereço atual (já exibido na Home)
      const pickup = {
        address: currentAddress,
        latitude:
          pickupSelection?.latitude ||
          userRegion?.latitude ||
          region?.latitude ||
          undefined,
        longitude:
          pickupSelection?.longitude ||
          userRegion?.longitude ||
          region?.longitude ||
          undefined,
      };

      const dropoff = {
        address: dropAddr,
        latitude: favorite.latitude,
        longitude: favorite.longitude,
      };

      (navigation as any).navigate("SelectVehicle", { pickup, dropoff });
    } catch (e) {
      console.error("Erro ao selecionar favorito:", e);
    }
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

  // Removido: handleSelectVehicle (seleção ocorre na SelectVehicleScreen)
  // Removido: handlePressRide e handlePressDelivery (serviço selecionado via LocationPicker)


  const handleConfirmMotoOffer = (offerId: string, paymentMethod?: string) => {
    console.log("Moto offer confirmed:", offerId, paymentMethod);
    offersMotoRef.current?.close();

    let paymentRaw: "credit_card" | "pix" | "cash" = "credit_card";
    let paymentText = "Visa final 4242";

    if (paymentMethod === "dinheiro") {
      paymentRaw = "cash";
      paymentText = "Dinheiro";
    } else if (paymentMethod === "pix") {
      paymentRaw = "pix";
      paymentText = "Pix";
    }

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
      paymentSummary: paymentText,
      paymentMethodRaw: paymentRaw,
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
            onSelectFavorite={handleSelectFavorite as any}
            onPressSeeAll={() => {
              const pickup = {
                address: currentAddress,
                latitude:
                  pickupSelection?.latitude ||
                  userRegion?.latitude ||
                  region?.latitude ||
                  undefined,
                longitude:
                  pickupSelection?.longitude ||
                  userRegion?.longitude ||
                  region?.longitude ||
                  undefined,
              };
              bottomSheetRef.current?.close();
              (navigation as any).navigate("Favorites", { pickup });
            }}
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
          secondsLeft={searchingModal.secondsLeft}
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

        {/* Card de cancelamento (estilo Uber/99) */}
        {cancelNotice.visible && (
          <View
            style={{
              position: "absolute",
              left: 16,
              right: 16,
              bottom: 18,
              backgroundColor: "rgba(17,24,22,0.96)",
              borderRadius: 22,
              padding: 18,
              borderWidth: 1,
              borderColor: "rgba(239,68,68,0.32)",
              shadowColor: "#000",
              shadowOpacity: 0.5,
              shadowRadius: 22,
              shadowOffset: { width: 0, height: 12 },
              elevation: 16,
              minHeight: 210,
            }}
          >
            {/* Header */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: "rgba(239,68,68,0.18)",
                  borderWidth: 1,
                  borderColor: "rgba(239,68,68,0.28)",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MaterialIcons name="error-outline" size={22} color="#ef4444" />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                  Corrida cancelada
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  O motorista cancelou esta solicitação
                </Text>
              </View>
            </View>

            {/* Body */}
            <View
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.78)", lineHeight: 19 }}>
                {cancelNotice.reason || "Motivo não informado."}
              </Text>
            </View>

            {/* Actions */}
            <View style={{ flexDirection: "row", gap: 10, marginTop: 14 }}>
              <TouchableOpacity
                onPress={() => setCancelNotice({ visible: false })}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: "rgba(255,255,255,0.08)",
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.10)",
                }}
                activeOpacity={0.85}
              >
                <Text style={{ color: "#fff", fontWeight: "900" }}>Fechar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setCancelNotice({ visible: false });
                  // Opcional: você pode reabrir o bottom sheet principal aqui
                  try {
                    bottomSheetRef.current?.snapToIndex(1);
                  } catch {}
                }}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  borderRadius: 999,
                  backgroundColor: "#ef4444",
                  alignItems: "center",
                }}
                activeOpacity={0.9}
              >
                <Text style={{ color: "#111816", fontWeight: "900" }}>
                  Solicitar outra
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Card de timeout (sem motorista) */}
        <SearchTimeoutCard
          visible={searchTimeoutCardVisible}
          onClose={() => setSearchTimeoutCardVisible(false)}
          onRetry={() => {
            setSearchTimeoutCardVisible(false);
            // reabrir modal de busca com o mesmo rideId (se existir)
            setSearchingModal((prev) => ({
              ...prev,
              visible: true,
              secondsLeft: 30,
            }));
          }}
        />

        {/* Resumo final agora é uma Screen dedicada; sheet não é mais renderizado aqui */}
      </View>
    </GestureHandlerRootView>
  );
}
