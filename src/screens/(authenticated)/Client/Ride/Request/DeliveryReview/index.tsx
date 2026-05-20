import React, { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-toast-message";

import rideService, { CreateRideRequest } from "@/services/ride.service";
import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { DeliverySummaryCard } from "@/components/client/delivery-setup/DeliverySummaryCard";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { formatBRL } from "@/utils/mappers";

export default function DeliveryReviewScreen({ navigation, route }: any) {
  const params = route.params || {};
  const [submitting, setSubmitting] = useState(false);

  const suggestedMin = useMemo(() => Number(params?.pricingSnapshot?.smartPricing?.minimumPrice || 0), [params]);
  const suggestedMax = useMemo(() => Number(params?.pricingSnapshot?.smartPricing?.priorityPrice || 0), [params]);

  const validatePayload = () => {
    if (!params?.pickup?.latitude || !params?.dropoff?.latitude) {
      Toast.show({
        type: "error",
        text1: "Dados incompletos",
        text2: "Origem e destino sao obrigatorios.",
      });
      return false;
    }
    if (!params?.pricingSnapshot?.pricing || !params?.pricingSnapshot?.distance || !params?.pricingSnapshot?.duration) {
      Toast.show({
        type: "error",
        text1: "Cotacao expirada",
        text2: "Volte e recalcule os valores antes de publicar.",
      });
      return false;
    }
    if (!Number.isFinite(Number(params?.offerValue)) || Number(params?.offerValue) <= 0) {
      Toast.show({
        type: "error",
        text1: "Oferta invalida",
        text2: "Defina uma oferta valida para continuar.",
      });
      return false;
    }
    if (!String(params?.recipientName || "").trim() || !String(params?.recipientPhone || "").trim()) {
      Toast.show({
        type: "error",
        text1: "Recebedor incompleto",
        text2: "Informe nome e telefone do recebedor.",
      });
      return false;
    }
    return true;
  };

  const handlePublish = async () => {
    if (submitting) return;
    if (!validatePayload()) return;

    const paymentMethodMap: Record<string, string> = { cash: "cash", pix: "pix", card: "card" };
    const backendPaymentMethod = paymentMethodMap[params.paymentMethod] || "cash";

    const backendPayload: CreateRideRequest = {
      serviceType: "delivery",
      vehicleType: params.vehicleType,
      pickup: params.pickup,
      dropoff: params.dropoff,
      cityId: params.cityId,
      pricing: {
        ...params.pricingSnapshot.pricing,
        total: Number(params.offerValue),
      },
      distance: params.pricingSnapshot.distance,
      duration: params.pricingSnapshot.duration,
      details: {
        itemType: params.deliveryType,
        needsHelper: Boolean(params.needsHelper),
        priority: params.priority,
        cargoSize: params.cargoSize,
        pickupComplement: params.pickupComplement,
        dropoffComplement: params.dropoffComplement,
        recipientName: params.recipientName,
        recipientPhone: params.recipientPhone,
        recipientInstructions: params.recipientInstructions,
        deliveryPin: params.deliveryPin,
        specialInstructions: `[Tamanho: ${params.cargoSize}] ${params.cargoDescription || ""}`.trim(),
      },
      payment: {
        method: { type: backendPaymentMethod as any },
      },
      negotiation: {
        enabled: true,
        clientOffer: Number(params.offerValue),
      },
      scheduledFor: params.preferScheduled
        ? new Date(Date.now() + Number(params.scheduledOffsetMin || 60) * 60 * 1000).toISOString()
        : undefined,
    };

    try {
      setSubmitting(true);
      const created = await rideService.create(backendPayload);

      if (created?.status === "scheduled") {
        Toast.show({
          type: "success",
          text1: "Entrega agendada",
          text2: "Seu pedido foi agendado e aparecera em pedidos ativos.",
        });
        navigation.replace("ActiveOrders");
        return;
      }

      navigation.replace("OrderSent", {
        rideId: created._id,
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao publicar entrega",
        text2: e?.message || "Verifique sua conexao",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#091A2F]">
      <View className="absolute inset-0 bg-[#091A2F]" />
      <DeliverySetupHeader onBack={navigation.goBack} />

      <ScrollView className="flex-1 pt-28" contentContainerStyle={{ paddingBottom: 180, paddingTop: 16 }}>
        <DeliverySummaryCard
          originAddress={params.pickup?.address || "Origem nao informada"}
          dropoffAddress={params.dropoff?.address || "Destino nao informado"}
          distance={params.pricingSnapshot?.distance?.text || "-"}
          duration={params.pricingSnapshot?.duration?.text || "-"}
        />

        <View className="mx-4 mt-2 rounded-2xl border border-white/10 bg-[#11253E] px-4 py-4">
          <Text className="text-white font-bold text-base mb-3">Resumo da entrega</Text>
          <Text className="text-white/75 text-xs mb-1">Veiculo: {params.vehicleType}</Text>
          <Text className="text-white/75 text-xs mb-1">Tipo: {params.deliveryType}</Text>
          <Text className="text-white/75 text-xs mb-1">Tamanho: {params.cargoSize}</Text>
          <Text className="text-white/75 text-xs mb-1">Ajudante: {params.needsHelper ? "Sim" : "Nao"}</Text>
          <Text className="text-white/75 text-xs mb-1">Fragil: {params.isFragile ? "Sim" : "Nao"}</Text>
          <Text className="text-white/75 text-xs mb-1">Peso aprox: {params.approximateWeightKg || "Nao informado"} kg</Text>
          <Text className="text-white/75 text-xs mb-1">Prioridade: {params.priority}</Text>
          <Text className="text-white/75 text-xs">Descricao: {params.cargoDescription || "Nao informada"}</Text>
        </View>

        <View className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#11253E] px-4 py-4">
          <Text className="text-white font-bold text-base mb-3">Recebedor</Text>
          <Text className="text-white/75 text-xs mb-1">Nome: {params.recipientName || "-"}</Text>
          <Text className="text-white/75 text-xs mb-1">Telefone: {params.recipientPhone || "-"}</Text>
          <Text className="text-white/75 text-xs mb-1">Instrucao: {params.recipientInstructions || "-"}</Text>
          <Text className="text-white/75 text-xs mb-1">Compl. coleta: {params.pickupComplement || "-"}</Text>
          <Text className="text-white/75 text-xs mb-1">Compl. entrega: {params.dropoffComplement || "-"}</Text>
          <Text className="text-white/75 text-xs">PIN: {params.deliveryPin || "Nao informado"}</Text>
        </View>

        <View className="mx-4 mt-3 rounded-2xl border border-white/10 bg-[#11253E] px-4 py-4">
          <Text className="text-white font-bold text-base mb-3">Oferta e Pagamento</Text>
          <Text className="text-white text-lg font-extrabold mb-1">{formatBRL(Number(params.offerValue || 0))}</Text>
          <Text className="text-white/70 text-xs mb-2">Faixa sugerida: {formatBRL(Number.isFinite(suggestedMin) ? suggestedMin : 0)} - {formatBRL(Number.isFinite(suggestedMax) ? suggestedMax : 0)}</Text>
          <View className="flex-row items-center mt-1 bg-white/5 rounded-xl px-3 py-2">
            <Text className="text-white/60 text-xs">Pagamento: </Text>
            <Text className="text-[#02de95] font-bold text-xs">{{
              cash: "Dinheiro",
              pix: "PIX",
              card: "Cart\u00e3o",
            }[params.paymentMethod as string] || "Dinheiro"}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => navigation.goBack()} className="mx-4 mt-4 h-11 rounded-xl border border-white/20 items-center justify-center">
          <Text className="text-white/80 font-bold text-xs uppercase">Editar dados</Text>
        </TouchableOpacity>

        {submitting && (
          <View className="mt-4 items-center justify-center">
            <ActivityIndicator color="#02de95" />
            <Text className="text-white/60 text-xs mt-2">Publicando entrega...</Text>
          </View>
        )}
      </ScrollView>

      <SearchDeliveryButton loading={submitting} onPress={handlePublish} label="Enviar Para Entregadores" />
    </KeyboardAvoidingView>
  );
}
