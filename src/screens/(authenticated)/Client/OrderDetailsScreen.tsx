import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import type { FinalOrderSummaryData } from "./HomeScreen/components/FinalOrderSummarySheet";

type Params = { OrderDetails: { data: FinalOrderSummaryData } };

export default function OrderDetailsScreen() {
  const route = useRoute<RouteProp<Params, "OrderDetails">>();
  const navigation = useNavigation();
  const data = route.params?.data;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0" }}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: "white",
            fontSize: 18,
            fontWeight: "800",
            marginTop: 6,
          }}
        >
          Detalhes do pedido
        </Text>
      </View>
      <View style={{ padding: 20 }}>
        {!data ? (
          <Text style={{ color: "white" }}>Sem dados.</Text>
        ) : (
          <View>
            <Section
              title="Coleta"
              lines={[data.pickupAddress, data.pickupNeighborhood || ""]}
            />
            <Section
              title="Destino"
              lines={[data.dropoffAddress, data.dropoffNeighborhood || ""]}
            />
            <Section
              title="Serviço"
              lines={[
                `Entrega • ${labelForVehicle(data.vehicleType)}`,
                `Finalidade: ${data.servicePurposeLabel}`,
              ]}
            />
            <Section
              title="Detalhes"
              lines={[
                `Item: ${data.itemType || "-"}`,
                `Ajudante: ${data.helperIncluded ? "Incluído" : "Não"}`,
                `Seguro: ${insuranceLabel(data.insuranceLevel)}`,
              ]}
            />
            <Section title="Pagamento" lines={[data.paymentSummary]} />
            <Section
              title="Valores"
              lines={[
                `Base: ${formatBRL(data.pricing.base)}`,
                `Distância (${data.pricing.distanceKm.toFixed(
                  1
                )} km): ${formatBRL(data.pricing.distancePrice)}`,
                `Taxa: ${formatBRL(data.pricing.serviceFee)}`,
                `Total: ${formatBRL(data.pricing.total)}`,
              ]}
            />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

function Section({ title, lines }: { title: string; lines: string[] }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Text style={{ color: "white", fontWeight: "800", marginBottom: 6 }}>
        {title}
      </Text>
      {lines.filter(Boolean).map((l, i) => (
        <Text key={i} style={{ color: "#9abcb0" }}>
          {l}
        </Text>
      ))}
    </View>
  );
}

function labelForVehicle(v: FinalOrderSummaryData["vehicleType"]) {
  switch (v) {
    case "moto":
      return "Moto";
    case "car":
      return "Carro";
    case "van":
      return "Van";
    case "truck":
      return "Caminhão";
    default:
      return "Veículo";
  }
}
function insuranceLabel(level: FinalOrderSummaryData["insuranceLevel"]) {
  if (level === "premium") return "Premium";
  if (level === "basic") return "Básico Ativado";
  return "Não contratado";
}
function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${value.toFixed(2)}`;
  }
}
