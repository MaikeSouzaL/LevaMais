/**
 * RideCompletedScreen
 * Tela de corrida concluida
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";

type Params = {
  RideCompleted: {
    rideId: string;
    total?: number;
    pickupAddress?: string;
    dropoffAddress?: string;
    driverName?: string;
  };
};

export default function RideCompletedScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Params, "RideCompleted">>();
  const rideId = route.params?.rideId;
  const total = route.params?.total;
  const pickupAddress = route.params?.pickupAddress;
  const dropoffAddress = route.params?.dropoffAddress;
  const driverName = route.params?.driverName;

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Corrida finalizada" subtitle="Pedido concluido com sucesso" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={82} color={colors.primary[500]} />
        </View>

        <Text style={styles.title}>Tudo certo!</Text>
        <Text style={styles.subtitle}>Seu pedido foi concluido e registrado no historico.</Text>

        <View style={styles.summaryCard}>
          {!!driverName && <Text style={styles.meta}>Motorista: {driverName}</Text>}
          {!!pickupAddress && (
            <Text style={styles.meta} numberOfLines={1}>
              Coleta: {pickupAddress}
            </Text>
          )}
          {!!dropoffAddress && (
            <Text style={styles.meta} numberOfLines={1}>
              Destino: {dropoffAddress}
            </Text>
          )}
          {typeof total === "number" && (
            <Text style={styles.total}>Total pago: R$ {Number(total).toFixed(2)}</Text>
          )}
          {!!rideId && <Text style={styles.rideId}>Pedido: {rideId}</Text>}
        </View>
      </View>

      <View style={styles.footer}>
        <LoadingButton
          title="Avaliar motorista"
          onPress={() =>
            rideId
              ? (navigation as any).navigate("ClientRateDriver", {
                  rideId,
                  driverName,
                })
              : (navigation as any).navigate("Home")
          }
          variant="primary"
        />
        <LoadingButton
          title="Dar gorjeta"
          onPress={() =>
            rideId
              ? (navigation as any).navigate("TipDriver", {
                  rideId,
                  driverName,
                })
              : null
          }
          variant="secondary"
        />
        <LoadingButton
          title="Voltar ao inicio"
          onPress={() => (navigation as any).navigate("Home")}
          variant="ghost"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,222,149,0.09)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.28)",
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    marginTop: spacing.xs,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: spacing.xl,
  },
  summaryCard: {
    width: "100%",
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(17,37,62,0.62)",
    padding: spacing.lg,
    gap: spacing.xs,
  },
  meta: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  total: {
    color: colors.primary[500],
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  rideId: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,25,20,0.96)",
  },
});
