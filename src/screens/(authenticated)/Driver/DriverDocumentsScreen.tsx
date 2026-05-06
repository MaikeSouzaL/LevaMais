import React, { useCallback, useMemo, useState } from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import userService, { UserProfile } from "../../../services/user.service";

function statusColor(ready: boolean) {
  return ready ? "#02de95" : "#fbbf24";
}

export default function DriverDocumentsScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const me = await userService.getProfile();
          if (!mounted) return;
          setProfile(me);
        } catch {
          if (!mounted) return;
          setProfile(null);
        }
      })();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const docs = useMemo(
    () => [
      {
        key: "cpf",
        label: "Documento pessoal (CPF)",
        ready: Boolean(profile?.cpf),
      },
      {
        key: "vehicle",
        label: "Dados do veiculo",
        ready: Boolean(profile?.vehicleInfo?.plate && profile?.vehicleInfo?.model),
      },
      {
        key: "city",
        label: "Cidade de operacao",
        ready: Boolean(profile?.city),
      },
      {
        key: "contact",
        label: "Contato do motorista",
        ready: Boolean(profile?.phone && profile?.email),
      },
    ],
    [profile],
  );

  const completed = docs.filter((item) => item.ready).length;
  const progress = Math.round((completed / docs.length) * 100);

  return (
    <DriverScreen title="Documentos" scroll>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.65)", fontWeight: "700" }}>
          Status da documentacao
        </Text>
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 28, marginTop: 6 }}>
          {progress}%
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.58)", marginTop: 4 }}>
          {completed} de {docs.length} itens completos
        </Text>
      </SectionCard>

      {docs.map((item) => (
        <SectionCard key={item.key}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialIcons
              name={item.ready ? "check-circle" : "pending"}
              size={22}
              color={statusColor(item.ready)}
            />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "800" }}>{item.label}</Text>
              <Text style={{ color: "rgba(255,255,255,0.6)", marginTop: 3 }}>
                {item.ready ? "Atualizado" : "Pendente de preenchimento"}
              </Text>
            </View>
          </View>
        </SectionCard>
      ))}

      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
          Para liberar todas as categorias de corrida e entrega, mantenha seus dados e veiculo atualizados.
        </Text>
      </SectionCard>
    </DriverScreen>
  );
}
