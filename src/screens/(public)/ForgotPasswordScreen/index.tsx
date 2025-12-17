import React, { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import { requestPasswordReset } from "../../../services/auth.service";

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const emailInputRef = useRef<TextInput>(null);

  async function handleSendCode() {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email obrigatório",
        text2: "Digite seu email para continuar",
      });
      return;
    }

    // Validação básica de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Toast.show({
        type: "error",
        text1: "Email inválido",
        text2: "Digite um email válido",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await requestPasswordReset({
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Código enviado!",
          text2: "Verifique seu email para o código de verificação",
        });

        // Navegar para tela de verificação de código
        navigation.navigate("VerifyCode", {
          email: email.trim().toLowerCase(),
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao enviar código",
          text2: response.message || "Verifique seu email e tente novamente",
        });
      }
    } catch (error: any) {
      console.error("Erro ao solicitar recuperação de senha:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao enviar código",
        text2: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-dark justify-center"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Ícone de voltar fixo no topo */}
      <SafeAreaView edges={["top"]} className="bg-brand-dark">
        <View className="px-6 pt-4">
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            className="w-10 h-10 items-center justify-center"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Feather name="arrow-left" size={24} color={theme.COLORS.WHITE} />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        ref={scrollViewRef}
        className="flex-1"
        contentContainerStyle={{
          flexGrow: 1,
          justifyContent: "center",
          paddingBottom: 40,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView edges={["bottom"]} className="flex-1 px-6 justify-center">
          {/* Título e descrição */}
          <View className="mb-8">
            <Text className="text-4xl font-bold text-white tracking-tight mb-3">
              Esqueceu a senha?
            </Text>
            <Text className="text-base text-gray-400 font-regular leading-6">
              Digite seu email e enviaremos um código de verificação para você
              criar uma nova senha
            </Text>
          </View>

          {/* Campo Email */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-300 mb-3">
              Seu e-mail
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-4 h-14 focus:border-brand-light">
              <Feather
                name="mail"
                size={20}
                color={theme.COLORS.BRAND_LIGHT}
                style={{ marginRight: 12 }}
              />
              <TextInput
                ref={emailInputRef}
                className="flex-1 text-base text-white"
                placeholder="Digite seu e-mail"
                placeholderTextColor="#7C7C8A"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                autoFocus
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollToEnd({ animated: true });
                  }, 300);
                }}
              />
            </View>
          </View>

          {/* Botão Enviar */}
          <TouchableOpacity
            className="h-14 bg-brand-light rounded-2xl items-center justify-center mb-6 shadow-lg shadow-brand-light/20"
            onPress={handleSendCode}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text className="text-brand-dark font-bold text-lg">
              {loading ? "Enviando..." : "Enviar código"}
            </Text>
          </TouchableOpacity>

          {/* Link para voltar ao login */}
          <TouchableOpacity
            className="items-center py-4"
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text className="text-base text-gray-400">
              Lembrou sua senha?{" "}
              <Text className="text-brand-light font-bold">Entrar</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
