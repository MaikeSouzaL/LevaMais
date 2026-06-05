import React, { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, FlatList, ActivityIndicator, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import freightService from "@/services/freight.service";
import type { FreightRequest, FreightStatus } from "@/types/freight";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";

const ST_LABEL: Record<FreightStatus, string> = {
  requested: "Novo", quoted: "Cotado", accepted: "Pago", rejected: "Recusado", cancelled: "Cancelado",
  in_transit: "Em trânsito", delivered: "Entregue", completed: "Concluído", refunded: "Estornado", expired: "Expirado",
};
const ST_COLOR: Record<FreightStatus, string> = {
  requested: "#f59e0b", quoted: "#38bdf8", accepted: "#02de95", rejected: "#ef4444", cancelled: "#ef4444",
  in_transit: "#38bdf8", delivered: "#a3a3a3", completed: "#a3a3a3", refunded: "#ef4444", expired: "#94a3b8",
};

export default function CarrierFreightScreen() {
  const [items, setItems] = useState<FreightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { setItems(await freightService.listIncoming()); } catch { setItems([]); } finally { setLoading(false); setRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const act = async (id: string, fn: () => Promise<any>) => {
    setBusy(id);
    try { await fn(); await load(); }
    catch (e: any) { Toast.show({ type: "error", text1: "Falhou", text2: e?.response?.data?.message || e?.message }); }
    finally { setBusy(null); }
  };

  const sendQuote = (f: FreightRequest) => {
    const price = Number(prices[f._id]);
    if (!(price > 0)) return Toast.show({ type: "error", text1: "Informe um preço" });
    act(f._id, async () => { await freightService.quote(f._id, price); Toast.show({ type: "success", text1: "Cotação enviada" }); });
  };

  const renderItem = ({ item }: { item: FreightRequest }) => {
    const c = item.clientId as any;
    const isBusy = busy === item._id;
    return (
      <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: "#fff", fontWeight: "800", flex: 1 }} numberOfLines={1}>{item.item?.description || "Encomenda"}</Text>
          <View style={{ backgroundColor: `${ST_COLOR[item.status]}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: ST_COLOR[item.status], fontWeight: "800", fontSize: 11 }}>{ST_LABEL[item.status]}</Text>
          </View>
        </View>
        <Text style={{ color: "rgba(255,255,255,0.55)", fontSize: 12, marginTop: 4 }}>
          {c?.name || "Cliente"} · {item.item?.size} · {item.item?.weightKg || 0}kg
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginTop: 2 }} numberOfLines={1}>
          Coleta: {item.pickup?.address || "—"} → {item.dropoff?.address || "—"}
        </Text>

        {isBusy ? (
          <View style={{ marginTop: 12, alignItems: "center" }}><ActivityIndicator color="#02de95" /></View>
        ) : item.status === "requested" ? (
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" }}>
            <TextInput
              value={prices[item._id] || ""}
              onChangeText={(v) => setPrices((p) => ({ ...p, [item._id]: v }))}
              keyboardType="decimal-pad"
              placeholder="R$ preço"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, color: "#fff", borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" }}
            />
            <TouchableOpacity onPress={() => sendQuote(item)} style={{ backgroundColor: "#02de95", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 }}>
              <Text style={{ color: "#062b22", fontWeight: "800", fontSize: 13 }}>Cotar</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => act(item._id, () => freightService.reject(item._id))} style={{ borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 }}>
              <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 13 }}>Recusar</Text>
            </TouchableOpacity>
          </View>
        ) : item.status === "quoted" ? (
          <Text style={{ color: "#38bdf8", fontSize: 12, marginTop: 12, fontWeight: "700" }}>Cotado R$ {Number(item.quote?.price || 0).toFixed(2)} — aguardando o cliente aceitar.</Text>
        ) : item.status === "accepted" ? (
          <TouchableOpacity onPress={() => act(item._id, () => freightService.pickup(item._id))} style={{ marginTop: 12, backgroundColor: "#38bdf8", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#04293b", fontWeight: "800" }}>Confirmar coleta</Text>
          </TouchableOpacity>
        ) : item.status === "in_transit" ? (
          <TouchableOpacity onPress={() => act(item._id, () => freightService.deliver(item._id))} style={{ marginTop: 12, backgroundColor: "#02de95", borderRadius: 10, paddingVertical: 10, alignItems: "center" }}>
            <Text style={{ color: "#062b22", fontWeight: "800" }}>Confirmar entrega · receber R$ {Number(item.pricing?.driverPayout || 0).toFixed(2)}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  };

  return (
    <DriverScreen title="Fretes recebidos" scroll={false}>
      {loading ? (
        <View style={{ paddingTop: 50, alignItems: "center" }}><ActivityIndicator color="#02de95" /></View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(f) => f._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical: 8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#02de95" />}
          ListEmptyComponent={
            <View style={{ alignItems: "center", paddingTop: 70 }}>
              <Icon name="package" size={46} color="rgba(255,255,255,0.2)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 14, fontWeight: "700" }}>Nenhum frete recebido</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 13, textAlign: "center", paddingHorizontal: 30 }}>
                Quando um cliente solicitar um frete à sua transportadora, ele aparece aqui para você cotar.
              </Text>
            </View>
          }
        />
      )}
    </DriverScreen>
  );
}
