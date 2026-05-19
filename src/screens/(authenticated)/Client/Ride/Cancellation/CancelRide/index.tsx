/**
 * CancelRideScreen
 * Cancelamento de corrida com envio real para API
 */

import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { ClientScreenHeader, LoadingButton } from "../../../Shared/components";
import rideService from "@/services/ride.service";
import { formatBRL } from "@/utils/mappers";
import { ClientStackParamList } from "../../../types/navigation";

const CANCEL_REASONS = [
  "Mudei de ideia",
  "Motorista demorou muito",
  "Encontrei outra opcao",
  "Preco muito alto",
  "Outro motivo",
];

export default function CancelRideScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "ClientCancelRide">>();
  const route = useRoute<RouteProp<ClientStackParamList, "ClientCancelRide">>();
  const rideId = route.params?.rideId;
  const total = route.params?.total;
  const initialStatus = route.params?.status;
  const initialEstimatedFee = route.params?.estimatedFee;

  const [selectedReason, setSelectedReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [rideStatus, setRideStatus] = useState(initialStatus || "");
  const [rideTotal, setRideTotal] = useState(
    typeof total === "number" ? total : undefined,
  );
  const [serviceType, setServiceType] = useState<string>("");

  const canSubmit = useMemo(() => Boolean(rideId && selectedReason), [rideId, selectedReason]);

  useEffect(() => {
    let mounted = true;
    if (!rideId) return;

    rideService
      .getById(rideId)
      .then((ride) => {
        if (!mounted) return;
        setRideStatus(String(ride?.status || ""));
        setServiceType(String(ride?.serviceType || ""));
        if (ride?.pricing?.total != null) {
          setRideTotal(Number(ride.pricing.total));
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, [rideId]);

  const feeStatusApplies = [
    "accepted",
    "driver_arriving",
    "arrived",
    "in_progress",
  ].includes(rideStatus);
  const estimatedFee =
    typeof initialEstimatedFee === "number" && initialEstimatedFee > 0
      ? initialEstimatedFee
      : 0;
  const isDelivery =
    serviceType === "delivery" || serviceType === "frete";
  const isPackageCollected = isDelivery && rideStatus === "in_progress";
  const isBeforeDriverAccepted = ["requesting", "driver_assigned", "payment_pending"].includes(rideStatus);
  const isDriverOnTheWay = ["accepted", "driver_arriving"].includes(rideStatus);
  const isDriverAtPickup = rideStatus === "arrived";
  const estimatedFeeFromRide = Number((initialEstimatedFee || 0) > 0 ? initialEstimatedFee : 0);
  const effectiveEstimatedFee = feeStatusApplies ? estimatedFeeFromRide : 0;

  const warningMessage = useMemo(() => {
    if (isPackageCollected) {
      return "O pacote ja foi coletado. Para cancelar nesta fase, fale com o suporte para avaliacao operacional.";
    }
    if (isDriverAtPickup) {
      return "O motorista ja chegou ao ponto de coleta. O cancelamento pode gerar taxa.";
    }
    if (isDriverOnTheWay) {
      return "O motorista ja aceitou e esta em deslocamento. O cancelamento pode gerar taxa.";
    }
    if (isBeforeDriverAccepted) {
      return "Seu pedido ainda esta em fase inicial. O cancelamento sera aplicado sem etapa operacional avancada.";
    }
    return "Revise com atencao antes de confirmar o cancelamento.";
  }, [isBeforeDriverAccepted, isDriverAtPickup, isDriverOnTheWay, isPackageCollected]);

  const handleCancel = async () => {
    if (!canSubmit || !rideId || isPackageCollected) return;

    setLoading(true);
    try {
      const response: any = await rideService.cancel(rideId, selectedReason);
      const chargedFee =
        Number(response?.cancellationFee ?? response?.data?.cancellationFee ?? effectiveEstimatedFee) || 0;
      Toast.show({
        type: "success",
        text1: isDelivery ? "Entrega cancelada" : "Corrida cancelada",
      });
      if (chargedFee > 0) {
        navigation.replace("CancelFee", {
          rideId,
          fee: chargedFee,
          total: rideTotal,
          serviceType,
        });
      } else {
        navigation.reset({ index: 0, routes: [{ name: "Home" }] });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Nao foi possivel cancelar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader
        title={isDelivery ? "Cancelar entrega" : "Cancelar corrida"}
        subtitle="Selecione o motivo para seguir com o cancelamento"
        showBack
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Por que deseja cancelar?</Text>

        <View style={styles.warningCard}>
          <Text style={styles.warningTitle}>Atencao</Text>
          <Text style={styles.warningText}>
          {estimatedFee > 0
              ? warningMessage
              : warningMessage}
          </Text>
          {typeof rideTotal === "number" && (
            <Text style={styles.warningText}>
              Valor do {isDelivery ? "pedido" : "corrida"} atual: {formatBRL(rideTotal)}
            </Text>
          )}
          {effectiveEstimatedFee > 0 && (
            <View style={styles.feeBox}>
              <Text style={styles.feeLabel}>Taxa prevista</Text>
              <Text style={styles.feeValue}>{formatBRL(effectiveEstimatedFee)}</Text>
              <Text style={styles.feeHint}>
                Essa taxa ajuda a cobrir o deslocamento e o tempo do motorista.
              </Text>
            </View>
          )}
        </View>

        {isPackageCollected ? (
          <View style={styles.blockedCard}>
            <Text style={styles.blockedTitle}>Cancelamento bloqueado nesta fase</Text>
            <Text style={styles.blockedText}>
              Como o pacote ja foi coletado, o cancelamento precisa de analise do suporte.
            </Text>
            <TouchableOpacity
              style={styles.supportBtn}
              onPress={() => navigation.navigate("SupportCenter")}
              activeOpacity={0.85}
            >
              <Text style={styles.supportBtnText}>Falar com suporte</Text>
            </TouchableOpacity>
          </View>
        ) : (
          CANCEL_REASONS.map((reason) => {
            const selected = selectedReason === reason;
            return (
              <TouchableOpacity
                key={reason}
                style={[styles.reason, selected && styles.reasonSelected]}
                onPress={() => setSelectedReason(reason)}
                activeOpacity={0.85}
              >
                <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{reason}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <LoadingButton
          title={
            isPackageCollected
              ? "Suporte necessario"
              : effectiveEstimatedFee > 0
              ? `Cancelar e pagar ${formatBRL(effectiveEstimatedFee)}`
              : "Confirmar cancelamento"
          }
          onPress={handleCancel}
          variant="danger"
          loading={loading}
          disabled={!canSubmit || loading || isPackageCollected}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1, padding: spacing.lg },
  title: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
  },
  warningCard: {
    backgroundColor: "rgba(255,193,7,0.1)",
    borderWidth: 1,
    borderColor: "rgba(255,193,7,0.3)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  warningTitle: {
    color: "#ffcc6c",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  warningText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xs,
  },
  feeBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: "rgba(255,152,0,0.12)",
    borderWidth: 1,
    borderColor: "rgba(255,152,0,0.34)",
  },
  feeLabel: {
    color: "#ffcc6c",
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: "uppercase",
  },
  feeValue: {
    color: colors.text.primary,
    fontSize: fontSize["2xl"],
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  feeHint: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  reason: {
    backgroundColor: "rgba(17,37,62,0.64)",
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  reasonSelected: {
    borderColor: colors.primary[500],
    backgroundColor: "rgba(2, 222, 149, 0.12)",
  },
  reasonText: { color: colors.text.primary, fontSize: fontSize.base, fontWeight: fontWeight.medium },
  reasonTextSelected: { color: colors.primary[500], fontWeight: fontWeight.bold },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    backgroundColor: "rgba(10,25,20,0.96)",
  },
  blockedCard: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.35)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  blockedTitle: {
    color: "#fca5a5",
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  blockedText: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    lineHeight: 18,
  },
  supportBtn: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: "rgba(239,68,68,0.2)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.5)",
  },
  supportBtnText: {
    color: "#fecaca",
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});
