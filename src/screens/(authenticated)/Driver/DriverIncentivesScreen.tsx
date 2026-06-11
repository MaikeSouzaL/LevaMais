import React, { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

import SectionCard from "../../../components/ui/SectionCard";
import { DriverScreen } from "./components/DriverScreen";
import rideService from "../../../services/ride.service";

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

export default function DriverIncentivesScreen() {
  const [goal, setGoal] = useState(10);
  const [rides, setRides] = useState(0);
  const [bonus, setBonus] = useState(0);

  const progress = useMemo(() => {
    const safeGoal = Math.max(1, Number(goal || 1));
    return Math.min(100, Math.round((Number(rides || 0) / safeGoal) * 100));
  }, [goal, rides]);

  const load = useCallback(async () => {
    const stats = await rideService.getDriverStats();
    setGoal(Number(stats.goal || 10));
    setRides(Number(stats.rides || 0));
    setBonus(Number(stats.bonus || 0));
  }, []);

   useFocusEffect(
     useCallback(() => {
       load().catch((error) => {
         console.error('Failed to load driver incentives:', error);
       });
     }, [load]),
   );

  return (
    <DriverScreen title="Incentivos" scroll>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>Meta do periodo</Text>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 26, marginTop: 4 }}>{rides}/{goal} corridas</Text>
        <View style={{ marginTop: 12, height: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)" }}>
          <View style={{ width: `${progress}%`, height: 10, borderRadius: 999, backgroundColor: "#02de95" }} />
        </View>
        <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{progress}% concluido</Text>
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>Bonus estimado</Text>
        <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 24, marginTop: 6 }}>{formatBRL(bonus)}</Text>
      </SectionCard>
    </DriverScreen>
  );
}
