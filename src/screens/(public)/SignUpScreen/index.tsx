import { useEffect, useState } from "react";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    Text,
    TouchableOpacity,
    View,
    BackHandler,
  } from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";

import { TextInput } from "react-native";
import GoogleButton from "../SignInScreen/component/GoogleButton";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../theme";
// import { createUser, createUserWithGoogle } from "../../../services/User";

interface IsignUpParams {
  phone: string;
  city: string;
}

GoogleSignin.configure({
  webClientId:
    "422301870316-9u5rkfq44pngmak5keip0sct07ga1sbe.apps.googleusercontent.com",
  profileImageSize: 150,
  offlineAccess: true,
});

export default function SignUp() {
  const route = useRoute();

  const navigation = useNavigation();

  // const { phone, city } = route.params as IsignUpParams;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener("hardwareBackPress", () => {
      return true; 
    });
    return () => backHandler.remove();
  }, []);

  function handleBackToSignIn() {

    navigation.goBack();
  }

  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId:
  //       "422301870316-9u5rkfq44pngmak5keip0sct07ga1sbe.apps.googleusercontent.com",
  //     profileImageSize: 150,
  //     offlineAccess: true,
  //   });
  // }, []);



  // async function handleGoogleSignUp() {
  //   if (!phone) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Informe o telefone antes de continuar com o Google.",
  //     });
  //     return;
  //   }

  //   setGoogleLoading(true);

  //   try {
  //     await GoogleSignin.hasPlayServices();
  //     const userInfo = await GoogleSignin.signIn();

  //     if (isSuccessResponse(userInfo)) {
  //       const { user, idToken, scopes, serverAuthCode } = userInfo.data;
  //       const { givenName, email, familyName, id, name, photo } = user;

  //       const { token, ...rest } = await createUserWithGoogle({
  //         name,
  //         email,
  //         password: `${email}-${id}`,
  //         city,
  //         phone,
  //         givenName,
  //         familyName,
  //         profilePhoto: photo,
  //         googleId: id,
  //       });
  //       console.log("Token recebido do backend:", token, rest);

  //       Toast.show({
  //         type: "success",
  //         text1: "Cadastro com Google realizado com sucesso!",
  //       });

  //       await AsyncStorage.setItem("@auth_token", token);

  //       navigation.navigate("PerfilScreen", {
  //         token: token,
  //         _id: rest._id,
  //         userCity: rest.city,
  //         userName: rest.name,
  //         userEmail: rest.email,
  //         userPhone: rest.phone,
  //         userPhoto: rest.profilePhoto,
  //         userGoogleId: rest.googleId,
  //         acceptedTerms: rest.acceptedTerms,
  //       });
  //     } else {
  //       if (isErrorWithCode(userInfo)) {
  //         if (userInfo.code === statusCodes.SIGN_IN_CANCELLED) {
  //           Toast.show({
  //             type: "info",
  //             text1: "Login cancelado pelo usuário.",
  //           });
  //           return;
  //         }
  //         if (userInfo.code === statusCodes.IN_PROGRESS) {
  //           Toast.show({
  //             type: "info",
  //             text1: "Já existe um login em progresso.",
  //           });
  //           return;
  //         }
  //         if (userInfo.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
  //           Toast.show({
  //             type: "error",
  //             text1: "Serviços do Google Play não disponíveis.",
  //           });
  //           return;
  //         }
  //       }
  //     }
  //   } catch (error: any) {
  //     Toast.show({
  //       type: "error",
  //       text1: `${error.message}`,
  //     });
  //   } finally {
  //     setGoogleLoading(false);
  //   }
  // }

  // async function handleManualSignUp() {
  //   if (loading) return;
  //   if (!name || !email || !password || !confirmarSenha) {
  //     Toast.show({
  //       type: "error",
  //       text1: "Por favor, preencha todos os campos.",
  //     });
  //     return;
  //   }
  //   if (password !== confirmarSenha) {
  //     Toast.show({
  //       type: "error",
  //       text1: "As senhas não coincidem.",
  //     });
  //     return;
  //   }
  //   if (password.length < 6) {
  //     Toast.show({
  //       type: "error",
  //       text1: "A senha deve ter pelo menos 6 caracteres.",
  //     });
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     const { token, user } = await createUser({
  //       city,
  //       name,
  //       email,
  //       password,
  //       phone,
  //     });

  //     console.log("_id", user._id);

  //     Toast.show({ type: "success", text1: "Cadastro realizado com sucesso!" });

  //     if (token) {
  //       await AsyncStorage.setItem("@auth_token", token);
  //     }

  //     navigation.navigate("PerfilScreen", {
  //       _id: user._id,
  //       userCity: user.city,
  //       userName: user.name,
  //       userEmail: user.email,
  //       userPhone: user.phone,
  //       userPhoto: user.profilePhoto,
  //       userGoogleId: user.googleId,
  //       acceptedTerms: user.acceptedTerms,
  //       token,
  //     });
  //   } catch (error: any) {
  //     const msg =
  //       error?.response?.data?.mensagem ||
  //       error?.response?.data?.message ||
  //       error?.message ||
  //       "Erro inesperado";
  //     console.log("Erro ao cadastrar:", msg);
  //     Toast.show({
  //       type: "error",
  //       text1: "Falha no cadastro",
  //       text2: msg,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-brand-dark"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView className="flex-1 px-6 justify-center py-6">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white tracking-tight">Criar Conta</Text>
            <Text className="text-base text-gray-400 mt-2 font-regular">
              Preencha os dados abaixo para começar
            </Text>
          </View>

          {/* Campo Nome */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              Nome completo
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <Feather name="user" size={22} color={theme.COLORS.BRAND_LIGHT} className="mr-2" />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite seu nome"
                placeholderTextColor="#7C7C8A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* Campo Email */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              E-mail
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <MaterialIcons
                name="email"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite seu e-mail"
                placeholderTextColor="#7C7C8A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Campo Senha */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              Senha
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <Feather name="lock" size={22} color={theme.COLORS.BRAND_LIGHT} className="mr-2" />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite sua senha"
                placeholderTextColor="#7C7C8A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Campo Confirmar Senha */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              Confirmar senha
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <Feather name="lock" size={22} color={theme.COLORS.BRAND_LIGHT} className="mr-2" />
              <TextInput
                className="flex-1 h-12 text-base text-white"
                placeholder="Confirme sua senha"
                placeholderTextColor="#7C7C8A"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                <Feather
                  name={showConfirmPassword ? "eye" : "eye-off"}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão Cadastrar */}
          <TouchableOpacity
            className="h-14 bg-brand-light rounded-2xl items-center justify-center mt-2 mb-3 shadow-lg shadow-brand-light/20"
            // onPress={handleManualSignUp}
            disabled={loading}
          >
            <Text className="text-brand-dark font-bold text-lg">
              {loading ? "Cadastrando..." : "Criar conta"}
            </Text>
          </TouchableOpacity>

          {/* Link para Esqueci Senha */}
          <TouchableOpacity
            className="mt-2 mb-4 items-center"
            // onPress={() => navigation.navigate("EsqueciSenhaScreen")}
          >
            <Text className="text-base text-brand-light">Esqueceu sua senha?</Text>
          </TouchableOpacity>

          {/* Divisor OU */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-gray-700" />
            <Text className="mx-3 text-gray-500 font-medium">OU</Text>
            <View className="flex-1 h-[1px] bg-gray-700" />
          </View>

          {/* Botão Google */}
          <GoogleButton onPress={()=>{}} loading={googleLoading} />

          {/* Link para Login */}
          <TouchableOpacity
            className="mt-5 items-center pb-6"
            onPress={() => handleBackToSignIn()}
          >
            <Text className="text-base text-gray-400">
              Já tem uma conta?{" "}
              <Text className="text-brand-light font-bold">Entrar</Text>
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
