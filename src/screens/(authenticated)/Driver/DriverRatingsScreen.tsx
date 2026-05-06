import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import rideService, { Ride } from "../../../services/ride.service";

function toNumber(value: unknown) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

export default function DriverRatingsScreen() {
  const [rides, setRides] = useState<Ride[]>([]);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const result = await rideService.getHistory({ page: 1, limit: 60, status: "completed" });
          if (!mounted) return;
          setRides(result?.rides || []);
        } catch {
          if (!mounted) return;
          setRides([]);
        }
      })();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const summary = useMemo(() => {
    const stars = rides
      .map((ride: any) => toNumber(ride?.rating?.driverRating?.stars))
      .filter((value) => value > 0);

    const avg = stars.length
      ? stars.reduce((acc, value) => acc + value, 0) / stars.length
      : 0;

    const five = stars.filter((value) => value >= 4.5).length;
    return {
      avg,
      total: stars.length,
      five,
    };
  }, [rides]);

  return (
    <DriverScreen title="Avaliacoes" scroll>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>
          Nota media
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <MaterialIcons name="star" size={26} color="#fbbf24" />
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 30 }}>
            {summary.avg > 0 ? summary.avg.toFixed(1) : "--"}
          </Text>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.58)", marginTop: 4 }}>
          {summary.total} avaliacoes recebidas
        </Text>
      </SectionCard>

      <View style={{ flexDirection: "row", gap: 10 }}>
        <SectionCard style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "700" }}>5 estrelas</Text>
          <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 22, marginTop: 6 }}>
            {summary.five}
          </Text>
        </SectionCard>

        <SectionCard style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "700" }}>Concluidas</Text>
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 22, marginTop: 6 }}>
            {rides.length}
          </Text>
        </SectionCard>
      </View>

      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "800", marginBottom: 10 }}>
          Ultimos feedbacks
        </Text>
        <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
          {rides.slice(0, 10).map((ride: any) => {
            const stars = toNumber(ride?.rating?.driverRating?.stars);
            const comment = String(ride?.rating?.driverRating?.comment || "").trim();
            return (
              <View
                key={ride._id}
                style={{
                  paddingVertical: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: "rgba(255,255,255,0.08)",
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>
                  {stars > 0 ? `${stars.toFixed(1)} estrelas` : "Sem nota"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.62)", marginTop: 4 }} numberOfLines={2}>
                  {comment || "Sem comentario"}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </SectionCard>
    </DriverScreen>
  );
}
