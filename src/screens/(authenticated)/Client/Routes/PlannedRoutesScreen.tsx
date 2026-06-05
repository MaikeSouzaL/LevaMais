import React, { useCallback, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ClientScreenHeader from "../Shared/components/ClientScreenHeader";
import routeService from "@/services/route.service";
import disputeService from "@/services/dispute.service";
import type { DriverRoute, RouteReservation, RouteReservationStatus } from "@/types/routes";
import { colors } from "@/theme";
import { Icon } from "@/components/ui/Icon";

const RES_LABEL: Record<RouteReservationStatus, string> = {
  requested: "Aguardando motorista",
  accepted: "Aceita",
  rejected: "Recusada",
  awaiting_pickup: "Aguardando coleta",
  in_transit: "A caminho",
  delivered: "Entregue",
  completed: "Concluída",
  cancelled: "Cancelada",
  refunded: "Estornada",
};
const RES_COLOR: Record<RouteReservationStatus, string> = {
  requested: "#f59e0b", accepted: "#02de95", rejected: "#ef4444", awaiting_pickup: "#02de95",
  in_transit: "#38bdf8", delivered: "#a3a3a3", completed: "#a3a3a3", cancelled: "#ef4444", refunded: "#ef4444",
};

function fmt(value?: string) {
  if (!value) return "";
  try { return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }); } catch { return value; }
}

export default function PlannedRoutesScreen() {
  const navigation = useNavigation<any>();
  const [tab, setTab] = useState<"discover" | "mine">("discover");
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [reservations, setReservations] = useState<RouteReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      if (tab === "discover") setRoutes(await routeService.discover());
      else setReservations(await routeService.listMyReservations());
    } catch { /* no-op */ } finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const cancelReservation = async (id: string) => {
    try {
      await routeService.cancelReservation(id);
      Toast.show({ type: "success", text1: "Reserva cancelada" });
      load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message });
    }
  };

  const reportProblem = (rideId: string) => {
    Alert.alert("Relatar problema", "Deseja abrir uma disputa sobre esta reserva?", [
      { text: "Voltar", style: "cancel" },
      {
        text: "Abrir disputa",
        onPress: async () => {
          try {
            await disputeService.create({
              rideId,
              category: "route",
              description: "Problema com a reserva de rota planejada (maloteiro).",
            });
            Toast.show({ type: "success", text1: "Disputa aberta", text2: "Nossa equipe vai analisar." });
          } catch (e: any) {
            Toast.show({ type: "error", text1: "Erro ao abrir disputa", text2: e?.message });
          }
        },
      },
    ]);
  };

  const renderRoute = ({ item }: { item: DriverRoute }) => {
    const free = (item.capacity?.maxItems || 0) - (item.capacityUsed?.items || 0);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate("RouteReserve", { routeId: item._id })}
        style={card}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Icon name="route" size={18} color={colors.primary[500]} />
          <Text style={{ color: colors.text.primary, fontWeight: "800", fontSize: 15, marginLeft: 8, flex: 1 }} numberOfLines={1}>
            {item.origin?.label} → {item.destination?.label}
          </Text>
        </View>
        <View style={{ flexDirection: "row", gap: 16, marginTop: 10 }}>
          <Meta icon="clock" text={fmt(item.departAt)} />
          <Meta icon="package" text={`${free} vaga(s)`} />
          <Meta icon="cash" text={`a partir de R$ ${Number(item.pricing?.basePrice || 0).toFixed(0)}`} />
        </View>
      </TouchableOpacity>
    );
  };

  const renderReservation = ({ item }: { item: RouteReservation }) => {
    const r = item.routeId as any;
    const canCancel = ["requested", "accepted", "awaiting_pickup"].includes(item.status);
    const rideId = item.rideId || null;
    const canTrack = !!rideId && ["accepted", "awaiting_pickup", "in_transit"].includes(item.status);
    const canDispute = !!rideId && ["in_transit", "delivered", "completed"].includes(item.status);
    return (
      <View style={card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text.primary, fontWeight: "800", flex: 1 }} numberOfLines={1}>
            {r?.origin?.label || "Rota"} → {r?.destination?.label || ""}
          </Text>
          <View style={{ backgroundColor: `${RES_COLOR[item.status]}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: RES_COLOR[item.status], fontWeight: "800", fontSize: 11 }}>{RES_LABEL[item.status]}</Text>
          </View>
        </View>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 6 }}>
          {item.item?.description || item.item?.type || "Encomenda"} · R$ {Number(item.pricing?.price || 0).toFixed(2)}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {canTrack && (
            <TouchableOpacity onPress={() => navigation.navigate("DeliveryTracking", { rideId })} style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.primary[500], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Icon name="map-pin" size={14} color="#062b22" />
              <Text style={{ color: "#062b22", fontWeight: "800", fontSize: 13, marginLeft: 6 }}>Acompanhar</Text>
            </TouchableOpacity>
          )}
          {canDispute && (
            <TouchableOpacity onPress={() => reportProblem(rideId as string)} style={{ borderWidth: 1, borderColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 13 }}>Relatar problema</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity onPress={() => cancelReservation(item._id)} style={{ borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ClientScreenHeader title="Encomendas em rota" subtitle="Aproveite viagens de motoristas para enviar encomendas" />

      <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
        {(["discover", "mine"] as const).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity key={t} onPress={() => { setTab(t); setLoading(true); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: active ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: active ? colors.primary[500] : "rgba(255,255,255,0.08)" }}>
              <Text style={{ color: active ? colors.primary[500] : colors.text.secondary, fontWeight: "800", fontSize: 13 }}>
                {t === "discover" ? "Disponíveis" : "Minhas reservas"}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={{ paddingTop: 50, alignItems: "center" }}><ActivityIndicator color={colors.primary[500]} /></View>
      ) : tab === "discover" ? (
        <FlatList
          data={routes}
          keyExtractor={(r) => r._id}
          renderItem={renderRoute}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary[500]} />}
          ListEmptyComponent={<Empty icon="route" text="Nenhuma rota disponível agora" />}
        />
      ) : (
        <FlatList
          data={reservations}
          keyExtractor={(r) => r._id}
          renderItem={renderReservation}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary[500]} />}
          ListEmptyComponent={<Empty icon="package" text="Você ainda não tem reservas" />}
        />
      )}
    </View>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={14} color={colors.text.secondary} />
      <Text style={{ color: colors.text.secondary, fontSize: 12, marginLeft: 5 }}>{text}</Text>
    </View>
  );
}

function Empty({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={{ alignItems: "center", paddingTop: 60 }}>
      <Icon name={icon} size={46} color="rgba(255,255,255,0.2)" />
      <Text style={{ color: colors.text.secondary, marginTop: 14, fontWeight: "700" }}>{text}</Text>
    </View>
  );
}

const card = {
  backgroundColor: "rgba(255,255,255,0.05)",
  borderRadius: 16,
  padding: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.08)",
} as const;
