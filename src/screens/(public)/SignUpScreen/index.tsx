import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Phone, User, Mail, Lock } from "lucide-react-native";
import * as Location from "expo-location";
import Toast from "react-native-toast-message";

// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Core Logic & Configurations
import { CLIENTE_WEB_ID } from "@env";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { getCurrentLocationAndAddress } from "../../../utils/location";
import LocationPermissionScreen from "../LocationPermissionScreen";
import { googleAuth } from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";

// Unified System & Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { AuthInput } from "../../../components/auth/AuthInput";
import { SocialLoginButtons } from "../../../components/auth/SocialLoginButtons";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";
import PasswordStrengthIndicator from "../../../components/PasswordStrengthIndicator";

// 🔐 Google Authentication Initialization
GoogleSignin.configure({
  webClientId: CLIENTE_WEB_ID,
  profileImageSize: 150,
  offlineAccess: true,
});

// 🔐 Robust Zod Schema for Signup Validations
const signUpSchema = z.object({
  phone: z.string().min(10, "Informe o telefone com DDD").max(15, "Formato inválido"),
  name: z.string().min(2, "O nome deve ter pelo menos 2 caracteres"),
  email: z.string().min(1, "E-mail obrigatório").email("Formato de e-mail inválido"),
  password: z.string().min(6, "Mínimo de 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirme sua senha"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpParams {
  phone?: string;
  city?: string;
}

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Params Handover
  const params = (route.params || {}) as SignUpParams;
  const initialPhone = params.phone || "";
  const initialCity = params.city || "";

  // 🔄 Functional Local States (Location, Permissions)
  const [detectedCity, setDetectedCity] = useState(initialCity);
  const [showPermissionScreen, setShowPermissionScreen] = useState(false);
  const [hasCheckedPermission, setHasCheckedPermission] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);

  // 🔄 Loading States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // 📝 React Hook Form
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      phone: initialPhone,
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Listen for password to pass strength feedback
  const watchedPassword = watch("password", "");

  // 📍 Location Logic Callbacks
  const handleGetLocation = useCallback(async () => {
    setLocationLoading(true);
    try {
      const result = await getCurrentLocationAndAddress();
      if (result?.address?.city) {
        setDetectedCity(result.address.city);
        Toast.show({
          type: "success",
          text1: "Localização detectada",
          text2: `Cidade: ${result.address.city}`,
        });
      }
    } catch (error) {
          } finally {
      setLocationLoading(false);
    }
  }, []);

  // Effects hooks logic: Config, and Location Validation logic preserved exactly.

  useEffect(() => {
    let isMounted = true;
    async function checkPermission() {
      if (initialCity) {
        if (isMounted) setHasCheckedPermission(true);
        return;
      }
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (isMounted) {
          if (status === "granted") {
            setShowPermissionScreen(false);
            setHasCheckedPermission(true);
            await handleGetLocation();
          } else {
            setShowPermissionScreen(true);
            setHasCheckedPermission(true);
          }
        }
      } catch (err) {
                if (isMounted) {
          setShowPermissionScreen(true);
          setHasCheckedPermission(true);
        }
      }
    }
    checkPermission();
    return () => { isMounted = false; };
  }, [initialCity, handleGetLocation]);

  async function handleAllowLocation() {
    setShowPermissionScreen(false);
    setLocationLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Toast.show({ type: "error", text1: "Permissão negada" });
        setShowPermissionScreen(true);
        setLocationLoading(false);
        return;
      }
      await handleGetLocation();
    } catch (err) {
      Toast.show({ type: "error", text1: "Erro ao solicitar permissão" });
      setShowPermissionScreen(true);
      setLocationLoading(false);
    }
  }

  function handleSkipLocation() {
    setShowPermissionScreen(false);
  }

  // 💼 Modern Google Signup Logic (Aligned with Backend & Social Flows)
  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    console.log("[GoogleSignUp] Início do processo");
    try {
      console.log("[GoogleSignUp] Verificando Play Services");
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      
      console.log("[GoogleSignUp] Iniciando signIn()");
      const userInfo = await GoogleSignin.signIn();
      console.log("[GoogleSignUp] SignIn realizado com sucesso", userInfo);

      if (!isSuccessResponse(userInfo)) {
        Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
        return;
      }

      const { id, email, name, photo } = userInfo.data.user;
      const normalizedEmail = email.trim().toLowerCase();

      const response = await googleAuth({
        googleId: id,
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
        profilePhoto: photo || undefined,
      });

      if (response.success && response.data) {
        const { user: userData, token, isNewUser } = response.data;
        const {
          _id,
          name: userName,
          email: userEmail,
          phone,
          userType,
          profilePhoto,
          googleId: gId,
          acceptedTerms,
        } = userData;

        const userCity = initialCity || detectedCity || "";

        // 🚨 Force Phone Capture if missing
        if (!phone) {
          const generatedPassword = `${userEmail}-${id}`;
          navigation.navigate("GooglePhonePrompt", {
            user: {
              _id,
              name: userName,
              email: userEmail,
              password: generatedPassword,
              phone: "",
              city: userCity,
              userType: userType || undefined,
              googleId: gId,
              profilePhoto,
              acceptedTerms,
            },
            token,
          });
          return;
        }

        // 🚀 If it's a NEW user, they MUST go to SelectProfile to choose between Client or Driver!
        if (isNewUser || !userType) {
          const generatedPassword = `${userEmail}-${id}`;
          navigation.navigate("SelectProfile", {
            user: {
              _id,
              name: userName,
              email: userEmail,
              password: generatedPassword,
              phone: phone,
              city: userCity,
              userType: userType || undefined,
              googleId: gId,
              profilePhoto,
              acceptedTerms,
            },
            token,
          });
          return;
        }

        // If phone exists and not new user, route as usual
        if (userType === "client" || userType === "driver") {
          useAuthStore.getState().login(
            userType,
            {
              id: _id,
              name: userName,
              cidade: userCity,
              nome: userName,
              email: userEmail,
              telefone: phone,
              fotoPerfil: profilePhoto,
              googleId: gId,
              aceitouTermos: !!acceptedTerms,
            },
            token,
          );

          Toast.show({
            type: "success",
            text1: "Bem-vindo de volta!",
          });
        } else {
          const generatedPassword = `${userEmail}-${id}`;
          navigation.navigate("SelectProfile", {
            user: {
              _id,
              name: userName,
              email: userEmail,
              password: generatedPassword,
              phone: phone,
              city: userCity,
              userType: userType || undefined,
              googleId: gId,
              profilePhoto,
              acceptedTerms,
            },
            token,
          });
        }
      } else {
        Toast.show({
          type: "error",
          text1: "Erro na autenticação",
          text2: response.message || "Tente novamente",
        });
      }
    } catch (error: any) {
      console.error("[GoogleSignUp] Erro capturado no catch:", error);
      if (isErrorWithCode(error)) {
        console.log("[GoogleSignUp] Erro com código:", error.code);
        if (error.code === statusCodes.SIGN_IN_CANCELLED) {
            console.log("[GoogleSignUp] Login cancelado pelo usuário");
            return;
        }
      }
      Toast.show({ 
        type: "error", 
        text1: "Falha ao conectar com Google",
        text2: error?.message || "Erro interno da API do Google"
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  // 💼 Manual Signup Logic
  const onSubmit = async (data: SignUpFormValues) => {
    const sanitizedPhone = data.phone.replace(/\D/g, "");
    
    setLoading(true);
    try {
      // Wrap into structure required by downstream routing
      const userData = {
        _id: "",
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: sanitizedPhone,
        city: initialCity || detectedCity || undefined,
        userType: undefined,
        googleId: undefined,
        profilePhoto: undefined,
        acceptedTerms: true,
      };

      // Handover to verification routing
      navigation.navigate("PhoneVerification", {
        phone: sanitizedPhone,
        nextScreen: "SelectProfile",
        nextParams: {
          user: userData,
          token: "",
        },
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Erro", text2: "Tente novamente" });
    } finally {
      setLoading(false);
    }
  };

  // Handle conditional overlay first if needed.
  if (showPermissionScreen && hasCheckedPermission) {
    return (
      <LocationPermissionScreen
        onAllow={handleAllowLocation}
        onSkip={handleSkipLocation}
      />
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🌌 Cinematic Uniform Parallax Layers */}
      <LinearGradient
        colors={[colors.background.primary, '#060E18', '#040910']}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      <LinearGradient
        colors={['rgba(9, 26, 47, 0.3)', 'transparent', colors.background.primary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <AuthHeader />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing['2xl'] }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ⚡ Entering Staggered Header Block */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.welcomeBlock}
          >
            <Text style={styles.title}>Criar Conta</Text>
            <Text style={styles.subtitle}>Preencha seus dados para começar</Text>
          </MotiView>

          {/* 📋 Secure Form Stack */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 150 }}
            style={styles.formContainer}
          >
            <AuthInput
              control={control}
              name="phone"
              label="Telefone (WhatsApp)"
              placeholder="(11) 99999-9999"
              icon={Phone}
              keyboardType="phone-pad"
              error={errors.phone?.message}
            />

            <AuthInput
              control={control}
              name="name"
              label="Nome completo"
              placeholder="Como deseja ser chamado"
              icon={User}
              autoCapitalize="words"
              error={errors.name?.message}
            />

            <AuthInput
              control={control}
              name="email"
              label="Seu e-mail"
              placeholder="nome@email.com"
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />

            <AuthInput
              control={control}
              name="password"
              label="Crie uma senha"
              placeholder="Mínimo 6 caracteres"
              icon={Lock}
              secureTextEntry
              error={errors.password?.message}
            />
            {/* Strength meter logic integration */}
            {watchedPassword.length > 0 && (
              <View style={{ marginTop: -spacing.md, marginBottom: spacing.md }}>
                <PasswordStrengthIndicator password={watchedPassword} />
              </View>
            )}

            <AuthInput
              control={control}
              name="confirmPassword"
              label="Confirmar senha"
              placeholder="Digite a senha novamente"
              icon={Lock}
              secureTextEntry
              error={errors.confirmPassword?.message}
            />

            {/* 🚀 Primary Action Button */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary[500] }
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>Criar conta</Text>
              )}
            </TouchableOpacity>

            {/* 🔁 Helper Redirects */}
            <TouchableOpacity
              style={styles.forgotLink}
              onPress={() => navigation.navigate("ForgotPassword")}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotLinkText}>Esqueceu sua senha?</Text>
            </TouchableOpacity>

            {/* 🔗 Central Connector */}
            <View style={styles.dividerWrapper}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OU</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 📱 Shared Unified Social Action */}
            <SocialLoginButtons 
              onGooglePress={handleGoogleSignUp}
              isGoogleLoading={googleLoading}
            />
          </MotiView>

          {/* 🦶 Standard Footer Closure */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            style={styles.footerBox}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.footerRedirect}
            >
              <Text style={styles.footerMainText}>
                Já tem uma conta?{" "}
                <Text style={[styles.footerActionText, { color: colors.primary[500] }]}>Entrar</Text>
              </Text>
            </TouchableOpacity>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  welcomeBlock: {
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text.primary,
    letterSpacing: -0.5,
    fontWeight: '900',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    marginTop: 4,
  },
  formContainer: {
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  primaryButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
    fontWeight: '800',
  },
  forgotLink: {
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  forgotLinkText: {
    color: colors.primary[500],
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
  },
  dividerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerLabel: {
    marginHorizontal: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 12,
    color: colors.text.disabled,
    letterSpacing: 1,
  },
  footerBox: {
    marginTop: 'auto',
    paddingTop: spacing.xl,
    alignItems: 'center',
  },
  footerRedirect: {
    padding: spacing.sm,
  },
  footerMainText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
  },
  footerActionText: {
    fontFamily: fonts.bold,
    fontWeight: '800',
  },
});
