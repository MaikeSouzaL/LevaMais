import React, { useMemo, useState } from "react";
import { Text, View, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import routeService from "@/services/route.service";
import type { VehicleType } from "@/types/routes";
import { DriverScreen } from "./components/DriverScreen";
import { Icon } from "@/components/ui/Icon";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const VEHICLES: { key: VehicleType; label: string; icon: string }[] = [
  { key: "motorcycle", label: "Moto", icon: "bike" },
  { key: "car", label: "Carro", icon: "car" },
  { key: "van", label: "Van", icon: "truck" },
  { key: "truck", label: "Caminhão", icon: "truck" },
];

function label(color: string, text: string) {
  return <Text style={{ color, fontWeight: "700", fontSize: 13, marginBottom: 8 }}>{text}</Text>;
}

const inputStyle = {
  backgroundColor: "rgba(255,255,255,0.06)",
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  color: "#fff",
  fontSize: 15,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.08)",
} as const;

function fmt(d: Date) {
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export default function DriverPublishRouteScreen() {
  const navigation = useNavigation<any>();
  const [vehicleType, setVehicleType] = useState<VehicleType>("motorcycle");
  const [origin, setOrigin] = useState<{ label: string; latitude?: number; longitude?: number }>({ label: "" });
  const [destination, setDestination] = useState<{ label: string; latitude?: number; longitude?: number }>({ label: "" });
  const [maxItems, setMaxItems] = useState("10");
  const [maxWeightKg, setMaxWeightKg] = useState("50");
  const [basePrice, setBasePrice] = useState("15");
  const [pricePerKg, setPricePerKg] = useState("0");
  const [departAt, setDepartAt] = useState<Date>(() => new Date(Date.now() + 2 * 3600 * 1000));
  const [saving, setSaving] = useState(false);

  const presets = useMemo(() => {
    const now = Date.now();
    const tomorrow8 = new Date(now + 24 * 3600 * 1000);
    tomorrow8.setHours(8, 0, 0, 0);
    const tomorrow14 = new Date(now + 24 * 3600 * 1000);
    tomorrow14.setHours(14, 0, 0, 0);
    return [
      { label: "+2h", date: new Date(now + 2 * 3600 * 1000) },
      { label: "Amanhã 08:00", date: tomorrow8 },
      { label: "Amanhã 14:00", date: tomorrow14 },
    ];
  }, []);

  const adjust = (hours: number) => setDepartAt((d) => new Date(d.getTime() + hours * 3600 * 1000));

  const submit = async () => {
    if (!origin.label.trim()) return Toast.show({ type: "error", text1: "Informe a origem" });
    if (!destination.label.trim()) return Toast.show({ type: "error", text1: "Informe o destino" });
    if (departAt.getTime() <= Date.now()) return Toast.show({ type: "error", text1: "A partida deve ser no futuro" });

    setSaving(true);
    try {
      await routeService.publish({
        vehicleType,
        origin: {
          label: origin.label.trim(),
          latitude: origin.latitude,
          longitude: origin.longitude,
        },
        destination: {
          label: destination.label.trim(),
          latitude: destination.latitude,
          longitude: destination.longitude,
        },
        departAt: departAt.toISOString(),
        capacity: { maxItems: Number(maxItems) || 1, maxWeightKg: Number(maxWeightKg) || 0 },
        pricing: { basePrice: Number(basePrice) || 0, pricePerKg: Number(pricePerKg) || 0 },
      });
      Toast.show({ type: "success", text1: "Rota publicada!" });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao publicar", text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DriverScreen title="Publicar Rota" scroll>
      <View style={{ paddingBottom: 30 }}>
        {label("rgba(255,255,255,0.85)", "Veículo")}
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
          {VEHICLES.map((v) => {
            const active = vehicleType === v.key;
            return (
              <TouchableOpacity
                key={v.key}
                onPress={() => setVehicleType(v.key)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12,
                  backgroundColor: active ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.05)",
                  borderWidth: 1, borderColor: active ? "#02de95" : "rgba(255,255,255,0.08)",
                }}
              >
                <Icon name={v.icon} size={20} color={active ? "#02de95" : "rgba(255,255,255,0.6)"} />
                <Text style={{ color: active ? "#02de95" : "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", marginTop: 5 }}>{v.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <AddressAutocomplete
          label="Origem"
          placeholder="Cidade ou endereço de origem..."
          query={origin.label}
          setQuery={(val) => setOrigin((prev) => ({ ...prev, label: val }))}
          onSelect={(details) => setOrigin({
            label: details.formattedAddress,
            latitude: details.latitude,
            longitude: details.longitude,
          })}
        />

        <AddressAutocomplete
          label="Destino"
          placeholder="Cidade ou endereço de destino..."
          query={destination.label}
          setQuery={(val) => setDestination((prev) => ({ ...prev, label: val }))}
          onSelect={(details) => setDestination({
            label: details.formattedAddress,
            latitude: details.latitude,
            longitude: details.longitude,
          })}
        />

        {label("rgba(255,255,255,0.85)", "Partida")}
        <View style={{ backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, padding: 14, marginBottom: 8, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <TouchableOpacity onPress={() => adjust(-1)} style={{ padding: 6 }}><Icon name="minus" size={20} color="#02de95" /></TouchableOpacity>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="clock" size={16} color="rgba(255,255,255,0.7)" />
            <Text style={{ color: "#fff", fontWeight: "800", marginLeft: 8 }}>{fmt(departAt)}</Text>
          </View>
          <TouchableOpacity onPress={() => adjust(1)} style={{ padding: 6 }}><Icon name="plus" size={20} color="#02de95" /></TouchableOpacity>
        </View>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 20 }}>
          {presets.map((p) => (
            <TouchableOpacity key={p.label} onPress={() => setDepartAt(p.date)} style={{ flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)" }}>
              <Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 11, fontWeight: "700" }}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 20 }}>
          <View style={{ flex: 1 }}>
            {label("rgba(255,255,255,0.85)", "Máx. itens")}
            <TextInput value={maxItems} onChangeText={setMaxItems} keyboardType="number-pad" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            {label("rgba(255,255,255,0.85)", "Máx. peso (kg)")}
            <TextInput value={maxWeightKg} onChangeText={setMaxWeightKg} keyboardType="number-pad" style={inputStyle} />
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginBottom: 28 }}>
          <View style={{ flex: 1 }}>
            {label("rgba(255,255,255,0.85)", "Preço base (R$)")}
            <TextInput value={basePrice} onChangeText={setBasePrice} keyboardType="decimal-pad" style={inputStyle} />
          </View>
          <View style={{ flex: 1 }}>
            {label("rgba(255,255,255,0.85)", "R$/kg")}
            <TextInput value={pricePerKg} onChangeText={setPricePerKg} keyboardType="decimal-pad" style={inputStyle} />
          </View>
        </View>

        <TouchableOpacity
          disabled={saving}
          onPress={submit}
          style={{ backgroundColor: "#02de95", borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.7 : 1 }}
        >
          {saving ? <ActivityIndicator color="#062b22" /> : <Text style={{ color: "#062b22", fontWeight: "900", fontSize: 16 }}>Publicar rota</Text>}
        </TouchableOpacity>
      </View>
    </DriverScreen>
  );
}
