import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { DriverScreen } from "./components/DriverScreen";
import walletService, { Balance } from "../../../services/wallet.service";
import Toast from "react-native-toast-message";

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

function inferPixKeyType(value: string): "cpf" | "email" | "phone" | "evp" {
  const v = String(value || "").trim();

  if (/^[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}$/.test(v)) return "email";

  const digits = v.replace(/\D/g, "");
  if (digits.length === 11) return "cpf";
  if (digits.length >= 10 && digits.length <= 13) return "phone";

  return "evp";
}

export default function DriverWithdrawScreen() {
  const navigation = useNavigation<any>();
  const [balance, setBalance] = useState<Balance>({ available: 0, totalEarnings: 0, totalWithdrawn: 0 });
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  const loadBalance = useCallback(async () => {
    try {
      setLoadingBalance(true);
      const response = await walletService.getBalance();
      setBalance(response);
    } finally {
      setLoadingBalance(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadBalance();
    }, [loadBalance]),
  );

  const handleWithdraw = async () => {
    const value = parseCurrencyToNumber(amount);

    if (!value || value <= 0) {
      Toast.show({ type: "error", text1: "Valor invalido" });
      return;
    }

    if (value > balance.available) {
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
      const pixKeyType = inferPixKeyType(trimmedPixKey);
      await walletService.withdraw(value, trimmedPixKey, pixKeyType);

      Toast.show({
        type: "success",
        text1: "Solicitacao enviada",
        text2: "Acompanhe o status no extrato.",
      });

      setAmount("");
      setPixKey("");
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
    const value = balance.available * percentage;
    setAmount(value.toFixed(2).replace(".", ","));
  };

  return (
    <DriverScreen title="Saque" scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View
          style={{
            backgroundColor: "#1b2723",
            padding: 24,
            borderRadius: 16,
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 32,
          }}
        >
          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              textTransform: "uppercase",
              fontSize: 12,
              fontWeight: "700",
              letterSpacing: 1,
            }}
          >
            Disponivel para saque
          </Text>
          {loadingBalance ? (
            <ActivityIndicator color="#02de95" style={{ marginTop: 10 }} />
          ) : (
            <Text style={{ color: "#fff", fontSize: 42, fontWeight: "900", marginTop: 8 }}>
              {formatBRL(balance.available)}
            </Text>
          )}
        </View>

        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8, fontSize: 16 }}>
          Quanto voce quer sacar?
        </Text>

        <View
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
          }}
        >
          <Text style={{ color: "#02de95", fontSize: 20, fontWeight: "700", marginRight: 8 }}>R$</Text>
          <TextInput
            placeholder="0,00"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="numeric"
            style={{
              flex: 1,
              color: "white",
              fontSize: 24,
              fontWeight: "700",
              paddingVertical: 12,
            }}
            value={amount}
            onChangeText={setAmount}
          />
        </View>

        <View style={{ flexDirection: "row", gap: 10, marginBottom: 32 }}>
          <TouchableOpacity
            onPress={() => setPercent(0.25)}
            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>25%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPercent(0.5)}
            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>50%</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPercent(1)}
            style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}
          >
            <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>MAX</Text>
          </TouchableOpacity>
        </View>

        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8, fontSize: 16 }}>Chave PIX</Text>
        <TextInput
          placeholder="CPF, E-mail, Telefone ou chave aleatoria"
          placeholderTextColor="rgba(255,255,255,0.4)"
          autoCapitalize="none"
          style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            padding: 16,
            color: "white",
            fontSize: 16,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            marginBottom: 32,
          }}
          value={pixKey}
          onChangeText={setPixKey}
        />

        <TouchableOpacity
          onPress={handleWithdraw}
          disabled={loading || loadingBalance}
          style={{
            backgroundColor: "#02de95",
            padding: 18,
            borderRadius: 14,
            alignItems: "center",
            opacity: loading || loadingBalance ? 0.7 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#091A2F" />
          ) : (
            <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 16 }}>CONFIRMAR SAQUE</Text>
          )}
        </TouchableOpacity>

        <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 16, fontSize: 13 }}>
          O valor sera creditado na conta informada em ate 24 horas uteis.
        </Text>
      </KeyboardAvoidingView>
    </DriverScreen>
  );
}
