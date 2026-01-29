import React from "react";
import { Text } from "react-native";

import SectionCard from "../../../components/ui/SectionCard";
import { DriverScreen } from "./components/DriverScreen";

export default function DriverSafetyScreen() {
  return (
    <DriverScreen title="Segurança">
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
    </DriverScreen>
  );
}
