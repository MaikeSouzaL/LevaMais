import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import SectionCard from "../../../components/ui/SectionCard";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverHelpScreen() {
  const navigation = useNavigation<any>();

  return (
    <DriverScreen title="Ajuda" hideHeader={true}>
      <SectionCard>
        <Text style={{ color: "#fff", fontWeight: "900" }}>FAQ</Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
          - Como ficar online?
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
          - Como aceitar e cancelar corridas?
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
          - O que fazer em caso de problema na coleta ou entrega?
        </Text>
      </SectionCard>

      <SectionCard>
        <TouchableOpacity
          onPress={() => navigation.navigate("DriverSupportCenter")}
          activeOpacity={0.85}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <MaterialIcons name="support-agent" size={22} color="#02de95" />
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontWeight: "900" }}>
                Abrir central de suporte
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 4 }}>
                Atalhos para atendimento, seguranca e financeiro.
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={22} color="rgba(255,255,255,0.45)" />
          </View>
        </TouchableOpacity>
      </SectionCard>
    </DriverScreen>
  );
}
