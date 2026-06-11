import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { ArrowLeft, Landmark, ArrowDownRight } from "lucide-react-native";
import Toast from "react-native-toast-message";

import driverService from "../../../services/driver.service";

// Spec-defined colors matching Tailwind Config from HTML
const colors = {
  background: "#051424",
  onSurface: "#d4e4fa",
  onSurfaceVariant: "#c5c6cd",
  secondary: "#70ffba",
  onSecondary: "#003822",
  secondaryFixed: "#4dffb1",
  surfaceContainerHigh: "#1c2b3c",
  surfaceContainerHighest: "#273647",
  surfaceContainer: "#122131",
  surface: "#051424",
  surfaceContainerLow: "#0d1c2d",
  outlineVariant: "#45474d",
  tertiary: "#b0c9e8",
  primary: "#bbc6e3",
  error: "#ffb4ab",
  errorContainer: "#93000a",
};

function formatBRL(value: number) {
  try {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  } catch {
    return `R$ ${Number(value || 0).toFixed(2)}`;
  }
}

function parseCurrencyToNumber(raw: string): number {
  const normalized = String(raw || "")
    .replace(/\./g, "")
    .replace(/,/g, ".")
    .replace(/[^0-9.]/g, "");

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function DriverWithdrawScreen() {
  const navigation = useNavigation<any>();
  const [availableBalance, setAvailableBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [selectedPercentage, setSelectedPercentage] = useState<number | null>(null);

  const loadBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      const response = await driverService.getBalance();
      setAvailableBalance(Number(response?.balance || 0));
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [loadBalance])
  );

  const handleWithdraw = async () => {
    const value = parseCurrencyToNumber(amount);

    if (!value || value <= 0) {
      Toast.show({ type: "error", text1: "Valor inválido" });
      return;
    }

    if (value > availableBalance) {
      Toast.show({ type: "error", text1: "Saldo insuficiente" });
      return;
    }

    const trimmedPixKey = pixKey.trim();
    if (!trimmedPixKey) {
      Toast.show({ type: "error", text1: "Informe a chave PIX" });
      return;
    }

    setLoading(true);
    try {
      await driverService.requestWithdrawal(value, trimmedPixKey);

      Toast.show({
        type: "success",
        text1: "Solicitação enviada",
        text2: "Acompanhe o status no extrato.",
      });

      setAmount("");
      setPixKey("");
      setSelectedPercentage(null);
      await loadBalance();
      navigation.navigate("DriverStatement");
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao solicitar saque",
        text2: error?.response?.data?.error || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  const setPercent = (percentage: number) => {
    setSelectedPercentage(percentage);
    const value = availableBalance * percentage;
    setAmount(value.toFixed(2).replace(".", ","));
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />

      {/* ── TopAppBar ── */}
      <View style={styles.topAppBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={colors.onSurface} />
        </TouchableOpacity>
        <Text style={styles.topAppBarTitle}>Ganhos e carteira</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Page Header */}
        <View style={styles.headerSection}>
          <View style={styles.iconCircle}>
            <Landmark size={22} color={colors.onSurfaceVariant} />
          </View>
          <Text style={styles.headerTitle}>Saque</Text>
        </View>

        {/* Available Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.cardGlow} />
          <Text style={styles.balanceLabel}>Disponível para saque</Text>
          {loadingBalance ? (
            <ActivityIndicator color={colors.secondary} style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.balanceRow}>
              <Text style={styles.currencySymbol}>R$</Text>
              <Text style={styles.balanceValue}>
                {availableBalance.toFixed(2).replace(".", ",")}
              </Text>
            </View>
          )}
        </View>

        {/* Withdrawal Amount Input Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Quanto você quer sacar?</Text>
          <View style={styles.inputWrapper}>
            <View style={styles.inputPrefix}>
              <Text style={styles.prefixText}>R$</Text>
            </View>
            <TextInput
              style={styles.amountInput}
              placeholder="0,00"
              placeholderTextColor="rgba(212, 228, 250, 0.2)"
              keyboardType="numeric"
              value={amount}
              onChangeText={(text) => {
                setAmount(text);
                setSelectedPercentage(null);
              }}
            />
          </View>

          {/* Quick Select Buttons */}
          <View style={styles.quickSelectRow}>
            {([
              { percent: 0.25, label: "25%" },
              { percent: 0.5, label: "50%" },
              { percent: 1, label: "MAX" },
            ] as const).map((btn) => {
              const isActive = selectedPercentage === btn.percent;
              return (
                <TouchableOpacity
                  key={btn.label}
                  activeOpacity={0.8}
                  onPress={() => setPercent(btn.percent)}
                  style={[
                    styles.quickBtn,
                    isActive && styles.quickBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.quickBtnText,
                      isActive && styles.quickBtnTextActive,
                      btn.label === "MAX" && !isActive && styles.quickBtnTextMax,
                    ]}
                  >
                    {btn.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PIX Key Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Chave PIX</Text>
          <TextInput
            style={styles.pixInput}
            placeholder="CPF, E-mail, Telefone ou chave aleatória"
            placeholderTextColor="rgba(212, 228, 250, 0.25)"
            autoCapitalize="none"
            value={pixKey}
            onChangeText={setPixKey}
          />
        </View>

        {/* CTA and Disclaimer */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={[
              styles.ctaButton,
              (loading || loadingBalance) && styles.ctaButtonDisabled,
            ]}
            onPress={handleWithdraw}
            activeOpacity={0.9}
            disabled={loading || loadingBalance}
          >
            {loading ? (
              <ActivityIndicator color={colors.onSecondary} />
            ) : (
              <Text style={styles.ctaButtonText}>Confirmar Saque</Text>
            )}
          </TouchableOpacity>
          <Text style={styles.disclaimerText}>
            O valor será creditado na conta informada em até 24 horas úteis.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topAppBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 64,
    paddingHorizontal: 20,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.2)",
  },
  backBtn: {
    padding: 8,
    borderRadius: 9999,
    marginRight: 12,
  },
  topAppBarTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: "700",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  headerSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 24,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: "700",
  },
  balanceCard: {
    backgroundColor: "rgba(28, 43, 60, 0.4)",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    marginBottom: 32,
  },
  cardGlow: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(112, 255, 186, 0.03)",
  },
  balanceLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
  },
  currencySymbol: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: "700",
  },
  balanceValue: {
    color: colors.onSurface,
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  section: {
    marginBottom: 24,
    gap: 8,
  },
  sectionLabel: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    overflow: "hidden",
  },
  inputPrefix: {
    paddingLeft: 16,
    justifyContent: "center",
  },
  prefixText: {
    color: colors.secondary,
    fontSize: 20,
    fontWeight: "700",
  },
  amountInput: {
    flex: 1,
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: "700",
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  quickSelectRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.5)",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  quickBtnActive: {
    backgroundColor: colors.surfaceContainerHigh,
    borderColor: colors.secondary,
  },
  quickBtnText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: "500",
  },
  quickBtnTextActive: {
    color: colors.secondary,
    fontWeight: "700",
  },
  quickBtnTextMax: {
    color: colors.onSurface,
    fontWeight: "700",
  },
  pixInput: {
    backgroundColor: colors.surfaceContainer,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: 10,
    color: colors.onSurface,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  ctaContainer: {
    marginTop: "auto",
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: "rgba(69, 71, 77, 0.15)",
    gap: 12,
  },
  ctaButton: {
    backgroundColor: colors.secondary,
    borderRadius: 10,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.7,
  },
  ctaButtonText: {
    color: colors.onSecondary,
    fontSize: 16,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  disclaimerText: {
    color: "rgba(197, 198, 205, 0.7)",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    maxWidth: "90%",
    alignSelf: "center",
  },
});
