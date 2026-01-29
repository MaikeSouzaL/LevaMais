import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import SectionCard from "../../../components/ui/SectionCard";
import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { useAuthStore } from "../../../context/authStore";

export default function ClientProfileScreen() {
  const navigation = useNavigation();
  const updateUserData = useAuthStore((s) => s.updateUserData);

  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");

  const canSave = useMemo(() => {
    return name.trim().length >= 2;
  }, [name]);

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
          text1: "Não foi possível carregar perfil",
          text2: e?.message || "Tente novamente",
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
      const u = await userService.updateProfile({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim(),
      });

      // sincroniza store local (usada em vários lugares)
      updateUserData({
        name: u.name,
        telefone: u.phone,
        cidade: u.city,
        nome: u.name,
        email: u.email,
      } as any);

      Toast.show({ type: "success", text1: "Perfil atualizado" });
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível salvar",
        text2: e?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Perfil
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0", fontWeight: "800" }}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "rgba(255,255,255,0.75)", fontWeight: "800" }}>
            Dados
          </Text>
          <View style={{ height: 12 }} />
          <TextField label="Nome" value={name} onChangeText={setName} />
          <TextField
            label="Telefone"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          <TextField label="Cidade" value={city} onChangeText={setCity} />
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
