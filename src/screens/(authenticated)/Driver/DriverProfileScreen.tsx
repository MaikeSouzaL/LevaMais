import React, { useEffect, useMemo, useState } from "react";
import { View, Text } from "react-native";
import Toast from "react-native-toast-message";

import SectionCard from "../../../components/ui/SectionCard";
import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverProfileScreen() {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const canSave = useMemo(() => name.trim().length >= 2, [name]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      try {
        const u = await userService.getProfile();
        if (!mounted) return;
        setName(u?.name || "");
        setPhone(u?.phone || "");
        setCity(u?.city || "");
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Falha ao carregar",
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
    setLoading(true);
    try {
      await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });
      Toast.show({ type: "success", text1: "Perfil atualizado" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível salvar",
        text2: e?.message,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverScreen title="Perfil">
      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900" }}>Dados</Text>
        <View style={{ height: 12 }} />
        <TextField label="Nome" value={name} onChangeText={setName} />
        <TextField label="Telefone" value={phone} onChangeText={setPhone} />
        <TextField label="Cidade" value={city} onChangeText={setCity} />
      </SectionCard>

      <ActionButton
        title={loading ? "Salvando..." : "Salvar"}
        variant="primary"
        onPress={save}
        disabled={!canSave || loading}
      />
    </DriverScreen>
  );
}
