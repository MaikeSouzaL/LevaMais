import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, TouchableOpacity, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import rideService from "@/services/ride.service";
import webSocketService from "@/services/websocket.service";
import { DeliverySetupHeader } from "@/components/client/delivery-setup/DeliverySetupHeader";
import { SearchDeliveryButton } from "@/components/client/delivery-setup/SearchDeliveryButton";
import { formatBRL } from "@/utils/mappers";

type UiPaymentMethod = "cash" | "card_app" | "card_driver" | "wallet" | "pix_app";

const PAYMENT_METHODS: Array<{ id: UiPaymentMethod; label: string; backendMethod: "cash" | "card" | "wallet" | "pix" }> = [
  { id: "cash", label: "Dinheiro", backendMethod: "cash" },
  { id: "card_app", label: "Cartao no app", backendMethod: "card" },
  { id: "card_driver", label: "Cartao com motorista", backendMethod: "card" },
  { id: "wallet", label: "Carteira", backendMethod: "wallet" },
  { id: "pix_app", label: "Pix no app", backendMethod: "pix" },
];

const PAYMENT_DEADLINE_SECONDS = 5 * 60; // 5 minutos

export default function DeliveryPaymentConfirmScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const rideId = String(route.params?.rideId || "");

  const [selectedMethod, setSelectedMethod] = useState<UiPaymentMethod>("cash");
  const [submitting, setSubmitting] = useState(false);
  const [rideData, setRideData] = useState<any>(null);
  const [loadingRide, setLoadingRide] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(PAYMENT_DEADLINE_SECONDS);
  const [expired, setExpired] = useState(false);
  const expiredRef = useRef(false);
  const pollRef = useRef<any>(null);

  // Load ride data
  useEffect(() => {
    const loadRide = async () => {
      if (!rideId) {
        setLoadingRide(false);
        return;
      }
      try {
        const ride = await rideService.getById(rideId);
        setRideData(ride);
      } catch {
        Toast.show({ type: "error", text1: "Erro", text2: "Nao foi possivel carregar a entrega." });
      } finally {
        setLoadingRide(false);
      }
    };
    loadRide();
  }, [rideId]);

  // Timer countdown + polling
  useEffect(() => {
    if (!rideId || expiredRef.current) return;

    // Countdown
    const timer = setInterval(() => {
      setSecondsLeft((prev: number) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!expiredRef.current) {
            expiredRef.current = true;
            setExpired(true);
            handleExpired();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll ride status
    const poll = setInterval(async () => {
      try {
        const ride = await rideService.getById(rideId);
        if (!ride || expiredRef.current) return;
        // Se o status mudou de payment_pending, reagir
        if (ride.status && ride.status !== "payment_pending") {
          clearInterval(timer);
          clearInterval(poll);
          if (ride.status === "driver_assigned") {
            // Nao precisa fazer nada, so navega
          } else if (ride.status === "requesting") {
            // Timeout ocorreu no backend
            setExpired(true);
            expiredRef.current = true;
            Toast.show({
              type: "error",
              text1: "Tempo de pagamento expirado",
              text2: "O motorista foi liberado. Volte para as propostas.",
            });
          }
        }
      } catch {}
    }, 5000);

    // WebSocket listener para expiracao
    const onPaymentExpired = (data: any) => {
      if (data?.rideId === rideId && !expiredRef.current) {
        expiredRef.current = true;
        setExpired(true);
        Toast.show({
          type: "error",
          text1: "Tempo de pagamento expirado",
          text2: "O motorista foi liberado.",
        });
      }
    };
    webSocketService.on("ride-payment-expired", onPaymentExpired);

    pollRef.current = { timer, poll };

    return () => {
      clearInterval(timer);
      clearInterval(poll);
      webSocketService.off("ride-payment-expired", onPaymentExpired);
    };
  }, [rideId]);

  const handleExpired = async () => {
    try {
      await rideService.cancelPaymentSelection(rideId);
    } catch {}
    navigation.replace("SearchingDriver", { rideId, serviceType: "delivery" });
  };

  const finalAmount = useMemo(() => {
    const agreed = Number(rideData?.negotiation?.finalAgreedPrice || 0);
    if (Number.isFinite(agreed) && agreed > 0) return agreed;
    return Number(rideData?.pricing?.total || 0);
  }, [rideData]);

  const selectedDriverName = useMemo(() => {
    const driver = rideData?.driverId;
    if (!driver || typeof driver === "string") return "Motorista selecionado";
    return driver?.name || "Motorista selecionado";
  }, [rideData]);

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  const handleConfirm = async () => {
    if (!rideId || submitting || expired) return;
    try {
      setSubmitting(true);
      const backendMethod =
        PAYMENT_METHODS.find((item) => item.id === selectedMethod)?.backendMethod || "cash";
      const ride = await rideService.confirmNegotiationPayment(rideId, { method: backendMethod });
      Toast.show({
        type: "success",
        text1: "Pagamento confirmado",
        text2: "Entrega liberada para o motorista.",
      });
      if (pollRef.current) {
        clearInterval(pollRef.current.timer);
        clearInterval(pollRef.current.poll);
      }
      navigation.reset({
        index: 0,
        routes: [{ name: "RideTracking", params: { rideId: ride?._id || rideId } }],
      });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao confirmar pagamento",
        text2: e?.response?.data?.error || e?.message || "Tente novamente.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSelection = async () => {
    if (submitting) return;
    try {
      setSubmitting(true);
      await rideService.cancelPaymentSelection(rideId);
      Toast.show({
        type: "info",
        text1: "Selecao cancelada",
        text2: "O motorista foi liberado. Seu pedido voltou para busca.",
      });
      navigation.replace("SearchingDriver", { rideId, serviceType: "delivery" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: e?.message || "Nao foi possivel cancelar.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1 bg-[#091A2F]">
      <View className="absolute inset-0 bg-[#091A2F]" />
      <DeliverySetupHeader onBack={handleCancelSelection} />

      <View className="flex-1 pt-28 px-4">
        {/* Timer */}
        <View className={`rounded-2xl px-4 py-3 mb-4 items-center ${secondsLeft <= 60 ? "border border-red-500/30 bg-red-500/10" : "border border-white/10 bg-[#11253E]"}`}>
          <Text className={`font-extrabold text-2xl ${secondsLeft <= 60 ? "text-red-400" : "text-[#02de95]"}`}>
            {minutes.toString().padStart(2, "0")}:{secs.toString().padStart(2, "0")}
          </Text>
          <Text className="text-white/50 text-[10px] mt-1">
            {expired ? "Tempo expirado" : "Tempo restante para confirmar pagamento"}
          </Text>
        </View>

        {/* Summary */}
        <View className="rounded-2xl border border-white/10 bg-[#11253E] px-4 py-4 mb-4">
          <Text className="text-white font-bold text-base mb-1">Confirmar pagamento</Text>
          <Text className="text-white/70 text-xs">
            Entregador: {selectedDriverName}
          </Text>
          <Text className="text-white/70 text-xs">Valor final acordado</Text>
          <Text className="text-white font-extrabold text-2xl mt-2">{formatBRL(finalAmount)}</Text>
        </View>

        {expired ? (
          <View className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-6 items-center">
            <Text className="text-red-400 font-extrabold text-lg text-center mb-2">Tempo de pagamento expirado</Text>
            <Text className="text-white/60 text-xs text-center mb-4">O motorista foi liberado. Seu pedido voltou para a busca de entregadores.</Text>
            <TouchableOpacity
              onPress={handleExpired}
              className="h-12 rounded-xl bg-[#02de95] items-center justify-center w-full"
            >
              <Text className="text-[#091A2F] font-extrabold text-sm">Voltar para busca</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {loadingRide ? (
              <View className="items-center justify-center mt-6">
                <ActivityIndicator color="#02de95" />
              </View>
            ) : (
              <View className="rounded-2xl border border-white/10 bg-[#11253E] px-4 py-4">
                <Text className="text-white font-bold text-sm mb-3">Metodo de pagamento</Text>
                {PAYMENT_METHODS.map((item) => {
                  const selected = selectedMethod === item.id;
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => setSelectedMethod(item.id)}
                      className={`h-11 rounded-xl border px-3 mb-2 items-center justify-center ${
                        selected ? "border-[#02de95] bg-[#02de95]/10" : "border-white/15 bg-white/5"
                      }`}
                    >
                      <Text className={`text-xs font-bold uppercase ${selected ? "text-[#02de95]" : "text-white/80"}`}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </>
        )}
      </View>

      {!expired && (
        <>
          <SearchDeliveryButton loading={submitting || loadingRide} onPress={handleConfirm} label="Confirmar Pagamento" />
          <TouchableOpacity
            onPress={handleCancelSelection}
            disabled={submitting}
            className="items-center py-3"
          >
            <Text className="text-white/40 text-xs font-bold uppercase">Cancelar e liberar motorista</Text>
          </TouchableOpacity>
        </>
      )}
    </KeyboardAvoidingView>
  );
}
