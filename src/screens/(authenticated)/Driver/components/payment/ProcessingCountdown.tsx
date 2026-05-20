import React, { useEffect, useMemo, useState } from "react";
import { Text, View } from "react-native";

function asMMSS(totalSeconds: number) {
  const safe = Math.max(0, totalSeconds);
  const mm = String(Math.floor(safe / 60)).padStart(2, "0");
  const ss = String(safe % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function ProcessingCountdown({ initialSeconds = 300 }: { initialSeconds?: number }) {
  const [seconds, setSeconds] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const text = useMemo(() => asMMSS(seconds), [seconds]);

  return (
    <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(251,191,36,0.35)", backgroundColor: "rgba(251,191,36,0.08)", padding: 10, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
      <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 10.5 }}>Tempo estimado</Text>
      <Text style={{ color: "#fbbf24", fontSize: 14, fontWeight: "900", letterSpacing: 0.5 }}>{text}</Text>
    </View>
  );
}
