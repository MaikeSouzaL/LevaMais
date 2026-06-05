import React, { useCallback, useState } from "react";
import { Text, View, TouchableOpacity, FlatList, RefreshControl, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";

import routeService from "@/services/route.service";
import type { DriverRoute, DriverRouteStatus } from "@/types/routes";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";

const STATUS_LABEL: Record<DriverRouteStatus, string> = {
  draft: "Rascunho",
  published: "Publicada",
  in_transit: "Em trânsito",
  completed: "Concluída",
  cancelled: "Cancelada",
};

const STATUS_COLOR: Record<DriverRouteStatus, string> = {
  draft: "#94a3b8",
  published: "#02de95",
  in_transit: "#38bdf8",
  completed: "#a3a3a3",
  cancelled: "#ef4444",
};

function fmtDate(value?: string) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch {
    return value;
  }
}

export default function DriverRoutesScreen() {
  const navigation = useNavigation<any>();
  const [routes, setRoutes] = useState<DriverRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const list = await routeService.listMine();
      setRoutes(list);
    } catch {
      setRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const renderItem = ({ item }: { item: DriverRoute }) => {
    const status = (item.status || "published") as DriverRouteStatus;
    const used = item.capacityUsed?.items || 0;
    const max = item.capacity?.maxItems || 0;
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => navigation.navigate("DriverRouteDetail", { routeId: item._id })}
        style={{
          backgroundColor: "rgba(255,255,255,0.05)",
          borderRadius: 16,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 8 }}>
            <Icon name="map-pin" size={18} color="#02de95" />
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 15, marginLeft: 8, flex: 1 }} numberOfLines={1}>
              {item.origin?.label || "Origem"} → {item.destination?.label || "Destino"}
            </Text>
          </View>
          <View style={{ backgroundColor: `${STATUS_COLOR[status]}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: STATUS_COLOR[status], fontWeight: "800", fontSize: 11 }}>{STATUS_LABEL[status]}</Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 12, gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="clock" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 5 }}>{fmtDate(item.departAt)}</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="package" size={14} color="rgba(255,255,255,0.6)" />
            <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, marginLeft: 5 }}>{used}/{max} itens</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <DriverScreen
      title="Minhas Rotas"
      headerRight={
        <TouchableOpacity onPress={() => navigation.navigate("DriverPublishRoute")} style={{ padding: 6 }}>
          <Icon name="plus" size={24} color="#02de95" />
        </TouchableOpacity>
      }
    >
      {loading ? (
        <View style={{ paddingTop: 60, alignItems: "center" }}>
          <ActivityIndicator color="#02de95" />
        </View>
      ) : (
        <FlatList
          data={routes}
          keyExtractor={(r) => r._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#02de95" />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 70 }}>
              <Icon name="route" size={48} color="rgba(255,255,255,0.25)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 16, fontWeight: "700" }}>Nenhuma rota publicada</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 13, textAlign: "center", paddingHorizontal: 30 }}>
                Publique uma viagem futura entre cidades e leve encomendas no caminho.
              </Text>
              <TouchableOpacity
                onPress={() => navigation.navigate("DriverPublishRoute")}
                style={{ marginTop: 20, backgroundColor: "#02de95", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 }}
              >
                <Text style={{ color: "#062b22", fontWeight: "900" }}>Publicar rota</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </DriverScreen>
  );
}
