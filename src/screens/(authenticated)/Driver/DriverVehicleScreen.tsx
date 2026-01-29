import React from "react";
import { View, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import DriverHeader from "./components/DriverHeader";
import { useAuthStore } from "../../../context/authStore";

export default function DriverVehicleScreen() {
  const userData: any = useAuthStore((s) => s.userData);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0f231c" }}>
      <DriverHeader title="Veículo" />
      <View style={{ padding: 16 }}>
        <Text style={{ color: "rgba(255,255,255,0.65)", marginTop: 8 }}>
          Em breve: editar placa/modelo/cor/ano.
        </Text>
        {!!userData?.vehicleType && (
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 10 }}>
            Tipo: {String(userData.vehicleType)}
          </Text>
        )}
        {!!userData?.vehicleInfo?.plate && (
          <Text style={{ color: "rgba(255,255,255,0.8)", marginTop: 6 }}>
            Placa: {String(userData.vehicleInfo.plate)}
          </Text>
        )}
      </View>
    </SafeAreaView>
  );
}
