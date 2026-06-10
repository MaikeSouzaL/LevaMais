import React, { useState } from "react";
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
import {
  signInWithGoogle,
  getProfile,
} from "../../../services/supabase-auth.service";
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

export default function SignUpScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Params Handover
  const routeParams = (route.params || {}) as { phone?: string };
  const initialPhone = routeParams.phone || "";

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

  // 💼 Google Signup via Supabase
  async function handleGoogleSignUp() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      try { await GoogleSignin.signOut(); } catch (e) {}

      const userInfo = await GoogleSignin.signIn();
      if (!isSuccessResponse(userInfo)) {
        Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
        return;
      }

      const idToken = userInfo.data.idToken;
      if (!idToken) {
        Toast.show({ type: "error", text1: "Token Google inválido. Tente novamente." });
        return;
      }

      const { session, user } = await signInWithGoogle(idToken);
      if (!session || !user) {
        Toast.show({ type: "error", text1: "Erro ao autenticar com Google" });
        return;
      }

      const profile = await getProfile(user.id);

      if (!profile?.role) {
        const googleUserData = {
          _id: user.id,
          name: profile?.full_name || user.user_metadata?.full_name || "",
          email: user.email || "",
          phone: profile?.phone || "",
          city: profile?.city || "",
          acceptedTerms: false,
        };
        navigation.navigate("PhoneVerification", {
          phone: profile?.phone || "",
          askForPhone: !profile?.phone,
          nextScreen: "PhoneLocationSetup",
          nextParams: { user: googleUserData, token: session.access_token },
        });
        return;
      }

      useAuthStore.getState().login(
        profile.role as "client" | "driver",
        {
          id: user.id,
          name: profile.full_name || "",
          nome: profile.full_name || "",
          email: user.email || "",
          telefone: profile.phone || "",
          cidade: profile.city || "",
          fotoPerfil: profile.avatar_url || undefined,
          aceitouTermos: profile.accepted_terms,
        },
        session.access_token,
      );

      Toast.show({ type: "success", text1: "Bem-vindo de volta!" });
    } catch (error: any) {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) return;
      Toast.show({
        type: "error",
        text1: "Falha ao conectar com Google",
        text2: error?.message || "Erro interno",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  // 💼 Manual Signup — coleta dados e encaminha para verificação de telefone
  const onSubmit = async (data: SignUpFormValues) => {
    const sanitizedPhone = data.phone.replace(/\D/g, "");

    setLoading(true);
    try {
      const userData = {
        _id: "",
        name: data.name,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        phone: sanitizedPhone,
        city: undefined as string | undefined,
        userType: undefined as string | undefined,
        googleId: undefined as string | undefined,
        profilePhoto: undefined as string | undefined,
        acceptedTerms: false,
      };

      navigation.navigate("PhoneVerification", {
        phone: sanitizedPhone,
        nextScreen: "PhoneLocationSetup",
        nextParams: { user: userData, token: "" },
      });
    } catch (error: any) {
      Toast.show({ type: "error", text1: "Erro", text2: "Tente novamente" });
    } finally {
      setLoading(false);
    }
  };

  // Handle conditional overlay first if needed.

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
