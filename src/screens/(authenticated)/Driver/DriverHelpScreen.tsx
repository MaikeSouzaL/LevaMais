import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import DriverHeader from "./components/DriverHeader";
import SectionCard from "../../../components/ui/SectionCard";

export default function DriverHelpScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Ajuda" />

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>FAQ</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            • Como ficar online?
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            • Como aceitar/cancelar corridas?
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            • Problemas com coleta/entrega.
          </Text>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Suporte</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            MVP: defina canal de suporte (WhatsApp/email) e eu coloco aqui.
          </Text>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
