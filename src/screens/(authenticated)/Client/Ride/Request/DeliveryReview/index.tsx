import React, { useMemo, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View, Clipboard } from "react-native";
import Toast from "react-native-toast-message";
import { MotiView } from "moti";
import {
  Truck, Package, Ruler, User, Phone, FileText, Hash,
  ShieldCheck, Clock, MapPin, ChevronLeft, Banknote, Zap,
  Copy, Calendar, Info, Scale, AlertTriangle
} from "lucide-react-native";

import rideService, { CreateRideRequest } from "@/services/ride.service";
import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { DeliverySummaryCard } from "@/components/client/delivery-setup/DeliverySummaryCard";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { formatBRL } from "@/utils/mappers";

const PRIORITY_LABELS: Record<number, { label: string; color: string; bg: string; icon: string }> = {
  0: { label: "Econômico", color: "#38bdf8", bg: "bg-sky-500/10", icon: "🐢" },
  1: { label: "Rápido", color: "#02de95", bg: "bg-primary/10", icon: "⚡" },
  2: { label: "Urgente", color: "#ef4444", bg: "bg-red-500/10", icon: "🚀" },
};

const VEHICLE_LABELS: Record<string, string> = {
  motorcycle: "Moto", car: "Carro", van: "Van", truck: "Caminhão",
};

function SectionHeader({ icon: Icon, title }: { icon: any; title: string }) {
  return (
    <View className="flex-row items-center gap-2.5 mb-4">
      <View className="w-9 h-9 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
        <Icon size={16} color="#02de95" strokeWidth={2.5} />
      </View>
      <Text className="text-white text-sm font-extrabold tracking-wide">{title}</Text>
    </View>
  );
}

export default function DeliveryReviewScreen({ navigation, route }: any) {
  const params = route.params || {};
  const [submitting, setSubmitting] = useState(false);

  const suggestedMin = useMemo(() => Number(params?.pricingSnapshot?.smartPricing?.minimumPrice || 0), [params]);
  const suggestedMax = useMemo(() => Number(params?.pricingSnapshot?.smartPricing?.priorityPrice || 0), [params]);
  const priorityInfo = PRIORITY_LABELS[params.priority] || PRIORITY_LABELS[0];
  const offerValue = Number(params.offerValue || 0);

  const validatePayload = () => {
    if (!params?.pickup?.latitude || !params?.dropoff?.latitude) {
      Toast.show({ type: "error", text1: "Dados incompletos", text2: "Origem e destino são obrigatórios." });
      return false;
    }
    if (!params?.pricingSnapshot?.pricing || !params?.pricingSnapshot?.distance || !params?.pricingSnapshot?.duration) {
      Toast.show({ type: "error", text1: "Cotação expirada", text2: "Volte e recalcule os valores antes de publicar." });
      return false;
    }
    if (!Number.isFinite(offerValue) || offerValue <= 0) {
      Toast.show({ type: "error", text1: "Oferta inválida", text2: "Defina uma oferta válida para continuar." });
      return false;
    }
    if (!String(params?.recipientName || "").trim() || !String(params?.recipientPhone || "").trim()) {
      Toast.show({ type: "error", text1: "Recebedor incompleto", text2: "Informe nome e telefone do recebedor." });
      return false;
    }
    return true;
  };

  const handleCopyPin = () => {
    if (params.deliveryPin) {
      Clipboard.setString(params.deliveryPin);
      Toast.show({
        type: "success",
        text1: "Código Copiado! 🔐",
        text2: "Envie este código ao recebedor da entrega.",
        position: "top",
      });
    }
  };

  const handlePublish = async () => {
    if (submitting) return;
    if (!validatePayload()) return;

    const backendPayload: CreateRideRequest = {
      serviceType: "delivery",
      vehicleType: params.vehicleType,
      pickup: params.pickup,
      dropoff: params.dropoff,
      routeCoordinates:
        Array.isArray(params.routeCoordinates) && params.routeCoordinates.length >= 2
          ? params.routeCoordinates
          : [
              { latitude: params.pickup?.latitude, longitude: params.pickup?.longitude },
              { latitude: params.dropoff?.latitude, longitude: params.dropoff?.longitude },
            ],
      pricing: { ...params.pricingSnapshot.pricing, total: offerValue },
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
      negotiation: { enabled: true, clientOffer: offerValue },
      scheduledFor: params.preferScheduled
        ? new Date(Date.now() + Number(params.scheduledOffsetMin || 60) * 60 * 1000).toISOString()
        : undefined,
    };

    try {
      setSubmitting(true);
      const created = await rideService.create(backendPayload);
      if (created?.status === "scheduled") {
        Toast.show({ type: "success", text1: "Entrega agendada", text2: "Seu pedido foi agendado e aparecerá em pedidos ativos." });
        navigation.navigate("ActiveOrders");
        return;
      }
      navigation.replace("OrderSent", { rideId: created._id });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao publicar entrega", text2: e?.message || "Verifique sua conexão" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#091A2F]">
      <View className="absolute inset-0 bg-[#091A2F]" />
      <DeliverySetupHeader onBack={navigation.goBack} title="Revisar Entrega" subtitle="Confira os detalhes e faça sua oferta." />

      <ScrollView
        className="flex-1 pt-28"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 180, paddingTop: 16 }}
      >
        {/* Rota (Summary) */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400 }}
        >
          <DeliverySummaryCard
            originAddress={params.pickup?.address || "Origem não informada"}
            dropoffAddress={params.dropoff?.address || "Destino não informado"}
            distance={params.pricingSnapshot?.distance?.text || "-"}
            duration={params.pricingSnapshot?.duration?.text || "-"}
          />
        </MotiView>

        {/* Detalhes da entrega (Grid Moderno) */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 100 }}
          className="mx-6 mb-4 rounded-2xl border border-white/[0.05] bg-[#11253E] p-5 shadow-lg shadow-black/20"
        >
          <SectionHeader icon={Package} title="Detalhes da entrega" />

          {/* Grid de Specs */}
          <View className="flex-row flex-wrap gap-2.5 mb-4">
            {/* Veículo */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Truck size={13} color="#64748b" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Veículo</Text>
              </View>
              <Text className="text-white text-xs font-black">{VEHICLE_LABELS[params.vehicleType] || params.vehicleType || "-"}</Text>
            </View>

            {/* Tipo */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Package size={13} color="#64748b" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tipo</Text>
              </View>
              <Text className="text-white text-xs font-black capitalize">{String(params.deliveryType || "-")}</Text>
            </View>

            {/* Tamanho */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Ruler size={13} color="#64748b" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Tamanho</Text>
              </View>
              <Text className="text-white text-xs font-black">
                {params.cargoSize === "small" ? "Pequeno" : params.cargoSize === "medium" ? "Médio" : params.cargoSize === "large" ? "Grande" : params.cargoSize || "-"}
              </Text>
            </View>

            {/* Prioridade */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center gap-1.5 mb-1">
                <Zap size={13} color="#64748b" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Prioridade</Text>
              </View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs">{priorityInfo.icon}</Text>
                <Text className="text-xs font-black" style={{ color: priorityInfo.color }}>{priorityInfo.label}</Text>
              </View>
            </View>

            {/* Ajudante */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Ajudante</Text>
                <View className={`px-2 py-0.5 rounded-full ${params.needsHelper ? "bg-[#02de95]/15 border border-[#02de95]/30" : "bg-white/5 border border-white/10"}`}>
                  <Text className={`text-[9px] font-bold ${params.needsHelper ? "text-[#02de95]" : "text-slate-400"}`}>
                    {params.needsHelper ? "Sim" : "Não"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Carga Frágil */}
            <View className="flex-1 min-w-[45%] bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Frágil</Text>
                <View className={`px-2 py-0.5 rounded-full ${params.isFragile ? "bg-amber-500/15 border border-amber-500/30" : "bg-white/5 border border-white/10"}`}>
                  <Text className={`text-[9px] font-bold ${params.isFragile ? "text-amber-500" : "text-slate-400"}`}>
                    {params.isFragile ? "Sim" : "Não"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Rodapé do Bloco de Detalhes */}
          <View className="bg-[#0E1D31] border border-white/[0.04] p-3 rounded-xl gap-2">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-1.5">
                <Scale size={13} color="#64748b" />
                <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Peso aproximado</Text>
              </View>
              <Text className="text-white text-xs font-bold">{params.approximateWeightKg ? `${params.approximateWeightKg} kg` : "Não informado"}</Text>
            </View>

            {params.cargoDescription ? (
              <View className="border-t border-white/[0.04] pt-2 mt-1">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <FileText size={13} color="#64748b" />
                  <Text className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Descrição dos itens</Text>
                </View>
                <Text className="text-slate-300 text-xs font-medium leading-relaxed">{params.cargoDescription}</Text>
              </View>
            ) : null}
          </View>
        </MotiView>

        {/* Recebedor (Design Clean e Organizado) */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 200 }}
          className="mx-6 mb-4 rounded-2xl border border-white/[0.05] bg-[#11253E] p-5 shadow-lg shadow-black/20"
        >
          <SectionHeader icon={User} title="Destinatário & Segurança" />

          <View className="bg-[#0E1D31] border border-white/[0.04] p-3.5 rounded-xl gap-3.5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <View className="w-7 h-7 rounded-full bg-white/5 items-center justify-center">
                  <User size={13} color="#64748b" />
                </View>
                <View>
                  <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Nome</Text>
                  <Text className="text-white text-xs font-bold mt-0.5">{params.recipientName || "-"}</Text>
                </View>
              </View>

              <View className="flex-row items-center gap-2 min-w-[40%]">
                <View className="w-7 h-7 rounded-full bg-white/5 items-center justify-center">
                  <Phone size={13} color="#64748b" />
                </View>
                <View>
                  <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Telefone</Text>
                  <Text className="text-white text-xs font-bold mt-0.5">{params.recipientPhone || "-"}</Text>
                </View>
              </View>
            </View>

            {params.recipientInstructions ? (
              <View className="border-t border-white/[0.04] pt-3.5">
                <View className="flex-row items-center gap-1.5 mb-1">
                  <Info size={13} color="#64748b" />
                  <Text className="text-slate-500 text-[9px] font-bold uppercase tracking-wider">Instruções de entrega</Text>
                </View>
                <Text className="text-slate-300 text-xs font-medium">{params.recipientInstructions}</Text>
              </View>
            ) : null}

            {(params.pickupComplement || params.dropoffComplement) && (
              <View className="border-t border-white/[0.04] pt-3.5 gap-2">
                {params.pickupComplement ? (
                  <View className="flex-row items-center gap-2">
                    <MapPin size={12} color="#02de95" />
                    <Text className="text-slate-300 text-xs flex-1" numberOfLines={1}>
                      <Text className="text-slate-500 font-bold text-[10px] uppercase">Coleta: </Text>
                      {params.pickupComplement}
                    </Text>
                  </View>
                ) : null}
                {params.dropoffComplement ? (
                  <View className="flex-row items-center gap-2">
                    <MapPin size={12} color="#ef4444" />
                    <Text className="text-slate-300 text-xs flex-1" numberOfLines={1}>
                      <Text className="text-slate-500 font-bold text-[10px] uppercase">Entrega: </Text>
                      {params.dropoffComplement}
                    </Text>
                  </View>
                ) : null}
              </View>
            )}
          </View>

          {/* PIN destacado super premium */}
          <TouchableOpacity
            onPress={handleCopyPin}
            activeOpacity={0.8}
            className="mt-4 rounded-xl border border-dashed border-primary/40 bg-primary/[0.03] p-4 flex-row items-center justify-between"
          >
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/20">
                <ShieldCheck size={20} color="#02de95" strokeWidth={2} />
              </View>
              <View>
                <Text className="text-slate-400 text-[9px] font-extrabold uppercase tracking-widest">Código de segurança</Text>
                <Text className="text-white text-2xl font-black tracking-[6px] mt-0.5">{params.deliveryPin || "----"}</Text>
              </View>
            </View>
            <View className="items-center bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg flex-row gap-1.5">
              <Copy size={11} color="#94a3b8" />
              <Text className="text-slate-300 font-bold text-[9px] uppercase tracking-wider">Copiar</Text>
            </View>
          </TouchableOpacity>
        </MotiView>

        {/* Oferta Financeira (Luxury Display) */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 400, delay: 300 }}
          className="mx-6 mb-4 rounded-2xl border-2 border-primary/30 bg-[#11253E] p-5 shadow-2xl shadow-primary/10 relative overflow-hidden"
        >
          {/* Luz sutil de fundo */}
          <View className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-primary/5 blur-3xl" />

          <SectionHeader icon={Banknote} title="Sua oferta sugerida" />

          <View className="items-center py-4 bg-[#0E1D31] border border-white/[0.04] rounded-2xl mt-1">
            <Text className="text-slate-500 text-[10px] font-extrabold uppercase tracking-widest mb-1">Valor Oferecido</Text>
            <Text className="text-[#02de95] text-5xl font-black tracking-tighter">{formatBRL(offerValue)}</Text>
            
            <View className="mt-4 flex-row items-center gap-2.5 bg-white/[0.04] border border-white/[0.06] rounded-full px-4.5 py-2">
              <Info size={12} color="#02de95" />
              <Text className="text-slate-400 text-[10px] font-medium">Faixa recomendada:</Text>
              <Text className="text-white text-[10px] font-extrabold">
                {formatBRL(Number.isFinite(suggestedMin) ? suggestedMin : 0)} — {formatBRL(Number.isFinite(suggestedMax) ? suggestedMax : 0)}
              </Text>
            </View>
          </View>

          {params.preferScheduled && (
            <View className="mt-3.5 rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 flex-row items-center gap-3">
              <Calendar size={15} color="#f59e0b" />
              <Text className="text-amber-500 text-[10px] font-extrabold uppercase tracking-wider">
                Agendado para +{params.scheduledOffsetMin || 60} minutos
              </Text>
            </View>
          )}
        </MotiView>

        {/* Botão de Edição (Estilo Secundário Super Clean) */}
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          className="mx-6 mb-6 h-12 rounded-xl bg-slate-800/40 border border-white/[0.06] flex-row items-center justify-center gap-2"
        >
          <ChevronLeft size={16} color="#64748b" strokeWidth={2.5} />
          <Text className="text-slate-400 font-bold text-xs uppercase tracking-widest">Voltar e Ajustar</Text>
        </TouchableOpacity>

        {submitting && (
          <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }} className="items-center justify-center mb-6">
            <ActivityIndicator color="#02de95" size="large" />
            <Text className="text-[#02de95] text-xs mt-2 font-bold uppercase tracking-widest">Enviando solicitação...</Text>
          </MotiView>
        )}
      </ScrollView>

      {/* Botão Principal Fixo Premium */}
      <SearchDeliveryButton loading={submitting} onPress={handlePublish} label="Enviar Para Entregadores" />
    </KeyboardAvoidingView>
  );
}
