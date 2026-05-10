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

// 🔧 Core Services
import { sendPhoneVerification, verifyPhoneCode } from "../../../services/auth.service";

// 🎨 Unified System & Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { OTPIllustration } from "../../../components/auth/OTPIllustration";
import { OTPInput } from "../../../components/auth/OTPInput";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";

export default function PhoneVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Parameters Extraction (Preserved Logic)
  const phone = route.params?.phone || "";
  const nextScreen = route.params?.nextScreen || "SelectProfile";
  const nextParams = route.params?.nextParams || {};

  // State Hooks
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [hasSentInitialCode, setHasSentInitialCode] = useState(false);

  // Effect: Safeguard missing phone reference
  useEffect(() => {
    if (!phone) {
      Toast.show({
        type: "error",
        text1: "Telefone não encontrado",
        text2: "Volte e informe seu telefone para continuar",
      });
      navigation.goBack();
    }
  }, [navigation, phone]);

  // Effect: Automatic trigger upon screen entry (Preserved Logic)
  useEffect(() => {
    if (!phone || hasSentInitialCode) return;

    async function sendInitialCode() {
      setSending(true);
      try {
        const response = await sendPhoneVerification(phone);
        if (response.success) {
          setCountdown(60);
          setHasSentInitialCode(true);
          Toast.show({
            type: "success",
            text1: "Código enviado",
            text2: "Confira seu SMS para continuar",
          });
          return;
        }
        Toast.show({
          type: "error",
          text1: "Falha ao enviar código",
          text2: response.message || "Tente novamente",
        });
      } catch (e: any) {
        Toast.show({
          type: "error",
          text1: "Erro ao enviar código",
          text2: e?.message || "Tente novamente",
        });
      } finally {
        setSending(false);
      }
    }

    sendInitialCode();
  }, [phone, hasSentInitialCode]);

  // Timer Handler
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Handlers
  async function handleResend() {
    if (!phone || countdown > 0 || sending) return;
    setSending(true);
    try {
      const response = await sendPhoneVerification(phone);
      if (!response.success) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: response.message || "Não foi possível reenviar",
        });
        return;
      }
      setCountdown(60);
      Toast.show({ type: "success", text1: "Código reenviado" });
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setSending(false);
    }
  }

  async function handleVerify() {
    if (code.length < 6) {
      Toast.show({ type: "error", text1: "Código incompleto", text2: "Preencha todos os dígitos" });
      return;
    }

    setLoading(true);
    try {
      const resp = await verifyPhoneCode(phone, code);
      if (resp.success) {
        Toast.show({ type: "success", text1: "Telefone verificado!" });
        // Execute predefined handover callback routing
        navigation.navigate(nextScreen, nextParams);
      } else {
        Toast.show({ type: "error", text1: "Código inválido", text2: resp.message || "Verifique e tente novamente" });
      }
    } catch (e: any) {
      Toast.show({ type: "error", text1: "Erro", text2: e?.message || "Tente novamente" });
    } finally {
      setLoading(false);
    }
  }

  // Phone mask helper
  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  const formattedPhone = normalizedPhone.length === 11
    ? normalizedPhone.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3")
    : normalizedPhone.length === 10
      ? normalizedPhone.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3")
      : phone;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      {/* 🌌 Parallax Visual Foundation */}
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
            { paddingBottom: insets.bottom + spacing.xl }
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 🎨 Central Illustration */}
          <OTPIllustration />

          {/* ⚡ Text Block with Staggered Entry */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500 }}
            style={styles.headingBlock}
          >
            <Text style={styles.title}>Verifique seu número</Text>
            <Text style={styles.subtitle}>
              Enviamos um código de confirmação para o número
            </Text>
            <Text 
              style={[styles.phoneText, { color: colors.primary[500] }]}
            >
              {formattedPhone}
            </Text>
          </MotiView>

          {/* ⌨️ Dynamic Field Entry */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            style={styles.interactionContainer}
          >
            <OTPInput value={code} onChange={setCode} />

            {/* 🚀 Confirm Trigger */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: colors.primary[500] },
                code.length < 6 && { opacity: 0.6 }
              ]}
              onPress={handleVerify}
              disabled={loading || code.length < 6}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.buttonText}>Verificar</Text>
              )}
            </TouchableOpacity>

            {/* 🔁 Conditional Resend/Timer Handler */}
            <View style={styles.resendContainer}>
              {countdown > 0 ? (
                <MotiText
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={styles.timerText}
                >
                  Reenviar em <Text style={{ color: colors.primary[500], fontWeight: '700' }}>{countdown}s</Text>
                </MotiText>
              ) : (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={sending}
                  activeOpacity={0.7}
                  style={styles.resendLink}
                >
                  <Text style={styles.resendLabel}>Não recebeu? </Text>
                  <Text style={[styles.resendAction, { color: colors.primary[500] }]}>
                    {sending ? 'Solicitando...' : 'Reenviar código'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
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
  headingBlock: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  title: {
    fontFamily: fonts.bold,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: colors.text.tertiary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: '80%',
  },
  phoneText: {
    fontFamily: fonts.semibold,
    fontSize: 16,
    marginTop: 6,
  },
  interactionContainer: {
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginBottom: spacing.xl,
  },
  buttonText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
    fontWeight: '800',
  },
  resendContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  timerText: {
    fontFamily: fonts.medium,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  resendLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  resendLabel: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  resendAction: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    fontWeight: '700',
  },
});
