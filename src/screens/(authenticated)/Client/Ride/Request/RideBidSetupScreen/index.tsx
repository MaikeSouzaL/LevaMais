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
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import { PaymentMethodsSheet, type PaymentMethod } from "@/components/payment/PaymentMethodsSheet";

export default function RideBidSetupScreen({ route, navigation }: any) {
  const insets = useSafeAreaInsets();
  const { pickup, dropoff, stops, routeCoordinates, initialDistanceKm, initialDurationMin, rideCategory, presetOffer, category } = route.params || {};

  const initialVehicle: "motorcycle" | "car" =
    route.params?.vehicleType === "motorcycle" ? "motorcycle" : "car";
  const [vehicleType, setVehicleType] = useState<"motorcycle" | "car">(initialVehicle);
  const [estimate, setEstimate] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [clientOffer, setClientOffer] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);
  const presetAppliedRef = React.useRef(false);

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
        const est = {
          suggestedPrice: total,
          minPrice: Math.max(1, Math.round(total * 0.8 * 100) / 100),
          maxPrice: Math.round(total * 1.5 * 100) / 100,
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

  const adjustOffer = (amount: number) => {
    const current = parseFloat(clientOffer) || estimate?.suggestedPrice || 0;
    const newOffer = Math.max(
      estimate?.minPrice || 0,
      Math.min(estimate?.maxPrice || 9999, current + amount)
    );
    setClientOffer(newOffer.toFixed(2));
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
      {/* Header */}
      <View className="flex-row items-center px-5 py-4 border-b border-slate-100 bg-white">
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          className="mr-3 w-10 h-10 rounded-full bg-slate-100 items-center justify-center"
        >
          <ChevronLeft size={24} color="#334155" />
        </TouchableOpacity>
        <Text className="text-slate-800 text-xl font-bold flex-1">
          Configure sua corrida
        </Text>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>


        {/* Resumo da Rota */}
        <View className="mx-5 mt-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-3">
            Resumo da rota
          </Text>

          <View className="flex-row items-start mb-3">
            <View className="w-3 h-3 rounded-full bg-[#02de95] mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-slate-500 text-xs">Embarque</Text>
              <Text className="text-slate-800 text-sm font-bold" numberOfLines={2}>
                {pickup.address}
              </Text>
            </View>
          </View>

          <View className="flex-row items-start">
            <View className="w-3 h-3 rounded-full bg-red-500 mt-1 mr-3" />
            <View className="flex-1">
              <Text className="text-slate-500 text-xs">Desembarque</Text>
              <Text className="text-slate-800 text-sm font-bold" numberOfLines={2}>
                {dropoff.address}
              </Text>
            </View>
          </View>

          <View className="flex-row mt-4 pt-4 border-t border-slate-100">
            <View className="flex-1 items-center">
              <Text className="text-slate-500 text-xs">Distância</Text>
              <Text className="text-slate-800 text-lg font-bold">
                {estimate.distanceKm.toFixed(1)} km
              </Text>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-slate-500 text-xs">Tempo estimado</Text>
              <Text className="text-slate-800 text-lg font-bold">
                {estimate.durationMin} min
              </Text>
            </View>
          </View>
        </View>



        {/* Estimativa de Preço */}
        <View className="mx-5 mt-5 bg-white rounded-3xl p-5 border border-slate-100 shadow-sm shadow-slate-200">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-3">
            Preço sugerido
          </Text>
          <View className="items-center">
            <Text className="text-[#02de95] text-4xl font-black">
              R$ {estimate.suggestedPrice.toFixed(2)}
            </Text>
            <Text className="text-slate-500 text-sm mt-2">
              Faixa: R$ {estimate.minPrice.toFixed(2)} - R$ {estimate.maxPrice.toFixed(2)}
            </Text>
          </View>

          <View className="mt-4 pt-4 border-t border-slate-100">
            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-500 text-sm">Tarifa base</Text>
              <Text className="text-slate-800 text-sm font-bold">
                R$ {estimate.pricingBreakdown.baseFare.toFixed(2)}
              </Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-slate-500 text-sm">Distância</Text>
              <Text className="text-slate-800 text-sm font-bold">
                R$ {estimate.pricingBreakdown.distancePrice.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Lance do Cliente */}
        <View className="mx-5 mt-5 mb-5 bg-white rounded-3xl p-5 border-2 border-[#02de95] shadow-sm shadow-[#02de95]/20">
          <Text className="text-slate-400 text-xs font-bold uppercase mb-3">
            Seu lance
          </Text>
          <Text className="text-slate-500 text-xs mb-3 text-center">
            💡 Lances próximos ao preço sugerido têm mais chances de aceitação
          </Text>

          <View className="items-center mb-4">
            <Text className="text-slate-400 text-sm mb-1">R$</Text>
            <Text className="text-slate-800 text-5xl font-black">
              {clientOffer}
            </Text>
          </View>

          {/* Botões de ajuste */}
          <View className="flex-row gap-2 mb-3">
            <TouchableOpacity
              className="flex-1 bg-red-50 rounded-xl py-3 items-center border border-red-200"
              onPress={() => adjustOffer(-2)}
            >
              <Text className="text-red-600 text-sm font-bold">- R$ 2</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-red-50 rounded-xl py-3 items-center border border-red-200"
              onPress={() => adjustOffer(-1)}
            >
              <Text className="text-red-600 text-sm font-bold">- R$ 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-emerald-50 rounded-xl py-3 items-center border border-emerald-200"
              onPress={() => setClientOffer(estimate.suggestedPrice.toFixed(2))}
            >
              <Text className="text-[#02de95] text-sm font-bold">Sugerido</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-50 rounded-xl py-3 items-center border border-blue-200"
              onPress={() => adjustOffer(1)}
            >
              <Text className="text-blue-600 text-sm font-bold">+ R$ 1</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-50 rounded-xl py-3 items-center border border-blue-200"
              onPress={() => adjustOffer(2)}
            >
              <Text className="text-blue-600 text-sm font-bold">+ R$ 2</Text>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Rodapé: igual ao card da tela de detalhes (entrega) */}
      <View style={{ borderTopWidth: 1, borderTopColor: "#eceff3", backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 14, paddingBottom: Math.max(insets.bottom, 15) }}>
        {/* Forma de pagamento */}
        <TouchableOpacity
          style={{ height: 36, flexDirection: "row", alignItems: "center" }}
          onPress={() => setShowPaymentMethods(true)}
          activeOpacity={0.8}
        >
          <View style={{ marginRight: 8, width: 26, height: 26, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: paymentMethod === "cash" ? "#ffae00" : paymentMethod === "pix" ? "#02de95" : "#ff6b35" }}>
             {paymentMethod === "cash" ? (
               <Banknote size={15} color="#fff" />
             ) : paymentMethod === "pix" ? (
               <QrCode size={15} color="#fff" />
             ) : (
               <CreditCard size={15} color="#fff" />
             )}
          </View>
          <Text style={{ fontSize: 15, fontWeight: "900", color: "#111827" }}>
             {paymentMethod === "cash" ? "Dinheiro" : paymentMethod === "pix" ? "Pix" : "Maquininha de cartão"}
          </Text>
          <View style={{ flex: 1 }} />
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#4b5563" }} numberOfLines={1}>Use saldo e poupe R$ 4,00</Text>
          <ChevronRight size={18} color="#9ca3af" style={{ marginLeft: 4 }} />
        </TouchableOpacity>

        {/* Total + botão */}
        <View style={{ marginTop: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>R$ {clientOffer}</Text>
          <TouchableOpacity
            style={{ height: 60, minWidth: 184, borderRadius: 22, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#02de95" }}
            onPress={handleContinue}
            activeOpacity={0.9}
          >
            <ShieldCheck size={21} color="#111827" />
            <Text style={{ fontSize: 22, fontWeight: "900", color: "#111827" }}>Enviar lance</Text>
          </TouchableOpacity>
        </View>
      </View>

      <PaymentMethodsSheet
        visible={showPaymentMethods}
        value={paymentMethod}
        onChange={setPaymentMethod}
        onClose={() => setShowPaymentMethods(false)}
        subtitle="Escolha como pagar sua corrida"
        onDeposit={() => {
          setShowPaymentMethods(false);
          (navigation as any).navigate("Deposit", { onSuccess: () => loadEstimate() });
        }}
        onAddCard={() => navigation.navigate("AddPaymentMethod")}
      />
    </SafeAreaView>
  );
}
