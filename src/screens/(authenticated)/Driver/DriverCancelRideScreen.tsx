import React, { useMemo, useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import rideService from "../../../services/ride.service";
import {
  CancelReason,
  DriverCancelReasonModal,
} from "./components/DriverCancelReasonModal";

type Params = {
  DriverCancelRide: {
    rideId: string;
  };
};

const REASONS: CancelReason[] = [
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
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Cancelar corrida
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          Selecione um motivo.
        </Text>
      </View>

      <DriverCancelReasonModal
        visible
        title="Cancelar corrida"
        subtitle="Selecione um motivo. O cliente será notificado."
        reasons={REASONS}
        selectedReasonId={selected}
        onSelectReason={setSelected}
        onClose={() => navigation.goBack()}
        onConfirm={submit}
        confirmDisabled={!canSubmit || loading}
        confirmLabel={loading ? "Cancelando..." : "Confirmar cancelamento"}
      />
    </SafeAreaView>
  );
}
