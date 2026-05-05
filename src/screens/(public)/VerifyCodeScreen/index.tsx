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
import {
  requestPasswordReset,
  verifyResetCode,
} from "../../../services/auth.service";

export default function VerifyCodeScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email } = route.params as { email: string };

  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => {
      inputRefs.current[0]?.focus();
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 300);
  }, []);

  useEffect(() => {
    if (resendCountdown <= 0) return;

    const timer = setInterval(() => {
      setResendCountdown((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [resendCountdown]);

  function handleCodeChange(text: string, index: number) {
    const numericText = text.replace(/[^0-9]/g, "");

    if (numericText.length > 1) {
      const digits = numericText.split("").slice(0, 6);
      const newCode = [...code];
      digits.forEach((digit, i) => {
        if (index + i < 6) {
          newCode[index + i] = digit;
        }
      });
      setCode(newCode);
      const nextIndex = Math.min(index + digits.length, 5);
      inputRefs.current[nextIndex]?.focus();
      return;
    }

    const newCode = [...code];
    newCode[index] = numericText;
    setCode(newCode);

    if (numericText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyPress(key: string, index: number) {
    if (key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyCode() {
    const codeString = code.join("");

    if (codeString.length !== 6) {
      Toast.show({
        type: "error",
        text1: "Codigo incompleto",
        text2: "Digite o codigo de 6 digitos",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await verifyResetCode({
        email,
        code: codeString,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Codigo verificado",
          text2: "Agora voce pode criar uma nova senha",
        });

        navigation.navigate("NewPassword", {
          email,
          code: codeString,
        });
        return;
      }

      Toast.show({
        type: "error",
        text1: "Codigo invalido",
        text2: response.message || "Verifique o codigo e tente novamente",
      });
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error("Erro ao verificar codigo:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao verificar codigo",
        text2: error.message || "Verifique sua conexao e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleResendCode() {
    if (resendLoading || resendCountdown > 0) return;

    setResendLoading(true);
    try {
      const response = await requestPasswordReset({
        email: email.trim().toLowerCase(),
      });

      if (!response.success) {
        Toast.show({
          type: "error",
          text1: "Erro ao reenviar",
          text2: response.message || "Tente novamente",
        });
        return;
      }

      setResendCountdown(60);
      Toast.show({
        type: "success",
        text1: "Codigo reenviado",
        text2: "Verifique seu email",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao reenviar",
        text2: error?.message || "Tente novamente",
      });
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <View className="flex-row items-center px-6 py-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View className="flex-1 px-6">
            <View className="mb-8 mt-4">
              <Text className="text-4xl font-bold text-white tracking-tight mb-3">
                Verificar codigo
              </Text>
              <Text className="text-base text-gray-400 font-regular leading-6">
                Digite o codigo de 6 digitos enviado para{"\n"}
                <Text className="text-brand-light font-semibold">{email}</Text>
              </Text>
            </View>

            <View className="mb-8">
              <View className="flex-row justify-between mb-6">
                {code.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => {
                      if (ref) inputRefs.current[index] = ref;
                    }}
                    className="w-14 h-16 bg-surface-secondary border border-gray-700 rounded-xl text-center text-white text-2xl font-bold"
                    value={digit}
                    onChangeText={(text) => handleCodeChange(text, index)}
                    onKeyPress={({ nativeEvent }) =>
                      handleKeyPress(nativeEvent.key, index)
                    }
                    onFocus={() => {
                      setTimeout(() => {
                        scrollViewRef.current?.scrollToEnd({ animated: true });
                      }, 300);
                    }}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                  />
                ))}
              </View>

              <TouchableOpacity
                onPress={handleResendCode}
                className="items-center py-2"
                disabled={resendLoading || resendCountdown > 0}
                activeOpacity={0.7}
              >
                <Text className="text-base text-gray-400">
                  Nao recebeu o codigo?{" "}
                  <Text className="text-brand-light font-bold">
                    {resendCountdown > 0
                      ? `Reenviar em ${resendCountdown}s`
                      : resendLoading
                        ? "Enviando..."
                        : "Reenviar"}
                  </Text>
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              className="h-14 bg-brand-light rounded-2xl items-center justify-center mb-6 shadow-lg shadow-brand-light/20"
              onPress={handleVerifyCode}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text className="text-brand-dark font-bold text-lg">
                {loading ? "Verificando..." : "Verificar codigo"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="items-center py-4"
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text className="text-base text-gray-400">
                Voltar para{" "}
                <Text className="text-brand-light font-bold">
                  esqueci a senha
                </Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
