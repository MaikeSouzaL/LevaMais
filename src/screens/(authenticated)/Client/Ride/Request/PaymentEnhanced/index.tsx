import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { MaterialIcons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { FlowStepHeader, LoadingButton } from "../../../Shared/components";
import { CreditCardInput } from "@/components/CreditCardInput";
import { PaymentMethodSelector } from "@/components/PaymentMethodSelector";
import { usePaymentForm } from "@/hooks/usePaymentForm";
import { useErrorHandler } from "@/hooks/useAsyncHandlers";
import { logger } from "@/utils/logger";
import rideService from "@/services/ride.service";
import paymentService from "@/services/payment.service";
import promotionService from "@/services/promotion.service";
import { useClientCityStore } from "@/context/clientCityStore";
import { mapServiceModeToApi, mapVehicleTypeToApi, formatBRL } from "@/utils/mappers";

type Params = {
  Payment: {
    amount: number;
    order?: any;
  };
};

export default function PaymentScreenEnhanced() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Params, "Payment">>();
  const detectedCity = useClientCityStore((state) => state.city);
  const { handleError } = useErrorHandler("PaymentScreen");

  const amount = route.params?.amount || 0;
  const order = route.params?.order;

  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [processing, setProcessing] = useState(false);

  const paymentForm = usePaymentForm(amount);

  useEffect(() => {
    if (!order) {
      Toast.show({
        type: "info",
        text1: "Erro",
        text2: "Finalize o resumo antes do pagamento",
      });
      navigation.goBack();
    }
  }, [order, navigation]);

  const cityId = useMemo(
    () =>
      (detectedCity as any)?._id ||
      (detectedCity as any)?.id ||
      detectedCity?.cityId,
    [detectedCity]
  );

  const serviceType = useMemo(
    () => mapServiceModeToApi(order?.serviceMode) as "ride" | "delivery",
    [order?.serviceMode]
  );

  const totalDiscount = Number(appliedPromo?.discountAmount || 0);
  const finalAmount = Math.max(0, amount - totalDiscount);

  const handleApplyPromo = useCallback(async () => {
    const code = promoCode.trim().toUpperCase();
    if (!code) {
      Toast.show({
        type: "info",
        text1: "Digite um cupom",
      });
      return;
    }

    setPromoLoading(true);
    try {
      logger.info("PaymentScreen", `Validando cupom ${code}`);
      const promo = await promotionService.validateCode({
        code,
        amount,
        serviceType,
      });

      setAppliedPromo(promo);
      Toast.show({
        type: "success",
        text1: "Cupom aplicado",
        text2: `Desconto de ${formatBRL(Number(promo.discountAmount || 0))}`,
      });
      logger.info("PaymentScreen", "Cupom aplicado com sucesso");
    } catch (error) {
      logger.error("PaymentScreen", "Erro ao aplicar cupom", error as Error);
      Toast.show({
        type: "error",
        text1: "Cupom inválido",
        text2: "Verifique o código e tente novamente",
      });
      setAppliedPromo(null);
    } finally {
      setPromoLoading(false);
    }
  }, [promoCode, amount, serviceType]);

  const handleRemovePromo = useCallback(() => {
    setAppliedPromo(null);
    setPromoCode("");
  }, []);

  const handleProcessPayment = useCallback(async () => {
    if (!order) return;

    if (!paymentForm.validateForm()) {
      return;
    }

    setProcessing(true);
    try {
      logger.info("PaymentScreen", `Processando pagamento via ${paymentForm.method}`);

      if (!order.pickupLatLng || !order.dropoffLatLng) {
        throw new Error("Coordenadas de coleta/destino inválidas");
      }

      const paymentResponse = await paymentService.processPayment({
        amount: finalAmount,
        method: paymentForm.method,
        description: `${serviceType} em ${order.pickup?.address || "Local"}`,
        pixKey: paymentForm.pixKey || undefined,
      });

      if (!paymentResponse.success) {
        throw new Error(paymentResponse.error || "Erro ao processar pagamento");
      }

      logger.info(
        "PaymentScreen",
        "Pagamento processado com sucesso",
        paymentResponse
      );

      const ride = await rideService.create({
        serviceType: mapServiceModeToApi(order.serviceMode),
        vehicleType: mapVehicleTypeToApi(order.vehicleType),
        cityId,
        purposeId: order.purposeId,
        pickup: {
          latitude: order.pickupLatLng.latitude,
          longitude: order.pickupLatLng.longitude,
          address: order.pickupAddress,
        },
        dropoff: {
          latitude: order.dropoffLatLng.latitude,
          longitude: order.dropoffLatLng.longitude,
          address: order.dropoffAddress,
        },
        pricing: {
          basePrice: order.pricing?.base || 0,
          distancePrice: order.pricing?.distancePrice || 0,
          serviceFee: order.pricing?.serviceFee || 0,
          total: finalAmount,
          currency: "BRL",
        },
        distance: {
          value: (order.pricing?.distanceKm || 0) * 1000,
          text: `${(order.pricing?.distanceKm || 0).toFixed(1)} km`,
        },
        duration: {
          value: (order.etaMinutes || 0) * 60,
          text: order.etaText || `${order.etaMinutes || 0} min`,
        },
        payment: {
          method: {
            type: paymentForm.method as any,
          },
        },
        promotionCode: appliedPromo?.code,
        details: {
          insurance: order.insuranceLevel as any,
          specialInstructions: order.notes,
        },
      });

      logger.info("PaymentScreen", "Corrida criada com sucesso", ride);

      Toast.show({
        type: "success",
        text1: "Pagamento confirmado!",
        text2: "Sua corrida foi criada",
      });

      navigation.reset({
        index: 0,
        routes: [
          {
            name: "RideTracking",
            params: { rideId: ride._id },
          },
        ],
      });
    } catch (error) {
      logger.error("PaymentScreen", "Erro ao processar pagamento", error as Error);
      handleError(
        error as Error,
        "Erro ao processar pagamento. Tente novamente."
      );
    } finally {
      setProcessing(false);
    }
  }, [order, paymentForm, finalAmount, appliedPromo, cityId, serviceType, handleError, navigation]);

  if (!order) {
    return null;
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <FlowStepHeader currentStep={3} totalSteps={3} title="Pagamento" />

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Resumo do Pedido</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Valor base</Text>
                <Text style={styles.summaryValue}>{formatBRL(amount)}</Text>
              </View>

              {appliedPromo && (
                <View style={styles.summaryRow}>
                  <Text style={[styles.summaryLabel, styles.discount]}>
                    Desconto ({appliedPromo.code})
                  </Text>
                  <Text style={[styles.summaryValue, styles.discount]}>
                    -{formatBRL(totalDiscount)}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />

              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatBRL(finalAmount)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cupom Promocional</Text>
            {appliedPromo ? (
              <View style={styles.promoApplied}>
                <MaterialIcons name="check-circle" size={20} color="#02de95" />
                <View style={styles.promoInfo}>
                  <Text style={styles.promoCode}>{appliedPromo.code}</Text>
                  <Text style={styles.promoDescription}>
                    Desconto de {formatBRL(totalDiscount)}
                  </Text>
                </View>
                <TouchableOpacity onPress={handleRemovePromo}>
                  <MaterialIcons name="close" size={20} color="rgba(255,255,255,0.5)" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.promoInput}>
                <View style={styles.inputWrapper}>
                  <MaterialIcons
                    name="local-offer"
                    size={20}
                    color="rgba(255,255,255,0.5)"
                  />
                  <TextInput
                    style={styles.inlineInput}
                    value={promoCode}
                    onChangeText={setPromoCode}
                    placeholder="Ex: LEVA10"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    autoCapitalize="characters"
                    editable={!promoLoading}
                  />
                </View>
                <TouchableOpacity
                  style={styles.promoButton}
                  onPress={handleApplyPromo}
                  disabled={promoLoading}
                >
                  {promoLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.promoButtonText}>Aplicar</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <PaymentMethodSelector
              selected={paymentForm.method}
              onSelect={paymentForm.updateMethod}
              methods={["credit_card", "pix", "wallet", "cash"]}
            />
          </View>

          {paymentForm.method === "credit_card" && (
            <View style={styles.section}>
              <CreditCardInput
                cardNumber={paymentForm.cardNumber}
                holderName={paymentForm.holderName}
                expiry={paymentForm.expiry}
                cvv={paymentForm.cvv}
                onCardNumberChange={paymentForm.updateCardNumber}
                onHolderNameChange={paymentForm.updateHolderName}
                onExpiryChange={paymentForm.updateExpiry}
                onCvvChange={paymentForm.updateCvv}
              />
            </View>
          )}

          {paymentForm.method === "pix" && (
            <View style={styles.section}>
              <View style={styles.pixCard}>
                <MaterialIcons name="qr-code" size={48} color="#32BCAD" />
                <Text style={styles.pixTitle}>Pague via PIX</Text>
                <Text style={styles.pixDescription}>
                  Informe a chave PIX para vincular este pagamento antes de solicitar o motorista.
                </Text>
                <TextInput
                  style={styles.pixInput}
                  value={paymentForm.pixKey}
                  onChangeText={paymentForm.updatePixKey}
                  placeholder="CPF, e-mail, telefone ou chave aleatória"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}

          {paymentForm.method === "cash" && (
            <View style={styles.section}>
              <View style={styles.cashCard}>
                <MaterialIcons name="money" size={48} color="#85bb65" />
                <Text style={styles.cashTitle}>Pagamento em Dinheiro</Text>
                <Text style={styles.cashDescription}>
                  Pague {formatBRL(finalAmount)} diretamente ao motorista
                </Text>
              </View>
            </View>
          )}

          {paymentForm.error && (
            <View style={styles.errorBox}>
              <MaterialIcons name="error-outline" size={20} color="#ef4444" />
              <Text style={styles.errorText}>{paymentForm.error}</Text>
            </View>
          )}

          <View style={{ height: spacing.lg }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
          <LoadingButton
            title={`Confirmar Pagamento - ${formatBRL(finalAmount)}`}
            onPress={handleProcessPayment}
            loading={processing}
            disabled={!paymentForm.canSubmit()}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  section: {
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  summaryCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: spacing.lg,
    gap: spacing.md,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: fontSize.sm,
  },
  summaryValue: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  discount: {
    color: "#02de95",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  totalLabel: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  totalValue: {
    color: "#02de95",
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  promoApplied: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2,222,149,0.1)",
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  promoInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  promoCode: {
    color: "#02de95",
    fontWeight: fontWeight.bold,
  },
  promoDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: fontSize.xs,
  },
  promoInput: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  inputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  inlineInput: {
    flex: 1,
    color: colors.text.primary,
    paddingVertical: spacing.md,
    paddingLeft: spacing.sm,
  },
  promoButton: {
    backgroundColor: "#02de95",
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    justifyContent: "center",
  },
  promoButtonText: {
    color: "#091A2F",
    fontWeight: fontWeight.bold,
  },
  pixCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#32BCAD",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  pixTitle: {
    color: "#32BCAD",
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  pixDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  pixInput: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  cashCard: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: "#85bb65",
    padding: spacing.xl,
    alignItems: "center",
    gap: spacing.md,
  },
  cashTitle: {
    color: "#85bb65",
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  cashDescription: {
    color: "rgba(255,255,255,0.6)",
    fontSize: fontSize.sm,
    textAlign: "center",
  },
  errorBox: {
    flexDirection: "row",
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: "#ef4444",
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: "center",
  },
  errorText: {
    color: "#ef4444",
    fontSize: fontSize.sm,
    flex: 1,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
});
