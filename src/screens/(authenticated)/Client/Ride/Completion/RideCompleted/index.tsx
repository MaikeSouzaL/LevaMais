import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import rideService from "../../../../services/ride.service";

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

  const [selectedTip, setSelectedTip] = useState<number | null>(null);
  const [sendingTip, setSendingTip] = useState(false);

  const handleQuickTip = async (amount: number) => {
    if (!rideId || sendingTip) return;
    setSendingTip(true);
    try {
      await rideService.addTip(rideId, amount);
      setSelectedTip(amount);
      Toast.show({
        type: "success",
        text1: "Gorjeta enviada! 💖",
        text2: `Você enviou R$ ${amount.toFixed(2)} ao motorista. Obrigado!`,
      });
    } catch (err: any) {
      Toast.show({
        type: "error",
        text1: "Não foi possível enviar gorjeta",
        text2: err?.message || "Tente novamente",
      });
    } finally {
      setSendingTip(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Corrida finalizada" subtitle="Pedido concluido com sucesso" />

      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="check-circle" size={82} color={colors.primary[500]} />
        </View>

        <Text style={styles.title}>Tudo certo!</Text>
        <Text style={styles.subtitle}>Seu pedido foi concluido e registrado no historico.</Text>

        {/* Cupom Recibo Digital Premium */}
        <View style={styles.summaryCard}>
          {/* Cabeçalho do motorista */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }}>
              <MaterialIcons name="person" size={24} color={colors.primary[500]} />
            </View>
            <View>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "800" }}>
                {driverName || "Onze Motores App"}
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>Seu Motorista</Text>
            </View>
          </View>

          {/* Linha pontilhada estilizada */}
          <View style={styles.dottedDivider} />

          {/* Detalhes da Rota */}
          <View style={{ gap: spacing.sm, marginVertical: 8 }}>
            {!!pickupAddress && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary[500] }} />
                <Text style={styles.meta} numberOfLines={1}>
                  Coleta: {pickupAddress}
                </Text>
              </View>
            )}
            {!!dropoffAddress && (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#ef4444" }} />
                <Text style={styles.meta} numberOfLines={1}>
                  Destino: {dropoffAddress}
                </Text>
              </View>
            )}
          </View>

          {/* Linha pontilhada estilizada */}
          <View style={styles.dottedDivider} />

          {/* Total Pago */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
            <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: "700" }}>Total pago:</Text>
            {typeof total === "number" && (
              <Text style={styles.total}>R$ {Number(total).toFixed(2)}</Text>
            )}
          </View>

          {/* Seção de Gorjeta Rápida (Tip Chips) */}
          <View style={{ marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.06)" }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "700", marginBottom: 10 }}>
              Deseja reconhecer o motorista com uma gorjeta?
            </Text>
            
            <View style={{ flexDirection: "row", gap: 10 }}>
              {[2, 5, 10].map((val) => {
                const isSelected = selectedTip === val;
                return (
                  <TouchableOpacity
                    key={val}
                    disabled={sendingTip || selectedTip !== null}
                    onPress={() => handleQuickTip(val)}
                    style={{
                      flex: 1,
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: "center",
                      borderWidth: 1,
                      borderColor: isSelected ? colors.primary[500] : "rgba(255,255,255,0.1)",
                      backgroundColor: isSelected ? "rgba(2,222,149,0.15)" : "rgba(255,255,255,0.03)",
                    }}
                  >
                    {sendingTip && selectedTip === null ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={{ color: isSelected ? colors.primary[500] : "#fff", fontSize: 13, fontWeight: "900" }}>
                        + R$ {val},00
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
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
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2,222,149,0.09)",
    borderWidth: 1,
    borderColor: "rgba(2,222,149,0.28)",
    marginBottom: spacing.md,
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
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderStyle: "dashed",
    marginVertical: 10,
  },
  meta: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
    flex: 1,
  },
  total: {
    color: colors.primary[500],
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
  },
  footer: {
    padding: spacing.lg,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,25,20,0.96)",
  },
});
