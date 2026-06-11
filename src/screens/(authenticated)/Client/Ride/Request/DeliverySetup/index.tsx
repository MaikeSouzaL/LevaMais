import React, { useState, useEffect, useCallback, useMemo } from "react";
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { useDebounce } from "@/hooks/useDebounce";

import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { DeliverySummaryCard } from "@/components/client/delivery-setup/DeliverySummaryCard";
import { VehicleSelector, LogisticsVehicleType } from "@/components/client/delivery-setup/VehicleSelector";
import { DeliveryTypeSelector, DeliveryType } from "@/components/client/delivery-setup/DeliveryTypeSelector";
import { CargoSizeSelector } from "@/components/client/delivery-setup/CargoSizeSelector";
import { HelperSwitch } from "@/components/client/delivery-setup/HelperSwitch";
import { CargoDescriptionInput } from "@/components/client/delivery-setup/CargoDescriptionInput";
import { DeliveryOfferCard } from "@/components/client/delivery-setup/DeliveryOfferCard";
import { DeliveryPrioritySelector, DeliveryPriority } from "@/components/client/delivery-setup/DeliveryPrioritySelector";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { FragileSwitch } from "@/components/client/delivery-setup/FragileSwitch";
import { WeightInput } from "@/components/client/delivery-setup/WeightInput";
import { DeliveryDataForm } from "@/components/client/delivery-setup/DeliveryDataForm";
import { DeliveryOfferSkeleton } from "@/components/client/delivery-setup/DeliveryOfferSkeleton";
import { Zap } from "lucide-react-native";

export type CargoSize = "small" | "medium" | "large";

interface DeliverySetupParams {
  vehicleType?: LogisticsVehicleType;
  preferScheduled?: boolean;
  pickup: { address: string; latitude: number; longitude: number };
  dropoff: { address: string; latitude: number; longitude: number };
  routeCoordinates?: Array<{ latitude: number; longitude: number }>;
  initialDistanceKm?: number;
  initialDurationMin?: number;
}

export default function DeliverySetupScreen({ navigation, route }: any) {
  const params = (route.params as DeliverySetupParams) || {};
  const detectedCity = useClientCityStore((state) => state.city);

  const [loadingPricing, setLoadingPricing] = useState(true);
  const [priceData, setPriceData] = useState<any>(null);
  const [pricingError, setPricingError] = useState<string | null>(null);
  const [pricingReloadTick, setPricingReloadTick] = useState(0);

  const [vehicleType, setVehicleType] = useState<LogisticsVehicleType>(params.vehicleType || "motorcycle");
  const [deliveryType, setDeliveryType] = useState<DeliveryType>("food");
  const [cargoDescription, setCargoDescription] = useState("");
  const [cargoSize, setCargoSize] = useState<CargoSize>("small");
  const [needsHelper, setNeedsHelper] = useState(false);
  const [isFragile, setIsFragile] = useState(false);
  const [approximateWeightKg, setApproximateWeightKg] = useState("");
  const [offerValue, setOfferValue] = useState<number>(20.0);
  const [priority, setPriority] = useState<DeliveryPriority>(0);
  const [scheduledOffsetMin, setScheduledOffsetMin] = useState<number>(60);
  const [pickupComplement, setPickupComplement] = useState("");
  const [dropoffComplement, setDropoffComplement] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [recipientInstructions, setRecipientInstructions] = useState("");
  const [deliveryPin, setDeliveryPin] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );

  const hasValidRoute = Boolean(params.pickup && params.dropoff);

  // Debounce text inputs that trigger pricing
  const debouncedCargoDescription = useDebounce(cargoDescription, 500);
  const debouncedWeight = useDebounce(approximateWeightKg, 500);

  const handleRegeneratePin = useCallback(() => {
    setDeliveryPin(String(Math.floor(1000 + Math.random() * 9000)));
  }, []);

  const handleOfferValueChange = useCallback((nextValue: number) => {
    const parsed = Number(nextValue);
    if (!Number.isFinite(parsed)) return;
    setOfferValue(Math.max(1, Math.round(parsed)));
  }, []);

  // Inline validation
  const nameError = useMemo(() => {
    if (!recipientName) return undefined;
    return recipientName.trim().length < 2 ? "Nome muito curto" : undefined;
  }, [recipientName]);

  const phoneError = useMemo(() => {
    if (!recipientPhone) return undefined;
    const digits = recipientPhone.replace(/\D/g, "");
    if (digits.length < 10) return "Telefone incompleto";
    return undefined;
  }, [recipientPhone]);

  useEffect(() => {
    const refreshPricing = async () => {
      if (!params.pickup || !params.dropoff) {
        setPricingError("Origem e destino nao foram definidos. Volte e selecione os enderecos.");
        setLoadingPricing(false);
        return;
      }
      try {
        setPricingError(null);
        setLoadingPricing(true);
        const parsedWeight = parseFloat(debouncedWeight);
        const res = await rideService.calculatePrice({
          pickup: params.pickup,
          dropoff: params.dropoff,
          vehicleType,
          deliveryType,
          cargoSize,
          priority,
          needsHelper,
          isFragile,
          approximateWeightKg: Number.isFinite(parsedWeight) ? parsedWeight : undefined,
          serviceType: "delivery",
          distance: params.initialDistanceKm ? Math.round(params.initialDistanceKm * 1000) : undefined,
          duration: params.initialDurationMin ? Math.round(params.initialDurationMin * 60) : undefined,
        });

        setPriceData(res);
        const smartSuggestion = res.smartPricing?.suggestedPrice || res.pricing?.total || 20;
        setOfferValue(Math.round(smartSuggestion));
      } catch (e: any) {
        setPricingError(e?.message || "Falha ao calcular o preco da entrega.");
        setPriceData(null);
      } finally {
        setLoadingPricing(false);
      }
    };
    refreshPricing();
  }, [
    vehicleType,
    deliveryType,
    cargoSize,
    needsHelper,
    isFragile,
    priority,
    debouncedWeight,
    debouncedCargoDescription,
    params.pickup?.latitude,
    params.dropoff?.latitude,
    params.initialDistanceKm,
    params.initialDurationMin,
    detectedCity,
    pricingReloadTick,
  ]);

  const handleReviewRequest = () => {
    if (!hasValidRoute) {
      Toast.show({
        type: "error",
        text1: "Rota invalida",
        text2: "Defina origem e destino antes de solicitar a entrega.",
      });
      return;
    }
    if (!priceData) {
      Toast.show({
        type: "error",
        text1: "Preco indisponivel",
        text2: "Aguardando cotacao da entrega. Tente novamente em instantes.",
      });
      return;
    }
    if (!Number.isFinite(offerValue) || offerValue <= 0) {
      Toast.show({
        type: "error",
        text1: "Valor de oferta invalido",
        text2: "Defina uma oferta maior que zero.",
      });
      return;
    }
    if (!recipientName.trim() || !recipientPhone.trim() || nameError || phoneError) {
      Toast.show({
        type: "error",
        text1: "Dados do recebedor invalidos",
        text2: nameError || phoneError || "Informe nome e telefone do recebedor.",
      });
      return;
    }


    navigation.navigate("DeliveryReview", {
      pickup: params.pickup,
      dropoff: params.dropoff,
      routeCoordinates: params.routeCoordinates,
      preferScheduled: Boolean(params.preferScheduled),
      scheduledOffsetMin,
      vehicleType,
      deliveryType,
      cargoSize,
      needsHelper,
      isFragile,
      approximateWeightKg,
      priority,
      cargoDescription,
      pickupComplement,
      dropoffComplement,
      recipientName,
      recipientPhone,
      recipientInstructions,
      deliveryPin,
      offerValue,
      pricingSnapshot: priceData,
    });
  };

  const minHintRaw = Number(priceData?.smartPricing?.minimumPrice);
  const maxHintRaw = Number(priceData?.smartPricing?.priorityPrice);
  const minHint = Number.isFinite(minHintRaw) ? minHintRaw : 15;
  const maxHint = Number.isFinite(maxHintRaw) ? maxHintRaw : 35;

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#091A2F]">
      <View className="absolute inset-0 bg-[#091A2F]" />

      <DeliverySetupHeader onBack={navigation.goBack} />

      <ScrollView
        className="flex-1 pt-28"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 16 }}
      >
        <DeliverySummaryCard
          originAddress={params.pickup?.address || "Origem nao informada"}
          dropoffAddress={params.dropoff?.address || "Destino nao informado"}
          distance={priceData?.distance?.text || (params.initialDistanceKm ? `${params.initialDistanceKm.toFixed(1)} km` : "...")}
          duration={priceData?.duration?.text || (params.initialDurationMin ? `${Math.ceil(params.initialDurationMin)} min` : "...")}
        />
        {!hasValidRoute && (
          <View className="mx-4 mb-4 rounded-xl border border-red-400/40 bg-red-500/10 px-3 py-3">
            <Text className="text-red-300 text-[12px] font-semibold">
              Origem/destino ausentes. Volte para a tela anterior e selecione os enderecos para continuar.
            </Text>
          </View>
        )}
        {params.preferScheduled && (
          <View className="mx-4 mb-2 rounded-xl border border-[#fbbf24]/35 bg-[#fbbf24]/10 px-3 py-2">
            <Text className="text-[#fbbf24] text-[12px] font-bold">
              Baixa oferta detectada: recomendamos agendar para aumentar chance de aceite.
            </Text>
            <View className="mt-2 flex-row gap-2">
              {[30, 60, 120].map((minutes) => (
                <TouchableOpacity
                  key={minutes}
                  onPress={() => setScheduledOffsetMin(minutes)}
                  className={`rounded-full px-3 py-1 ${
                    scheduledOffsetMin === minutes ? "bg-[#fbbf24]" : "bg-[#fbbf24]/15 border border-[#fbbf24]/40"
                  }`}
                >
                  <Text className={`text-[11px] font-semibold ${scheduledOffsetMin === minutes ? "text-[#091A2F]" : "text-[#fbbf24]"}`}>
                    {minutes} min
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        <View className="h-[1px] bg-white/[0.03] w-full my-2" />

        <VehicleSelector selected={vehicleType} onSelect={setVehicleType} pickupLocation={params.pickup} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6" />

        <DeliveryTypeSelector selected={deliveryType} onSelect={setDeliveryType} vehicleType={vehicleType} />

        {(vehicleType === "van" || vehicleType === "truck") && (
          <View className="mx-6 mb-4 rounded-xl border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-3 py-2">
            <Text className="text-[#7dd3fc] text-[12px] font-semibold">
              Frete {vehicleType === "truck" ? "de caminhao" : "de van"}: detalhe acesso no local e o peso da carga para melhorar o aceite.
            </Text>
          </View>
        )}

        <CargoDescriptionInput value={cargoDescription} onChange={setCargoDescription} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <CargoSizeSelector value={cargoSize} onChange={setCargoSize} />

        <HelperSwitch enabled={needsHelper} onToggle={setNeedsHelper} />

        <FragileSwitch enabled={isFragile} onToggle={setIsFragile} />

        <WeightInput value={approximateWeightKg} onChange={setApproximateWeightKg} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <DeliveryPrioritySelector value={priority} onChange={setPriority} />

        <View className="h-[1px] bg-white/[0.03] w-full mb-6 mt-2" />

        <DeliveryDataForm
          pickupComplement={pickupComplement}
          dropoffComplement={dropoffComplement}
          recipientName={recipientName}
          recipientPhone={recipientPhone}
          recipientInstructions={recipientInstructions}
          deliveryPin={deliveryPin}
          onPickupComplementChange={setPickupComplement}
          onDropoffComplementChange={setDropoffComplement}
          onRecipientNameChange={setRecipientName}
          onRecipientPhoneChange={setRecipientPhone}
          onRecipientInstructionsChange={setRecipientInstructions}
          onDeliveryPinChange={setDeliveryPin}
          onRegeneratePin={handleRegeneratePin}
          nameError={nameError}
          phoneError={phoneError}
        />

        {loadingPricing ? (
          <DeliveryOfferSkeleton />
        ) : pricingError ? (
          <View className="mx-4 mb-4 rounded-xl border border-amber-300/40 bg-amber-500/10 px-3 py-3">
            <Text className="text-amber-200 text-[12px] font-semibold">{pricingError}</Text>
            <TouchableOpacity onPress={() => setPricingReloadTick((prev) => prev + 1)} className="mt-2 self-start rounded-full border border-amber-300/50 px-3 py-1">
              <Text className="text-amber-200 text-[11px] font-bold">Recarregar cotacao</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <DeliveryOfferCard value={offerValue} suggestedMin={minHint} suggestedMax={maxHint} onChange={handleOfferValueChange} />
            <View className="items-center mb-6">
              <View className="flex-row items-center bg-[#1E2D3D] border border-white/5 px-4 py-2 rounded-full shadow-md">
                <Zap size={11} color="#02de95" className="mr-1.5" />
                <Text className="text-white/80 text-[11px] font-bold">Preco sugerido: R$ {Math.round(minHint)} - R$ {Math.round(maxHint)}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      <SearchDeliveryButton loading={loadingPricing} onPress={handleReviewRequest} label="Revisar Pedido" />
    </KeyboardAvoidingView>
  );
}
