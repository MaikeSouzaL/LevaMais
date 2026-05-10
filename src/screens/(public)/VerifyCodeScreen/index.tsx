import React, { useState, useEffect } from "react";
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
import Toast from "react-native-toast-message";

// Core Services
import {
  requestPasswordReset,
  verifyResetCode,
} from "../../../services/auth.service";

// Unified System & Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { OTPIllustration } from "../../../components/auth/OTPIllustration";
import { OTPInput } from "../../../components/auth/OTPInput";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";

export default function VerifyCodeScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Extract Email Param
  const { email } = (route.params || {}) as { email: string };

  // State Hooks
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Verify Parameter Presence on Start
  useEffect(() => {
    if (!email) {
      Toast.show({
        type: "error",
        text1: "E-mail ausente",
        text2: "Volte e informe o e-mail novamente",
      });
      navigation.goBack();
    }
  }, [email, navigation]);

  // Timer Handler Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => Math.max(0, prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Action: Verify Reset Code
  async function handleVerifyCode() {
    if (code.length < 6) {
      Toast.show({
        type: "error",
        text1: "Código incompleto",
        text2: "Preencha todos os 6 dígitos do código",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await verifyResetCode({
        email,
        code,
      });

      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Código verificado!",
          text2: "Crie sua nova senha agora",
        });

        navigation.navigate("NewPassword", {
          email,
          code,
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Código inválido",
          text2: response.message || "Verifique o código e tente novamente",
        });
      }
    } catch (error: any) {
      console.error("Erro ao verificar código:", error);
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Falha de conexão, tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  // Action: Resend Code
  async function handleResendCode() {
    if (resendLoading || resendCountdown > 0) return;

    setResendLoading(true);
    try {
      const response = await requestPasswordReset({
        email: email.trim().toLowerCase(),
      });

      if (response.success) {
        setResendCountdown(60);
        Toast.show({
          type: "success",
          text1: "Código reenviado!",
          text2: "Verifique sua caixa de entrada",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Erro ao reenviar",
          text2: response.message || "Tente novamente em breve",
        });
      }
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Erro ao reenviar",
        text2: "Tente novamente em alguns instantes",
      });
    } finally {
      setResendLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌌 Base Cinematic Visual Stack */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#040910"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      <LinearGradient
        colors={["rgba(9, 26, 47, 0.3)", "transparent", colors.background.primary]}
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
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Premium Illustration */}
          <OTPIllustration />

          {/* Text block entering first */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.textBlock}
          >
            <Text style={styles.title}>Verificar Código</Text>
            <Text style={styles.subtitle}>
              Digite o código de 6 dígitos que enviamos para o e-mail:
            </Text>
            <Text style={[styles.targetText, { color: colors.primary[500] }]}>
              {email}
            </Text>
          </MotiView>

          {/* Interactivity container entering second */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
            style={styles.actionBlock}
          >
            {/* Advanced Native OTP Input */}
            <OTPInput value={code} onChange={setCode} />

            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary[500] },
                code.length < 6 && { opacity: 0.6 },
              ]}
              onPress={handleVerifyCode}
              disabled={loading || code.length < 6}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color={colors.background.primary} />
              ) : (
                <Text style={styles.primaryButtonText}>Verificar código</Text>
              )}
            </TouchableOpacity>

            {/* Dynamic Resend Handler */}
            <View style={styles.resendBox}>
              {resendCountdown > 0 ? (
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.timerLabel}
                >
                  Reenviar em <Text style={{ color: colors.primary[500], fontWeight: "700" }}>{resendCountdown}s</Text>
                </MotiText>
              ) : (
                <TouchableOpacity
                  onPress={handleResendCode}
                  disabled={resendLoading}
                  activeOpacity={0.7}
                  style={styles.resendLink}
                >
                  <Text style={styles.resendLabel}>Não recebeu? </Text>
                  <Text style={[styles.resendCall, { color: colors.primary[500] }]}>
                    {resendLoading ? "Aguarde..." : "Reenviar"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </MotiView>

          {/* Footer Redirect */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500, delay: 400 }}
            style={styles.footerWrapper}
          >
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.footerLink}
            >
              <Text style={styles.footerLabel}>
                Voltar para{" "}
                <Text style={[styles.footerHighlight, { color: colors.primary[500] }]}>
                  Esqueci a senha
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
  },
  textBlock: {
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: "85%",
  },
  targetText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    marginTop: 6,
    textAlign: "center",
  },
  actionBlock: {
    width: "100%",
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
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
  resendBox: {
    alignItems: "center",
    justifyContent: "center",
  },
  timerLabel: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  resendLink: {
    flexDirection: "row",
    alignItems: "center",
  },
  resendLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  resendCall: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    fontWeight: "700",
  },
  footerWrapper: {
    marginTop: "auto",
    paddingTop: spacing["2xl"],
    alignItems: "center",
  },
  footerLink: {
    padding: spacing.sm,
  },
  footerLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
  },
  footerHighlight: {
    fontFamily: fonts.bold,
    fontWeight: "800",
  },
});
