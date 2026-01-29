import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import rideService, { Ride } from "../../../services/ride.service";
import SectionCard from "../../../components/ui/SectionCard";

function formatDate(value?: string) {
  if (!value) return "";
  try {
    const d = new Date(value);
    return d.toLocaleString("pt-BR");
  } catch {
    return String(value);
  }
}

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

export default function ClientHistoryScreen() {
  const navigation = useNavigation();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(false);

  const completed = useMemo(
    () => rides.filter((r) => r.status === "completed"),
    [rides],
  );

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
          Histórico
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0", fontWeight: "800" }}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
        <Text style={{ color: "rgba(255,255,255,0.65)" }}>
          {loading
            ? "Carregando..."
            : `${completed.length} corridas finalizadas`}
        </Text>

        {rides.length === 0 && !loading ? (
          <Text style={{ color: "rgba(255,255,255,0.65)" }}>
            Você ainda não possui corridas.
          </Text>
        ) : (
          rides.map((r) => (
            <TouchableOpacity
              key={r._id}
              activeOpacity={0.85}
              onPress={() => {
                try {
                  (navigation as any).navigate("OrderDetails", {
                    data: {
                      pickupAddress: r.pickup?.address,
                      dropoffAddress: r.dropoff?.address,
                      vehicleType: (r as any)?.vehicleType,
                      etaMinutes: r.duration?.value
                        ? Math.round(r.duration.value / 60)
                        : undefined,
                      pricing: {
                        total: (r as any)?.pricing?.total,
                        base: (r as any)?.pricing?.basePrice,
                        distancePrice: (r as any)?.pricing?.distancePrice,
                        serviceFee: (r as any)?.pricing?.serviceFee,
                        distanceKm: r.distance?.value
                          ? r.distance.value / 1000
                          : undefined,
                      },
                    },
                  });
                } catch {}
              }}
            >
              <SectionCard>
                <Text style={{ color: "#fff", fontWeight: "900" }}>
                  {formatBRL((r as any)?.pricing?.total ?? 0)} • {r.status}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
                  {formatDate(r.createdAt)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 10 }}>
                  Coleta: {r.pickup?.address || "—"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.75)", marginTop: 4 }}>
                  Destino: {r.dropoff?.address || "—"}
                </Text>
              </SectionCard>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
