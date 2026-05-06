import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

import { colors, spacing, fontSize, fontWeight, borderRadius } from "@/theme";
import { formatBRL } from "@/utils/mappers";
import { ClientScreenHeader, LoadingButton } from "../../Shared/components";
import { getClientWallet, topupClientWallet, WalletTransaction } from "@/services/auth.service";

function transactionLabel(type: WalletTransaction["type"]) {
  const map = {
    topup: "Recarga",
    ride_payment: "Pagamento de corrida",
    refund: "Estorno",
    adjustment: "Ajuste",
  } as const;

  return map[type] || "Movimentacao";
}

export default function WalletScreen() {
  const navigation = useNavigation<any>();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(false);

  const quickTopups = [10, 20, 50];

  const loadWallet = useCallback(async () => {
    try {
      setLoading(true);
      const wallet = await getClientWallet();
      setBalance(Number(wallet?.balance || 0));
      setTransactions(wallet?.transactions || []);
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao carregar carteira",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
    }, [loadWallet]),
  );

  const handleTopup = async (value: number) => {
    try {
      setLoading(true);
      const response = await topupClientWallet(value);
      setBalance(Number(response?.balance || 0));
      Toast.show({
        type: "success",
        text1: "Saldo atualizado",
        text2: `+ ${formatBRL(value)} adicionado`,
      });
      await loadWallet();
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao recarregar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ClientScreenHeader title="Carteira" subtitle="Saldo e movimentacoes da sua conta" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <View style={styles.balanceCard}>
          <MaterialIcons name="account-balance-wallet" size={46} color={colors.primary[500]} />
          <Text style={styles.balanceLabel}>Saldo disponivel</Text>
          <Text style={styles.balanceValue}>{formatBRL(balance)}</Text>
        </View>

        <View style={styles.actions}>
          <LoadingButton
            title="Adicionar saldo rapido"
            onPress={() => handleTopup(20)}
            variant="primary"
            loading={loading}
          />

          <View style={styles.quickTopupRow}>
            {quickTopups.map((value) => (
              <TouchableOpacity
                key={value}
                style={styles.quickTopupChip}
                onPress={() => handleTopup(value)}
                disabled={loading}
              >
                <Text style={styles.quickTopupText}>+ {formatBRL(value)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <LoadingButton
            title="Historico completo"
            onPress={() => navigation.navigate("History")}
            variant="secondary"
            disabled={loading}
          />
        </View>

        <Text style={styles.sectionTitle}>METODOS DE PAGAMENTO</Text>
        <TouchableOpacity
          style={styles.paymentMethodCard}
          onPress={() => navigation.navigate("AddPaymentMethod")}
        >
          <MaterialIcons name="add-circle" size={24} color={colors.primary[500]} />
          <Text style={styles.paymentMethodText}>Adicionar cartao de credito</Text>
          <MaterialIcons name="chevron-right" size={24} color="#555" />
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>TRANSACOES RECENTES</Text>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialIcons name="receipt" size={42} color={colors.text.tertiary} />
            <Text style={styles.emptyText}>Nenhuma transacao ainda</Text>
          </View>
        ) : (
          <View style={styles.transactionsList}>
            {transactions.slice(0, 6).map((item) => (
              <View key={String(item._id)} style={styles.transactionItem}>
                <View>
                  <Text style={styles.transactionTitle}>{transactionLabel(item.type)}</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(item.createdAt).toLocaleDateString("pt-BR")}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>{formatBRL(Number(item.amount || 0))}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  content: { flex: 1 },
  contentContainer: { padding: spacing.lg },
  balanceCard: {
    backgroundColor: colors.background.secondary,
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    alignItems: "center",
    marginBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  balanceLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginTop: spacing.md,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  balanceValue: {
    color: colors.primary[500],
    fontSize: fontSize["3xl"],
    fontWeight: fontWeight.bold,
    marginTop: spacing.xs,
  },
  actions: { gap: spacing.md, marginBottom: spacing.xl },
  quickTopupRow: { flexDirection: "row", gap: spacing.sm },
  quickTopupChip: {
    flex: 1,
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.sm,
  },
  quickTopupText: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  sectionTitle: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.md,
    letterSpacing: 0.8,
  },
  emptyState: {
    alignItems: "center",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.secondary,
  },
  emptyText: { color: colors.text.tertiary, fontSize: fontSize.base, marginTop: spacing.md },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.md,
  },
  paymentMethodText: { color: colors.text.primary, fontSize: fontSize.base, flex: 1, fontWeight: fontWeight.semibold },
  transactionsList: {
    backgroundColor: colors.background.secondary,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.md,
    gap: spacing.sm,
  },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  transactionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  transactionDate: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  transactionAmount: {
    color: colors.primary[500],
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
});