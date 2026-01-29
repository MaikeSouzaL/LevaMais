import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import DriverHeader from "./components/DriverHeader";
import SectionCard from "../../../components/ui/SectionCard";
import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";

export default function DriverVehicleScreen() {
  const [loading, setLoading] = useState(false);
  const [vehicleType, setVehicleType] = useState<string>("motorcycle");
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [year, setYear] = useState("");

  const canSave = useMemo(() => {
    return plate.trim().length >= 3 && model.trim().length >= 2;
  }, [plate, model]);

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
        Toast.show({ type: "error", text1: "Falha ao carregar", text2: e?.message });
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

    setLoading(true);
    try {
      await userService.updateProfile({
        vehicleType: vehicleType as any,
        vehicleInfo: {
          plate: plate.trim(),
          model: model.trim(),
          color: color.trim() || undefined,
          year: year ? Number(year) : undefined,
        },
      });
      Toast.show({ type: "success", text1: "Veículo atualizado" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Não foi possível salvar", text2: e?.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Veículo" />

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Dados do veículo</Text>
          <View style={{ height: 12 }} />

          <TextField
            label="Tipo (motorcycle/car/van/truck)"
            value={vehicleType}
            onChangeText={setVehicleType}
          />
          <TextField label="Placa" value={plate} onChangeText={setPlate} />
          <TextField label="Modelo" value={model} onChangeText={setModel} />
          <TextField label="Cor" value={color} onChangeText={setColor} />
          <TextField
            label="Ano"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
          />
        </SectionCard>

        <ActionButton
          title={loading ? "Salvando..." : "Salvar"}
          variant="primary"
          onPress={save}
          disabled={!canSave || loading}
        />
      </View>
    </SafeAreaView>
  );
}
