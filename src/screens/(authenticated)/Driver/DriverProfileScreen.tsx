import React, { useEffect, useMemo, useState } from "react";
import { TouchableOpacity, View, Text } from "react-native";
import Toast from "react-native-toast-message";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import SectionCard from "../../../components/ui/SectionCard";
import TextField from "../../../components/ui/TextField";
import ActionButton from "../../../components/ui/ActionButton";
import userService from "../../../services/user.service";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverProfileScreen() {
  const navigation = useNavigation<any>();
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
    <DriverScreen title="Perfil" hideHeader={true}>
      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900" }}>Dados</Text>
        <View style={{ height: 12 }} />
        <TextField label="Nome" value={name} onChangeText={setName} />
        <TextField label="Telefone" value={phone} onChangeText={setPhone} />
        <TextField label="Cidade" value={city} onChangeText={setCity} />
      </SectionCard>

      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900", marginBottom: 8 }}>
          Atalhos de conta
        </Text>

        <QuickAccessRow
          icon="description"
          title="Documentos"
          subtitle="Status da sua documentacao"
          onPress={() => navigation.navigate("DriverDocuments")}
        />
        <QuickAccessRow
          icon="tune"
          title="Preferencias"
          subtitle="Corridas, entregas e aceite"
          onPress={() => navigation.navigate("DriverWorkPreferences")}
        />
        <QuickAccessRow
          icon="star"
          title="Avaliacoes"
          subtitle="Notas e feedback dos clientes"
          onPress={() => navigation.navigate("DriverRatings")}
        />
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

function QuickAccessRow(props: {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={props.onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 10,
      }}
    >
      <MaterialIcons name={props.icon} size={20} color="#02de95" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#fff", fontWeight: "800" }}>{props.title}</Text>
        <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
          {props.subtitle}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.5)" />
    </TouchableOpacity>
  );
}
