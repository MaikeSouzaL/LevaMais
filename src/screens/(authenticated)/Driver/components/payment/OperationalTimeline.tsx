import React from "react";
import { Text, View } from "react-native";

const STEPS = [
  "Cliente confirmou proposta",
  "Pagamento em análise",
  "Plataforma validando",
  "Rota será liberada",
];

export function OperationalTimeline({ activeIndex }: { activeIndex: number }) {
  return (
    <View style={{ marginTop: 12, gap: 8 }}>
      <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 9.5, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.4 }}>
        Timeline operacional
      </Text>
      {STEPS.map((step, idx) => {
        const isDone = idx < activeIndex;
        const isActive = idx === activeIndex;
        return (
          <View key={step} style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: isDone ? "#02de95" : isActive ? "#fbbf24" : "rgba(255,255,255,0.25)", borderWidth: isActive ? 2 : 0, borderColor: "rgba(251,191,36,0.45)" }} />
            <Text style={{ color: isActive ? "#fff" : "rgba(255,255,255,0.62)", fontSize: 10.5, fontWeight: isActive ? "800" : "600" }}>{step}</Text>
          </View>
        );
      })}
    </View>
  );
}
