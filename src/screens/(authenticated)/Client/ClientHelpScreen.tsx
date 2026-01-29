import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";

import SectionCard from "../../../components/ui/SectionCard";

export default function ClientHelpScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <View
        style={{
          padding: 16,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.08)",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "900", fontSize: 18 }}>
          Ajuda
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: "#9abcb0", fontWeight: "800" }}>Voltar</Text>
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16, gap: 12 }}>
        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>FAQ</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            • Como solicitar uma corrida/entrega?
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            • Como cancelar?
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 6 }}>
            • Como falar com o suporte?
          </Text>
        </SectionCard>

        <SectionCard>
          <Text style={{ color: "#fff", fontWeight: "900" }}>Suporte</Text>
          <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 10 }}>
            MVP: defina um canal (WhatsApp/email) e eu coloco aqui com link.
          </Text>
        </SectionCard>
      </View>
    </SafeAreaView>
  );
}
