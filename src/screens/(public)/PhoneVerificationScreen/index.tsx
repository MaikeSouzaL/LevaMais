import React, { useState, useRef, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import { sendPhoneVerification, verifyPhoneCode } from "../../../services/auth.service";

const CODE_INPUT_COUNT = 6;

export default function PhoneVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phone = route.params?.phone || "";
  const nextScreen = route.params?.nextScreen || "SelectProfile";
  const nextParams = route.params?.nextParams || {};

  const [code, setCode] = useState<string[]>(Array(CODE_INPUT_COUNT).fill(""));
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasSentInitialCode, setHasSentInitialCode] = useState(false);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (!phone) {
      Toast.show({
        type: "error",
        text1: "Telefone nao encontrado",
        text2: "Volte e informe seu telefone para continuar",
      });
      navigation.goBack();
      return;
    }

    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 300);
  }, [navigation, phone]);

  useEffect(() => {
    if (!phone || hasSentInitialCode) return;

    async function sendInitialCode() {
      setSending(true);
      try {
        const response = await sendPhoneVerification(phone);
        if (response.success) {
          setCountdown(60);
          setHasSentInitialCode(true);
          Toast.show({
            type: "success",
            text1: "Codigo enviado",
            text2: "Confira seu SMS para continuar",
          });
          return;
        }

        Toast.show({
          type: "error",
          text1: "Falha ao enviar codigo",
          text2: response.message || "Tente novamente",
        });
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Erro ao enviar codigo",
          text2: e?.message || "Tente novamente",
        });
      } finally {
        setSending(false);
      }
    }

    sendInitialCode();
  }, [phone, hasSentInitialCode]);

  useEffect(() => {
    let timer: any;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((p) => p - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  function handleCodeChange(text: string, index: number) {
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric.length > 1) return;

    const next = [...code];
    next[index] = numeric;
    setCode(next);

    if (numeric && index < CODE_INPUT_COUNT - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(e: any, index: number) {
    if (e.nativeEvent.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleResend() {
    if (!phone || countdown > 0) return;
    setSending(true);
    try {
      const response = await sendPhoneVerification(phone);
      if (!response.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: response.message || "Nao foi possivel reenviar",
        });
        return;
      }

      setCountdown(60);
      Toast.show({ type: "success", text1: "Codigo reenviado" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    const fullCode = code.join("");
    if (fullCode.length < CODE_INPUT_COUNT) {
      Toast.show({ type: "error", text1: "Codigo incompleto", text2: "Digite o codigo de 6 digitos" });
      return;
    }

    setLoading(true);
    try {
      const resp = await verifyPhoneCode(phone, fullCode);
      if (resp.success) {
        Toast.show({ type: "success", text1: "Telefone verificado!" });
        navigation.navigate(nextScreen, nextParams);
      } else {
        Toast.show({ type: "error", text1: "Codigo invalido", text2: resp.message || "Verifique e tente novamente" });
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setLoading(false);
    }
  }

  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  const formattedPhone = normalizedPhone.length === 11
    ? normalizedPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    : normalizedPhone.length === 10
      ? normalizedPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
      : phone;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.COLORS.BRAND_DARK }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingVertical: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: 32 }}>
            <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
          </TouchableOpacity>

          <Text style={{ color: "#fff", fontSize: 28, fontWeight: "900", marginBottom: 8 }}>
            Verifique seu numero
          </Text>
          <Text style={{ color: "#8ea6a3", fontSize: 15, marginBottom: 8 }}>
            Enviamos um codigo de 6 digitos por SMS para
          </Text>
          <Text style={{ color: theme.COLORS.BRAND_LIGHT, fontSize: 16, fontWeight: "700", marginBottom: 40 }}>
            {formattedPhone || phone}
          </Text>

          <View style={{ flexDirection: "row", justifyContent: "center", gap: 10, marginBottom: 32 }}>
            {code.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { inputRefs.current[i] = r; }}
                style={{
                  width: 48,
                  height: 56,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: digit ? theme.COLORS.BRAND_LIGHT : "rgba(255,255,255,0.15)",
                  backgroundColor: "rgba(255,255,255,0.06)",
                  color: "#fff",
                  fontSize: 24,
                  fontWeight: "800",
                  textAlign: "center",
                }}
                keyboardType="number-pad"
                maxLength={1}
                value={digit}
                onChangeText={(t) => handleCodeChange(t, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            activeOpacity={0.85}
            style={{
              height: 52,
              borderRadius: 14,
              backgroundColor: theme.COLORS.BRAND_LIGHT,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text style={{ color: theme.COLORS.BRAND_DARK, fontWeight: "900", fontSize: 16 }}>
              {loading ? "Verificando..." : "Verificar"}
            </Text>
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text style={{ color: "#8ea6a3", fontSize: 14 }}>
              Nao recebeu?{" "}
            </Text>
            {countdown > 0 ? (
              <Text style={{ color: theme.COLORS.BRAND_LIGHT, fontSize: 14, fontWeight: "700" }}>
                Reenviar em {countdown}s
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend} disabled={sending}>
                <Text style={{ color: theme.COLORS.BRAND_LIGHT, fontSize: 14, fontWeight: "700" }}>
                  {sending ? "Enviando..." : "Reenviar codigo"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
