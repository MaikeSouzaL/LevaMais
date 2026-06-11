import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
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

// Status onde cancelamento direto pelo motorista nao e permitido
const BLOCKED_CANCEL_STATUSES = ["in_progress", "completed"];

export default function DriverCancelRideScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "DriverCancelRide">>();
  const rideId = route.params?.rideId;

  const [selected, setSelected] = useState<string>("other");
  const [loading, setLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState<string | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  // Verifica a fase atual da corrida para decidir se permite cancelamento
  useEffect(() => {
    if (!rideId) {
      setLoadingStatus(false);
      return;
    }
    rideService.getById(rideId)
      .then((ride) => {
        setRideStatus(ride?.status || null);
      })
      .catch(() => {
        setRideStatus(null);
      })
      .finally(() => setLoadingStatus(false));
  }, [rideId]);

  const isBlocked = rideStatus ? BLOCKED_CANCEL_STATUSES.includes(rideStatus) : false;
  const isDelivery = rideStatus !== null; // sempre true se carregou

  const canSubmit = useMemo(
    () => !!rideId && !!selected && !isBlocked,
    [rideId, selected, isBlocked],
  );

  async function submit() {
    if (!rideId || !canSubmit) return;

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
    <SafeAreaView style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <View style={{ padding: 16 }}>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Cancelar corrida
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
          {isBlocked
            ? "Cancelamento bloqueado nesta fase."
            : "Selecione um motivo."}
        </Text>
      </View>

      {loadingStatus ? (
        <View style={{ padding: 24, alignItems: "center" }}>
          <ActivityIndicator color="#02de95" />
          <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 8, fontSize: 12 }}>
            Verificando fase da corrida...
          </Text>
        </View>
      ) : isBlocked ? (
        <View style={{ padding: 24 }}>
          <View
            style={{
              backgroundColor: "rgba(251,191,36,0.1)",
              borderWidth: 1,
              borderColor: "rgba(251,191,36,0.3)",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#fbbf24", fontWeight: "800", fontSize: 16, textAlign: "center", marginBottom: 12 }}>
              Cancelamento bloqueado
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 }}>
              {isDelivery
                ? "O pacote ja foi coletado. Nao e possivel cancelar diretamente. Entre em contato com o suporte para tratar devolucao ou extravio."
                : "A corrida esta em andamento. Entre em contato com o suporte se precisar cancelar."}
            </Text>
            <TouchableOpacity
              onPress={() => {
                try {
                  (navigation as any).navigate("SupportCenter");
                } catch {
                  navigation.goBack();
                }
              }}
              style={{
                backgroundColor: "#fbbf24",
                borderRadius: 12,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text style={{ color: "#091A2F", fontWeight: "800", fontSize: 14 }}>
                Falar com Suporte
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <DriverCancelReasonModal
          visible
          title="Cancelar corrida"
          subtitle="Selecione um motivo. O cliente será notificado."
          infoNote={
            "Ao cancelar, o cliente é reembolsado 100% e a corrida volta automaticamente para a busca por outro motorista. " +
            "Você não é multado, mas cancelamentos frequentes aumentam sua taxa de cancelamento e podem reduzir suas ofertas."
          }
          reasons={REASONS}
          selectedReasonId={selected}
          onSelectReason={setSelected}
          onClose={() => navigation.goBack()}
          onConfirm={submit}
          confirmDisabled={!canSubmit || loading}
          confirmLabel={loading ? "Cancelando..." : "Confirmar cancelamento"}
        />
      )}
    </SafeAreaView>
  );
}
