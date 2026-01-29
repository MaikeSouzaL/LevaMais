import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverHeader from "./components/DriverHeader";
import SectionCard from "../../../components/ui/SectionCard";

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverWalletScreen() {
  // MVP: sem carteira real no backend ainda
  const available = 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Carteira" />

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>Saldo disponível</Text>
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 28, marginTop: 8 }}>
            {formatBRL(available)}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
            MVP: aqui entram repasses/saques. Podemos calcular pelo histórico e criar um endpoint de payouts.
          </Text>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
