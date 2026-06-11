import React, { useEffect, useMemo, useState } from "react";
import { Linking, Text, TouchableOpacity, View } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { useNavigation } from "@react-navigation/native";

import { DriverScreen } from "./components/DriverScreen";
import SectionCard from "../../../components/ui/SectionCard";
import configService, { SupportChannels } from "../../../services/config.service";

type SupportItem = {
  icon: string;
  title: string;
  subtitle: string;
  action: () => void;
};

export default function DriverSupportCenterScreen() {
  const navigation = useNavigation<any>();
  const [supportChannels, setSupportChannels] = useState<SupportChannels | null>(null);

  useEffect(() => {
    configService.getSupportChannels().then(setSupportChannels).catch(() => setSupportChannels(null));
  }, []);

  const items: SupportItem[] = useMemo(() => {
    const supportEmail = supportChannels?.email || "suporte@levamais.app";

    return [
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
        subtitle: supportEmail,
        action: () => Linking.openURL(`mailto:${supportEmail}`),
      },
    ];
  }, [navigation, supportChannels]);

  return (
    <DriverScreen title="Suporte" scroll hideHeader={true}>
      <SectionCard>
        <Text style={{ color: "rgba(255,255,255,0.72)", lineHeight: 20 }}>
          Selecione o assunto para atendimento rapido. Os canais abaixo usam a configuracao pública da plataforma.
        </Text>
      </SectionCard>

      {items.map((item) => (
        <TouchableOpacity key={item.title} activeOpacity={0.85} onPress={item.action}>
          <SectionCard>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Icon name={item.icon} size={22} color="#02de95" />
              <View style={{ flex: 1 }}>
                <Text style={{ color: "#fff", fontWeight: "800" }}>{item.title}</Text>
                <Text style={{ color: "rgba(255,255,255,0.62)", marginTop: 3 }}>
                  {item.subtitle}
                </Text>
              </View>
              <Icon name="chevron-right" size={22} color="rgba(255,255,255,0.5)" />
            </View>
          </SectionCard>
        </TouchableOpacity>
      ))}
    </DriverScreen>
  );
}
