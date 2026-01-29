import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DriverHeader from "./components/DriverHeader";

export default function DriverEarningsScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Ganhos" />
      <View style={{ padding: 16 }}>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
          Em breve: resumo do dia, semanas, repasses e taxas.
        </Text>
      </View>
    </SafeAreaView>
  );
}
