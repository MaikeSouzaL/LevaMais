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
"@react-navigation/native-stack";
// import api from "../../../services/api";
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

  // async function handleGoogleSignIn() {
  //   if (!phone) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Número de telefone necessário",
  //       text2: "Informe seu telefone antes de continuar",
  //     });
  //     setShowPhoneModal(true);
  //     return;
  //   }

  //   // setGoogleLoading(true);
  //   try {
  //     // 1. Autenticar com o Google
  //     await GoogleSignin.hasPlayServices();
  //     const userInfo = await GoogleSignin.signIn();

  //     if (!isSuccessResponse(userInfo)) {
  //       Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
  //       return;
  //     }

  //     // 2. Extrair informações do usuário Google
  //     const { user, idToken, scopes, serverAuthCode } = userInfo.data;
  //     const { givenName, email, familyName, id, name, photo } = user;

  //     // 3. Enviar para API de login Google
  //     const response = await api.post("/login", {
  //       email: email.trim().toLowerCase(),
  //       password: `${email}-${id}`,
  //     });
  //     // console.log("Login com Google:", response.status);

  //     if (response.status === 200) {
  //       const { user } = response.data;
  //       const {
  //         token,
  //         _id,
  //         name,
  //         email,
  //         phone,
  //         userType,
  //         profilePhoto,
  //         googleId,
  //         acceptedTerms,
  //         expoToken,
  //       } = user;
  //       // console.log("Dados do usuário:", JSON.stringify(user, null, 2));

  //       await AsyncStorage.setItem("@auth_token", token);

  //       useAuthStore.getState().login(
  //         userType,
  //         {
  //           id: _id,
  //           cidade: city,
  //           nome: name,
  //           email: email,
  //           telefone: phone,
  //           fotoPerfil: profilePhoto,
  //           googleId: googleId,
  //           aceitouTermos: acceptedTerms,
  //           expoPushToken: expoToken,
  //         },
  //         token
  //       );
  //       Toast.show({
  //         type: "success",
  //         text1: "Login com Google realizado com sucesso!",
  //       });
  //     }
  //   } catch (error: any) {
  //     console.log("Erro no login com Google:", error);
  //     Toast.show({
  //       type: "error",
  //       text1:
  //         error.response?.data?.error ||
  //         "Erro ao fazer login com Google. Verifique sua conexão.",
  //     });
  //   }
  // }

  // async function handleManualLogin() {
  //   if (!email.trim()) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Email obrigatório",
  //       text2: "Preencha seu email para continuar",
  //     });
  //     return;
  //   }
  //   if (!password || password.length < 6) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Senha inválida",
  //       text2: "A senha deve ter pelo menos 6 caracteres",
  //     });
  //     return;
  //   }
  //   setLoading(true);
  //   try {
  //     // 1. Fazer a requisição para a API
  //     const response = await api.post("/login", {
  //       email: email.trim().toLowerCase(),
  //       password,
  //     });

  //     if (response.status === 200) {
  //       const { user } = response.data;
  //       const {
  //         token,
  //         _id,
  //         name,
  //         email,
  //         phone,
  //         userType,
  //         profilePhoto,
  //         googleId,
  //         acceptedTerms,
  //         expoToken,
  //       } = user;
  //       // console.log("Dados do usuário:", JSON.stringify(user, null, 2));

  //       await AsyncStorage.setItem("@auth_token", token);

  //       useAuthStore.getState().login(
  //         userType,
  //         {
  //           id: _id,
  //           cidade: city,
  //           nome: name,
  //           email: email,
  //           telefone: phone,
  //           fotoPerfil: profilePhoto,
  //           googleId: googleId,
  //           aceitouTermos: acceptedTerms,
  //           expoPushToken: expoToken,
  //         },
  //         token
  //       );
  //       Toast.show({
  //         type: "success",
  //         text1: "Login com Google realizado com sucesso!",
  //       });
  //     }
  //   } catch (error: any) {
  //     console.log("Erro no login:", error);
  //     Toast.show({
  //       type: "error",
  //       text1: error.response?.data?.error || "Erro ao fazer login",
  //     });
  //   }
  // }

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
            <Text className="text-4xl font-bold text-white tracking-tight">Bem-vindo</Text>
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
                <Text className="text-brand-light font-bold text-sm">Alterar</Text>
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
            // onPress={() => navigation.navigate("EsqueciSenhaScreen")}
          >
            <Text className="text-gray-400 font-regular text-right">
              Esqueceu a senha?
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-14 bg-brand-light rounded-2xl items-center justify-center mb-6 shadow-lg shadow-brand-light/20"
            // onPress={handleManualLogin}
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

          <GoogleButton onPress={()=>{}} loading={googleLoading} />

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
