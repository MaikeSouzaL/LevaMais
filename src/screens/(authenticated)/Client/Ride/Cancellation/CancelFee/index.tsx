import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";

import { colors, spacing, fontSize } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import { formatBRL } from "@/utils/mappers";
import { ClientStackParamList } from "../../../types/navigation";

export default function CancelFeeScreen() {
  const navigation = useNavigation<
    NativeStackNavigationProp<ClientStackParamList, "CancelFee">
  >();
  const route = useRoute<RouteProp<ClientStackParamList, "CancelFee">>();
  const fee = route.params?.fee || 5;
  const serviceType = route.params?.serviceType;
  const isDelivery = serviceType === "delivery" || serviceType === "frete";

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title="Taxa de cancelamento"
        subtitle="Informacoes sobre a cobranca deste cancelamento"
        showBack
      />

      <View style={styles.content}>
        <MaterialIcons name="warning" size={74} color="#ff9800" />
        <Text style={styles.title}>Taxa aplicada</Text>
        <Text style={styles.subtitle}>Sera cobrada uma taxa de {formatBRL(fee)} neste cancelamento.</Text>

        <View style={styles.bullets}>
          <Text style={styles.bullet}>• O motorista ja foi acionado para esse {isDelivery ? "pedido" : "corrida"}.</Text>
          <Text style={styles.bullet}>• A taxa cobre deslocamento e tempo de espera.</Text>
          <Text style={styles.bullet}>• Se preferir, voce ainda pode continuar a {isDelivery ? "entrega" : "corrida"}.</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <LoadingButton title="Entendi" onPress={() => navigation.navigate("Home")} variant="primary" />
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
    padding: spacing.xl,
  },
  title: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: "700",
    marginTop: spacing.lg,
  },
  subtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.base,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  bullets: {
    marginTop: spacing.lg,
    width: "100%",
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: 12,
    padding: spacing.md,
  },
  bullet: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  footer: { padding: spacing.lg },
});



