import React, { useCallback, useEffect, useState } from "react";
import {
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import Toast from "react-native-toast-message";
import { Icon } from "@/components/ui/Icon";
import { LinearGradient } from "expo-linear-gradient";

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
    <DriverScreen title="Plantões de motoboy" scroll={false} hideHeader={true}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#02de95"
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Active Shift */}
        {activeAccepted && (
          <LinearGradient
            colors={["#1a3a2f", "#091A2F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 20,
              padding: 20,
              marginBottom: 20,
              borderWidth: 2,
              borderColor: "#02de95",
              overflow: "hidden",
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <View style={{ backgroundColor: "rgba(2,222,149,0.2)", padding: 10, borderRadius: 12 }}>
                <Icon name="radio-button-checked" size={20} color="#02de95" />
              </View>
              <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 14, textTransform: "uppercase", letterSpacing: 0.5 }}>
                Plantão Ativo
              </Text>
            </View>
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 20, marginBottom: 8 }}>
              {activeAccepted.title}
            </Text>
            <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, marginTop: 8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <Icon name="access-time" size={16} color="rgba(255,255,255,0.6)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
                  Até {new Date(activeAccepted.endAt).toLocaleString("pt-BR")}
                </Text>
              </View>
              <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, lineHeight: 18 }}>
                Novas corridas estão bloqueadas durante este período
              </Text>
            </View>
          </LinearGradient>
        )}

        {/* My Accepted Shifts */}
        <View style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
            <Icon name="check-circle" size={24} color="#02de95" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
              Meus Plantões
            </Text>
            <View style={{ backgroundColor: "rgba(2,222,149,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: "#02de95", fontWeight: "800", fontSize: 12 }}>
                {accepted.length}
              </Text>
            </View>
          </View>

          {accepted.length === 0 ? (
            <LinearGradient
              colors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]}
              style={{
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Icon name="info-outline" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, textAlign: "center" }}>
                Você ainda não aceitou nenhum plantão
              </Text>
            </LinearGradient>
          ) : (
            accepted.map((item) => (
              <LinearGradient
                key={item._id}
                colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16, flex: 1 }}>
                    {item.title}
                  </Text>
                  <View style={{ backgroundColor: "rgba(2,222,149,0.15)", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
                    <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 12 }}>
                      {formatBRL(item.dailyAmount)}
                    </Text>
                  </View>
                </View>

                <View style={{ gap: 6 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="local-gas-station" size={14} color="rgba(255,255,255,0.5)" />
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 13 }}>
                      {item.fuelIncluded ? "Gasolina inclusa" : "Sem gasolina"}
                    </Text>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="schedule" size={14} color="rgba(255,255,255,0.5)" />
                    <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 13 }}>
                      {new Date(item.startAt).toLocaleDateString("pt-BR")} • {new Date(item.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} a {new Date(item.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            ))
          )}
        </View>

        {/* Available Shifts */}
        <View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12, paddingHorizontal: 4 }}>
            <Icon name="local-offer" size={24} color="#fbbf24" />
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
              Plantões Disponíveis
            </Text>
            <View style={{ backgroundColor: "rgba(251,191,36,0.2)", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 }}>
              <Text style={{ color: "#fbbf24", fontWeight: "800", fontSize: 12 }}>
                {available.length}
              </Text>
            </View>
          </View>

          {loading ? (
            <View style={{ padding: 40, alignItems: "center" }}>
              <ActivityIndicator size="large" color="#02de95" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12 }}>
                Carregando plantões...
              </Text>
            </View>
          ) : available.length === 0 ? (
            <LinearGradient
              colors={["rgba(255,255,255,0.03)", "rgba(255,255,255,0.01)"]}
              style={{
                borderRadius: 16,
                padding: 24,
                alignItems: "center",
                borderWidth: 1,
                borderColor: "rgba(255,255,255,0.08)",
              }}
            >
              <Icon name="inbox" size={40} color="rgba(255,255,255,0.3)" />
              <Text style={{ color: "rgba(255,255,255,0.5)", marginTop: 12, textAlign: "center" }}>
                Nenhum plantão disponível no momento
              </Text>
            </LinearGradient>
          ) : (
            available.map((item) => (
              <LinearGradient
                key={item._id}
                colors={["rgba(2,222,149,0.08)", "rgba(2,222,149,0.03)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1.5,
                  borderColor: "rgba(2,222,149,0.2)",
                  overflow: "hidden",
                }}
              >
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}>
                      {item.title}
                    </Text>
                  </View>
                  <LinearGradient
                    colors={["#02de95", "#02de7a"]}
                    style={{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 }}
                  >
                    <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 13 }}>
                      {formatBRL(item.dailyAmount)}/dia
                    </Text>
                  </LinearGradient>
                </View>

                <View style={{ gap: 8, marginBottom: 14 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: "#02de95" }} />
                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "500" }}>
                      {item.fuelIncluded ? "🚗 Gasolina inclusa" : "⛽ Gasolina por sua conta"}
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <Icon name="schedule" size={14} color="#02de95" />
                    <Text style={{ color: "rgba(255,255,255,0.65)", fontSize: 12 }}>
                      {new Date(item.startAt).toLocaleDateString("pt-BR")} • {new Date(item.startAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} a {new Date(item.endAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </Text>
                  </View>

                  {item.description && (
                    <View style={{ backgroundColor: "rgba(255,255,255,0.05)", padding: 10, borderRadius: 10, marginTop: 4 }}>
                      <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, lineHeight: 16 }}>
                        ℹ️ {item.description}
                      </Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => acceptOffer(item._id)}
                  disabled={acceptingId === item._id}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={acceptingId === item._id ? ["#02de7a", "#02de7a"] : ["#02de95", "#02de7a"]}
                    style={{
                      paddingVertical: 14,
                      borderRadius: 12,
                      alignItems: "center",
                      justifyContent: "center",
                      flexDirection: "row",
                      gap: 8,
                    }}
                  >
                    {acceptingId === item._id ? (
                      <>
                        <ActivityIndicator size="small" color="#091A2F" />
                        <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15 }}>
                          Aceitando...
                        </Text>
                      </>
                    ) : (
                      <>
                        <Icon name="check-circle" size={18} color="#091A2F" />
                        <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 15 }}>
                          Aceitar Plantão
                        </Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            ))
          )}
        </View>
      </ScrollView>
    </DriverScreen>
  );
}
