import React, { useState, useEffect } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  PermissionsAndroid,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView, MotiText } from "moti";
import { ShieldCheck, MessageSquare, Info } from "lucide-react-native";
import Toast from "react-native-toast-message";

import { updateMyProfile } from "../../../services/appwrite-auth.service";

// 🎨 Unified System & Components
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { OTPIllustration } from "../../../components/auth/OTPIllustration";
import { OTPInput } from "../../../components/auth/OTPInput";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";
import { PhoneAlreadyRegisteredModal } from "../../../components/auth/PhoneAlreadyRegisteredModal";

export default function PhoneVerificationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Parameters Extraction (Preserved Logic)
  const phone = route.params?.phone || "";
  const nextScreen = route.params?.nextScreen || "SelectProfile";
  const nextParams = route.params?.nextParams || {};
  const codeSent = route.params?.codeSent || false;
  const askForPhone = route.params?.askForPhone || false;

  // State Hooks
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [countdown, setCountdown] = useState(codeSent ? 60 : 0);
  const [hasSentInitialCode, setHasSentInitialCode] = useState(codeSent);
  const [showRegisteredModal, setShowRegisteredModal] = useState(false);
  const [enteredPhone, setEnteredPhone] = useState(phone || "");
  const [phoneConfirmed, setPhoneConfirmed] = useState(!!phone);

  // Effect: Safeguard missing phone reference
  useEffect(() => {
    if (!phone && !askForPhone) {
      Toast.show({
        type: "error",
        text1: "Telefone não encontrado",
        text2: "Volte e informe seu telefone para continuar",
      });
      navigation.goBack();
    }
  }, [navigation, phone, askForPhone]);

  // Simula envio de código quando telefone já vem preenchido
  useEffect(() => {
    if (!phone || hasSentInitialCode || askForPhone) return;
    setCountdown(60);
    setHasSentInitialCode(true);
    Toast.show({
      type: "success",
      text1: "Código enviado",
      text2: "Digite qualquer código de 4 dígitos para continuar",
    });
  }, [phone, hasSentInitialCode, askForPhone]);

  // Effect: Request SMS Permission (Android Only)
  useEffect(() => {
    if (Platform.OS === "android") {
      requestSMSPermission();
    }
  }, []);

  async function requestSMSPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
        {
          title: "Permissão de SMS",
          message:
            "O Leva+ precisa de acesso aos seus SMS para detectar o código de verificação automaticamente.",
          buttonNeutral: "Perguntar Depois",
          buttonNegative: "Cancelar",
          buttonPositive: "OK",
        }
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        console.log("SMS Permission Granted");
      } else {
        console.log("SMS Permission Denied");
      }
    } catch (err) {
      console.warn(err);
    }
  }

  // Timer Handler
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  // Confirma telefone digitado (modo askForPhone)
  function handlePhoneConfirm() {
    const cleaned = enteredPhone.replace(/\D/g, "");
    if (cleaned.length < 10) {
      Toast.show({ type: "error", text1: "Número inválido", text2: "Informe o telefone com DDD" });
      return;
    }
    setPhoneConfirmed(true);
    setCountdown(60);
    setHasSentInitialCode(true);
    Toast.show({ type: "success", text1: "Código enviado", text2: "Digite qualquer código de 4 dígitos para continuar" });
  }

  // Handlers
  function handleResend() {
    if (countdown > 0 || sending) return;
    setCountdown(60);
    Toast.show({ type: "success", text1: "Código reenviado" });
  }

  async function handleVerify() {
    if (code.length < 4) {
      Toast.show({ type: "error", text1: "Código incompleto", text2: "Preencha todos os dígitos" });
      return;
    }
    setLoading(true);
    try {
      const finalPhone = enteredPhone.replace(/\D/g, "") || phone;
      const userId = nextParams?.user?._id;

      // Salva o telefone no Supabase imediatamente (apenas para usuários já autenticados,
      // ex: fluxo Google. No cadastro manual a conta ainda não existe — será criada no SelectProfile).
      if (finalPhone && userId && userId.length > 10) {
        try {
          await updateMyProfile({ phone: finalPhone });
        } catch (e) {
          console.log("[PhoneVerification] falha ao salvar telefone:", e);
        }
      }

      const resolvedParams = finalPhone
        ? { ...nextParams, user: { ...(nextParams.user || {}), phone: finalPhone } }
        : nextParams;

      Toast.show({ type: "success", text1: "Telefone verificado!" });
      navigation.navigate(nextScreen, resolvedParams);
    } finally {
      setLoading(false);
    }
  }

  // Phone mask helper
  const normalizedPhone = String(enteredPhone || phone || "").replace(/\D/g, "");
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

          {/* Coleta de telefone (modo Google / sem phone pré-preenchido) */}
          {askForPhone && !phoneConfirmed ? (
            <MotiView
              from={{ opacity: 0, translateY: 15 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.headingBlock}
            >
              <Text style={styles.title}>Informe seu telefone</Text>
              <Text style={styles.subtitle}>
                Vamos enviar um código de verificação para seu número
              </Text>
              <TextInput
                style={styles.phoneInput}
                value={enteredPhone}
                onChangeText={setEnteredPhone}
                placeholder="(11) 99999-9999"
                placeholderTextColor={colors.text.disabled}
                keyboardType="phone-pad"
                maxLength={15}
                autoFocus
              />
              <TouchableOpacity
                style={[styles.primaryButton, { backgroundColor: colors.primary[500], marginTop: 8 }]}
                onPress={handlePhoneConfirm}
                activeOpacity={0.85}
              >
                <Text style={styles.buttonText}>Continuar</Text>
              </TouchableOpacity>
            </MotiView>
          ) : (
          <>
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
            <OTPInput value={code} onChange={setCode} cellCount={4} />

             {/* 🤖 Automatic Retrieval Hint & Info */}
             <MotiView 
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1000 }}
                className="flex-row items-center justify-center mb-4 gap-2"
             >
                <ActivityIndicator size="small" color={colors.primary[500]} style={{ transform: [{ scale: 0.6 }] }} />
                <Text className="text-white/40 text-[10px] font-medium tracking-widest uppercase">
                  Detectando SMS automaticamente...
                </Text>
             </MotiView>

             <MotiView 
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: 600, delay: 500 }}
                className="mb-8 p-4 bg-white/5 rounded-2xl border border-white/10"
             >
                <View className="flex-row items-center gap-3 mb-2">
                   <View style={{ backgroundColor: colors.primary[500] + '20' }} className="p-2 rounded-lg">
                      <MessageSquare size={16} color={colors.primary[500]} />
                   </View>
                   <Text className="text-white font-bold text-xs">Agilidade no Cadastro</Text>
                </View>
                <Text className="text-white/50 text-[11px] leading-4">
                  O sistema tentará capturar o código do SMS automaticamente para facilitar seu acesso. Caso não ocorra, você pode digitar os 4 dígitos manualmente.
                </Text>
             </MotiView>

            {/* 🚀 Confirm Trigger */}
            <TouchableOpacity
              style={[
                styles.primaryButton,
                code.length < 4 || loading
                  ? { backgroundColor: colors.background.secondary, opacity: 0.7 }
                  : { backgroundColor: colors.primary[500] }
              ]}
              onPress={handleVerify}
              disabled={loading || code.length < 4}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={[
                  styles.buttonText,
                  (code.length < 4 || loading) && { color: colors.text.tertiary }
                ]}>Verificar</Text>
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

          {/* 🛡️ Transparency & Safety Info */}
          <MotiView
            from={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 600, delay: 400 }}
            className="mt-12 p-5 bg-white/5 rounded-3xl border border-white/10"
          >
             <View className="flex-row items-center gap-3 mb-2">
                <View className="bg-[#02de95]/20 p-2 rounded-xl">
                   <ShieldCheck size={18} color="#02de95" />
                </View>
                <Text className="text-white font-bold text-sm">Sua Segurança é Prioridade</Text>
             </View>
             <Text className="text-white/60 text-xs leading-5">
               Solicitamos seu telefone para validar sua conta e garantir a integridade do sistema. Isso evita fraudes e assegura que todos os usuários do Leva+ sejam reais e verificados. Seus dados são protegidos por criptografia de ponta e nunca serão compartilhados para fins comerciais.
             </Text>
          </MotiView>
          </>
          )}
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
  phoneInput: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.light,
    backgroundColor: colors.background.secondary,
    color: colors.text.primary,
    fontSize: fontSize.lg,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
    fontFamily: fonts.regular,
  },
});
