import React, { useCallback, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import walletService, { StatementItem } from "../../../services/wallet.service";
import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverPayoutsScreen() {
  const [available, setAvailable] = useState(0);
  const [paid, setPaid] = useState(0);

  const load = useCallback(async () => {
    const balance = await walletService.getBalance();
    const statement = await walletService.getStatement(1, 50);

    const paidTotal = (statement.items || [])
      .filter((item: StatementItem) => item.type === "withdrawal" && item.status === "paid")
      .reduce((acc: number, item: StatementItem) => acc + Math.abs(Number(item.amount || 0)), 0);

    setAvailable(Number(balance.available || 0));
    setPaid(Number(paidTotal || 0));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  return (
    <DriverScreen title="Repasses" scroll>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>Disponivel para repasse</Text>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28, marginTop: 6 }}>{formatBRL(available)}</Text>
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>Total ja pago</Text>
        <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 24, marginTop: 6 }}>{formatBRL(paid)}</Text>
      </SectionCard>

      <View style={{ paddingHorizontal: 2 }}>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
          Os repasses acompanham seus saques no extrato. Para solicitar novo repasse, use a tela de saque.
        </Text>
      </View>
    </DriverScreen>
  );
}