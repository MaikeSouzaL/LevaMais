import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Switch } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import ClientScreenHeader from "../Shared/components/ClientScreenHeader";
import routeService from "@/services/route.service";
import type { DriverRoute, ItemSize } from "@/types/routes";
import { colors } from "@/theme";
import { Icon } from "@/components/ui/Icon";
import AddressAutocomplete from "@/components/AddressAutocomplete";

const SIZES: { key: ItemSize; label: string }[] = [
  { key: "small", label: "Pequeno" },
  { key: "medium", label: "Médio" },
  { key: "large", label: "Grande" },
];

const input = {
  backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
  color: colors.text.primary, fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
} as const;

export default function RouteReserveScreen() {
  const navigation = useNavigation<any>();
  const { params } = useRoute<any>();
  const routeId: string = params?.routeId;

  const [route, setRoute] = useState<DriverRoute | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [description, setDescription] = useState("");
  const [size, setSize] = useState<ItemSize>("small");
  const [weightKg, setWeightKg] = useState("1");
  const [pickup, setPickup] = useState<{ address: string; latitude?: number; longitude?: number }>({ address: "" });
  const [dropoff, setDropoff] = useState<{ address: string; latitude?: number; longitude?: number }>({ address: "" });
  const [withInsurance, setWithInsurance] = useState(false);
  const [declaredValue, setDeclaredValue] = useState("");

  useFocusEffect(useCallback(() => {
    routeService.getRoute(routeId).then((r) => setRoute(r)).catch(() => {}).finally(() => setLoading(false));
  }, [routeId]));

  const INSURANCE_PCT = 0.02; // espelha PlatformConfig.plannedRoutes.insuranceFeePct (valor final é calculado no backend)

  const estimate = useMemo(() => {
    if (!route) return 0;
    const base = Number(route.pricing?.basePrice) || 0;
    const perKg = Number(route.pricing?.pricePerKg) || 0;
    const mult = route.pricing?.sizeMultipliers?.[size] ?? (size === "large" ? 1.5 : size === "medium" ? 1.2 : 1);
    let itemPrice = Math.max(0, (base + (Number(weightKg) || 0) * perKg) * mult);

    // Precificação dinâmica por ocupação (Fase D9)
    const maxItems = Math.max(1, route.capacity?.maxItems || 10);
    const maxWeight = Math.max(1, route.capacity?.maxWeightKg || 50);
    const currentItems = Number(route.capacityUsed?.items) || 0;
    const currentWeight = Number(route.capacityUsed?.weightKg) || 0;

    const itemOccupancy = currentItems / maxItems;
    const weightOccupancy = currentWeight / maxWeight;
    const occupancy = Math.max(0, Math.min(1, Math.max(itemOccupancy, weightOccupancy)));

    let occupancyMultiplier = 1.0;
    if (occupancy > 0.8) {
      occupancyMultiplier = 1.15 + (occupancy - 0.8) * 1.25; // Até 1.4x
    } else if (occupancy > 0.5) {
      occupancyMultiplier = 1.0 + (occupancy - 0.5) * 0.5; // Até 1.15x
    }

    itemPrice = itemPrice * occupancyMultiplier;

    const insurance = withInsurance ? (Number(declaredValue) || 0) * INSURANCE_PCT : 0;
    return itemPrice + insurance;
  }, [route, size, weightKg, withInsurance, declaredValue]);

  const submit = async () => {
    if (!description.trim()) return Toast.show({ type: "error", text1: "Descreva a encomenda" });
    if (!pickup.address.trim()) return Toast.show({ type: "error", text1: "Informe o endereço de coleta" });
    if (!dropoff.address.trim()) return Toast.show({ type: "error", text1: "Informe o endereço de entrega" });

    setSaving(true);
    try {
      await routeService.createReservation({
        routeId,
        item: {
          description: description.trim(),
          size,
          weightKg: Number(weightKg) || 0,
          declaredValue: withInsurance ? Number(declaredValue) || 0 : 0,
        },
        pickup: {
          address: pickup.address.trim(),
          latitude: pickup.latitude,
          longitude: pickup.longitude,
        },
        dropoff: {
          address: dropoff.address.trim(),
          latitude: dropoff.latitude,
          longitude: dropoff.longitude,
        },
        withInsurance,
      });
      Toast.show({ type: "success", text1: "Reserva solicitada!", text2: "Aguarde o motorista aceitar." });
      navigation.goBack();
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro ao reservar", text2: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
        <ClientScreenHeader title="Reservar espaço" showBack />
        <View style={{ paddingTop: 50, alignItems: "center" }}><ActivityIndicator color={colors.primary[500]} /></View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.primary }}>
      <ClientScreenHeader title="Reservar espaço" showBack />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {route && (
          <View style={{ backgroundColor: "rgba(2,222,149,0.08)", borderRadius: 14, padding: 14, marginBottom: 20, borderWidth: 1, borderColor: "rgba(2,222,149,0.2)" }}>
            <Text style={{ color: colors.text.primary, fontWeight: "900", fontSize: 15 }}>
              {route.origin?.label} → {route.destination?.label}
            </Text>
            <Text style={{ color: colors.text.secondary, fontSize: 12, marginTop: 4 }}>
              Partida: {route.departAt ? new Date(route.departAt).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }) : "-"}
            </Text>
          </View>
        )}

        <Lbl text="O que você vai enviar?" />
        <TextInput value={description} onChangeText={setDescription} placeholder="Ex.: Documentos, caixa de peças..." placeholderTextColor="rgba(255,255,255,0.35)" style={[input, { marginBottom: 18 }]} />

        <Lbl text="Tamanho" />
        <View style={{ flexDirection: "row", gap: 10, marginBottom: 18 }}>
          {SIZES.map((s) => {
            const active = size === s.key;
            return (
              <TouchableOpacity key={s.key} onPress={() => setSize(s.key)} style={{ flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, backgroundColor: active ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: active ? colors.primary[500] : "rgba(255,255,255,0.08)" }}>
                <Text style={{ color: active ? colors.primary[500] : colors.text.secondary, fontWeight: "700" }}>{s.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Lbl text="Peso aproximado (kg)" />
        <TextInput value={weightKg} onChangeText={setWeightKg} keyboardType="decimal-pad" style={[input, { marginBottom: 18 }]} />

        <AddressAutocomplete
          label="Endereço de coleta"
          placeholder="Onde o motorista coleta..."
          query={pickup.address}
          setQuery={(val) => setPickup((prev) => ({ ...prev, address: val }))}
          onSelect={(details) => setPickup({
            address: details.formattedAddress,
            latitude: details.latitude,
            longitude: details.longitude,
          })}
        />

        <AddressAutocomplete
          label="Endereço de entrega"
          placeholder="Onde o motorista entrega..."
          query={dropoff.address}
          setQuery={(val) => setDropoff((prev) => ({ ...prev, address: val }))}
          onSelect={(details) => setDropoff({
            address: details.formattedAddress,
            latitude: details.latitude,
            longitude: details.longitude,
          })}
        />

        <View style={{ backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1, paddingRight: 10 }}>
              <Icon name="shield-check" size={18} color={colors.primary[500]} />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={{ color: colors.text.primary, fontWeight: "700", fontSize: 14 }}>Seguro da encomenda</Text>
                <Text style={{ color: colors.text.secondary, fontSize: 11, marginTop: 2 }}>Garantia de 2% sobre o valor declarado</Text>
              </View>
            </View>
            <Switch
              value={withInsurance}
              onValueChange={setWithInsurance}
              trackColor={{ false: "rgba(255,255,255,0.15)", true: "rgba(2,222,149,0.5)" }}
              thumbColor={withInsurance ? colors.primary[500] : "#f4f4f5"}
            />
          </View>
          {withInsurance && (
            <TextInput
              value={declaredValue}
              onChangeText={setDeclaredValue}
              keyboardType="decimal-pad"
              placeholder="Valor declarado (R$)"
              placeholderTextColor="rgba(255,255,255,0.35)"
              style={[input, { marginTop: 12 }]}
            />
          )}
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 14, padding: 16, marginBottom: 20 }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Icon name="cash" size={18} color={colors.primary[500]} />
            <Text style={{ color: colors.text.secondary, fontWeight: "700", marginLeft: 8 }}>Estimativa</Text>
          </View>
          <Text style={{ color: colors.text.primary, fontWeight: "900", fontSize: 20 }}>R$ {estimate.toFixed(2)}</Text>
        </View>
        <Text style={{ color: colors.text.secondary, fontSize: 12, marginBottom: 24 }}>
          O valor é retido na sua carteira LevaPay e só é liberado ao motorista após a entrega.
        </Text>

        <TouchableOpacity disabled={saving} onPress={submit} style={{ backgroundColor: colors.primary[500], borderRadius: 14, paddingVertical: 16, alignItems: "center", opacity: saving ? 0.7 : 1 }}>
          {saving ? <ActivityIndicator color="#062b22" /> : <Text style={{ color: "#062b22", fontWeight: "900", fontSize: 16 }}>Reservar e pagar</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Lbl({ text }: { text: string }) {
  return <Text style={{ color: colors.text.primary, fontWeight: "700", fontSize: 13, marginBottom: 8 }}>{text}</Text>;
}
