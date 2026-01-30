import React, { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Image } from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import {
  MaterialIcons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";

type PaymentMethod = "credit_card" | "pix" | "cash";

import type { FinalOrderSummaryData } from "./components/FinalOrderSummarySheet";
import rideService from "../../../../services/ride.service";
import {
  mapServiceModeToApi,
  mapVehicleTypeToApi,
  formatBRL,
} from "../../../../utils/mappers";

type Params = {
  Payment: {
    amount: number;
    order?: FinalOrderSummaryData;
  };
};

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "Payment">>();
  const amount = route.params?.amount || 0;
  const order = route.params?.order;

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethod>("credit_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmPayment = async () => {
    setError(null);
    // MVP: ainda não processa pagamento.
    // Por enquanto, ao clicar em "Pagar" apenas cria a corrida (solicitação) e notifica/busca motorista.
    console.log(
      `Enviando solicitação de corrida de ${formatBRL(amount)} (método selecionado: ${selectedMethod})`,
    );

    if (!order) {
      // Mantém compatibilidade, mas sem order não dá pra criar corrida.
      (navigation as any).navigate("Home", {
        startSearch: true,
        searchData: {
          title: "Buscando motorista",
          price: formatBRL(amount),
          eta: "Chegada em ~5 min",
        },
      });
      return;
    }

    if (!order.pickupLatLng || !order.dropoffLatLng) {
      setError(
        "Faltam coordenadas de coleta/destino. Selecione no mapa e tente novamente.",
      );
      return;
    }

    try {
      setLoading(true);

      const apiVehicle = mapVehicleTypeToApi(order.vehicleType);
      const apiServiceType = mapServiceModeToApi(order.serviceMode);

      // Mapeia o resumo (UI) para o contrato do backend
      const ride = await rideService.create({
        serviceType: apiServiceType,
        vehicleType: apiVehicle,
        purposeId: order.purposeId,
        pickup: {
          address: order.pickupAddress,
          latitude: order.pickupLatLng.latitude,
          longitude: order.pickupLatLng.longitude,
        },
        dropoff: {
          address: order.dropoffAddress,
          latitude: order.dropoffLatLng.latitude,
          longitude: order.dropoffLatLng.longitude,
        },
        pricing: {
          basePrice: order.pricing.base,
          distancePrice: order.pricing.distancePrice,
          serviceFee: order.pricing.serviceFee,
          total: order.pricing.total,
          currency: "BRL",
        },
        distance: {
          value: Math.round((order.pricing.distanceKm || 0) * 1000),
          text: `${order.pricing.distanceKm?.toFixed?.(1) ?? order.pricing.distanceKm} km`,
        },
        duration: {
          value: (order.etaMinutes || 0) * 60,
          text: order.etaMinutes ? `${order.etaMinutes} min` : "",
        },
        details: {
          itemType: order.itemType,
          needsHelper: order.helperIncluded,
          insurance: (order.insuranceLevel as any) || "none",
        },
        payment: {
          method: {
            type: order.paymentMethodRaw || selectedMethod,
          },
        },
      });

      const searchData = {
        title: "Buscando motorista",
        price: formatBRL(amount),
        eta: order.etaText || "Chegada em ~5 min",
        rideId: ride._id,
      };

      (navigation as any).navigate("Home", {
        startSearch: true,
        rideId: ride._id,
        searchData,
      });
    } catch (e: any) {
      // Se já existe corrida ativa, backend retorna 400 com rideId
      const rideId = e?.response?.data?.rideId;
      const message = e?.response?.data?.error || e?.message;

      if (rideId) {
        setError("Você já possui uma corrida ativa. Abrindo...");
        try {
          (navigation as any).navigate("RideTracking", { rideId });
        } catch {}
        return;
      }

      setError(message || "Falha ao confirmar pedido. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const renderMethod = (
    id: PaymentMethod,
    icon: React.ReactNode,
    label: string,
    sublabel?: string,
  ) => {
    const isSelected = selectedMethod === id;
    return (
      <TouchableOpacity
        onPress={() => setSelectedMethod(id)}
        activeOpacity={0.8}
        style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: isSelected ? "rgba(2, 222, 149, 0.1)" : "#162e25",
          borderWidth: 1,
          borderColor: isSelected ? "#02de95" : "rgba(255,255,255,0.05)",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
        }}
      >
        <View style={{ width: 40, alignItems: "center" }}>{icon}</View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text
            style={{
              color: "white",
              fontSize: 16,
              fontWeight: "600",
              marginBottom: 2,
            }}
          >
            {label}
          </Text>
          {sublabel && (
            <Text style={{ color: "#9abcb0", fontSize: 12 }}>{sublabel}</Text>
          )}
        </View>
        <View
          style={{
            width: 20,
            height: 20,
            borderRadius: 10,
            borderWidth: 2,
            borderColor: isSelected ? "#02de95" : "#555",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {isSelected && (
            <View
              style={{
                width: 10,
                height: 10,
                borderRadius: 5,
                backgroundColor: "#02de95",
              }}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      {/* Header */}
      <View
        style={{
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ padding: 8, marginRight: 8 }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: "white", fontSize: 18, fontWeight: "800" }}>
          Pagamento
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: 24,
          paddingBottom: Math.max(insets.bottom, 24) + 96,
        }}
      >
        <Text
          style={{
            color: "#9abcb0",
            fontSize: 14,
            marginBottom: 24,
            textAlign: "center",
          }}
        >
          Valor a pagar
        </Text>
        <Text
          style={{
            color: "white",
            fontSize: 40,
            fontWeight: "800",
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          {formatBRL(amount)}
        </Text>

        <Text
          style={{
            color: "white",
            fontSize: 16,
            fontWeight: "700",
            marginBottom: 16,
          }}
        >
          Escolha a forma de pagamento
        </Text>

        {renderMethod(
          "credit_card",
          <MaterialIcons name="credit-card" size={24} color="white" />,
          "Cartão de Crédito",
          "Visa final 4242",
        )}

        {renderMethod(
          "pix",
          <MaterialCommunityIcons
            name="qrcode-scan"
            size={24}
            color="#32BCAD"
          />,
          "Pix",
          "Aprovação imediata",
        )}

        {renderMethod(
          "cash",
          <FontAwesome5 name="money-bill-wave" size={20} color="#85bb65" />,
          "Dinheiro",
          "Pagar diretamente ao motorista",
        )}
      </ScrollView>

      {/* Footer */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: Math.max(insets.bottom, 16) + 16,
          backgroundColor: "rgba(15,35,28,0.95)",
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.05)",
        }}
      >
        {error && (
          <View
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(255,75,75,0.12)",
              borderWidth: 1,
              borderColor: "rgba(255,75,75,0.25)",
            }}
          >
            <Text style={{ color: "#ffb3b3", fontSize: 13 }}>{error}</Text>
          </View>
        )}

        <TouchableOpacity
          onPress={handleConfirmPayment}
          disabled={loading}
          activeOpacity={0.9}
          style={{
            height: 56,
            borderRadius: 12,
            backgroundColor: loading ? "rgba(2,222,149,0.5)" : "#02de95",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#0f231c", fontWeight: "800", fontSize: 18 }}>
            {loading ? "Enviando solicitação..." : `Pagar ${formatBRL(amount)}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
