import React from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";

type SupportItem = {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  subtitle: string;
  action: () => void;
};

export default function DriverSupportCenterScreen() {
  const navigation = useNavigation<any>();

  const items: SupportItem[] = [
    {
      icon: "attach-money",
      title: "Ganhos e repasses",
      subtitle: "Ajuda com saques e extrato",
      action: () => navigation.navigate("DriverFinance"),
    },
    {
      icon: "security",
      title: "Seguranca em rota",
      subtitle: "Central de emergencia e apoio",
      action: () => navigation.navigate("DriverSafety"),
    },
    {
      icon: "description",
      title: "Documentacao",
      subtitle: "Atualize dados para manter conta ativa",
      action: () => navigation.navigate("DriverDocuments"),
    },
    {
      icon: "mail-outline",
      title: "Falar por e-mail",
      subtitle: "suporte@levamais.app",
      action: () => Linking.openURL("mailto:suporte@levamais.app"),
    },
  ];

  return (
    <DriverScreen title="Suporte" scroll hideHeader={true}>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
          Selecione o assunto para atendimento rapido. Fluxo inspirado nos centros de ajuda de apps de mobilidade.
        </Text>
      </SectionCard>

      {items.map((item) => (
        <TouchableOpacity key={item.title} activeOpacity={0.85} onPress={item.action}>
          <SectionCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <MaterialIcons name={item.icon} size={22} color="#02de95" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{item.title}</Text>
                <Text style={{ color: "rgba(255,255,255,0.62)", marginTop: 3 }}>
                  {item.subtitle}
                </Text>
              </View>
              <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
            </View>
          </SectionCard>
        </TouchableOpacity>
      ))}
    </DriverScreen>
  );
}
