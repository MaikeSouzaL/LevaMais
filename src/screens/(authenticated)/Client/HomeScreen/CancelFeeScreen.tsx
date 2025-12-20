import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { View, Text, TouchableOpacity } from "react-native";
import { RouteProp, useRoute, useNavigation } from "@react-navigation/native";
import { useAuthStore } from "../../../../context/authStore";

type Params = { CancelFee: { total: number } };

export default function CancelFeeScreen() {
  const route = useRoute<RouteProp<Params, "CancelFee">>();
  const navigation = useNavigation();
  const total = route.params?.total ?? 0;
  const fee = total * 0.5;
  const creditWallet = useAuthStore((s) => s.creditWallet);
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
            fontSize: 20,
            fontWeight: "800",
            marginTop: 8,
          }}
        >
          Cancelar corrida
        </Text>
      </View>
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
          Taxa de cancelamento
        </Text>
        <Text style={{ color: "#9abcb0", marginTop: 6 }}>
          Ao cancelar agora, será cobrado 50% do valor da corrida.
        </Text>
        <View
          style={{
            marginTop: 16,
            backgroundColor: "#162e25",
            borderRadius: 12,
            padding: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
          }}
        >
          <Row label="Valor da corrida" value={formatBRL(total)} />
          <Row label="Taxa (50%)" value={formatBRL(fee)} />
          <View
            style={{
              height: 1,
              backgroundColor: "rgba(255,255,255,0.08)",
              marginVertical: 8,
            }}
          />
          <Row label="Total a pagar" value={formatBRL(fee)} highlight />
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <TouchableOpacity
          onPress={() => {
            // 1) Creditar metade na carteira
            creditWallet(fee);
            // 2) Resetar fluxo atual voltando ao Home sem reabrir o sheet
            (navigation as any).navigate("Home", {
              // flags que garantem estado limpo; Home já limpa params desconhecidos
              cancelTrip: true,
            });
          }}
          style={{
            height: 50,
            borderRadius: 12,
            backgroundColor: "#ef4444",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            Confirmar cancelamento
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() =>
            (navigation as any).navigate("Home", { resumeDriverFound: true })
          }
          style={{ marginTop: 10, alignItems: "center" }}
        >
          <Text style={{ color: "#9abcb0" }}>Manter corrida</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: 8,
      }}
    >
      <Text style={{ color: "#9abcb0" }}>{label}</Text>
      <Text
        style={{
          color: highlight ? "#02de95" : "white",
          fontWeight: highlight ? "800" : "600",
        }}
      >
        {value}
      </Text>
    </View>
  );
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
