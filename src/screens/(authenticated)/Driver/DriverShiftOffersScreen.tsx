import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import shiftOfferService, { ShiftOffer } from "../../../services/shiftOffer.service";
import { formatBRL } from "../../../utils/mappers";
import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";

export default function DriverShiftOffersScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [available, setAvailable] = useState<ShiftOffer[]>([]);
  const [accepted, setAccepted] = useState<ShiftOffer[]>([]);

  const load = useCallback(async () => {
    const [availableData, acceptedData] = await Promise.all([
      shiftOfferService.listAvailableOffers(),
      shiftOfferService.listDriverAccepted(),
    ]);
    setAvailable(availableData || []);
    setAccepted(acceptedData || []);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        await load();
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao carregar plantoes",
          text2: e?.message || "Tente novamente",
        });
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const acceptOffer = async (offerId: string) => {
    setAcceptingId(offerId);
    try {
      await shiftOfferService.accept(offerId);
      Toast.show({ type: "success", text1: "Plantao aceito com sucesso" });
      await load();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel aceitar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setAcceptingId(null);
    }
  };

  const activeAccepted = accepted.find((item) => {
    const now = Date.now();
    return (
      item.status === "accepted" &&
      new Date(item.startAt).getTime() <= now &&
      new Date(item.endAt).getTime() > now
    );
  });

  return (
    <DriverScreen title="Plantoes de motoboy" scroll={false}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#02de95"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
      >
        {activeAccepted && (
          <SectionCard>
            <Text style={{ color: "#02de95", fontWeight: "900" }}>
              Plantao ativo
            </Text>
            <Text style={{ color: "#fff", fontWeight: "800", marginTop: 6 }}>
              {activeAccepted.title}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
              Ate {new Date(activeAccepted.endAt).toLocaleString("pt-BR")}
            </Text>
            <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
              Durante este periodo, novas corridas ficam bloqueadas.
            </Text>
          </SectionCard>
        )}

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>
            Meus plantoes aceitos
          </Text>
          {accepted.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.6)" }}>
              Nenhum plantao aceito.
            </Text>
          ) : (
            accepted.map((item) => (
              <View key={item._id} style={{ marginBottom: 10 }}>
                <Text style={{ color: "#fff", fontWeight: "700" }}>{item.title}</Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  {formatBRL(item.dailyAmount)} ·{" "}
                  {item.fuelIncluded ? "Com gasolina" : "Sem gasolina"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                  {new Date(item.startAt).toLocaleString("pt-BR")} ate{" "}
                  {new Date(item.endAt).toLocaleString("pt-BR")}
                </Text>
              </View>
            ))
          )}
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>
            Plantoes disponiveis
          </Text>
          {loading ? (
            <Text style={{ color: "rgba(255,255,255,0.6)" }}>Carregando...</Text>
          ) : available.length === 0 ? (
            <Text style={{ color: "rgba(255,255,255,0.6)" }}>
              Sem plantoes disponiveis no momento.
            </Text>
          ) : (
            available.map((item) => (
              <View
                key={item._id}
                style={{
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  padding: 12,
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "800" }}>{item.title}</Text>
                <Text style={{ color: "#02de95", fontWeight: "900", marginTop: 4 }}>
                  {formatBRL(item.dailyAmount)}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                  {item.fuelIncluded ? "Gasolina inclusa" : "Gasolina por conta do motoboy"}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  Inicio: {new Date(item.startAt).toLocaleString("pt-BR")}
                </Text>
                <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 2 }}>
                  Fim: {new Date(item.endAt).toLocaleString("pt-BR")}
                </Text>
                {item.description ? (
                  <Text style={{ color: "rgba(255,255,255,0.55)", marginTop: 6 }}>
                    {item.description}
                  </Text>
                ) : null}

                <TouchableOpacity
                  onPress={() => acceptOffer(item._id)}
                  disabled={acceptingId === item._id}
                  style={{
                    marginTop: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "#02de95",
                    paddingVertical: 10,
                  }}
                >
                  <Text style={{ color: "#091A2F", fontWeight: "900" }}>
                    {acceptingId === item._id ? "Aceitando..." : "Aceitar plantao"}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </SectionCard>
      </ScrollView>
    </DriverScreen>
  );
}
