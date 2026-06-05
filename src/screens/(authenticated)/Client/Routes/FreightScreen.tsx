import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, ScrollView, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ClientScreenHeader from "../Shared/components/ClientScreenHeader";
import freightService from "@/services/freight.service";
import disputeService from "@/services/dispute.service";
import type { FreightRequest, FreightStatus, PublicCarrier } from "@/types/freight";
import type { ItemSize } from "@/types/routes";
import { colors } from "@/theme";
import { Icon } from "@/components/ui/Icon";

const ST_LABEL: Record<FreightStatus, string> = {
  requested: "Aguardando cotação", quoted: "Cotado", accepted: "Pago / a caminho", rejected: "Recusado",
  cancelled: "Cancelado", in_transit: "A caminho", delivered: "Entregue", completed: "Concluído",
  refunded: "Estornado", expired: "Expirado",
};
const ST_COLOR: Record<FreightStatus, string> = {
  requested: "#f59e0b", quoted: "#38bdf8", accepted: "#02de95", rejected: "#ef4444", cancelled: "#ef4444",
  in_transit: "#38bdf8", delivered: "#a3a3a3", completed: "#a3a3a3", refunded: "#ef4444", expired: "#94a3b8",
};
const SIZES: { key: ItemSize; label: string }[] = [
  { key: "small", label: "Pequeno" }, { key: "medium", label: "Médio" }, { key: "large", label: "Grande" },
];
const input = {
  backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  color: colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
} as const;

export default function FreightScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const [tab, setTab] = useState<"carriers" | "mine">("carriers");
  const [carriers, setCarriers] = useState<PublicCarrier[]>([]);
  const [mine, setMine] = useState<FreightRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // formulário de solicitação
  const [selected, setSelected] = useState<PublicCarrier | null>(null);
  const [description, setDescription] = useState("");
  const [size, setSize] = useState<ItemSize>("small");
  const [weightKg, setWeightKg] = useState("1");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    try {
      if (tab === "carriers") setCarriers(await freightService.listCarriers());
      else setMine(await freightService.listMine());
    } catch { /* no-op */ } finally { setLoading(false); setRefreshing(false); }
  }, [tab]);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  // Vindo do perfil da transportadora: abre direto o formulário de solicitação.
  useEffect(() => {
    if (params?.presetCarrierId) {
      setSelected({ _id: params.presetCarrierId, brandName: params.presetCarrierName || "Transportadora" } as PublicCarrier);
    }
  }, [params?.presetCarrierId]);

  const submit = async () => {
    if (!selected) return;
    if (!description.trim()) return Toast.show({ type: "error", text1: "Descreva a encomenda" });
    setSending(true);
    try {
      await freightService.create({
        carrierId: selected._id,
        item: { description: description.trim(), size, weightKg: Number(weightKg) || 0 },
        pickup: { address: pickup.trim() },
        dropoff: { address: dropoff.trim() },
      });
      Toast.show({ type: "success", text1: "Frete solicitado!", text2: "Aguarde a cotação da transportadora." });
      setSelected(null); setDescription(""); setPickup(""); setDropoff("");
      setTab("mine");
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.response?.data?.message || e?.message });
    } finally { setSending(false); }
  };

  const accept = async (f: FreightRequest) => {
    try {
      await freightService.accept(f._id);
      Toast.show({ type: "success", text1: "Frete aceito e pago", text2: "O valor fica retido até a entrega." });
      load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao aceitar", text2: e?.response?.data?.message || e?.message });
    }
  };
  const cancel = async (id: string) => { try { await freightService.cancel(id); Toast.show({ type: "success", text1: "Frete cancelado" }); load(); } catch (e: any) { Toast.show({ type: "error", text1: "Erro", text2: e?.message }); } };
  const dispute = (rideId: string) => Alert.alert("Relatar problema", "Abrir disputa sobre este frete?", [
    { text: "Voltar", style: "cancel" },
    { text: "Abrir disputa", onPress: async () => { try { await disputeService.create({ rideId, category: "route", description: "Problema com frete sob demanda (transportadora)." }); Toast.show({ type: "success", text1: "Disputa aberta" }); } catch (e: any) { Toast.show({ type: "error", text1: "Erro", text2: e?.message }); } } },
  ]);

  // --- Form de solicitação ---
  if (selected) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ClientScreenHeader title="Solicitar frete" showBack />
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          <View style={{ backgroundColor: "rgba(2,222,149,0.08)", borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(2,222,149,0.2)" }}>
            <Text style={{ color: colors.text.primary, fontWeight: "900", fontSize: 15 }}>{selected.brandName}</Text>
            <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>A transportadora vai enviar uma cotação para você aceitar.</Text>
          </View>
          <Lbl text="O que enviar?" />
          <TextInput value={description} onChangeText={setDescription} placeholder="Ex.: caixa, documentos..." placeholderTextColor="rgba(255,255,255,0.35)" style={[input, { marginBottom: 16 }]} />
          <Lbl text="Tamanho" />
          <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
            {SIZES.map((s) => {
              const active = size === s.key;
              return (
                <TouchableOpacity key={s.key} onPress={() => setSize(s.key)} style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: active ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: active ? colors.primary[500] : "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: active ? colors.primary[500] : colors.text.secondary, fontWeight: "700" }}>{s.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Lbl text="Peso aprox. (kg)" />
          <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" style={[input, { marginBottom: 16 }]} />
          <Lbl text="Endereço de coleta" />
          <TextInput value={pickup} onChangeText={setPickup} placeholder="Onde coletar" placeholderTextColor="rgba(255,255,255,0.35)" style={[input, { marginBottom: 16 }]} />
          <Lbl text="Endereço de entrega" />
          <TextInput value={dropoff} onChangeText={setDropoff} placeholder="Onde entregar" placeholderTextColor="rgba(255,255,255,0.35)" style={[input, { marginBottom: 24 }]} />
          <TouchableOpacity disabled={sending} onPress={submit} style={{ backgroundColor: colors.primary[500], borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: sending ? 0.7 : 1 }}>
            {sending ? <ActivityIndicator color="#062b22" /> : <Text style={{ color: "#062b22", fontWeight: "900", fontSize: 16 }}>Solicitar cotação</Text>}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setSelected(null)} style={{ alignItems: "center", paddingVertical: 14 }}>
            <Text style={{ color: colors.text.secondary, fontWeight: "700" }}>Voltar</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const renderCarrier = ({ item }: { item: PublicCarrier }) => (
    <TouchableOpacity activeOpacity={0.85} onPress={() => (item.slug ? navigation.navigate("CarrierProfile", { slug: item.slug }) : setSelected(item))} style={card}>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(2,222,149,0.15)", alignItems: "center", justifyContent: "center" }}>
          <Icon name="truck" size={22} color={colors.primary[500]} />
        </View>
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Text style={{ color: colors.text.primary, fontWeight: "800", fontSize: 15 }} numberOfLines={1}>{item.brandName}</Text>
          <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
            {(item.serviceAreas || []).map((a) => a.label).filter(Boolean).join(" · ") || "Fretes sob demanda"}
          </Text>
        </View>
        <Icon name="chevron-right" size={18} color="rgba(255,255,255,0.4)" />
      </View>
    </TouchableOpacity>
  );

  const renderMine = ({ item }: { item: FreightRequest }) => {
    const c = item.carrierId as any;
    const rideId = item.rideId || null;
    const canAccept = item.status === "quoted";
    const canCancel = ["requested", "quoted", "accepted"].includes(item.status);
    const canTrack = !!rideId && ["accepted", "in_transit"].includes(item.status);
    const canDispute = !!rideId && ["in_transit", "delivered", "completed"].includes(item.status);
    return (
      <View style={card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ color: colors.text.primary, fontWeight: "800", flex: 1 }} numberOfLines={1}>{c?.brandName || "Transportadora"}</Text>
          <View style={{ backgroundColor: `${ST_COLOR[item.status]}22`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 }}>
            <Text style={{ color: ST_COLOR[item.status], fontWeight: "800", fontSize: 11 }}>{ST_LABEL[item.status]}</Text>
          </View>
        </View>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 6 }}>
          {item.item?.description || "Encomenda"}{item.quote?.price ? ` · cotado R$ ${Number(item.quote.price).toFixed(2)}` : ""}
        </Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
          {canAccept && (
            <TouchableOpacity onPress={() => accept(item)} style={{ backgroundColor: colors.primary[500], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "#062b22", fontWeight: "800", fontSize: 13 }}>Aceitar R$ {Number(item.quote?.price || 0).toFixed(2)}</Text>
            </TouchableOpacity>
          )}
          {canTrack && (
            <TouchableOpacity onPress={() => navigation.navigate("DeliveryTracking", { rideId })} style={{ borderWidth: 1, borderColor: colors.primary[500], borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: colors.primary[500], fontWeight: "800", fontSize: 13 }}>Acompanhar</Text>
            </TouchableOpacity>
          )}
          {canDispute && (
            <TouchableOpacity onPress={() => dispute(rideId as string)} style={{ borderWidth: 1, borderColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "#f59e0b", fontWeight: "800", fontSize: 13 }}>Problema</Text>
            </TouchableOpacity>
          )}
          {canCancel && (
            <TouchableOpacity onPress={() => cancel(item._id)} style={{ borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 13 }}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ClientScreenHeader title="Fretes" subtitle="Contrate transportadoras para enviar suas encomendas" />
      <View style={{ flexDirection: "row", padding: 16, gap: 10 }}>
        {(["carriers", "mine"] as const).map((t) => {
          const active = tab === t;
          return (
            <TouchableOpacity key={t} onPress={() => { setTab(t); setLoading(true); }} style={{ flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: "center", backgroundColor: active ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: active ? colors.primary[500] : "rgba(255,255,255,0.08)" }}>
              <Text style={{ color: active ? colors.primary[500] : colors.text.secondary, fontWeight: "800", fontSize: 13 }}>{t === "carriers" ? "Transportadoras" : "Meus fretes"}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {loading ? (
        <View style={{ paddingTop: 50, alignItems: "center" }}><ActivityIndicator color={colors.primary[500]} /></View>
      ) : tab === "carriers" ? (
        <FlatList data={carriers} keyExtractor={(c) => c._id} renderItem={renderCarrier}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary[500]} />}
          ListEmptyComponent={<Empty icon="truck" text="Nenhuma transportadora disponível ainda" />} />
      ) : (
        <FlatList data={mine} keyExtractor={(f) => f._id} renderItem={renderMine}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 30 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={colors.primary[500]} />}
          ListEmptyComponent={<Empty icon="package" text="Você ainda não solicitou fretes" />} />
      )}
    </View>
  );
}

function Lbl({ text }: { text: string }) {
  return <Text style={{ color: colors.text.primary, fontWeight: "700", fontSize: 13, marginBottom: 8 }}>{text}</Text>;
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
  backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 12,
  borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
} as const;
