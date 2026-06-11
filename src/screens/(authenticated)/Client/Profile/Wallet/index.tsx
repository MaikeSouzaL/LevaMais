import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StatusBar,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { MotiView } from "moti";
import {
  Wallet,
  ArrowLeft,
  Plus,
  ChevronRight,
  History,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  AlertCircle,
} from "lucide-react-native";
import Toast from "react-native-toast-message";

import { formatBRL } from "@/utils/mappers";
import { getClientWallet, WalletTransaction } from "@/services/auth.service";
import { ClientStackParamList } from "../../types/navigation";
import { useWalletBalance } from "@/hooks/useWalletBalance";

const QUICK_TOPUPS = [10, 20, 50, 100];

function transactionLabel(type: WalletTransaction["type"]) {
  const map = {
    topup: "Recarga de saldo",
    ride_payment: "Pagamento de corrida",
    refund: "Estorno",
    adjustment: "Ajuste",
  } as const;
  return map[type] || "Movimentação";
}

function transactionSign(type: WalletTransaction["type"]) {
  return type === "topup" || type === "refund" || type === "adjustment" ? "+" : "-";
}

function transactionColor(type: WalletTransaction["type"]) {
  return type === "topup" || type === "refund" ? "#02de95" : type === "adjustment" ? "#fbbf24" : "#f43f5e";
}

export default function WalletScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ClientStackParamList, "Wallet">>();
  const insets = useSafeAreaInsets();

  // Saldo LevaPay em tempo real (assina mudanças em profiles.wallet_balance)
  const { balance } = useWalletBalance();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [customAmount, setCustomAmount] = useState("");
  const [showCustom, setShowCustom] = useState(false);

  const loadWallet = useCallback(async () => {
    setLoading(true);
    try {
      const wallet = await getClientWallet();
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

  // Recarga padronizada: leva ao fluxo Deposit (PIX/Boleto via Supabase).
  // O saldo é creditado pelo trigger no banco e reflete aqui em tempo real.
  const goToDeposit = useCallback(
    (presetAmount?: number) => {
      (navigation as any).navigate("Deposit", {
        defaultAmount: presetAmount,
        onSuccess: () => loadWallet(),
      });
    },
    [navigation, loadWallet],
  );

  const handleQuickTopup = (value: number) => goToDeposit(value);

  const handleCustomTopup = () => {
    const parsed = parseFloat(customAmount.replace(",", "."));
    if (!parsed || parsed < 1) {
      Toast.show({ type: "error", text1: "Valor inválido", text2: "Informe um valor acima de R$ 1,00" });
      return;
    }
    setShowCustom(false);
    setCustomAmount("");
    goToDeposit(parsed);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#091A2F" }}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 12,
          paddingHorizontal: 20,
          paddingBottom: 16,
          flexDirection: "row",
          alignItems: "center",
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.06)",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40, height: 40, borderRadius: 14,
            backgroundColor: "rgba(255,255,255,0.08)",
            alignItems: "center", justifyContent: "center", marginRight: 14,
          }}
        >
          <ArrowLeft size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ color: "#fff", fontSize: 18, fontWeight: "800" }}>Carteira</Text>
          <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 2 }}>
            Saldo e movimentações
          </Text>
        </View>
        <TouchableOpacity
          onPress={loadWallet}
          disabled={loading}
          style={{
            width: 38, height: 38, borderRadius: 12,
            backgroundColor: "rgba(255,255,255,0.06)",
            alignItems: "center", justifyContent: "center",
          }}
        >
          {loading ? (
            <ActivityIndicator color="#02de95" size="small" />
          ) : (
            <RefreshCw size={16} color="rgba(255,255,255,0.5)" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de saldo */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            borderRadius: 28, overflow: "hidden",
            backgroundColor: "#11253E",
            borderWidth: 1, borderColor: "rgba(2,222,149,0.18)",
            padding: 28, marginBottom: 20, alignItems: "center",
            position: "relative",
          }}
        >
          {/* Glow de fundo */}
          <View style={{ position: "absolute", top: -30, right: -30, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(2,222,149,0.06)" }} />

          <View style={{
            width: 60, height: 60, borderRadius: 30,
            backgroundColor: "rgba(2,222,149,0.12)",
            borderWidth: 1.5, borderColor: "rgba(2,222,149,0.3)",
            alignItems: "center", justifyContent: "center", marginBottom: 16,
          }}>
            <Wallet size={28} color="#02de95" />
          </View>

          <Text style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            Saldo Disponível
          </Text>
          {loading ? (
            <ActivityIndicator color="#02de95" size="large" style={{ marginVertical: 8 }} />
          ) : (
            <Text style={{ color: "#02de95", fontSize: 44, fontWeight: "900", letterSpacing: -1 }}>
              {formatBRL(balance)}
            </Text>
          )}
        </MotiView>

        {/* Recarga rápida */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 22,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
            padding: 20, marginBottom: 16,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 }}>
            <Plus size={16} color="#02de95" />
            <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>Adicionar Saldo</Text>
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
            {QUICK_TOPUPS.map((value) => (
              <TouchableOpacity
                key={value}
                onPress={() => handleQuickTopup(value)}
                activeOpacity={0.8}
                style={{
                  flex: 1, minWidth: "40%", height: 52,
                  borderRadius: 14, alignItems: "center", justifyContent: "center",
                  borderWidth: 1.5, borderColor: "rgba(2,222,149,0.3)",
                  backgroundColor: "rgba(2,222,149,0.07)",
                }}
              >
                <Text style={{ color: "#02de95", fontSize: 16, fontWeight: "900" }}>
                  {formatBRL(value)}
                </Text>
                <Text style={{ color: "rgba(2,222,149,0.55)", fontSize: 10, fontWeight: "600" }}>
                  adicionar
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Outro valor */}
          {!showCustom ? (
            <TouchableOpacity
              onPress={() => setShowCustom(true)}
              activeOpacity={0.8}
              style={{
                height: 44, borderRadius: 14, borderWidth: 1,
                borderColor: "rgba(255,255,255,0.1)",
                backgroundColor: "rgba(255,255,255,0.03)",
                alignItems: "center", justifyContent: "center",
              }}
            >
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, fontWeight: "700" }}>
                + Outro valor
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={{ flexDirection: "row", gap: 10 }}>
              <View style={{
                flex: 1, height: 48, borderRadius: 14,
                borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)",
                backgroundColor: "rgba(255,255,255,0.04)",
                flexDirection: "row", alignItems: "center", paddingHorizontal: 14,
              }}>
                <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 14, fontWeight: "700", marginRight: 4 }}>R$</Text>
                <TextInput
                  value={customAmount}
                  onChangeText={setCustomAmount}
                  placeholder="0,00"
                  placeholderTextColor="rgba(255,255,255,0.2)"
                  keyboardType="decimal-pad"
                  style={{ flex: 1, color: "#fff", fontSize: 16, fontWeight: "700" }}
                  autoFocus
                />
              </View>
              <TouchableOpacity
                onPress={handleCustomTopup}
                activeOpacity={0.85}
                style={{
                  height: 48, paddingHorizontal: 18, borderRadius: 14,
                  backgroundColor: "#02de95", alignItems: "center", justifyContent: "center",
                }}
              >
                <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 13, textTransform: "uppercase" }}>
                  OK
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </MotiView>

        {/* Métodos de pagamento */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 180 }}
          style={{ marginBottom: 16 }}
        >
          <TouchableOpacity
            onPress={() => navigation.navigate("PaymentsCenter")}
            activeOpacity={0.85}
            style={{
              flexDirection: "row", alignItems: "center", gap: 14,
              backgroundColor: "#11253E", borderRadius: 18, padding: 18,
              borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
            }}
          >
            <View style={{
              width: 42, height: 42, borderRadius: 13,
              backgroundColor: "rgba(59,130,246,0.12)",
              borderWidth: 1, borderColor: "rgba(59,130,246,0.2)",
              alignItems: "center", justifyContent: "center",
            }}>
              <CreditCard size={20} color="#3b82f6" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>Métodos de Pagamento</Text>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginTop: 2 }}>
                Gerenciar cartões e forma padrão
              </Text>
            </View>
            <ChevronRight size={18} color="rgba(255,255,255,0.25)" />
          </TouchableOpacity>
        </MotiView>

        {/* Histórico de transações */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240 }}
          style={{
            backgroundColor: "#11253E", borderRadius: 22,
            borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", overflow: "hidden",
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <History size={16} color="rgba(255,255,255,0.5)" />
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "800" }}>Transações Recentes</Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate("History")} activeOpacity={0.8}>
              <Text style={{ color: "#02de95", fontSize: 12, fontWeight: "700" }}>Ver todas</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <ActivityIndicator color="#02de95" />
            </View>
          ) : transactions.length === 0 ? (
            <View style={{ padding: 32, alignItems: "center" }}>
              <AlertCircle size={32} color="rgba(255,255,255,0.15)" style={{ marginBottom: 12 }} />
              <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 14, fontWeight: "600" }}>
                Nenhuma transação ainda
              </Text>
              <Text style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, marginTop: 4 }}>
                Adicione saldo para começar
              </Text>
            </View>
          ) : (
            <>
              {transactions.slice(0, 8).map((item, index) => {
                const sign = transactionSign(item.type);
                const color = transactionColor(item.type);
                const Icon = sign === "+" ? TrendingUp : TrendingDown;
                return (
                  <View
                    key={String(item._id || index)}
                    style={{
                      flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14,
                      borderBottomWidth: index < Math.min(transactions.length, 8) - 1 ? 1 : 0,
                      borderBottomColor: "rgba(255,255,255,0.04)",
                    }}
                  >
                    <View style={{
                      width: 38, height: 38, borderRadius: 12,
                      backgroundColor: color + "18",
                      alignItems: "center", justifyContent: "center", marginRight: 14,
                    }}>
                      <Icon size={18} color={color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>
                        {transactionLabel(item.type)}
                      </Text>
                      <Text style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, marginTop: 2 }}>
                        {new Date(item.createdAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })}
                      </Text>
                    </View>
                    <Text style={{ color, fontSize: 14, fontWeight: "900" }}>
                      {sign}{formatBRL(Number(item.amount || 0))}
                    </Text>
                  </View>
                );
              })}
              {transactions.length > 8 && (
                <TouchableOpacity
                  onPress={() => navigation.navigate("History")}
                  activeOpacity={0.8}
                  style={{ padding: 16, alignItems: "center", borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.04)" }}
                >
                  <Text style={{ color: "#02de95", fontSize: 13, fontWeight: "700" }}>
                    Ver mais {transactions.length - 8} transações
                  </Text>
                </TouchableOpacity>
              )}
            </>
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}
