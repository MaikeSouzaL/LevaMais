import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
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
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Comprovantes" subtitle="Corridas e entregas finalizadas" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {rides.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt-long" size={42} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Nenhum comprovante encontrado</Text>
          </View>
        ) : (
          rides.map((ride) => (
            <TouchableOpacity
              key={ride._id}
              style={styles.receiptCard}
              onPress={() => navigation.navigate("OrderDetails", { rideId: ride._id })}
            >
              <View style={styles.topRow}>
                <Text style={styles.title}>{ride.serviceType === "delivery" ? "Entrega" : "Corrida"}</Text>
                <Text style={styles.value}>{formatBRL(Number(ride?.pricing?.total || 0))}</Text>
              </View>
              <Text style={styles.address} numberOfLines={1}>Coleta: {ride.pickup?.address || "-"}</Text>
              <Text style={styles.address} numberOfLines={1}>Destino: {ride.dropoff?.address || "-"}</Text>
              <Text style={styles.date}>{new Date(ride.completedAt || ride.updatedAt).toLocaleString("pt-BR")}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg, gap: spacing.sm },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  emptyText: { color: colors.text.tertiary, marginTop: spacing.sm },
  receiptCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { color: colors.text.primary, fontWeight: fontWeight.bold, fontSize: fontSize.base },
  value: { color: colors.primary[500], fontWeight: fontWeight.bold, fontSize: fontSize.base },
  address: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: 4 },
  date: { color: colors.text.tertiary, fontSize: fontSize.xs, marginTop: spacing.sm },
});
