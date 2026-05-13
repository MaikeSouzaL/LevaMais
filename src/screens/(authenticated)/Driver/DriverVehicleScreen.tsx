import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity } from "react-native";
import Toast from "react-native-toast-message";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";

import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";

interface CompletionStatus {
  vehicleType: boolean;
  plate: boolean;
  model: boolean;
  color: boolean;
  year: boolean;
}

function getCompletionStatus(vehicleType: string, plate: string, model: string, color: string, year: string): CompletionStatus {
  return {
    vehicleType: vehicleType.trim().length > 0,
    plate: plate.trim().length >= 3,
    model: model.trim().length >= 2,
    color: color.trim().length > 0,
    year: year.trim().length > 0,
  };
}

function getCompletionPercentage(status: CompletionStatus): number {
  const total = Object.keys(status).length;
  const completed = Object.values(status).filter(Boolean).length;
  return Math.round((completed / total) * 100);
}

const VEHICLE_TYPES = [
  { id: "motorcycle", label: "Motocicleta", icon: "two-wheeler" as const },
  { id: "car", label: "Carro", icon: "directions-car" as const },
  { id: "van", label: "Van", icon: "airport-shuttle" as const },
  { id: "truck", label: "Caminhão", icon: "local-shipping" as const },
];

export default function DriverVehicleScreen() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>("motorcycle");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");

  const canSave = useMemo(() => {
    return plate.trim().length >= 3 && model.trim().length >= 2;
  }, [plate, model]);

  const completionStatus = useMemo(() => getCompletionStatus(vehicleType, plate, model, color, year), [vehicleType, plate, model, color, year]);
  const completionPercentage = useMemo(() => getCompletionPercentage(completionStatus), [completionStatus]);
  const isComplete = completionPercentage === 100;

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const u = await userService.getProfile();
        if (!mounted) return;
        setVehicleType(u.vehicleType || "motorcycle");
        setPlate(u.vehicleInfo?.plate || "");
        setModel(u.vehicleInfo?.model || "");
        setColor(u.vehicleInfo?.color || "");
        setYear(u.vehicleInfo?.year ? String(u.vehicleInfo.year) : "");
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao carregar dados",
          text2: e?.message,
        });
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  async function save() {
    if (!canSave) return;

    setSaving(true);
    try {
      await userService.updateProfile({
        vehicleType: vehicleType as any,
        vehicleInfo: {
          plate: plate.trim().toUpperCase(),
          model: model.trim(),
          color: color.trim() || undefined,
          year: year ? Number(year) : undefined,
        },
      });
      Toast.show({ type: "success", text1: "Veículo atualizado com sucesso!" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível salvar",
        text2: e?.message,
      });
    } finally {
      setSaving(false);
    }
  }

  const currentVehicleLabel = VEHICLE_TYPES.find(v => v.id === vehicleType)?.label || "Veículo";
  const currentVehicleIcon = VEHICLE_TYPES.find(v => v.id === vehicleType)?.icon || "directions-car";

  if (loading) {
    return (
      <DriverScreen title="Carregando..." hideHeader={true}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#02de95" />
        </View>
      </DriverScreen>
    );
  }

  return (
    <DriverScreen title="Veículo do Motorista" hideHeader={true} scroll>
      
      {/* 🌟 Top Glowing Badge Card */}
      <LinearGradient
        colors={["rgba(2, 222, 149, 0.12)", "rgba(11, 26, 42, 0.6)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 24,
          padding: 22,
          marginBottom: 20,
          borderWidth: 1,
          borderColor: "rgba(2, 222, 149, 0.3)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between"
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: "800", textTransform: "uppercase", letterSpacing: 0.5 }}>
            Ativo na Plataforma
          </Text>
          <Text style={{ color: "#fff", fontSize: 24, fontWeight: "900", marginTop: 2 }}>
            {currentVehicleLabel}
          </Text>
          <Text style={{ color: plate ? "#02de95" : "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "700", marginTop: 4 }}>
            {plate.toUpperCase() || "Placa não cadastrada"}
          </Text>
        </View>
        
        <View style={{
          width: 60,
          height: 60,
          borderRadius: 30,
          backgroundColor: "rgba(2, 222, 149, 0.15)",
          borderWidth: 1,
          borderColor: "#02de95",
          justifyContent: "center",
          alignItems: "center"
        }}>
          <MaterialIcons name={currentVehicleIcon} size={28} color="#02de95" />
        </View>
      </LinearGradient>

      {/* 📊 Visual Core Progress Summary */}
      <SectionCard style={{ padding: 16, marginBottom: 22 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <View>
            <Text style={{ color: "#fff", fontWeight: "800", fontSize: 14 }}>Dados Registrados</Text>
            <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>Completude do perfil veicular</Text>
          </View>
          <View style={{ backgroundColor: "rgba(2, 222, 149, 0.1)", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
            <Text style={{ color: "#02de95", fontWeight: "900", fontSize: 14 }}>{completionPercentage}%</Text>
          </View>
        </View>

        <View style={{ height: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${completionPercentage}%`, backgroundColor: isComplete ? "#02de95" : "#F59E0B", borderRadius: 3 }} />
        </View>
      </SectionCard>

      {/* 🛵 Selectable Visual Type Row */}
      <View style={{ marginBottom: 22 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", paddingLeft: 4, marginBottom: 12 }}>
          Selecione o Tipo de Veículo
        </Text>
        
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {VEHICLE_TYPES.map((item) => {
            const active = vehicleType === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  minWidth: "45%",
                  backgroundColor: active ? "rgba(2, 222, 149, 0.08)" : "rgba(255,255,255,0.03)",
                  borderRadius: 18,
                  paddingVertical: 18,
                  alignItems: "center",
                  justifyContent: "center",
                  borderWidth: 1,
                  borderColor: active ? "#02de95" : "rgba(255,255,255,0.08)",
                  gap: 6
                }}
                onPress={() => setVehicleType(item.id)}
              >
                <MaterialIcons name={item.icon} size={26} color={active ? "#02de95" : "rgba(255,255,255,0.4)"} />
                <Text style={{ color: active ? "#fff" : "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: active ? "800" : "600" }}>
                  {item.label}
                </Text>
                {active && (
                  <View style={{ position: "absolute", top: 8, right: 8 }}>
                    <Ionicons name="checkmark-circle" size={16} color="#02de95" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 📝 Unified Form Card */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "800", textTransform: "uppercase", paddingLeft: 4, marginBottom: 12 }}>
          Informações Técnicas
        </Text>

        <SectionCard style={{ padding: 18, gap: 16 }}>
          
          {/* Modelo */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Ionicons name="build-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" }}>Modelo do Veículo</Text>
            </View>
            <TextField
              value={model}
              onChangeText={setModel}
              placeholder="Ex: Honda Civic, Yamaha Fazer..."
            />
          </View>

          {/* Grid: Placa e Ano */}
          <View style={{ flexDirection: "row", gap: 14 }}>
            <View style={{ flex: 1.2 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="card-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" }}>Placa</Text>
              </View>
              <TextField
                value={plate}
                onChangeText={(val) => setPlate(val.toUpperCase())}
                placeholder="ABC-1234"
                autoCapitalize="characters"
              />
            </View>

            <View style={{ flex: 0.8 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.5)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" }}>Ano</Text>
              </View>
              <TextField
                value={year}
                onChangeText={setYear}
                keyboardType="number-pad"
                maxLength={4}
                placeholder="2024"
              />
            </View>
          </View>

          {/* Cor */}
          <View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 }}>
              <Ionicons name="color-palette-outline" size={14} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700" }}>Cor Predominante</Text>
            </View>
            <TextField
              value={color}
              onChangeText={setColor}
              placeholder="Ex: Preto, Prata, Branco..."
            />
          </View>

        </SectionCard>
      </View>

      {/* 💾 Action Area */}
      <View style={{ marginBottom: 40 }}>
        {saving ? (
          <View style={{ paddingVertical: 14, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#02de95" />
          </View>
        ) : (
          <ActionButton
            title="Salvar Dados do Veículo"
            variant="primary"
            onPress={save}
            disabled={!canSave || saving}
          />
        )}
      </View>

    </DriverScreen>
  );
}
