import React from "react";
import { Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

export function DeliveryUnlockCard() {
  return (
    <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: "rgba(2,222,149,0.4)", backgroundColor: "rgba(2,222,149,0.11)", padding: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
      <MaterialIcons name="rocket-launch" size={15} color="#02de95" />
      <View style={{ flex: 1 }}>
        <Text style={{ color: "#02de95", fontSize: 10, fontWeight: "900", textTransform: "uppercase" }}>Próxima etapa</Text>
        <Text style={{ color: "#d2ffe9", fontSize: 11, fontWeight: "700" }}>Iniciar rota automaticamente</Text>
      </View>
    </View>
  );
}
