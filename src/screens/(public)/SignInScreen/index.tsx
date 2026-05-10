import React, { useState, useEffect, useRef } from "react";
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
import { MotiView, MotiText } from "moti";
import { Mail, Lock } from "lucide-react-native";

// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Core Logic & Services
import {
  login as loginService,
  googleAuth,
  checkEmailExists,
} from "../../../services/auth.service";
import { useAuthStore } from "../../../context/authStore";
import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";
import Toast from "react-native-toast-message";
import { CLIENTE_WEB_ID } from "@env";

// Official Theme & Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { AuthInput } from "../../../components/auth/AuthInput";
import { SocialLoginButtons } from "../../../components/auth/SocialLoginButtons";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";

// 🔐 Form Schema
const loginSchema = z.object({
  email: z.string().min(1, "O e-mail é obrigatório").email("Formato de e-mail inválido"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function SignInScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // 🔄 UI States
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const googleConfiguredRef = useRef(false);

  // 📝 Form Definition
  const { control, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    }
  });

  // 📥 Sync params & configuration hooks
  useEffect(() => {
    const paramEmail = route.params?.email;
    if (paramEmail && typeof paramEmail === "string") {
      setValue("email", paramEmail.trim().toLowerCase());
    }
  }, [route.params?.email]);

  useEffect(() => {
    if (googleConfiguredRef.current) return;
    googleConfiguredRef.current = true;

    GoogleSignin.configure({
      webClientId: CLIENTE_WEB_ID,
      profileImageSize: 150,
      offlineAccess: true,
    });
  }, []);

  // 💼 Handlers
  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();

      if (!isSuccessResponse(userInfo)) {
        Toast.show({ type: "error", text1: "Falha ao autenticar com Google" });
        return;
      }

      const { user } = userInfo.data;
      const { email, id, name, photo } = user;
      const normalizedEmail = email.trim().toLowerCase();

      // Verify user in backend
      const existsRes = await checkEmailExists(normalizedEmail);

      if (!existsRes.success) {
        Toast.show({
          type: "error",
          text1: "Erro ao verificar email",
          text2: existsRes.message || "Tente novamente.",
        });
        return;
      }

      if (existsRes.data?.exists && existsRes.data?.isActive === false) {
        Toast.show({
          type: "error",
          text1: "Conta desativada",
          text2: "Entre em contato com o suporte para reativar sua conta.",
        });
        return;
      }

      // If user doesn't exist, guide to profile selection
      if (!existsRes.data?.exists) {
        const generatedPassword = `${normalizedEmail}-${id}`;
        navigation.navigate("SelectProfile", {
          user: {
            _id: "",
            name: name || normalizedEmail.split("@")[0],
            email: normalizedEmail,
            password: generatedPassword,
            phone: "",
            city: "",
            userType: undefined,
            googleId: id,
            profilePhoto: photo || undefined,
            acceptedTerms: true,
          },
          token: "",
        });
        return;
      }

      // If user exists, finalize authentication
      const response = await googleAuth({
        googleId: id,
        email: normalizedEmail,
        name: name || normalizedEmail.split("@")[0],
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
          googleId: gId,
          acceptedTerms,
          city,
        } = userData;

        // 🚨 Force Phone Capture if missing (User Request: Google signup MUST force phone confirmation)
        if (!phone) {
          const generatedPassword = `${userEmail}-${id}`;
          navigation.navigate("GooglePhonePrompt", {
            user: {
              _id,
              name: userName,
              email: userEmail,
              password: generatedPassword,
              phone: "",
              city: city || "",
              userType: userType || undefined,
              googleId: gId,
              profilePhoto,
              acceptedTerms,
            },
            token,
          });
          return;
        }

        if (userType === "client" || userType === "driver") {
          useAuthStore.getState().login(
            userType,
            {
              id: _id,
              name: userName,
              cidade: city || "",
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
            text1: "Login com Google realizado com sucesso!",
            text2: `Bem-vindo, ${userName}!`,
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
              city: city || "",
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
          text1: "Erro ao autenticar com Google",
          text2: response.message || "Verifique sua conexão e tente novamente",
        });
      }
    } catch (error: any) {
      console.error("Erro no login com Google:", error);
      Toast.show({
        type: "error",
        text1: "Erro ao fazer login com Google",
        text2: error.message || "Verifique sua conexão.",
      });
    } finally {
      setGoogleLoading(false);
    }
  }

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    try {
      const response = await loginService({
        email: data.email.trim().toLowerCase(),
        password: data.password,
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

        useAuthStore.getState().login(
          userType,
          {
            id: _id,
            name: name,
            cidade: city || "",
            nome: name,
            email: userEmail,
            telefone: phone || "",
            fotoPerfil: profilePhoto,
            googleId: googleId,
            aceitouTermos: !!acceptedTerms,
          },
          token,
        );

        Toast.show({
          type: "success",
          text1: "Login realizado com sucesso!",
          text2: `Bem-vindo, ${name}!`,
        });
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
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🌌 Cinematic Background */}
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
        <AuthHeader showBackButton={false} />

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ⚡ Entrance Animated Title Block */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 100 }}
            style={styles.welcomeBlock}
          >
            <Text style={styles.title}>Bem-vindo</Text>
            <Text style={styles.subtitle}>Faça login para continuar explorando</Text>
          </MotiView>

          {/* 📋 Form Container */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 250 }}
            style={styles.formContainer}
          >
            <AuthInput
              control={control}
              name="email"
              label="Seu e-mail"
              placeholder="exemplo@email.com"
              icon={Mail}
              keyboardType="email-address"
              error={errors.email?.message}
            />

            <AuthInput
              control={control}
              name="password"
              label="Sua senha"
              placeholder="Mínimo de 6 caracteres"
              icon={Lock}
              secureTextEntry
              error={errors.password?.message}
            />

            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={() => navigation.navigate("ForgotPassword")}
              activeOpacity={0.7}
            >
              <Text style={styles.forgotText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* 🚀 Login Button */}
            <TouchableOpacity
              style={[
                styles.loginButton,
                { backgroundColor: colors.primary[500] }
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.loginButtonText}>Entrar</Text>
              )}
              <View style={styles.glow} />
            </TouchableOpacity>

            {/* 🔗 Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OU CONTINUE COM</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* 📱 Social Logins */}
            <SocialLoginButtons 
              onGooglePress={handleGoogleSignIn}
              isGoogleLoading={googleLoading}
            />
          </MotiView>

          {/* 🦶 Footer */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
            style={styles.footer}
          >
            <TouchableOpacity
              style={styles.footerLink}
              onPress={() => navigation.navigate("SignUp")}
              activeOpacity={0.7}
            >
              <Text style={styles.footerText}>
                Não tem uma conta?{" "}
                <Text style={styles.footerActionText}>Criar conta</Text>
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
    paddingTop: spacing.lg,
  },
  welcomeBlock: {
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 36,
    color: colors.text.primary,
    letterSpacing: -0.5,
    fontWeight: '800',
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    marginTop: 6,
  },
  formContainer: {
    width: '100%',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xl,
    marginTop: -spacing.sm, // bring closer to input
  },
  forgotText: {
    color: colors.text.tertiary,
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
  },
  loginButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  glow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[500],
    opacity: 0.1,
    borderRadius: borderRadius.xl,
  },
  loginButtonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: '#091A2F', // Dark contrast for high luminance green
    fontWeight: '700',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border.light,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontFamily: fonts.bold,
    fontSize: 10,
    color: colors.text.disabled,
    letterSpacing: 1.5,
  },
  footer: {
    marginTop: 'auto',
    paddingTop: spacing['2xl'],
    alignItems: 'center',
  },
  footerLink: {
    padding: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
  },
  footerActionText: {
    fontFamily: fonts.bold,
    color: colors.primary[500],
    fontWeight: '700',
  }
});
