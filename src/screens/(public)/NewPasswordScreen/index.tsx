import React, { useState, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Keyboard,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import theme from "../../../theme";
import { resetPassword } from "../../../services/auth.service";
import PasswordStrengthIndicator from "../../../components/PasswordStrengthIndicator";

export default function NewPasswordScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, code } = route.params as { email: string; code: string };

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  // Função para fazer scroll quando um input recebe foco
  function handleInputFocus(inputRef: React.RefObject<TextInput | null>) {
    setTimeout(() => {
      if (inputRef.current && scrollViewRef.current) {
        inputRef.current.measureLayout(
          scrollViewRef.current as any,
          (x, y) => {
            scrollViewRef.current?.scrollTo({
              y: y - 100, // Offset para deixar espaço acima do input
              animated: true,
            });
          },
          () => {
            // Fallback: scroll para o final
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }
        );
      }
    }, 300);
  }

  async function handleResetPassword() {
    if (!password || password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Senha inválida",
        text2: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    if (password !== confirmPassword) {
      Toast.show({
        type: "error",
        text1: "Senhas não coincidem",
        text2: "As senhas devem ser iguais",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await resetPassword({
        email: email,
        code: code,
        newPassword: password,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Senha alterada!",
          text2: "Sua senha foi alterada com sucesso",
        });

        // Navegar para tela de login
        navigation.navigate("SignIn");
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao alterar senha",
          text2: response.message || "Tente novamente",
        });
      }
    } catch (error: any) {
      console.error("Erro ao alterar senha:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao alterar senha",
        text2: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark" edges={["top"]}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        {/* Ícone de voltar fixo no topo */}
        <View className="px-6 pt-4">
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
          contentContainerStyle={{
            paddingBottom: 200,
            paddingTop: 20,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          nestedScrollEnabled={true}
        >
          <View className="flex-1 px-6">
            {/* Título e descrição */}
            <View className="mb-8 mt-4">
              <Text className="text-4xl font-bold text-white tracking-tight mb-3">
                Nova senha
              </Text>
              <Text className="text-base text-gray-400 font-regular leading-6">
                Digite sua nova senha para acessar sua conta
              </Text>
            </View>

            {/* Campo Nova Senha */}
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-300 mb-3">
                Nova senha
              </Text>
              <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-4 h-14 focus:border-brand-light">
                <Feather
                  name="lock"
                  size={20}
                  color={theme.COLORS.BRAND_LIGHT}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  ref={passwordInputRef}
                  className="flex-1 text-base text-white"
                  placeholder="Digite sua nova senha"
                  placeholderTextColor="#7C7C8A"
                  secureTextEntry={!showPassword}
                  value={password}
                  onChangeText={setPassword}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() =>
                    confirmPasswordInputRef.current?.focus()
                  }
                  onFocus={() => handleInputFocus(passwordInputRef)}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={theme.COLORS.GRAY_400}
                  />
                </TouchableOpacity>
              </View>
              <PasswordStrengthIndicator password={password} />
            </View>

            {/* Campo Confirmar Senha */}
            <View className="mb-6">
              <Text className="text-sm font-semibold text-gray-300 mb-3">
                Confirmar senha
              </Text>
              <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-4 h-14 focus:border-brand-light">
                <Feather
                  name="lock"
                  size={20}
                  color={theme.COLORS.BRAND_LIGHT}
                  style={{ marginRight: 12 }}
                />
                <TextInput
                  ref={confirmPasswordInputRef}
                  className="flex-1 text-base text-white"
                  placeholder="Confirme sua nova senha"
                  placeholderTextColor="#7C7C8A"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  returnKeyType="done"
                  onSubmitEditing={handleResetPassword}
                  onFocus={() => handleInputFocus(confirmPasswordInputRef)}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Feather
                    name={showConfirmPassword ? "eye" : "eye-off"}
                    size={20}
                    color={theme.COLORS.GRAY_400}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão Alterar Senha */}
            <TouchableOpacity
              className="h-14 bg-brand-light rounded-2xl items-center justify-center mb-6 shadow-lg shadow-brand-light/20"
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text className="text-brand-dark font-bold text-lg">
                {loading ? "Alterando..." : "Alterar senha"}
              </Text>
            </TouchableOpacity>

            {/* Link para voltar ao login */}
            <TouchableOpacity
              className="items-center py-4"
              onPress={() => navigation.navigate("SignIn")}
              activeOpacity={0.7}
            >
              <Text className="text-base text-gray-400">
                Lembrou sua senha?{" "}
                <Text className="text-brand-light font-bold">Entrar</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
