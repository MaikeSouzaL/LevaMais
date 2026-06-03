import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  LayoutAnimation,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
  KeyboardAvoidingView,
} from "react-native";
import Toast from "react-native-toast-message";
import { CommonActions, NavigationProp, RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowDownUp,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Info,
  KeyRound,
  Locate,
  Package,
  Pill,
  Plus,
  Shirt,
  ShieldCheck,
  Smartphone,
  Soup,
  SquareStack,
  User,
  Wallet,
  X,
  Sparkles,
  CreditCard,
  QrCode,
} from "lucide-react-native";

import { ClientStackParamList, DeliveryAddressProfile, DeliveryVehicleType } from "../../../types/navigation";
import rideService, { CalculatePriceResponse, CreateRideRequest } from "@/services/ride.service";
import paymentService from "@/services/payment.service";
import { PaymentMethodsSheet, type PaymentMethod } from "@/components/payment/PaymentMethodsSheet";

/**
 * Converte string de data em português para ISO 8601
 * Suporta: "Hoje, às 14:30", "Amanhã, às 08:30", "26/05, às 14:30"
 */
function parseScheduleToISO(scheduleStr: string | null): string | null {
  if (!scheduleStr) return null;

  try {
    const now = new Date();
    let targetDate: Date;

    // Extrair hora e minuto (formato: "às HH:MM")
    const timeMatch = scheduleStr.match(/às\s+(\d{1,2}):(\d{2})/);
    if (!timeMatch) return null;

    const hour = parseInt(timeMatch[1], 10);
    const minute = parseInt(timeMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

    // Determinar o dia
    if (scheduleStr.toLowerCase().startsWith("hoje")) {
      targetDate = new Date(now);
    } else if (scheduleStr.toLowerCase().startsWith("amanhã")) {
      targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + 1);
    } else {
      // Formato: "DD/MM" ou "DD/MM/YY"
      const dateMatch = scheduleStr.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/);
      if (dateMatch) {
        const day = parseInt(dateMatch[1], 10);
        const month = parseInt(dateMatch[2], 10) - 1; // Month é 0-indexed
        let year = dateMatch[3] ? parseInt(dateMatch[3], 10) : now.getFullYear();

        // Se ano tem 2 dígitos, adicionar 2000
        if (year < 100) year += 2000;

        targetDate = new Date(year, month, day);

        // Validar se a data é válida
        if (targetDate.getDate() !== day || targetDate.getMonth() !== month) {
          return null;
        }
      } else {
        return null;
      }
    }

    // Aplicar hora e minuto
    targetDate.setHours(hour, minute, 0, 0);

    // Verificar se a data é no futuro
    if (targetDate <= now) {
      return null;
    }

    return targetDate.toISOString();
  } catch (error) {
    console.error("Erro ao parsear data de agendamento:", error);
    return null;
  }
}

/**
 * Formata ISO 8601 para exibição em português
 */
function formatScheduleDisplay(isoStr: string | null): string {
  if (!isoStr) return "Partida imediata";

  try {
    const date = new Date(isoStr);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const timeStr = date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Hoje, às ${timeStr}`;
    } else if (isTomorrow) {
      return `Amanhã, às ${timeStr}`;
    } else {
      const day = String(date.getDate()).padStart(2, "0");
      const month = String(date.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}, às ${timeStr}`;
    }
  } catch (error) {
    return "Data inválida";
  }
}
import { GlobalMap } from "@/components/GlobalMap";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import RoutePin from "@/components/maps/RoutePin";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ItemTypeId = "personal" | "food" | "clothing" | "electronics" | "documents" | "keys" | "medicine" | "other";

const vehicleImages: Record<DeliveryVehicleType, ImageSourcePropType> = {
  motorcycle: require("../../../../../../assets/Logo/leva_moto.png"),
  car: require("../../../../../../assets/Logo/leva-carro.png"),
  van: require("../../../../../../assets/Logo/leva_van.png"),
  truck: require("../../../../../../assets/Logo/leva_bau.png"),
};

const vehicleCopy: Record<DeliveryVehicleType, { title: string; subtitle: string; details: string; price: string }> = {
  motorcycle: {
    title: "Entrega Moto",
    subtitle: "Entregas rápidas",
    details: "40×34×36cm • 10kg",
    price: "R$16,80",
  },
  car: {
    title: "Entrega Carro",
    subtitle: "Pacotes médios",
    details: "Itens médios • porta-malas",
    price: "R$16,80",
  },
  van: {
    title: "Entrega Van",
    subtitle: "Volumes maiores",
    details: "Cargas maiores • van",
    price: "R$16,80",
  },
  truck: {
    title: "Entrega Truck",
    subtitle: "Cargas grandes",
    details: "Carga pesada • caminhão",
    price: "R$16,80",
  },
};

const itemTypes: Array<{ id: ItemTypeId; label: string; icon: React.ComponentType<any> }> = [
  { id: "personal", label: "Itens pessoais", icon: User },
  { id: "food", label: "Alimentação", icon: Soup },
  { id: "clothing", label: "Vestuário", icon: Shirt },
  { id: "electronics", label: "Eletrônicos", icon: Smartphone },
  { id: "documents", label: "Documentos", icon: Package },
  { id: "keys", label: "Chaves", icon: KeyRound },
  { id: "medicine", label: "Medicamentos", icon: Pill },
  { id: "other", label: "Outros", icon: SquareStack },
];

const deliveryVehicles: DeliveryVehicleType[] = ["motorcycle", "car", "van", "truck"];

const formatBRL = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";

export default function DeliveryDetailsScreen() {
  const navigation = useNavigation<NavigationProp<ClientStackParamList>>();
  const route = useRoute<RouteProp<ClientStackParamList, "DeliveryDetails">>();
  const insets = useSafeAreaInsets();
  const { pickupProfile, dropoffProfile, vehicleType } = route.params;
  const [selectedVehicleType, setSelectedVehicleType] = useState<DeliveryVehicleType>(vehicleType);
  const [routeProfiles, setRouteProfiles] = useState<{
    pickupProfile: DeliveryAddressProfile;
    dropoffProfile: DeliveryAddressProfile;
  }>({ pickupProfile, dropoffProfile });
  const [usePickupPin, setUsePickupPin] = useState(true);
  const [useDropoffPin, setUseDropoffPin] = useState(true);
  const [showItemDetails, setShowItemDetails] = useState(false);
  const [selectedItemType, setSelectedItemType] = useState<ItemTypeId | null>(null);
  const [customItemType, setCustomItemType] = useState("");
  const [itemValue, setItemValue] = useState("");
  const [itemNotes, setItemNotes] = useState("");
  const [savedItemSummary, setSavedItemSummary] = useState<string | null>(null);
  const [showVehicleSelector, setShowVehicleSelector] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [showDepositPix, setShowDepositPix] = useState(false);
  const [showVerificationBenefits, setShowVerificationBenefits] = useState(false);
  const [showExitReason, setShowExitReason] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [exitReason, setExitReason] = useState<string | null>(null);
  const [priceData, setPriceData] = useState<CalculatePriceResponse | null>(null);
  const [loadingPricing, setLoadingPricing] = useState(false);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<Array<{ latitude: number; longitude: number }>>([]);
  const [animatedVehicleCoord, setAnimatedVehicleCoord] = useState<{ latitude: number; longitude: number } | null>(null);
  const routeCoordsRef = useRef<Array<{ latitude: number; longitude: number }>>([]);

  const [stops, setStops] = useState<DeliveryAddressProfile[]>(route.params?.stops || []);
  const [scheduledFor, setScheduledFor] = useState<string | null>(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [isCustomSchedule, setIsCustomSchedule] = useState(false);
  const [customDay, setCustomDay] = useState("");
  const [customHour, setCustomHour] = useState("");
  const [customMin, setCustomMin] = useState("");
  const [customOfferAdjustment, setCustomOfferAdjustment] = useState<number>(0);
  const [showCustomOfferInput, setShowCustomOfferInput] = useState(false);
  const [customOfferText, setCustomOfferText] = useState("");
  const [vehicleRotation, setVehicleRotation] = useState<number>(0);

  // PIX Deposit states
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [depositLoading, setDepositLoading] = useState(false);
  const [pixDepositData, setPixDepositData] = useState<any>(null);

  // Identity verification states
  const [verificationLoading, setVerificationLoading] = useState(false);

  // Feedback states
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Credit card states
  const [showAddCard, setShowAddCard] = useState(false);
  const [cardLoading, setCardLoading] = useState(false);

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const y = Math.sin(dLng) * Math.cos(lat2 * (Math.PI / 180));
    const x =
      Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
      Math.sin(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.cos(dLng);
    const brng = Math.atan2(y, x) * (180 / Math.PI);
    return (brng + 360) % 360;
  };


  const handleRemoveStop = (index: number) => {
    setStops((prev) => prev.filter((_, i) => i !== index));
    setRouteCoords([]);
    setAnimatedVehicleCoord(null);
  };

  // PIX Deposit Handler
  const handlePixDeposit = async (amount: number) => {
    try {
      setDepositLoading(true);
      const deposit = await paymentService.createPixDeposit(amount);
      setPixDepositData(deposit);
      Toast.show({
        type: "success",
        text1: "QR Code PIX gerado!",
        text2: "Escaneie com seu banco para completar o depósito",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao gerar depósito PIX",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setDepositLoading(false);
    }
  };

  // Identity Verification Handler
  const handleVerification = async () => {
    try {
      setVerificationLoading(true);
      const verification = await paymentService.submitVerification({
        documentType: "cnh",
        documentFront: "placeholder_front",
        documentBack: "placeholder_back",
        selfie: "placeholder_selfie",
      });
      Toast.show({
        type: "success",
        text1: "Verificação enviada!",
        text2: `Análise em ${verification.estimatedReviewTime}`,
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao enviar verificação",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setVerificationLoading(false);
    }
  };

  // Exit Feedback Handler
  const handleExitFeedback = async (reason: string, category: string = "general", details: string = "") => {
    try {
      setFeedbackLoading(true);
      await paymentService.submitExitFeedback({ reason, category, details });
      Toast.show({
        type: "info",
        text1: "Feedback enviado",
        text2: "Obrigado por compartilhar sua opinião",
      });
      setShowExitReason(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao enviar feedback",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Add Credit Card Handler
  const handleAddCard = async (cardData: {
    cardNumber: string;
    holderName: string;
    expiry: string;
    cvv: string;
  }) => {
    try {
      setCardLoading(true);
      const [expiryMonth, expiryYear] = cardData.expiry.split("/").map(Number);
      await paymentService.addCard({
        ...cardData,
        expiryMonth,
        expiryYear: expiryYear < 100 ? 2000 + expiryYear : expiryYear,
      });
      Toast.show({
        type: "success",
        text1: "Cartão adicionado!",
        text2: "Seu cartão foi salvo com sucesso",
      });
      setShowAddCard(false);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao adicionar cartão",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setCardLoading(false);
    }
  };

  const onDirectionsReady = (res: any) => {
    const coords = res.coordinates;
    setRouteCoords(coords);
    routeCoordsRef.current = coords;

    mapRef.current?.fitToCoordinates(coords, {
      edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
      animated: true,
    });
  };

  const handleRecenterRoute = () => {
    if (routeCoordsRef.current.length > 0) {
      mapRef.current?.fitToCoordinates(routeCoordsRef.current, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    }
  };

  useEffect(() => {
    if (routeCoords.length === 0) return;
    
    let index = 0;
    setAnimatedVehicleCoord(routeCoords[0]);
    
    const interval = setInterval(() => {
      if (routeCoordsRef.current.length < 2) return;
      const nextIndex = (index + 1) % routeCoordsRef.current.length;
      const p1 = routeCoordsRef.current[index];
      const p2 = routeCoordsRef.current[nextIndex];
      
      // Comentado para evitar que o ícone da motinha fique girando descontroladamente no mapa
      // const bearing = calculateBearing(p1.latitude, p1.longitude, p2.latitude, p2.longitude);
      // setVehicleRotation(bearing);
      setAnimatedVehicleCoord(p2);
      
      index = nextIndex;
    }, 150);
    
    return () => clearInterval(interval);
  }, [routeCoords]);

  const swapRotation = useRef(new Animated.Value(0)).current;

  const vehicle = useMemo(() => vehicleCopy[selectedVehicleType] || vehicleCopy.motorcycle, [selectedVehicleType]);
  const total = priceData?.pricing?.total ? formatBRL(priceData.pricing.total + customOfferAdjustment) : vehicle.price;
  const topInset = Math.max(insets.top, 18);
  const animatedSwapStyle = {
    transform: [
      {
        rotate: swapRotation.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", "180deg"],
        }),
      },
    ],
  };

  const selectedItemLabel = itemTypes.find((item) => item.id === selectedItemType)?.label;

  useEffect(() => {
    let mounted = true;

    const calculatePrice = async () => {
      const pickup = routeProfiles.pickupProfile.addressCoords;
      const dropoff = routeProfiles.dropoffProfile.addressCoords;
      if (!pickup || !dropoff) {
        setPriceData(null);
        setPricingError("Coordenadas incompletas para calcular a entrega.");
        return;
      }

      try {
        setLoadingPricing(true);
        setPricingError(null);
        const response = await rideService.calculatePrice({
          serviceType: "delivery",
          vehicleType: selectedVehicleType,
          pickup: {
            address: routeProfiles.pickupProfile.address,
            latitude: pickup.latitude,
            longitude: pickup.longitude,
          },
          dropoff: {
            address: routeProfiles.dropoffProfile.address,
            latitude: dropoff.latitude,
            longitude: dropoff.longitude,
          },
          stops: stops.map((s) => ({
            address: s.address,
            latitude: s.addressCoords?.latitude || 0,
            longitude: s.addressCoords?.longitude || 0,
          })),
          deliveryType: selectedItemType || "standard",
        });
        if (mounted) {
          setPriceData(response);
        }
      } catch (error: any) {
        if (mounted) {
          setPriceData(null);
          setPricingError(error?.message || "Falha ao calcular a entrega.");
        }
      } finally {
        if (mounted) {
          setLoadingPricing(false);
        }
      }
    };

    calculatePrice();

    return () => {
      mounted = false;
    };
  }, [
    routeProfiles.pickupProfile.address,
    routeProfiles.pickupProfile.addressCoords,
    routeProfiles.dropoffProfile.address,
    routeProfiles.dropoffProfile.addressCoords,
    selectedVehicleType,
    selectedItemType,
    stops,
  ]);

  const handleBackHome = () => {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "Home" }],
      }),
    );
  };

  const handleConfirm = async () => {
    if (submitting) return;
    const pickupCoords = routeProfiles.pickupProfile.addressCoords;
    const dropoffCoords = routeProfiles.dropoffProfile.addressCoords;
    if (!pickupCoords || !dropoffCoords) {
      Toast.show({ type: "error", text1: "Enderecos incompletos", text2: "Selecione coleta e entrega com localizacao valida." });
      return;
    }
    if (!priceData?.pricing || !priceData?.distance || !priceData?.duration) {
      Toast.show({ type: "error", text1: "Preco indisponivel", text2: "Aguarde o calculo da entrega antes de confirmar." });
      return;
    }

    const pickupPin = usePickupPin ? String(Math.floor(1000 + Math.random() * 9000)) : undefined;
    let deliveryPin = undefined;
    if (useDropoffPin) {
      const phoneDigits = (routeProfiles.dropoffProfile.contactPhone || "").replace(/[^0-9]/g, "");
      deliveryPin = phoneDigits.slice(-4);
    }
    const itemType = selectedItemType === "other"
      ? customItemType.trim() || "other"
      : selectedItemType || "standard";
    const paymentType =
      paymentMethod === "card_machine" ? "credit_card" : paymentMethod === "pix" ? "pix" : paymentMethod === "wallet" ? "wallet" : "cash";

    const payload: CreateRideRequest = {
      serviceType: "delivery",
      vehicleType: selectedVehicleType,
      pickup: {
        address: routeProfiles.pickupProfile.address,
        latitude: pickupCoords.latitude,
        longitude: pickupCoords.longitude,
      },
      dropoff: {
        address: routeProfiles.dropoffProfile.address,
        latitude: dropoffCoords.latitude,
        longitude: dropoffCoords.longitude,
      },
      stops: stops.map((s) => ({
        address: s.address,
        latitude: s.addressCoords?.latitude || 0,
        longitude: s.addressCoords?.longitude || 0,
      })),
      pricing: {
        ...priceData.pricing,
        total: priceData.pricing.total + customOfferAdjustment,
        subtotal: priceData.pricing.total + customOfferAdjustment,
      },
      distance: priceData.distance,
      duration: priceData.duration,
      scheduledFor: parseScheduleToISO(scheduledFor) || undefined,
      routeCoordinates: routeCoords.length >= 2
        ? routeCoords
        : [
            { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude },
            ...stops.map((s) => ({ latitude: s.addressCoords?.latitude || 0, longitude: s.addressCoords?.longitude || 0 })),
            { latitude: dropoffCoords.latitude, longitude: dropoffCoords.longitude },
          ],
      details: {
        itemType,
        pickupComplement: routeProfiles.pickupProfile.details,
        dropoffComplement: routeProfiles.dropoffProfile.details,
        recipientName: routeProfiles.dropoffProfile.contactName,
        recipientPhone: routeProfiles.dropoffProfile.contactPhone,
        recipientInstructions: itemNotes.trim(),
        pickupPin,
        deliveryPin,
        specialInstructions: savedItemSummary || itemNotes.trim(),
      },
      payment: {
        method: {
          type: paymentType,
        },
      },
      negotiation: {
        enabled: true,
        clientOffer: priceData.pricing.total + customOfferAdjustment,
      },
    };

    try {
      setSubmitting(true);
      const created = await rideService.create(payload);
      if (created?.status === "scheduled") {
        navigation.navigate("ActiveOrders");
        return;
      }
      navigation.navigate("OrderSent", { rideId: created._id });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao solicitar entrega",
        text2: error?.response?.data?.error || error?.response?.data?.message || error?.message || "Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleSwapAddresses = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    swapRotation.setValue(0);
    Animated.timing(swapRotation, {
      toValue: 1,
      duration: 260,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setRouteCoords([]);
    setAnimatedVehicleCoord(null);
    setRouteProfiles((current) => ({
      pickupProfile: current.dropoffProfile,
      dropoffProfile: current.pickupProfile,
    }));
  };

  const handleSaveItemDetails = () => {
    const typeText = selectedItemType === "other" && customItemType.trim()
      ? customItemType.trim()
      : selectedItemLabel || "Item";
    const valueText = itemValue.trim() ? `R$ ${itemValue.trim()}` : null;
    const noteText = itemNotes.trim() ? itemNotes.trim() : null;
    setSavedItemSummary([typeText, valueText, noteText].filter(Boolean).join(" • "));
    setShowItemDetails(false);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1 }}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >
      <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#f4f4f4" />

      {/* Standard Header */}
      <View style={[styles.header, { paddingTop: topInset, height: 62 + topInset, backgroundColor: "#fff", borderBottomWidth: 1, borderBottomColor: "#eef1f5" }]}>
        <TouchableOpacity style={styles.headerButton} onPress={handleBackHome} activeOpacity={0.75}>
          <ChevronLeft size={28} color="#111827" strokeWidth={2.7} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da entrega</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Top Route Map (Below Header) */}
      <View style={{ height: 210, width: "100%", position: "relative", overflow: "hidden", borderBottomWidth: 1, borderBottomColor: "#eef1f5" }}>
        <GlobalMap
          ref={mapRef}
          style={{ width: "100%", height: "100%" }}
          useDarkStyle={true}
          showsCompass={false}
          initialRegion={{
            latitude: routeProfiles.pickupProfile.addressCoords?.latitude || -23.5505,
            longitude: routeProfiles.pickupProfile.addressCoords?.longitude || -46.6333,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
        >
          {/* Pickup Marker */}
          {!!routeProfiles.pickupProfile.addressCoords && (
            <Marker coordinate={routeProfiles.pickupProfile.addressCoords} anchor={{ x: 0.35, y: 0.75 }}>
              <RoutePin variant="pickup" />
            </Marker>
          )}

          {/* Dropoff Marker */}
          {!!routeProfiles.dropoffProfile.addressCoords && (
            <Marker coordinate={routeProfiles.dropoffProfile.addressCoords} anchor={{ x: 0.35, y: 0.75 }}>
              <RoutePin variant="dropoff" />
            </Marker>
          )}

          {/* Polyline Route */}
          {routeCoords.length >= 2 && (
            <Polyline coordinates={routeCoords} strokeColor="#020202ff" strokeWidth={5.5} />
          )}

          {/* Stops Markers */}
          {stops.map((stop, idx) => {
            if (!stop.addressCoords) return null;
            return (
              <Marker key={idx} coordinate={stop.addressCoords} anchor={{ x: 0.3, y: 0.3 }}>
                <View style={{ alignItems: "center", position: "relative", height: 60, width: 34, justifyContent: "flex-start" }}>
                  {/* Triangle Core Hub */}
                  <View style={{ position: "absolute", top: 4, width: 26, height: 26, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                    <AlertTriangle size={20} color="#111827" fill="#02de95" strokeWidth={2.5} />
                  </View>
                  
                  {/* Stem (pezinho - haste) */}
                  <View style={{ position: "absolute", top: 25, width: 3, height: 8, backgroundColor: "#02de95", borderBottomLeftRadius: 1, borderBottomRightRadius: 1, zIndex: 9 }} />
                  
                  {/* Base Dot (pezinho - bolinha) */}
                  <View style={{ position: "absolute", top: 32, width: 6, height: 6, borderRadius: 3, backgroundColor: "#02de95", borderWidth: 1, borderColor: "#ffffff", zIndex: 12 }} />
                </View>
              </Marker>
            );
          })}

          {/* Animated Walking Delivery Marker */}
          {!!animatedVehicleCoord && (
            <Marker coordinate={animatedVehicleCoord} anchor={{ x: 0.3, y: 0.6 }}>
              <View style={{ alignItems: "center", position: "relative", height: 70, width: 34, justifyContent: "flex-start" }}>
                {/* Core Hub (Just Transparent Image) */}
                <View style={{ position: "absolute", top: 2, width: 26, height: 26, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
                  <Image
                    source={selectedVehicleType === "motorcycle" ? require("../../../../../../assets/Logo/leva_moto.png") : vehicleImages[selectedVehicleType]}
                    style={{ width: 24, height: 24 }} // Comentado transform para parar de girar: transform: [{ rotate: `${vehicleRotation}deg` }]
                    resizeMode="contain"
                  />
                </View>

                {/* Haste do alfinete (mais alta e preta) */}
                <View style={{ position: "absolute", top: 24, width: 3, height: 12, backgroundColor: "#111827", borderBottomLeftRadius: 1, borderBottomRightRadius: 1, zIndex: 9 }} />

                {/* Bolinha no pé do alfinete (preta) */}
                <View style={{ position: "absolute", top: 32, width: 6, height: 6, borderRadius: 3, backgroundColor: "#111827", borderWidth: 1, borderColor: "#ffffff", zIndex: 12 }} />
              </View>
            </Marker>
          )}

          {/* Directions calculation */}
          {!!routeProfiles.pickupProfile.addressCoords && !!routeProfiles.dropoffProfile.addressCoords && (
            <MapViewDirections
              origin={routeProfiles.pickupProfile.addressCoords}
              waypoints={stops.map((s) => s.addressCoords).filter((c): c is { latitude: number; longitude: number } => !!c)}
              destination={routeProfiles.dropoffProfile.addressCoords}
              apikey={GOOGLE_API_KEY}
              mode="DRIVING"
              strokeWidth={0}
              strokeColor="transparent"
              onReady={onDirectionsReady}
            />
          )}
        </GlobalMap>

        {/* Floating Recenter Route Button */}
        {routeCoords.length > 0 && (
          <TouchableOpacity
            style={{
              position: "absolute",
              bottom: 12,
              right: 12,
              backgroundColor: "#ffffff",
              width: 36,
              height: 36,
              borderRadius: 18,
              alignItems: "center",
              justifyContent: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 5,
              zIndex: 99,
            }}
            onPress={handleRecenterRoute}
            activeOpacity={0.85}
          >
            <Locate size={18} color="#111827" strokeWidth={2.5} />
          </TouchableOpacity>
        )}

        {/* Floating Info Pill Card (KM and Duration) */}
        {!!priceData?.distance && (
          <View
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              backgroundColor: "rgba(17, 24, 39, 0.9)",
              paddingHorizontal: 12,
              paddingVertical: 7,
              borderRadius: 100,
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3,
              elevation: 5,
              zIndex: 99,
            }}
          >
            <Locate size={13} color="#02de95" strokeWidth={3} />
            <Text style={{ color: "#ffffff", fontSize: 12, fontWeight: "900", letterSpacing: -0.1 }}>
              {priceData.distance.text}
              {priceData?.duration?.text ? ` • ${priceData.duration.text}` : ""}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.routeCard}>
          <View style={styles.routeRail}>
            <Circle size={12} color="#10d79a" strokeWidth={3} />
            <View style={styles.routeLine} />
            <View style={styles.routeLine} />
            <Circle size={12} color="#ff7a32" strokeWidth={3} />
            <TouchableOpacity
              style={styles.routeSwapBadge}
              onPress={handleSwapAddresses}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityLabel="Inverter endereços de coleta e entrega"
            >
              <Animated.View style={animatedSwapStyle}>
                <ArrowDownUp size={14} color="#111827" strokeWidth={3} />
              </Animated.View>
            </TouchableOpacity>
          </View>

          <View style={styles.routeBody}>
            <TouchableOpacity activeOpacity={0.85} style={styles.routeRow}>
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressText} numberOfLines={2}>
                  {routeProfiles.pickupProfile.address}
                </Text>
                <Text style={styles.contactText} numberOfLines={1}>
                  {routeProfiles.pickupProfile.contactName} • {routeProfiles.pickupProfile.contactPhone}
                </Text>
                {!!routeProfiles.pickupProfile.details && (
                  <Text style={styles.detailsText} numberOfLines={1}>
                    {routeProfiles.pickupProfile.details}
                  </Text>
                )}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>

            {priceData?.distance ? (
              <View style={{ flexDirection: "row", alignItems: "center", marginVertical: 8 }}>
                <View style={{ flex: 1, height: 1, backgroundColor: "#eef1f5" }} />
                <View style={{ backgroundColor: "#ecfff8", borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginHorizontal: 10, borderWidth: 1, borderColor: "#02de95" }}>
                  <Text style={{ color: "#02de95", fontSize: 12, fontWeight: "900" }}>
                    {priceData.distance.text}
                    {priceData?.duration?.text ? ` • ${priceData.duration.text}` : ""}
                  </Text>
                </View>
                <View style={{ flex: 1, height: 1, backgroundColor: "#eef1f5" }} />
              </View>
            ) : (
              <View style={styles.routeDivider} />
            )}

            {stops.map((stop, idx) => (
              <View key={idx}>
                <View style={[styles.routeRow, { backgroundColor: "#f9fafb", borderRadius: 12, padding: 10, marginVertical: 4, borderLeftWidth: 3, borderLeftColor: "#02de95" }]}>
                  <View style={styles.routeTextWrap}>
                    <Text style={{ fontSize: 10, fontWeight: "900", color: "#02de95", marginBottom: 2 }}>PARADA {idx + 1}</Text>
                    <Text style={[styles.addressText, { fontSize: 13 }]} numberOfLines={2}>
                      {stop.address}
                    </Text>
                    <Text style={styles.contactText} numberOfLines={1}>
                      {stop.contactName} • {stop.contactPhone}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveStop(idx)} style={{ padding: 6 }}>
                    <X size={18} color="#ef4444" strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={{ height: 1, backgroundColor: "#eef1f5", marginVertical: 6 }} />
              </View>
            ))}

            <TouchableOpacity activeOpacity={0.85} style={styles.routeRow}>
              <View style={styles.routeTextWrap}>
                <Text style={styles.addressText} numberOfLines={3}>
                  {routeProfiles.dropoffProfile.address}
                </Text>
                <Text style={styles.contactText} numberOfLines={1}>
                  {routeProfiles.dropoffProfile.contactName} • {routeProfiles.dropoffProfile.contactPhone}
                </Text>
                {!!routeProfiles.dropoffProfile.details && (
                  <Text style={styles.detailsText} numberOfLines={1}>
                    {routeProfiles.dropoffProfile.details}
                  </Text>
                )}
              </View>
              <ChevronRight size={23} color="#7b7f86" />
            </TouchableOpacity>

            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 10,
                marginTop: 10,
                borderWidth: 1,
                borderStyle: "dashed",
                borderColor: "#02de95",
                borderRadius: 12,
                gap: 6
              }}
              onPress={() => {
                navigation.navigate("DeliverySenderInfo", {
                  mode: "receiver",
                  vehicleType: selectedVehicleType,
                  flow: route.params?.flow || "send",
                  pickupProfile: routeProfiles.pickupProfile,
                  dropoffProfile: routeProfiles.dropoffProfile,
                  stops: stops,
                  isAddingStop: true,
                });
              }}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#02de95" strokeWidth={3} />
              <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "900" }}>Adicionar Parada (+ R$ 2,00)</Text>
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity activeOpacity={0.9} style={styles.cardRow} onPress={() => setShowItemDetails(true)}>
          <View style={styles.iconSlot}>
            <Package size={19} color="#667085" />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Inserir detalhes do item</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {savedItemSummary || "Adicionar uma observação na entrega"}
            </Text>
          </View>
          <ChevronRight size={23} color="#7b7f86" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} style={styles.cardRow} onPress={() => setShowScheduleModal(true)}>
          <View style={[styles.iconSlot, scheduledFor ? { backgroundColor: "#ecfff8" } : null]}>
            <Clock size={19} color={scheduledFor ? "#02de95" : "#667085"} />
          </View>
          <View style={styles.cardTextWrap}>
            <Text style={styles.cardTitle}>Agendar Entrega</Text>
            <Text style={styles.cardSubtitle} numberOfLines={2}>
              {scheduledFor ? `Agendado: ${scheduledFor}` : "Solicitar agora (Partida imediata)"}
            </Text>
          </View>
          {scheduledFor ? (
            <TouchableOpacity onPress={(e) => { e.stopPropagation(); setScheduledFor(null); }} style={{ padding: 4 }}>
              <X size={20} color="#ef4444" strokeWidth={2.5} />
            </TouchableOpacity>
          ) : (
            <ChevronRight size={23} color="#7b7f86" />
          )}
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.9} style={styles.vehicleCard} onPress={() => setShowVehicleSelector(true)}>
          <Image source={vehicleImages[selectedVehicleType]} style={styles.vehicleImage} resizeMode="contain" />
          <View style={styles.vehicleTextWrap}>
            <View style={styles.vehicleTitleRow}>
              <Text style={styles.cardTitle}>{vehicle.title}</Text>
              <Info size={14} color="#c2c6cc" />
            </View>
            <Text style={styles.cardSubtitle}>{vehicle.subtitle}</Text>
            <Text style={styles.vehicleDetails}>{vehicle.details}</Text>
            {!!pricingError && <Text style={styles.pricingError}>{pricingError}</Text>}
          </View>
          <View style={styles.vehiclePriceWrap}>
            {loadingPricing ? <ActivityIndicator color="#111827" /> : <Text style={styles.priceText}>{total}</Text>}
            <View style={styles.radioDot} />
          </View>
        </TouchableOpacity>

        <View style={styles.pinCard}>
          <View style={styles.pinHeader}>
            <Text style={styles.cardTitle}>Verificar com PIN</Text>
            <Info size={14} color="#c2c6cc" />
          </View>

          <TouchableOpacity style={styles.pinOption} onPress={() => setUsePickupPin((value) => !value)} activeOpacity={0.8}>
            <Text style={styles.pinText}>Usar código de coleta</Text>
            <View style={[styles.checkbox, usePickupPin && styles.checkboxActive]}>
              {usePickupPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.pinOption} onPress={() => setUseDropoffPin((value) => !value)} activeOpacity={0.8}>
            <Text style={styles.pinText}>Usar código de entrega</Text>
            <View style={[styles.checkbox, useDropoffPin && styles.checkboxActive]}>
              {useDropoffPin && <Check size={16} color="#fff" strokeWidth={3.2} />}
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 15) }]}>
        <View style={{ flexDirection: "row", gap: 5, paddingHorizontal: 16, marginBottom: 12, alignItems: "center" }}>
          <Text style={{ fontSize: 11, fontWeight: "800", color: "#6b7280", marginRight: 0 }}>Melhorar proposta:</Text>
          {["+ R$ 2", "+ R$ 5", "+ R$ 10"].map((btnText, idx) => {
            const addVal = idx === 0 ? 2 : idx === 1 ? 5 : 10;
            const active = customOfferAdjustment === addVal;
            return (
              <TouchableOpacity
                key={btnText}
                style={{
                  flex: 1,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: active ? "#02de95" : "#e6fcf4",
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: active ? "#02de95" : "#a1f4d7"
                }}
                onPress={() => setCustomOfferAdjustment(active ? 0 : addVal)}
                activeOpacity={0.8}
              >
                <Text style={{ color: active ? "#091A2F" : "#029d68", fontSize: 11, fontWeight: "900" }}>{btnText}</Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={{
              flex: 1,
              height: 32,
              borderRadius: 16,
              backgroundColor: (customOfferAdjustment !== 0 && customOfferAdjustment !== 2 && customOfferAdjustment !== 5 && customOfferAdjustment !== 10) ? "#02de95" : "#e6fcf4",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: (customOfferAdjustment !== 0 && customOfferAdjustment !== 2 && customOfferAdjustment !== 5 && customOfferAdjustment !== 10) ? "#02de95" : "#a1f4d7"
            }}
            onPress={() => {
              setCustomOfferText(customOfferAdjustment > 0 ? String(customOfferAdjustment) : "");
              setShowCustomOfferInput(true);
            }}
            activeOpacity={0.8}
          >
            <Text
              style={{
                color: (customOfferAdjustment !== 0 && customOfferAdjustment !== 2 && customOfferAdjustment !== 5 && customOfferAdjustment !== 10) ? "#091A2F" : "#029d68",
                fontSize: 11,
                fontWeight: "900"
              }}
            >
              {(customOfferAdjustment !== 0 && customOfferAdjustment !== 2 && customOfferAdjustment !== 5 && customOfferAdjustment !== 10) ? `+ R$ ${customOfferAdjustment}` : "Outro"}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.paymentRow} activeOpacity={0.8} onPress={() => setShowPaymentMethods(true)}>
          <View style={[styles.cashBadge, paymentMethod === "pix" ? { backgroundColor: "#02de95" } : paymentMethod === "card_machine" ? { backgroundColor: "#f97316" } : paymentMethod === "wallet" ? { backgroundColor: "#02de95" } : null]}>
            {paymentMethod === "pix" ? (
              <QrCode size={15} color="#fff" />
            ) : paymentMethod === "card_machine" ? (
              <CreditCard size={15} color="#fff" />
            ) : paymentMethod === "wallet" ? (
              <Wallet size={15} color="#fff" />
            ) : (
              <Wallet size={15} color="#fff" />
            )}
          </View>
          <Text style={styles.paymentLabel}>
            {paymentMethod === "pix" ? "Pix" : paymentMethod === "card_machine" ? "Maquininha de cartão" : paymentMethod === "wallet" ? "Saldo LevaPay" : "Dinheiro"}
          </Text>
          <View style={styles.paymentSpacer} />
          <Text style={styles.discountText}>Use saldo e poupe R$4,00</Text>
          <ChevronRight size={18} color="#9ca3af" />
        </TouchableOpacity>

        <View style={styles.footerBottom}>
          {loadingPricing ? (
            <View style={{ height: 32, justifyContent: "center", alignItems: "flex-start", width: 80 }}>
              <ActivityIndicator color="#02de95" size="small" />
            </View>
          ) : (
            <Text style={styles.totalText}>{total}</Text>
          )}
          <TouchableOpacity
            style={[styles.confirmButton, (submitting || loadingPricing) && styles.confirmButtonDisabled]}
            onPress={handleConfirm}
            activeOpacity={0.9}
            disabled={submitting || loadingPricing}
          >
            {submitting ? <ActivityIndicator color="#111" /> : <ShieldCheck size={21} color="#111" />}
            <Text style={styles.confirmText}>{submitting ? "Enviando" : "Confirmar"}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showItemDetails && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute inset-0 z-50 bg-black/35"
        >
          <View className="mt-[86px] flex-1 rounded-t-[22px] bg-white px-6 pb-6 pt-5">
            <View className="mb-7 flex-row items-center justify-between">
              <Text className="text-[27px] font-black text-[#111827]">Detalhes do item</Text>
              <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4]" onPress={() => setShowItemDetails(false)} activeOpacity={0.8}>
                <X size={22} color="#9ca3af" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerClassName="pb-6">
              <Text className="mb-4 text-xl font-black text-[#111827]">Tipo de item</Text>
              <View className="mb-6 flex-row flex-wrap gap-3">
                {itemTypes.map((item) => {
                  const Icon = item.icon;
                  const active = selectedItemType === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      className={
                        active
                          ? "flex-row items-center gap-2 rounded-lg bg-[#ff7a32] px-3.5 py-3"
                          : "flex-row items-center gap-2 rounded-lg bg-[#f7f7f9] px-3.5 py-3"
                      }
                      onPress={() => setSelectedItemType(item.id)}
                      activeOpacity={0.85}
                    >
                      <Icon size={19} color={active ? "#fff" : "#9aa0a6"} fill={item.id === "clothing" ? (active ? "#fff" : "#9aa0a6") : "transparent"} />
                      <Text className={active ? "text-base font-semibold text-white" : "text-base font-semibold text-[#333]"}>{item.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {selectedItemType === "other" && (
                <View className="mb-6 min-h-[94px] rounded-lg bg-[#f7f7f9] px-4 py-3">
                  <TextInput
                    value={customItemType}
                    onChangeText={(text) => setCustomItemType(text.slice(0, 50))}
                    placeholder="Insira o tipo do item"
                    placeholderTextColor="#9ca3af"
                    multiline
                    className="min-h-[52px] text-base text-[#111827]"
                  />
                  <Text className="self-end text-base text-[#8b929f]">{customItemType.length}/50</Text>
                </View>
              )}

              <Text className="mb-4 text-xl font-black text-[#111827]">Valor do item</Text>
              <View className="mb-3 flex-row items-center">
                <Text className="mr-3 text-base text-[#111827]">R$</Text>
                <TextInput
                  value={itemValue}
                  onChangeText={setItemValue}
                  placeholder="Insira o valor do item"
                  placeholderTextColor="#9ca3af"
                  keyboardType="decimal-pad"
                  className="h-11 flex-1 rounded-lg bg-[#f7f7f9] px-4 text-base text-[#111827]"
                />
              </View>
              <Text className="mb-8 text-[15px] leading-5 text-[#111827]">A LevaMais não sugere envio de itens com valor superior a R$500</Text>

              <Text className="mb-4 text-xl font-black text-[#111827]">Observações da entrega</Text>
              <View className="mb-10 min-h-[126px] rounded-lg bg-[#f7f7f9] px-4 py-3">
                <TextInput
                  value={itemNotes}
                  onChangeText={(text) => setItemNotes(text.slice(0, 100))}
                  placeholder="Adicione uma descrição ou observações"
                  placeholderTextColor="#9ca3af"
                  multiline
                  textAlignVertical="top"
                  className="min-h-[84px] text-base text-[#111827]"
                />
                <Text className="self-end text-base text-[#8b929f]">{itemNotes.length}/100</Text>
              </View>
            </ScrollView>

            <TouchableOpacity className="h-[55px] items-center justify-center rounded-[18px] bg-[#ffd400]" onPress={handleSaveItemDetails} activeOpacity={0.9}>
              <Text className="text-[21px] font-black text-[#111827]">Confirmar</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {showVehicleSelector && (
        <View className="absolute inset-0 z-50 bg-black/35">
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => setShowVehicleSelector(false)} />
          <View className="rounded-t-[26px] bg-white px-6 pb-7 pt-5">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[24px] font-black text-[#111827]">Tipo de entrega</Text>
              <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4]" onPress={() => setShowVehicleSelector(false)} activeOpacity={0.8}>
                <X size={22} color="#9ca3af" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <View className="gap-3">
              {deliveryVehicles.map((type) => {
                const option = vehicleCopy[type];
                const active = selectedVehicleType === type;
                return (
                  <TouchableOpacity
                    key={type}
                    className={active ? "flex-row items-center rounded-[20px] border-2 border-[#02de95] bg-[#ecfff8] px-4 py-4" : "flex-row items-center rounded-[20px] border border-[#eef1f5] bg-white px-4 py-4"}
                    activeOpacity={0.88}
                    onPress={() => {
                      setSelectedVehicleType(type);
                      setShowVehicleSelector(false);
                    }}
                  >
                    <Image source={vehicleImages[type]} className="mr-4 h-[52px] w-[52px]" resizeMode="contain" />
                    <View className="flex-1">
                      <Text className="text-[17px] font-black text-[#111827]">{option.title}</Text>
                      <Text className="mt-1 text-sm font-semibold text-[#6b7280]">{option.subtitle}</Text>
                      <Text className="mt-1 text-sm font-bold text-[#6b7280]">{option.details}</Text>
                    </View>
                    {active ? (
                      <View className="h-6 w-6 items-center justify-center rounded-full bg-[#02de95]">
                        <Check size={16} color="#111827" strokeWidth={3} />
                      </View>
                    ) : (
                      <ChevronRight size={22} color="#9ca3af" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      )}

      <PaymentMethodsSheet
        visible={showPaymentMethods}
        value={paymentMethod}
        onChange={setPaymentMethod}
        onClose={() => setShowPaymentMethods(false)}
        subtitle="Escolha como pagar sua entrega"
        onDeposit={() => {
          setShowPaymentMethods(false);
          (navigation as any).navigate("Deposit", { onSuccess: () => { /* refresh on return */ } });
        }}
        onAddCard={() => setShowAddCard(true)}
      />

      {showDepositPix && (
        <View className="absolute inset-0 z-50 bg-[#f8f8fa]" style={{ elevation: 60, backgroundColor: "#f8f8fa" }}>
          <View className="flex-row items-center justify-between px-6 pb-4" style={{ paddingTop: topInset }}>
            <TouchableOpacity className="h-10 w-10 justify-center" onPress={() => setShowDepositPix(false)} activeOpacity={0.8}>
              <ChevronLeft size={28} color="#111827" strokeWidth={2.7} />
            </TouchableOpacity>
            <Text className="flex-1 text-[20px] font-black text-[#111827]">Depósito</Text>
            <Text className="text-base font-semibold text-[#111827]">Histórico</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: 120 }}>
            <View className="mb-8 mt-5 items-center">
              <View className="h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-[#20c987]">
                <Wallet size={42} color="#fff" strokeWidth={2.5} />
              </View>
            </View>
            <Text className="text-[24px] font-black leading-8 text-[#111827]">Deposite no saldo LevaPay para usar quando quiser</Text>
            <Text className="mt-3 text-base leading-6 text-[#8b929f]">
              Só para corridas e entregas na LevaMais. Depósitos são reembolsáveis. Verifique sua conta para desbloquear
              <Text className="font-semibold text-[#8b929f]" onPress={() => setShowVerificationBenefits(true)}> mais vantagens &gt;</Text>
            </Text>

            <Text className="mb-3 mt-9 text-center text-base text-[#8b929f]">Valor</Text>
            <View className="mb-5 h-[135px] items-center justify-center rounded-[18px] bg-white">
              <Text className="text-[42px] font-black text-[#111827]">{total}</Text>
            </View>

            <View className="flex-row gap-2">
              {[total, "R$30,00", "R$50,00"].map((amount, index) => (
                <TouchableOpacity key={String(amount)} className={index === 0 ? "h-[86px] flex-1 items-center justify-center rounded-xl border border-[#02de95] bg-white" : "h-[86px] flex-1 items-center justify-center rounded-xl bg-white"} activeOpacity={0.85}>
                  {index === 2 && <Text className="absolute -top-3 right-1 rounded bg-[#d9fae8] px-2 py-0.5 text-[10px] font-bold text-[#11a060]">Recomendado</Text>}
                  <Text className="text-xl font-black text-[#111827]">{amount}</Text>
                  {index === 0 && <Text className="mt-1 text-sm font-semibold text-[#111827]">A pagar</Text>}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>

          <View className="absolute bottom-0 left-0 right-0 bg-[#f8f8fa] px-8 pb-7 pt-4">
            <TouchableOpacity
              className="h-[56px] items-center justify-center rounded-[22px] bg-[#02de95]"
              activeOpacity={0.9}
              onPress={() => handlePixDeposit(depositAmount || 30)}
            >
              {depositLoading ? (
                <ActivityIndicator size="large" color="#111827" />
              ) : (
                <Text className="text-[21px] font-black text-[#111827]">Depositar com Pix</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showVerificationBenefits && (
        <View className="absolute inset-0 z-[60] bg-white" style={{ elevation: 65, backgroundColor: "#ffffff" }}>
          <View className="px-6 pb-4" style={{ paddingTop: topInset }}>
            <TouchableOpacity className="h-10 w-10 justify-center" onPress={() => setShowExitReason(true)} activeOpacity={0.8}>
              <ChevronLeft size={28} color="#111827" strokeWidth={2.7} />
            </TouchableOpacity>
          </View>
          <View className="h-[300px] bg-[#ded2c8]" />
          <View className="-mt-12 flex-1 rounded-t-[50px] bg-white px-7 pt-14">
            <Text className="text-[32px] font-black leading-[42px] text-black">Faça a verificação e ganhe até R$275,00 de recompensas</Text>
            <Text className="mt-6 text-lg leading-7 text-[#9ca3af]">
              Para cadastrar, insira suas informações, faça uma verificação facial e envie seu RG, CNH ou RNE
            </Text>
            <Text className="mt-2 text-lg leading-7 text-[#9ca3af]">
              Ao mesmo tempo, também enviaremos uma solicitação de crédito para você
            </Text>
            <View className="flex-1" />
            <Text className="mb-4 text-center text-sm leading-5 text-[#9ca3af]">
              Ao continuar, você concorda com nossos <Text className="text-[#ff7a32]">Termos de Uso de Pagamento</Text> e <Text className="text-[#ff7a32]">Termos de Uso de Crédito</Text>
            </Text>
            <TouchableOpacity
              className="mb-7 h-[58px] items-center justify-center rounded-[16px] bg-[#02de95]"
              activeOpacity={0.9}
              onPress={() => handleVerification()}
            >
              {verificationLoading ? (
                <ActivityIndicator size="large" color="#000" />
              ) : (
                <Text className="text-[21px] font-black text-black">Concordar e continuar</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showExitReason && (
        <View className="absolute inset-0 z-[70] justify-end bg-black/55">
          <View className="rounded-t-[24px] bg-white px-8 pb-7 pt-6">
            <View className="mb-6 flex-row items-start justify-between">
              <Text className="flex-1 text-[27px] font-black leading-9 text-black">Por que você não terminou o cadastro?</Text>
              <TouchableOpacity className="h-9 w-9 items-center justify-center" onPress={() => setShowExitReason(false)}>
                <X size={24} color="#111827" strokeWidth={2.6} />
              </TouchableOpacity>
            </View>
            {[
              "Eu fiquei preocupado(a) que poderia demorar muito",
              "Eu continuarei minha solicitação mais tarde",
              "Eu não sabia por que tinha que concluir a verificação de identidade",
            ].map((reason) => (
              <TouchableOpacity
                key={reason}
                className="flex-row items-center border-b border-[#eef1f5] py-4"
                onPress={() => {
                  setExitReason(reason);
                  handleExitFeedback(reason, "");
                }}
                activeOpacity={0.85}
              >
                <Text className="flex-1 text-base leading-5 text-black">{reason}</Text>
                <View className={exitReason === reason ? "h-6 w-6 rounded-full border-[7px] border-[#111827]" : "h-6 w-6 rounded-full border-2 border-[#d1d5db]"} />
              </TouchableOpacity>
            ))}
            <View className="mt-5 min-h-[118px] rounded-xl bg-[#f1f2f4] px-4 py-3">
              <TextInput placeholder="Outro (especifique)" placeholderTextColor="#c3c7ce" multiline className="min-h-[78px] text-base text-[#111827]" />
              <Text className="self-end text-sm text-[#b7bcc5]">0/200</Text>
            </View>
            <TouchableOpacity className={exitReason ? "mt-6 h-[56px] items-center justify-center rounded-[16px] bg-[#02de95]" : "mt-6 h-[56px] items-center justify-center rounded-[16px] bg-[#f1f0f4]"} activeOpacity={0.9}>
              <Text className={exitReason ? "text-xl font-black text-black" : "text-xl font-black text-[#d5d2d8]"}>Confirmar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {showScheduleModal && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute inset-0 z-[80] justify-end bg-black/60"
        >
          <TouchableOpacity className="flex-1" activeOpacity={1} onPress={() => { setShowScheduleModal(false); setIsCustomSchedule(false); }} />
          <View className="rounded-t-[28px] bg-white px-7 pb-8 pt-6">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[22px] font-black text-[#111827]">Agendar Entrega</Text>
              <TouchableOpacity
                className="h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4]"
                onPress={() => {
                  setShowScheduleModal(false);
                  setIsCustomSchedule(false);
                }}
              >
                <X size={20} color="#9ca3af" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            {isCustomSchedule ? (
              <View>
                <Text className="mb-4 text-base text-[#6b7280] leading-6">Insira o dia e o horário desejado para a entrega:</Text>
                
                <Text className="mb-1 text-sm font-bold text-[#6b7280]">Dia (Ex: Amanhã, ou 26/05)</Text>
                <TextInput
                  value={customDay}
                  onChangeText={setCustomDay}
                  placeholder="Ex: Hoje, Amanhã ou 26/05"
                  placeholderTextColor="#9ca3af"
                  className="mb-4 h-12 rounded-xl bg-[#f3f4f6] px-4 text-sm font-semibold text-[#111827]"
                />

                <View className="flex-row gap-3 mb-6">
                  <View className="flex-1">
                    <Text className="mb-1 text-sm font-bold text-[#6b7280]">Hora (00-23)</Text>
                    <TextInput
                      value={customHour}
                      onChangeText={(t) => {
                        const h = t.replace(/[^0-9]/g, "").slice(0, 2);
                        setCustomHour(Number(h) < 24 ? h : "23");
                      }}
                      placeholder="14"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      className="h-12 rounded-xl bg-[#f3f4f6] px-4 text-sm font-semibold text-[#111827]"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="mb-1 text-sm font-bold text-[#6b7280]">Minuto (00-59)</Text>
                    <TextInput
                      value={customMin}
                      onChangeText={(t) => {
                        const m = t.replace(/[^0-9]/g, "").slice(0, 2);
                        setCustomMin(Number(m) < 60 ? m : "59");
                      }}
                      placeholder="30"
                      placeholderTextColor="#9ca3af"
                      keyboardType="numeric"
                      className="h-12 rounded-xl bg-[#f3f4f6] px-4 text-sm font-semibold text-[#111827]"
                    />
                  </View>
                </View>

                <View className="flex-row gap-3">
                  <TouchableOpacity
                    className="h-12 flex-1 items-center justify-center rounded-xl bg-[#f3f4f6]"
                    onPress={() => setIsCustomSchedule(false)}
                    activeOpacity={0.8}
                  >
                    <Text className="text-[15px] font-black text-[#111827]">Voltar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="h-12 flex-[2] items-center justify-center rounded-xl bg-[#02de95]"
                    onPress={() => {
                      const dayVal = customDay.trim() || "Hoje";
                      const hrVal = customHour.trim().padStart(2, "0") || "12";
                      const minVal = customMin.trim().padStart(2, "0") || "00";
                      setScheduledFor(`${dayVal}, às ${hrVal}:${minVal}`);
                      setShowScheduleModal(false);
                      setIsCustomSchedule(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <Text className="text-[15px] font-black text-[#091A2F]">Confirmar Horário</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View>
                <Text className="mb-4 text-base text-[#6b7280] leading-6">Selecione o horário ideal para realizarmos a sua coleta e entrega:</Text>
                
                <View className="gap-2 mb-4">
                  {[
                    { label: "Partida imediata (Agora)", value: null },
                    { label: "Hoje mais tarde (em 30 minutos)", value: "Hoje, às " + new Date(Date.now() + 30 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
                    { label: "Hoje mais tarde (em 2 horas)", value: "Hoje, às " + new Date(Date.now() + 120 * 60 * 1000).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) },
                    { label: "Amanhã pela manhã (08:30)", value: "Amanhã, às 08:30" },
                    { label: "Amanhã à tarde (14:00)", value: "Amanhã, às 14:00" },
                  ].map((opt) => {
                    const active = scheduledFor === opt.value;
                    return (
                      <TouchableOpacity
                        key={opt.label}
                        className={active ? "flex-row items-center rounded-2xl border-2 border-[#02de95] bg-[#ecfff8] p-3.5" : "flex-row items-center rounded-2xl border border-[#eef1f5] bg-white p-3.5"}
                        onPress={() => {
                          setScheduledFor(opt.value);
                          setShowScheduleModal(false);
                        }}
                        activeOpacity={0.85}
                      >
                        <Clock size={16} color={active ? "#02de95" : "#667085"} style={{ marginRight: 12 }} />
                        <Text className="flex-1 text-[15px] font-black text-[#111827]">{opt.label}</Text>
                        {active && <Check size={18} color="#02de95" strokeWidth={3.5} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <TouchableOpacity
                  className="h-12 items-center justify-center rounded-2xl border border-[#02de95] bg-[#ecfff8]"
                  onPress={() => {
                    const now = new Date();
                    setCustomDay("Hoje");
                    setCustomHour(String(now.getHours()));
                    setCustomMin(String(now.getMinutes()));
                    setIsCustomSchedule(true);
                  }}
                  activeOpacity={0.85}
                >
                  <Text className="text-[15px] font-black text-[#02de95]">Escolher data e hora personalizada</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      )}

      {showCustomOfferInput && (
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="absolute inset-0 z-[80] justify-start bg-black/60 pt-24 px-5"
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={() => setShowCustomOfferInput(false)}
          />
          <View className="rounded-[24px] bg-white px-7 pb-8 pt-6 shadow-2xl">
            <View className="mb-5 flex-row items-center justify-between">
              <Text className="text-[22px] font-black text-[#111827]">Melhorar Proposta</Text>
              <TouchableOpacity className="h-9 w-9 items-center justify-center rounded-full bg-[#f1f2f4]" onPress={() => setShowCustomOfferInput(false)}>
                <X size={20} color="#9ca3af" strokeWidth={3} />
              </TouchableOpacity>
            </View>

            <Text className="mb-4 text-base text-[#6b7280] leading-6">
              Digite o valor adicional que você gostaria de oferecer ao motorista para priorizar sua entrega:
            </Text>

            <View style={{
              height: 52,
              backgroundColor: "#f3f4f6",
              borderRadius: 14,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              borderWidth: 2,
              borderColor: "#02de95",
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 18, fontWeight: "900", color: "#6b7280", marginRight: 6 }}>R$</Text>
              <TextInput
                value={customOfferText}
                onChangeText={(text) => {
                  const num = Number(text.replace(/[^0-9]/g, ""));
                  setCustomOfferText(num > 0 ? String(num) : "");
                }}
                placeholder="0,00"
                placeholderTextColor="#9ca3af"
                keyboardType="numeric"
                autoFocus
                style={{
                  flex: 1,
                  height: "100%",
                  fontSize: 18,
                  fontWeight: "900",
                  color: "#111827",
                  padding: 0
                }}
              />
            </View>

            <TouchableOpacity
              className="h-14 items-center justify-center rounded-2xl bg-[#02de95]"
              onPress={() => {
                const val = Number(customOfferText);
                setCustomOfferAdjustment(val);
                setShowCustomOfferInput(false);
              }}
              activeOpacity={0.9}
            >
              <Text className="text-lg font-black text-[#091A2F]">Confirmar Proposta</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f4f4f4",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  headerButton: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#111827",
    fontSize: 21,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 18,
    paddingBottom: 240,
    gap: 12,
  },
  routeCard: {
    minHeight: 232,
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  routeRail: {
    position: "relative",
    width: 30,
    alignItems: "center",
    paddingTop: 5,
    paddingBottom: 4,
  },
  routeLine: {
    width: 2,
    flex: 1,
    backgroundColor: "#e4e8ee",
    marginVertical: 5,
  },
  routeSwapBadge: {
    position: "absolute",
    top: "50%",
    marginTop: -13.5,
    width: 27,
    height: 27,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f6f8",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeBody: {
    flex: 1,
    paddingLeft: 10,
  },
  routeRow: {
    minHeight: 91,
    flexDirection: "row",
    alignItems: "center",
  },
  routeTextWrap: {
    flex: 1,
    paddingRight: 8,
  },
  addressText: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "900",
    letterSpacing: -0.2,
    color: "#111827",
  },
  contactText: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  detailsText: {
    marginTop: 7,
    fontSize: 14,
    fontWeight: "700",
    color: "#6b7280",
  },
  routeDivider: {
    height: 1,
    backgroundColor: "#eef1f5",
    marginVertical: 8,
  },
  cardRow: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 20,
  },
  iconSlot: {
    width: 36,
    alignItems: "flex-start",
  },
  cardTextWrap: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "900",
    letterSpacing: -0.2,
    color: "#111827",
  },
  cardSubtitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  vehicleCard: {
    minHeight: 108,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  vehicleImage: {
    width: 58,
    height: 58,
    marginRight: 12,
  },
  vehicleTextWrap: {
    flex: 1,
  },
  vehicleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  vehicleDetails: {
    marginTop: 6,
    fontSize: 15,
    fontWeight: "700",
    color: "#6b7280",
  },
  pricingError: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "#ff7a32",
  },
  vehiclePriceWrap: {
    marginLeft: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  priceText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: "#111827",
  },
  pinCard: {
    minHeight: 168,
    backgroundColor: "#fff",
    borderRadius: 22,
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
  },
  pinHeader: {
    marginBottom: 23,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pinOption: {
    height: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pinText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4b5563",
  },
  checkbox: {
    width: 21,
    height: 21,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.8,
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  checkboxActive: {
    borderColor: "#111827",
    backgroundColor: "#111827",
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "#eceff3",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  paymentRow: {
    height: 36,
    flexDirection: "row",
    alignItems: "center",
  },
  cashBadge: {
    marginRight: 8,
    width: 24,
    height: 19,
    borderRadius: 5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffae00",
  },
  paymentLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#111827",
  },
  paymentSpacer: {
    flex: 1,
  },
  discountText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
  },
  footerBottom: {
    marginTop: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  totalText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
  confirmButton: {
    height: 60,
    minWidth: 184,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#02de95",
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#111827",
  },
});
