import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { DriverScreen } from "./components/DriverScreen";
import walletService from "../../../services/wallet.service";
import Toast from "react-native-toast-message";
import { FontAwesome5, MaterialIcons } from "@expo/vector-icons";

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

export default function DriverWithdrawScreen({ navigation }: any) {
  const [balance, setBalance] = useState({ available: 0, totalEarnings: 0, totalWithdrawn: 0 });
  const [amount, setAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(true);

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const b = await walletService.getBalance();
      setBalance(b);
    } catch (e) {
      console.log(e);
    } finally {
        setLoadingBalance(false);
    }
  };

  const handleWithdraw = async () => {
    const val = parseFloat(amount.replace(",", "."));
    if (!val || val <= 0) {
      Toast.show({ type: "error", text1: "Valor inválido" });
      return;
    }
    if (val > balance.available) {
        Toast.show({ type: "error", text1: "Saldo insuficiente" });
        return;
    }
    if (!pixKey) {
      Toast.show({ type: "error", text1: "Informe a chave PIX" });
      return;
    }

    setLoading(true);
    try {
      await walletService.withdraw(val, pixKey, "cpf"); // Default cpf for MVP
      Toast.show({
        type: "success",
        text1: "Solicitação enviada!",
        text2: "O valor cairá na sua conta em breve.",
      });
      loadBalance();
      setAmount("");
      navigation.goBack();
    } catch (e: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao solicitar saque",
        text2: e?.response?.data?.error || "Tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  const setPercent = (pct: number) => {
      const val = balance.available * pct;
      setAmount(val.toFixed(2));
  }

  return (
    <DriverScreen title="Saque" scroll>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        
        {/* Balance Card */}
        <View style={{ 
            backgroundColor: "#1b2723", 
            padding: 24, 
            borderRadius: 16, 
            alignItems: "center",
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.08)",
            marginBottom: 32
        }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", textTransform: "uppercase", fontSize: 12, fontWeight: "700", letterSpacing: 1 }}>Disponível para saque</Text>
            {loadingBalance ? <ActivityIndicator color="#02de95" style={{ marginTop: 10 }} /> : (
                <Text style={{ color: "#fff", fontSize: 42, fontWeight: "900", marginTop: 8 }}>
                    {formatBRL(balance.available)}
                </Text>
            )}
        </View>

        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8, fontSize: 16 }}>
          Quanto você quer sacar?
        </Text>
        
        <View style={{
            backgroundColor: "rgba(255,255,255,0.05)",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 4,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12
        }}>
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
            <TouchableOpacity onPress={() => setPercent(0.25)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>25%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPercent(0.5)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>50%</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setPercent(1)} style={{ flex: 1, backgroundColor: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 8, alignItems: "center" }}>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontWeight: "600" }}>MAX</Text>
            </TouchableOpacity>
        </View>

        <Text style={{ color: "white", fontWeight: "700", marginBottom: 8, fontSize: 16 }}>
          Chave PIX
        </Text>
        <TextInput
          placeholder="CPF, E-mail ou Telefone"
          placeholderTextColor="rgba(255,255,255,0.4)"
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
            <ActivityIndicator color="#0f231c" />
          ) : (
            <Text style={{ color: "#0f231c", fontWeight: "900", fontSize: 16 }}>
              CONFIRMAR SAQUE
            </Text>
          )}
        </TouchableOpacity>
        
        <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 16, fontSize: 13 }}>
            O valor será creditado na conta informada em até 24 horas úteis.
        </Text>

      </KeyboardAvoidingView>
    </DriverScreen>
  );
}
