import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import SectionCard from "../../../components/ui/SectionCard";
import { useAuthStore } from "../../../context/authStore";

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

export default function ClientWalletScreen() {
  const navigation = useNavigation();
  const balance = useAuthStore((s) => s.walletBalance || 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Carteira
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0", fontWeight: "800" }}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <SectionCard>
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>Saldo</Text>
          <Text
            style={{
              color: "#02de95",
              fontWeight: "900",
              fontSize: 28,
              marginTop: 8,
            }}
          >
            {formatBRL(balance)}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
            MVP: saldo local (store). Depois podemos integrar pagamentos reais.
          </Text>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
