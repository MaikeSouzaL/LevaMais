import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
// import * as Location from "expo-location";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  login as loginService,
  googleAuth,
} from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import Toast from "react-native-toast-message";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import GoogleButton from "./component/GoogleButton";
import PhoneNumberModal from "./component/PhoneNumberModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getCidadeUsuario } from "./getCidadeUsuario";
import { SafeAreaView } from "react-native-safe-area-context";
import { CLIENTE_WEB_ID } from "@env";

// Configurar Google Sign In
GoogleSignin.configure({
  webClientId: CLIENTE_WEB_ID,
  profileImageSize: 150,
  offlineAccess: true,
});

export default function SignInScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { params } = route;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState(""); // garanta que exista no componente
  const [showPhoneModal, setShowPhoneModal] = useState(true);
  const [phoneError, setPhoneError] = useState<string>("");
  const passwordInputRef = React.useRef<TextInput>(null);

  function handleNavigateToSignUp() {
    // animações: "default" | "fade" | "slide_from_right" | "slide_from_left" | "slide_from_bottom" | "none"
    navigation.navigate("SignUp");
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      // 1. Autenticar com o Google
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!isSuccessResponse(userInfo)) {
        Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
        return;
      }

      // 2. Extrair informações do usuário Google
      const { user } = userInfo.data;
      const { email, id, name, photo } = user;

      // 3. Enviar para API de autenticação Google
      const response = await googleAuth({
        googleId: id,
        email: email.trim().toLowerCase(),
        name: name || email.split("@")[0],
        profilePhoto: photo || undefined,
      });

      if (response.success && response.data) {
        const { user: userData, token } = response.data;
        const {
          _id,
          name: userName,
          email: userEmail,
          phone,
          userType,
          profilePhoto,
          googleId,
          acceptedTerms,
          city,
        } = userData;

        // Verificar se o usuário JÁ POSSUI um cadastro completo
        // Se tiver telefone E cidade, significa que já tinha cadastro completo (manual ou Google completo)
        // Se não tiver, significa que foi criado agora pelo Google e precisa completar
        const hasCompleteRegistration = phone && city;

        if (hasCompleteRegistration) {
          // Usuário já possui cadastro completo, fazer login direto
          const cidade = city || "";

          useAuthStore.getState().login(
            userType,
            {
              id: _id,
              cidade: cidade,
              nome: userName,
              email: userEmail,
              telefone: phone || "",
              fotoPerfil: profilePhoto,
              googleId: googleId,
              aceitouTermos: acceptedTerms,
            },
            token
          );

          Toast.show({
            type: "success",
            text1: "Login com Google realizado com sucesso!",
            text2: `Bem-vindo, ${userName}!`,
          });

          // A navegação será automática através do componente Routes
        } else {
          // Usuário não possui cadastro completo, precisa completar
          // Gerar senha usando email + id do Google
          const generatedPassword = `${userEmail}-${id}`;

          // Navegar para SelectProfile para escolher o tipo de usuário e completar cadastro
          navigation.navigate("SelectProfile", {
            user: {
              _id,
              name: userName,
              email: userEmail,
              password: generatedPassword, // Senha gerada: email-id
              phone: phone || "",
              city: city || "",
              userType: userType || undefined,
              googleId,
              profilePhoto,
              acceptedTerms,
            },
            token,
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao autenticar com Google",
          text2: response.message || "Verifique sua conexão e tente novamente",
        });
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao fazer login com Google",
        text2:
          error.message ||
          "Erro ao fazer login com Google. Verifique sua conexão.",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleManualLogin() {
    if (!email.trim()) {
      Toast.show({
        type: "error",
        text1: "Email obrigatório",
        text2: "Preencha seu email para continuar",
      });
      return;
    }
    if (!password || password.length < 6) {
      Toast.show({
        type: "error",
        text1: "Senha inválida",
        text2: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    setLoading(true);
    try {
      // Fazer login usando o serviço
      const response = await loginService({
        email: email.trim().toLowerCase(),
        password,
      });

      if (response.success && response.data) {
        const { user, token } = response.data;
        const {
          _id,
          name,
          email: userEmail,
          phone,
          userType,
          profilePhoto,
          googleId,
          acceptedTerms,
          city,
        } = user;

        // Usar city direto
        const cidade = city || "";

        // Salvar no Zustand
        useAuthStore.getState().login(
          userType,
          {
            id: _id,
            cidade: cidade,
            nome: name,
            email: userEmail,
            telefone: phone || "",
            fotoPerfil: profilePhoto,
            googleId: googleId,
            aceitouTermos: acceptedTerms,
          },
          token
        );

        Toast.show({
          type: "success",
          text1: "Login realizado com sucesso!",
          text2: `Bem-vindo, ${name}!`,
        });

        // A navegação será automática através do componente Routes
        // que verifica isAuthenticated e userType
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao fazer login",
          text2: response.message || "Email ou senha inválidos",
        });
      }
    } catch (error: any) {
      console.error("Erro no login:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao fazer login",
        text2: error.message || "Verifique sua conexão e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  // function handlePhoneConfirm(numero: string) {
  //   setPhone(numero);
  //   setShowPhoneModal(false);
  //   setPhoneError("");

  //   // Solicitar localização após confirmar o número de telefone
  //   getUserCity();
  // }

  // async function getUserCity() {
  //   try {
  //     const { status } = await Location.requestForegroundPermissionsAsync();

  //     if (status !== "granted") {
  //       console.log("Permissão de localização negada");
  //       return;
  //     }

  //     Toast.show({
  //       type: "info",
  //       text1: "Detectando sua localização",
  //       text2: "Estamos identificando sua cidade",
  //     });

  //     const location = await Location.getCurrentPositionAsync({});
  //     const cidade = await getCidadeUsuario(location.coords);

  //     if (cidade) {
  //       setCity(cidade);

  //       console.log(`Cidade detectada: ${cidade}`);

  //       Toast.show({
  //         type: "success",
  //         text1: "Localização detectada",
  //         text2: `Você está em ${cidade}`,
  //       });
  //     } else {
  //       Toast.show({
  //         type: "error",
  //         text1: "Cidade não detectada",
  //         text2: "Não foi possível identificar sua cidade",
  //       });
  //     }
  //   } catch (error) {
  //     console.error("Erro ao obter cidade:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: "Erro de localização",
  //       text2: "Não foi possível detectar sua cidade",
  //     });
  //   }
  // }

  // function handlePhoneCancel() {
  //   setPhoneError("O número de telefone é obrigatório para criar uma conta");
  // }

  // useEffect(() => {
  //   if (Email) {
  //     setEmail(Email);
  //     if (passwordInputRef.current) {
  //       passwordInputRef.current.focus();
  //     }
  //     Toast.show({
  //       type: "info",
  //       text1: "Email preenchido",
  //       text2: "Digite sua nova senha para entrar",
  //     });
  //   }
  // }, [route.params]);

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-dark"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <SafeAreaView className="flex-1 px-6 justify-center">
          <View className="mb-10">
            <Text className="text-4xl font-bold text-white tracking-tight">
              Bem-vindo
            </Text>
            <Text className="text-base text-gray-400 mt-2 font-regular">
              Faça login para continuar
            </Text>
          </View>

          {phone ? (
            <View className="flex-row items-center bg-surface-primary border border-brand-light/30 rounded-2xl px-4 py-3 mb-8">
              <MaterialCommunityIcons
                name="cellphone"
                size={24}
                color="#00E096"
              />
              <Text className="ml-3 text-base text-gray-200 font-semibold">
                +55 {phone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")}
              </Text>
              <TouchableOpacity
                className="ml-auto"
                onPress={() => setShowPhoneModal(true)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text className="text-brand-light font-bold text-sm">
                  Alterar
                </Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <View className="mb-4">
            <Text className="text-sm font-medium text-gray-300 mb-2">
              Seu e-mail
            </Text>
            <TextInput
              className="h-14 bg-surface-secondary rounded-xl px-4 text-white border border-gray-700 focus:border-brand-light"
              placeholder="Digite seu e-mail"
              placeholderTextColor="#7C7C8A"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-gray-300 mb-2">
              Sua senha
            </Text>
            <TextInput
              ref={passwordInputRef}
              className="h-14 bg-surface-secondary rounded-xl px-4 text-white border border-gray-700 focus:border-brand-light"
              placeholder="Digite sua senha"
              placeholderTextColor="#7C7C8A"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>

          <TouchableOpacity
            className="mb-8 items-end"
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text className="text-gray-400 font-regular text-right">
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 bg-brand-light rounded-2xl items-center justify-center mb-6 shadow-lg shadow-brand-light/20"
            onPress={handleManualLogin}
            disabled={loading}
          >
            <Text className="text-brand-dark font-bold text-lg">
              {loading ? "Entrando..." : "Entrar"}
            </Text>
          </TouchableOpacity>

          <View className="flex-row items-center my-6">
            <View className="flex-1 h-[1px] bg-gray-700" />
            <Text className="mx-4 text-gray-500 font-medium">OU</Text>
            <View className="flex-1 h-[1px] bg-gray-700" />
          </View>

          <GoogleButton onPress={handleGoogleSignIn} loading={googleLoading} />

          <TouchableOpacity
            className="mt-6 items-center"
            onPress={handleNavigateToSignUp}
          >
            <Text className="text-base text-gray-400">
              Não tem uma conta?{" "}
              <Text className="text-brand-light font-bold">Criar conta</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
