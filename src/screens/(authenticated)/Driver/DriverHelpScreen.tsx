import React from "react";
import { Text } from "react-native";

import SectionCard from "../../../components/ui/SectionCard";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverHelpScreen() {
  return (
    <DriverScreen title="Ajuda">
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
    </DriverScreen>
  );
}
