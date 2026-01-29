import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverHeader from "./components/DriverHeader";
import SectionCard from "../../../components/ui/SectionCard";

export default function DriverSafetyScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Segurança" />

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>SOS</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            MVP: aqui entra botão SOS e checklist de segurança.
          </Text>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Dicas</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            • Confirme endereço antes de iniciar.
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            • Para entregas: tire foto na coleta e na entrega.
          </Text>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
