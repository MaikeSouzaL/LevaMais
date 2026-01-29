import { useEffect, useState, useCallback, useRef } from "react";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  TextInput,
  Keyboard,
} from "react-native";
import Toast from "react-native-toast-message";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import * as Location from "expo-location";

import GoogleButton from "../SignInScreen/component/GoogleButton";
import { SafeAreaView } from "react-native-safe-area-context";
import theme from "../../../theme";
import { useAuthStore } from "../../../context/authStore";
import { CLIENTE_WEB_ID } from "@env";
import { googleAuth } from "../../../services/auth.service";
import { getCurrentLocationAndAddress } from "../../../utils/location";
import LocationPermissionScreen from "../CompleteRegistrationScreen/LocationPermissionScreen";
import PasswordStrengthIndicator from "../../../components/PasswordStrengthIndicator";

interface IsignUpParams {
  phone: string;
  city: string;
}

GoogleSignin.configure({
  webClientId: CLIENTE_WEB_ID,
  profileImageSize: 150,
  offlineAccess: true,
});

export default function SignUp() {
  const route = useRoute();
  const navigation = useNavigation();
  const { login } = useAuthStore();

  const params = route.params as IsignUpParams | undefined;
  const phone = params?.phone || "";
  const city = params?.city || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [detectedCity, setDetectedCity] = useState(city);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // Refs para inputs e scroll
  const scrollViewRef = useRef<ScrollView>(null);
  const nameInputRef = useRef<TextInput>(null);
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const confirmPasswordInputRef = useRef<TextInput>(null);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        return true;
      },
    );
    return () => backHandler.remove();
  }, []);

  function handleBackToSignIn() {
    navigation.goBack();
  }

  const handleGetLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const result = await getCurrentLocationAndAddress();

      if (result) {
        const { address: detectedAddress } = result;
        const cidade = detectedAddress.city || null;

        if (cidade) {
          setDetectedCity(cidade);
          Toast.show({
            type: "success",
            text1: "Localização detectada",
            text2: `Cidade: ${cidade}`,
          });
        }
      }
    } catch (error) {
      console.error("Erro ao obter localização:", error);
    } finally {
      setLocationLoading(false);
    }
  }, []);

  // Verificar permissão de localização ao montar e buscar automaticamente se já tiver permissão
  useEffect(() => {
    let isMounted = true;

    async function checkPermissionAndGetLocation() {
      // Se já tem cidade dos params, não precisa buscar
      if (city) {
        if (isMounted) {
          setHasCheckedPermission(true);
        }
        return;
      }

      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          if (status === "granted") {
            // Já tem permissão, buscar localização automaticamente
            setShowPermissionScreen(false);
            setHasCheckedPermission(true);
            await handleGetLocation();
          } else {
            // Não tem permissão, mostrar tela de permissão
            setShowPermissionScreen(true);
            setHasCheckedPermission(true);
          }
        }
      } catch (error) {
        console.error("Erro ao verificar permissão:", error);
        if (isMounted) {
          setShowPermissionScreen(true);
          setHasCheckedPermission(true);
        }
      }
    }

    checkPermissionAndGetLocation();

    return () => {
      isMounted = false;
    };
  }, [city, handleGetLocation]);

  async function handleAllowLocation() {
    setShowPermissionScreen(false);
    setLocationLoading(true);
    try {
      // Solicitar permissão
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({
          type: "error",
          text1: "Permissão negada",
          text2: "É necessário permitir a localização para continuar",
        });
        setLocationLoading(false);
        setShowPermissionScreen(true);
        return;
      }

      // Obter localização
      await handleGetLocation();
    } catch (error) {
      console.error("Erro ao solicitar permissão:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao solicitar permissão",
        text2: "Tente novamente",
      });
      setLocationLoading(false);
      setShowPermissionScreen(true);
    }
  }

  function handleSkipLocation() {
    setShowPermissionScreen(false);
    // Permite que o usuário continue sem localização
  }

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
          },
        );
      }
    }, 300);
  }

  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      if (!isSuccessResponse(userInfo)) {
        Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
        return;
      }

      const { user } = userInfo.data;
      const { email: userEmail, id, name, photo } = user;

      const normalizedEmail = userEmail.trim().toLowerCase();
      const generatedPassword = `${normalizedEmail}-${id}`;

      // NÃO cria usuário no banco aqui. Apenas segue para completar cadastro.
      navigation.navigate("SelectProfile", {
        user: {
          _id: "",
          name: name || normalizedEmail.split("@")[0],
          email: normalizedEmail,
          password: generatedPassword,
          phone: phone || "",
          city: city || detectedCity || "",
          userType: undefined,
          googleId: id,
          profilePhoto: photo || undefined,
          acceptedTerms: true,
        },
        token: "",
      });

      Toast.show({
        type: "success",
        text1: "Continue para completar seu cadastro",
      });
    } catch (error: any) {
      console.error("Erro no cadastro com Google:", error);
      if (isErrorWithCode(error)) {
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
          Toast.show({
            type: "info",
            text1: "Cadastro cancelado pelo usuário.",
          });
          return;
        }
        if (error.code === statusCodes.IN_PROGRESS) {
          Toast.show({
            type: "info",
            text1: "Já existe um login em progresso.",
          });
          return;
        }
        if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          Toast.show({
            type: "error",
            text1: "Serviços do Google Play não disponíveis.",
          });
          return;
        }
      }
      Toast.show({
        type: "error",
        text1: "Erro ao fazer cadastro com Google",
        text2:
          error.message ||
          "Erro ao fazer cadastro com Google. Verifique sua conexão.",
      });
    } finally {
      setGoogleLoading(false);
    }
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

  async function handleManualSignUp() {
    if (loading) return;

    // Validações
    if (!name || !email || !password || !confirmarSenha) {
      Toast.show({
        type: "error",
        text1: "Por favor, preencha todos os campos.",
      });
      return;
    }

    if (password !== confirmarSenha) {
      Toast.show({
        type: "error",
        text1: "As senhas não coincidem.",
      });
      return;
    }

    if (password.length < 6) {
      Toast.show({
        type: "error",
        text1: "A senha deve ter pelo menos 6 caracteres.",
      });
      return;
    }

    setLoading(true);

    try {
      // Criar objeto com os dados do formulário para passar via props
      // Não vamos salvar no banco ainda, apenas passar os dados para a tela de seleção de perfil
      const userData = {
        _id: "", // Será gerado no backend após seleção do perfil
        name,
        email,
        password, // Incluir senha para salvar depois
        phone: phone || undefined,
        city: city || detectedCity || undefined,
        userType: undefined, // Será definido na tela de seleção
        googleId: undefined,
        profilePhoto: undefined,
        acceptedTerms: true,
      };

      // Não salvar no banco ainda, apenas navegar com os dados
      Toast.show({
        type: "success",
        text1: "Dados preenchidos com sucesso!",
      });

      // Navegar para tela de seleção de perfil com dados do formulário
      navigation.navigate("SelectProfile", {
        user: userData,
        token: "",
      });
    } catch (error: any) {
      console.error("Erro:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: error.message || "Tente novamente mais tarde",
      });
    } finally {
      setLoading(false);
    }
  }

  // Mostrar tela de permissão se necessário
  if (showPermissionScreen && hasCheckedPermission) {
    return (
      <LocationPermissionScreen
        onAllow={handleAllowLocation}
        onSkip={handleSkipLocation}
      />
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-dark">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView
          ref={scrollViewRef}
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: 24,
            paddingVertical: 24,
            paddingBottom: 100,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
        >
          <View className="mb-8">
            <Text className="text-3xl font-bold text-white tracking-tight">
              Criar Conta
            </Text>
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
              <Feather
                name="user"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                ref={nameInputRef}
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite seu nome"
                placeholderTextColor="#7C7C8A"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                returnKeyType="next"
                onSubmitEditing={() => emailInputRef.current?.focus()}
                onFocus={() => handleInputFocus(nameInputRef)}
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
                ref={emailInputRef}
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite seu e-mail"
                placeholderTextColor="#7C7C8A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                onFocus={() => handleInputFocus(emailInputRef)}
              />
            </View>
          </View>

          {/* Campo Senha */}
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              Senha
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <Feather
                name="lock"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                ref={passwordInputRef}
                className="flex-1 h-12 text-base text-white"
                placeholder="Digite sua senha"
                placeholderTextColor="#7C7C8A"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
                onFocus={() => handleInputFocus(passwordInputRef)}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Feather
                  name={showPassword ? "eye" : "eye-off"}
                  size={20}
                  className="text-gray-400"
                />
              </TouchableOpacity>
            </View>
            <PasswordStrengthIndicator password={password} />
          </View>

          {/* Campo Confirmar Senha */}
          <View className="mb-6">
            <Text className="text-sm font-semibold text-gray-300 mb-1.5">
              Confirmar senha
            </Text>
            <View className="flex-row items-center border border-gray-700 rounded-xl bg-surface-secondary px-3 focus:border-brand-light">
              <Feather
                name="lock"
                size={22}
                color={theme.COLORS.BRAND_LIGHT}
                className="mr-2"
              />
              <TextInput
                ref={confirmPasswordInputRef}
                className="flex-1 h-12 text-base text-white"
                placeholder="Confirme sua senha"
                placeholderTextColor="#7C7C8A"
                value={confirmarSenha}
                onChangeText={setConfirmarSenha}
                secureTextEntry={!showConfirmPassword}
                returnKeyType="done"
                onSubmitEditing={handleManualSignUp}
                onFocus={() => handleInputFocus(confirmPasswordInputRef)}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
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
            onPress={handleManualSignUp}
            disabled={loading}
          >
            <Text className="text-brand-dark font-bold text-lg">
              {loading ? "Cadastrando..." : "Criar conta"}
            </Text>
          </TouchableOpacity>

          {/* Link para Esqueci Senha */}
          <TouchableOpacity
            className="mt-2 mb-4 items-center"
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text className="text-base text-brand-light">
              Esqueceu sua senha?
            </Text>
          </TouchableOpacity>

          {/* Divisor OU */}
          <View className="flex-row items-center my-4">
            <View className="flex-1 h-[1px] bg-gray-700" />
            <Text className="mx-3 text-gray-500 font-medium">OU</Text>
            <View className="flex-1 h-[1px] bg-gray-700" />
          </View>

          {/* Botão Google */}
          <GoogleButton onPress={handleGoogleSignUp} loading={googleLoading} />

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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
