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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Mail } from "lucide-react-native";
import Toast from "react-native-toast-message";

// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Core & Services
import { requestPasswordReset } from "../../../services/auth.service";

// UI Constants & Unified Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { AuthInput } from "../../../components/auth/AuthInput";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";

const forgotPasswordSchema = z.object({
  email: z.string().min(1, "E-mail obrigatório").email("Formato de e-mail inválido"),
});

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, formState: { errors } } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: ForgotFormValues) => {
    setLoading(true);
    try {
      const emailClean = data.email.trim().toLowerCase();
      const response = await requestPasswordReset({
        email: emailClean,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Código enviado!",
          text2: "Verifique seu e-mail para o código de verificação",
        });

        navigation.navigate("VerifyCode", {
          email: emailClean,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao enviar código",
          text2: response.message || "Verifique seu e-mail e tente novamente",
        });
      }
    } catch (error: any) {
            Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Verifique sua conexão e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌌 Base Cinematic Elements */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#040910"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      <LinearGradient
        colors={["rgba(9, 26, 47, 0.2)", "transparent", colors.background.primary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Standard Header with functional Back Button */}
        <AuthHeader showBackButton={true} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Animation Stagger block 1 - Headers */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.headerBlock}
          >
            <Text style={styles.title}>Esqueceu a senha?</Text>
            <Text style={styles.subtitle}>
              Digite seu e-mail e enviaremos um código de verificação para você criar uma nova senha
            </Text>
          </MotiView>

          {/* Animation Stagger block 2 - Form inputs */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 150 }}
            style={styles.formContainer}
          >
            <AuthInput
              control={control}
              name="email"
              label="Seu e-mail"
              placeholder="Digite seu e-mail"
              icon={Mail}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
            />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary[500] },
              ]}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>Enviar código</Text>
              )}
            </TouchableOpacity>
          </MotiView>

          {/* Animation Stagger block 3 - Footer */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 600, delay: 300 }}
            style={styles.footerBlock}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.footerLink}
            >
              <Text style={styles.footerText}>
                Lembrou sua senha?{" "}
                <Text style={[styles.footerAction, { color: colors.primary[500] }]}>
                  Entrar
                </Text>
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
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    justifyContent: "center", // Centralizar o conteúdo na tela de recuperação
  },
  headerBlock: {
    marginBottom: spacing["2xl"],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 32,
    color: colors.text.primary,
    letterSpacing: -0.5,
    fontWeight: "900",
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    lineHeight: 22,
  },
  formContainer: {
    width: "100%",
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
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
    fontWeight: "800",
  },
  footerBlock: {
    marginTop: spacing["3xl"],
    alignItems: "center",
  },
  footerLink: {
    padding: spacing.sm,
  },
  footerText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
  },
  footerAction: {
    fontFamily: fonts.bold,
    fontWeight: "800",
  },
});
