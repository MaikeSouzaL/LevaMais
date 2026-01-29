import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import rideService, { Ride } from "../../../services/ride.service";
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

export default function DriverEarningsScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed"),
    [rides],
  );

  const total = useMemo(() => {
    return completed.reduce((sum, r) => sum + ((r as any)?.pricing?.total || 0), 0);
  }, [completed]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await rideService.getHistory({ limit: 100, page: 1 });
        if (!mounted) return;
        setRides(res.rides || []);
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Não foi possível carregar ganhos",
          text2: e?.message || "Tente novamente",
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Ganhos" />

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>
            Ganhos (corridas finalizadas)
          </Text>
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 28, marginTop: 8 }}>
            {loading ? "Carregando..." : formatBRL(total)}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
            MVP: cálculo no app. Depois podemos calcular no backend com taxas.
          </Text>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Resumo</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            Finalizadas: {completed.length}
          </Text>
        </SectionCard>
      </ScrollView>
    </SafeAreaView>
  );
}
