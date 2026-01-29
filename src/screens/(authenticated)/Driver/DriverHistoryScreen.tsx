import React, { useEffect, useState } from "react";
import { Text } from "react-native";
import Toast from "react-native-toast-message";

import rideService, { Ride } from "../../../services/ride.service";
import SectionCard from "../../../components/ui/SectionCard";
import { DriverScreen } from "./components/DriverScreen";

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

export default function DriverHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const res = await rideService.getHistory({ limit: 50, page: 1 });
        if (!mounted) return;
        setRides(res.rides || []);
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Não foi possível carregar histórico",
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
    <DriverScreen title="Histórico" scroll>
      <Text style={{ color: "rgba(255,255,255,0.65)" }}>
        {loading ? "Carregando..." : `${rides.length} corridas`}
      </Text>

      {rides.length === 0 && !loading ? (
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
          Nenhuma corrida no histórico.
        </Text>
      ) : (
        rides.map((r) => (
          <SectionCard key={r._id}>
            <Text style={{ color: "#fff", fontWeight: "900" }}>
              {formatBRL((r as any)?.pricing?.total ?? 0)} • {r.status}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
              Coleta: {r.pickup?.address || "—"}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              Destino: {r.dropoff?.address || "—"}
            </Text>
          </SectionCard>
        ))
      )}
    </DriverScreen>
  );
}
