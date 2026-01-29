import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ActionButton from "../../../components/ui/ActionButton";
import rideService from "../../../services/ride.service";

type Params = {
  DriverCancelRide: {
    rideId: string;
  };
};

const REASONS = [
  { id: "client_no_show", label: "Cliente não apareceu" },
  { id: "wrong_pickup", label: "Local de coleta incorreto" },
  { id: "vehicle_issue", label: "Problema com o veículo" },
  { id: "safety", label: "Problema de segurança" },
  { id: "accident", label: "Acidente / imprevisto" },
  { id: "other", label: "Outro" },
];

export default function DriverCancelRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverCancelRide">>();
  const rideId = route.params?.rideId;

  const [selected, setSelected] = useState<string>("other");
  const [loading, setLoading] = useState(false);

  const canSubmit = useMemo(() => !!rideId && !!selected, [rideId, selected]);

  async function submit() {
    if (!rideId) return;
    if (!canSubmit) return;

    setLoading(true);
    try {
      await rideService.cancel(rideId, selected);
      Toast.show({ type: "success", text1: "Corrida cancelada" });

      try {
        (navigation as any).navigate("DriverHome");
      } catch {
        navigation.goBack();
      }
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível cancelar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Cancelar corrida
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          Selecione um motivo.
        </Text>
      </View>

      <View style={{ flex: 1, padding: 16, gap: 10 }}>
        {REASONS.map((r) => {
          const active = r.id === selected;
          return (
            <TouchableOpacity
              key={r.id}
              onPress={() => setSelected(r.id)}
              activeOpacity={0.8}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: active ? "rgba(239,68,68,0.12)" : "rgba(255,255,255,0.06)",
                borderWidth: 1,
                borderColor: active
                  ? "rgba(239,68,68,0.35)"
                  : "rgba(255,255,255,0.10)",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {r.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ padding: 16 }}>
        <ActionButton
          title={loading ? "Cancelando..." : "Confirmar cancelamento"}
          variant="danger"
          onPress={submit}
          disabled={!canSubmit || loading}
        />
        <View style={{ height: 10 }} />
        <ActionButton
          title="Voltar"
          variant="secondary"
          onPress={() => navigation.goBack()}
          disabled={loading}
        />
      </View>
    </SafeAreaView>
  );
}
