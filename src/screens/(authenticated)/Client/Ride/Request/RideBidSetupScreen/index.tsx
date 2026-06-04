import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline } from "react-native-maps";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  QrCode,
  Banknote,
  CreditCard,
  Wallet,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import { PaymentMethodsSheet, type PaymentMethod } from "@/components/payment/PaymentMethodsSheet";
import { BidAmountControl } from "@/components/ride/BidAmountControl";
import userService from "@/services/user.service";

export default function RideBidSetupScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { pickup, dropoff, stops, routeCoordinates, initialDistanceKm, initialDurationMin, rideCategory, presetOffer, category } = route.params || {};

  const initialVehicle: "motorcycle" | "car" =
    route.params?.vehicleType === "motorcycle" ? "motorcycle" : "car";
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "car">(initialVehicle);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientOffer, setClientOffer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("wallet");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const [balance, setBalance] = useState(0);
  const [held, setHeld] = useState(0);
  const [pendingDebt, setPendingDebt] = useState(0);

  const loadBalance = async () => {
    try {
      const profile = await userService.getProfile();
      if (profile && (profile as any).wallet) {
        setBalance((profile as any).wallet.balance || 0);
        setHeld((profile as any).wallet.held || 0);
      }
      setPendingDebt((profile as any)?.pendingDebt || 0);
    } catch (err) {
      console.warn("Erro ao buscar saldo:", err);
    }
  };

  const presetAppliedRef = React.useRef(false);

  useEffect(() => {
    loadBalance();
    const unsubscribe = navigation.addListener("focus", () => {
      loadBalance();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (showPaymentMethods) {
      loadBalance();
    }
  }, [showPaymentMethods]);

  useEffect(() => {
    loadEstimate();
  }, [vehicleType]);

  const loadEstimate = async () => {
    try {
      setLoading(true);

      // Preço da CATEGORIA já calculado no passo anterior = fonte da verdade.
      // Evita divergência (ex.: "preço sugerido" diferente do valor da categoria).
      if (category && typeof category.total === "number" && category.total > 0) {
        const total = category.total;
        // Faixa de lance vem do backend (simétrica ±25%). Fallback local caso ausente.
        const minPrice =
          typeof category.minPrice === "number"
            ? category.minPrice
            : Math.max(1, Math.round(total * 0.75 * 100) / 100);
        const maxPrice =
          typeof category.maxPrice === "number"
            ? category.maxPrice
            : Math.round(total * 1.25 * 100) / 100;
        const est = {
          suggestedPrice: total,
          minPrice,
          maxPrice,
          distanceKm: Number(category.distanceKm ?? initialDistanceKm ?? 0),
          durationMin: Number(category.durationMin ?? initialDurationMin ?? 0),
          pricingBreakdown: {
            baseFare: Number(category.basePrice ?? 0),
            distancePrice: Number(category.distancePrice ?? 0),
            total,
          },
        };
        setEstimate(est);
        if (!presetAppliedRef.current) {
          presetAppliedRef.current = true;
          setClientOffer(total.toFixed(2));
        }
        return;
      }

      // Fallback (entrada legada sem categoria): motor antigo de estimativa.
      const result = await rideService.calculateRideEstimate({
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude },
        dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude },
        vehicleType,
        distance: initialDistanceKm,
        duration: initialDurationMin,
      });
      setEstimate(result);
      if (!presetAppliedRef.current && typeof presetOffer === "number" && presetOffer > 0) {
        presetAppliedRef.current = true;
        setClientOffer(presetOffer.toFixed(2));
      } else {
        setClientOffer(result.suggestedPrice.toFixed(2));
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao calcular estimativa",
        text2: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    const offer = parseFloat(clientOffer);
    if (isNaN(offer) || offer < estimate.minPrice || offer > estimate.maxPrice) {
      Toast.show({
        type: "error",
        text1: "Lance inválido",
        text2: `O lance deve estar entre R$ ${estimate.minPrice.toFixed(2)} e R$ ${estimate.maxPrice.toFixed(2)}`,
      });
      return;
    }

    if (paymentMethod === "wallet" && balance < offer) {
      Toast.show({
        type: "error",
        text1: "Saldo insuficiente",
        text2: "Deposite saldo LevaPay ou escolha outro método de pagamento.",
      });
      setShowPaymentMethods(true);
      return;
    }

    navigation.navigate("RideBiddingScreen", {
      pickup,
      dropoff,
      stops,
      routeCoordinates,
      vehicleType,
      rideCategory,
      clientOffer: offer,
      estimate,
      paymentMethod,
    });
  };

  if (loading || !estimate) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <ActivityIndicator size="large" color="#02de95" />
        <Text className="text-slate-800 mt-4 text-base font-medium">Calculando estimativa...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header — clean, no bg on back btn */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, gap: 8 }}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{ width: 36, height: 36, alignItems: "center", justifyContent: "center" }}
        >
          <ChevronLeft size={24} color="#0F172A" strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={{ color: "#0F172A", fontSize: 18, fontWeight: "900", flex: 1 }}>
          Configure sua corrida
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>

        {/* ── Resumo da Rota (timeline compacta) ── */}
        <View style={{ marginHorizontal: 20, marginTop: 4, backgroundColor: "#F8FAFC", borderRadius: 20, padding: 18 }}>
          {/* Embarque */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ alignItems: "center", marginRight: 14, width: 14 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#02de95", borderWidth: 2, borderColor: "#fff" }} />
              <View style={{ width: 1.5, height: stops && stops.length > 0 ? 28 : 32, backgroundColor: "#CBD5E1", marginVertical: 2 }} />
            </View>
            <View style={{ flex: 1, paddingBottom: 6 }}>
              <Text style={{ color: "#64748B", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Embarque</Text>
              <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "700", marginTop: 1 }} numberOfLines={2}>
                {pickup.address}
              </Text>
            </View>
          </View>

          {/* Paradas intermediárias */}
          {stops && stops.length > 0 && stops.map((stop: any, index: number) => (
            <View key={`stop-${index}`} style={{ flexDirection: "row", alignItems: "flex-start" }}>
              <View style={{ alignItems: "center", marginRight: 14, width: 14 }}>
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#F59E0B", borderWidth: 2, borderColor: "#fff" }} />
                <View style={{ width: 1.5, height: 28, backgroundColor: "#CBD5E1", marginVertical: 2 }} />
              </View>
              <View style={{ flex: 1, paddingBottom: 6 }}>
                <Text style={{ color: "#F59E0B", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Parada {index + 1}</Text>
                <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "700", marginTop: 1 }} numberOfLines={2}>
                  {stop.address || stop.name || `Parada ${index + 1}`}
                </Text>
              </View>
            </View>
          ))}

          {/* Desembarque */}
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <View style={{ alignItems: "center", marginRight: 14, width: 14 }}>
              <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: "#EF4444", borderWidth: 2, borderColor: "#fff" }} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#64748B", fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Desembarque</Text>
              <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "700", marginTop: 1 }} numberOfLines={2}>
                {dropoff.address}
              </Text>
            </View>
          </View>

          {/* Distância e tempo — pills inline */}
          <View style={{ flexDirection: "row", marginTop: 14, gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "600" }}>Distância</Text>
              <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "900" }}>{estimate.distanceKm.toFixed(1)} km</Text>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, gap: 4, borderWidth: 1, borderColor: "#E2E8F0" }}>
              <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "600" }}>Tempo</Text>
              <Text style={{ color: "#0F172A", fontSize: 13, fontWeight: "900" }}>{estimate.durationMin} min</Text>
            </View>
          </View>
        </View>

        {/* ── Preço sugerido (compact) ── */}
        <View style={{ marginHorizontal: 20, marginTop: 16, alignItems: "center", paddingVertical: 16, backgroundColor: "#ECFDF5", borderRadius: 16 }}>
          <Text style={{ color: "#059669", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1 }}>
            Preço sugerido
          </Text>
          <Text style={{ color: "#059669", fontSize: 36, fontWeight: "900", marginTop: 2 }}>
            R$ {estimate.suggestedPrice.toFixed(2)}
          </Text>
          <Text style={{ color: "#64748B", fontSize: 12, marginTop: 4 }}>
            Faixa: R$ {estimate.minPrice.toFixed(2)} – R$ {estimate.maxPrice.toFixed(2)}
          </Text>
        </View>

        {/* ── Seu Lance ── */}
        <View style={{ marginHorizontal: 20, marginTop: 16, backgroundColor: "#fff", borderRadius: 24, padding: 22, borderWidth: 2, borderColor: "#02de95", shadowColor: "#02de95", shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 4 }}>
          <Text style={{ color: "#64748B", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
            Seu lance
          </Text>
          <BidAmountControl
            min={estimate.minPrice}
            max={estimate.maxPrice}
            suggested={estimate.suggestedPrice}
            value={parseFloat(clientOffer) || estimate.suggestedPrice}
            onChange={(n) => setClientOffer(n.toFixed(2))}
          />
        </View>


      </ScrollView>

      {/* ── Rodapé fixo ── */}
      <View style={{ borderTopWidth: 1, borderTopColor: "#F1F5F9", backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 12, paddingBottom: Math.max(insets.bottom, 15) }}>
        {/* Forma de pagamento */}
        <TouchableOpacity
          style={{ height: 36, flexDirection: "row", alignItems: "center" }}
          onPress={() => setShowPaymentMethods(true)}
          activeOpacity={0.8}
        >
          <View style={{ marginRight: 8, width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: paymentMethod === "cash" ? "#ffae00" : paymentMethod === "pix" ? "#02de95" : paymentMethod === "wallet" ? "#02de95" : "#ff6b35" }}>
             {paymentMethod === "cash" ? (
               <Banknote size={15} color="#fff" />
             ) : paymentMethod === "pix" ? (
               <QrCode size={15} color="#fff" />
             ) : paymentMethod === "wallet" ? (
               <Wallet size={15} color="#fff" />
             ) : (
               <CreditCard size={15} color="#fff" />
             )}
          </View>
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827" }}>
             {paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "pix" ? "Pix" : paymentMethod === "wallet" ? "Saldo LevaPay" : "Maquininha de cartão"}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#4b5563" }} numberOfLines={1}>Método de pagamento</Text>
          <ChevronRight size={18} color="#9ca3af" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Total + botão */}
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>R$ {clientOffer}</Text>
          <TouchableOpacity
            style={{ height: 56, minWidth: 184, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#02de95" }}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <ShieldCheck size={20} color="#111827" />
            <Text style={{ fontSize: 18, fontWeight: "900", color: "#111827" }}>Enviar lance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaymentMethodsSheet
        visible={showPaymentMethods}
        value={paymentMethod}
        onChange={setPaymentMethod}
        onClose={() => setShowPaymentMethods(false)}
        subtitle="Escolha como pagar sua corrida"
        balance={balance}
        held={held}
        pendingDebt={pendingDebt}
        totalPrice={parseFloat(clientOffer) || 0}
        onDeposit={() => {
          setShowPaymentMethods(false);
          (navigation as any).navigate("Deposit", { onSuccess: () => { loadBalance(); } });
        }}
        onAddCard={() => navigation.navigate("AddPaymentMethod")}
      />
    </SafeAreaView>
  );
}
