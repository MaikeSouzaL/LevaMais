import React, { useCallback, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import routeService from "@/services/route.service";
import type { RouteSchedule, VehicleType } from "@/types/routes";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";

const DAYS = ["D", "S", "T", "Q", "Q", "S", "S"]; // 0..6
const DAYS_FULL = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
} as const;

function Lbl({ text }: { text: string }) {
  return <Text style={{ color: "rgba(255,255,255,0.85)", fontWeight: "700", fontSize: 13, marginBottom: 8 }}>{text}</Text>;
}

export default function CarrierSchedulesScreen() {
  const [schedules, setSchedules] = useState<RouteSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [vehicleType] = useState<VehicleType>("motorcycle");
  const [originLabel, setOriginLabel] = useState("");
  const [destLabel, setDestLabel] = useState("");
  const [days, setDays] = useState<number[]>([1, 3, 5]);
  const [time, setTime] = useState("08:00");
  const [basePrice, setBasePrice] = useState("15");
  const [pricePerKg, setPricePerKg] = useState("0");

  const load = useCallback(async () => {
    try {
      setSchedules(await routeService.listSchedules());
    } catch {
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { setLoading(true); load(); }, [load]));

  const toggleDay = (d: number) => setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()));

  const submit = async () => {
    if (!originLabel.trim() || !destLabel.trim()) return Toast.show({ type: "error", text1: "Informe origem e destino" });
    if (!days.length) return Toast.show({ type: "error", text1: "Selecione ao menos um dia" });
    setCreating(true);
    try {
      const res = await routeService.createSchedule({
        vehicleType,
        origin: { label: originLabel.trim() },
        destination: { label: destLabel.trim() },
        daysOfWeek: days,
        departTime: time.trim(),
        pricing: { basePrice: Number(basePrice) || 0, pricePerKg: Number(pricePerKg) || 0 },
      });
      Toast.show({ type: "success", text1: "Agenda criada!", text2: `${(res as any)?.daysOfWeek?.length || days.length} dia(s) por semana.` });
      setShowForm(false);
      setOriginLabel(""); setDestLabel("");
      load();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message;
      Toast.show({ type: "error", text1: "Erro ao criar agenda", text2: msg });
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (s: RouteSchedule) => {
    try {
      await routeService.toggleSchedule(s._id);
      load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message });
    }
  };

  const remove = async (s: RouteSchedule) => {
    try {
      await routeService.deleteSchedule(s._id);
      Toast.show({ type: "success", text1: "Agenda removida" });
      load();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message });
    }
  };

  return (
    <DriverScreen
      title="Rotas Recorrentes"
      scroll
      headerRight={
        <TouchableOpacity onPress={() => setShowForm((v) => !v)} style={{ padding: 6 }}>
          <Icon name={showForm ? "x" : "plus"} size={24} color="#02de95" />
        </TouchableOpacity>
      }
    >
      {showForm && (
        <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginBottom: 20 }}>
          <Lbl text="Origem" />
          <TextInput value={originLabel} onChangeText={setOriginLabel} placeholder="Ex.: Cacoal" placeholderTextColor="rgba(255,255,255,0.35)" style={[inputStyle, { marginBottom: 14 }]} />
          <Lbl text="Destino" />
          <TextInput value={destLabel} onChangeText={setDestLabel} placeholder="Ex.: Pimenta Bueno" placeholderTextColor="rgba(255,255,255,0.35)" style={[inputStyle, { marginBottom: 14 }]} />

          <Lbl text="Dias da semana" />
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 14 }}>
            {DAYS.map((d, i) => {
              const active = days.includes(i);
              return (
                <TouchableOpacity key={i} onPress={() => toggleDay(i)} style={{ flex: 1, aspectRatio: 1, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: active ? "#02de95" : "rgba(255,255,255,0.06)", borderWidth: 1, borderColor: active ? "#02de95" : "rgba(255,255,255,0.08)" }}>
                  <Text style={{ color: active ? "#062b22" : "rgba(255,255,255,0.7)", fontWeight: "900" }}>{d}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Lbl text="Horário (HH:mm)" />
              <TextInput value={time} onChangeText={setTime} placeholder="08:00" placeholderTextColor="rgba(255,255,255,0.35)" style={inputStyle} />
            </View>
            <View style={{ flex: 1 }}>
              <Lbl text="Preço base (R$)" />
              <TextInput value={basePrice} onChangeText={setBasePrice} keyboardType="decimal-pad" style={inputStyle} />
            </View>
            <View style={{ flex: 1 }}>
              <Lbl text="R$/kg" />
              <TextInput value={pricePerKg} onChangeText={setPricePerKg} keyboardType="decimal-pad" style={inputStyle} />
            </View>
          </View>

          <TouchableOpacity disabled={creating} onPress={submit} style={{ backgroundColor: "#02de95", borderRadius: 12, paddingVertical: 14, alignItems: "center", opacity: creating ? 0.7 : 1 }}>
            {creating ? <ActivityIndicator color="#062b22" /> : <Text style={{ color: "#062b22", fontWeight: "900" }}>Criar agenda</Text>}
          </TouchableOpacity>
        </View>
      )}

      {loading ? (
        <View style={{ paddingTop: 40, alignItems: "center" }}><ActivityIndicator color="#02de95" /></View>
      ) : schedules.length === 0 && !showForm ? (
        <View style={{ alignItems: "center", paddingTop: 60 }}>
          <Icon name="calendar" size={46} color="rgba(255,255,255,0.2)" />
          <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 14, fontWeight: "700" }}>Nenhuma agenda</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", marginTop: 6, fontSize: 13, textAlign: "center", paddingHorizontal: 30 }}>
            Crie uma agenda e o app publica suas rotas automaticamente nos dias escolhidos.
          </Text>
        </View>
      ) : (
        schedules.map((s) => (
          <View key={s._id} style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", opacity: s.active ? 1 : 0.55 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={{ color: "#fff", fontWeight: "800", flex: 1 }} numberOfLines={1}>
                {s.origin?.label} → {s.destination?.label}
              </Text>
              <Text style={{ color: "#02de95", fontWeight: "900" }}>{s.departTime}</Text>
            </View>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
              {s.daysOfWeek.map((d) => DAYS_FULL[d]).join(" · ")} · base R$ {Number(s.pricing?.basePrice || 0).toFixed(0)}
            </Text>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity onPress={() => toggleActive(s)} style={{ borderWidth: 1, borderColor: s.active ? "#f59e0b" : "#02de95", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: s.active ? "#f59e0b" : "#02de95", fontWeight: "800", fontSize: 13 }}>{s.active ? "Pausar" : "Ativar"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => remove(s)} style={{ borderWidth: 1, borderColor: "#ef4444", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
                <Text style={{ color: "#ef4444", fontWeight: "800", fontSize: 13 }}>Remover</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))
      )}
    </DriverScreen>
  );
}
