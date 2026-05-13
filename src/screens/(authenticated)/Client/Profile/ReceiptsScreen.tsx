import React, { useCallback, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors } from "@/theme";
import { ClientScreenHeader } from "../Shared/components";
import rideService, { Ride } from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";

export default function ReceiptsScreen() {
  const navigation = useNavigation<any>();
  const [rides, setRides] = useState<Ride[]>([]);

  const load = useCallback(async () => {
    const res = await rideService.getHistory({ limit: 40, page: 1, status: "completed" });
    setRides(res?.rides || []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load().catch(() => {});
    }, [load]),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#091A2F]">
      <ClientScreenHeader title="Comprovantes" subtitle="Corridas e entregas finalizadas" />

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 8 }}>
        {rides.length === 0 ? (
          <View className="items-center p-6 border border-gray-700 rounded-lg bg-[#0d2838]">
            <MaterialIcons name="receipt-long" size={42} color={colors.text.tertiary} />
            <Text className="text-gray-500 mt-3">Nenhum comprovante encontrado</Text>
          </View>
        ) : (
          rides.map((ride) => (
            <TouchableOpacity
              key={ride._id}
              className="bg-[#0d2838] border border-gray-700 rounded-lg p-3"
              onPress={() => navigation.navigate("OrderDetails", { rideId: ride._id })}
            >
              <View className="flex-row justify-between items-center">
                <Text className="text-white font-bold text-base">{ride.serviceType === "delivery" ? "Entrega" : "Corrida"}</Text>
                <Text className="text-[#02de95] font-bold text-base">{formatBRL(Number(ride?.pricing?.total || 0))}</Text>
              </View>
              <Text className="text-gray-400 text-sm mt-2" numberOfLines={1}>Coleta: {ride.pickup?.address || "-"}</Text>
              <Text className="text-gray-400 text-sm" numberOfLines={1}>Destino: {ride.dropoff?.address || "-"}</Text>
              <Text className="text-gray-500 text-xs mt-2">{new Date(ride.completedAt || ride.updatedAt).toLocaleString("pt-BR")}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

