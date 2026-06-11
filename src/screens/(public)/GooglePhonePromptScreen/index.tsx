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
import { Phone, ShieldCheck } from "lucide-react-native";
import Toast from "react-native-toast-message";

// React Hook Form + Zod
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Services
import { sendPhoneVerification } from "../../../services/auth.service";

// UI System
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

import { AuthHeader } from "../../../components/auth/AuthHeader";
import { AuthInput } from "../../../components/auth/AuthInput";
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { Particles } from "../../../components/visuals/Particles";
import { PhoneAlreadyRegisteredModal } from "../../../components/auth/PhoneAlreadyRegisteredModal";

const schema = z.object({
  phone: z.string().min(14, "Informe um celular válido com DDD"),
});

type FormData = z.infer<typeof schema>;

export default function GooglePhonePromptScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [showRegisteredModal, setShowRegisteredModal] = useState(false);

  // Retrieve passed-through google payload context
  const { user, token } = (route.params || {}) as { user: any; token: string };

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "",
    },
  });

  // Formatter to mirror other screens masks
  const currentPhone = watch("phone");
  const formatPhone = (text: string) => {
    const cleaned = text.replace(/\D/g, "");
    if (cleaned.length <= 11) {
      return cleaned
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2")
        .substring(0, 15);
    }
    return text.substring(0, 15);
  };

  const onSubmit = async (data: FormData) => {
    const rawPhone = data.phone.replace(/\D/g, "");
    
    setLoading(true);
    try {
      // 1. Enviar userId junto para o backend vincular o código ao usuário
      const userId = user?._id || undefined;
      const response = await sendPhoneVerification(rawPhone, userId);
      
      if (response.success) {
        Toast.show({
          type: "success",
          text1: "Código enviado!",
          text2: "Verifique seu celular para confirmar",
        });

        // 2. Navigate to OTP validation screen carrying the payload
        // Pass user object downstream updating the phone number field
        const updatedUser = { ...user, phone: rawPhone };

        navigation.navigate("PhoneVerification", {
          phone: rawPhone,
          codeSent: true,
          nextScreen: "PhoneLocationSetup",
          nextParams: {
            user: updatedUser,
            token: token,
          },
        });
      } else {
        if (response.message && (response.message.includes("já cadastrado") || response.message.includes("ja cadastrado"))) {
          setShowRegisteredModal(true);
        } else {
          Toast.show({
            type: "error",
            text1: "Falha ao enviar SMS",
            text2: response.message || "Tente novamente",
          });
        }
      }
    } catch (error: any) {
            Toast.show({
        type: "error",
        text1: "Erro de conexão",
        text2: "Falha ao requisitar código, verifique sua internet",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#040910"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <AuthHeader showBackButton={true} />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600 }}
            style={styles.headerArea}
          >
            <Text style={styles.title}>Só mais um passo!</Text>
            <Text style={styles.subtitle}>
              Para finalizar sua conta Google, precisamos confirmar seu número de celular.
            </Text>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 150 }}
            style={styles.formBody}
          >
            <AuthInput
              control={control}
              name="phone"
              label="Celular"
              placeholder="(00) 00000-0000"
              icon={Phone}
              keyboardType="phone-pad"
              error={errors.phone?.message}
              onChangeText={(val) => setValue("phone", formatPhone(val))}
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
                <Text style={styles.btnText}>Enviar Código</Text>
              )}
            </TouchableOpacity>

            {/* 🛡️ Transparency & Safety Info */}
            <MotiView
              from={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 600, delay: 300 }}
              className="mt-10 p-5 bg-white/5 rounded-3xl border border-white/10"
            >
               <View className="flex-row items-center gap-3 mb-2">
                  <View className="bg-[#02de95]/20 p-2 rounded-xl">
                     <ShieldCheck size={18} color="#02de95" />
                  </View>
                  <Text className="text-white font-bold text-sm">Privacidade Garantida</Text>
               </View>
               <Text className="text-white/60 text-xs leading-5">
                 Seu número é essencial para garantir a segurança da plataforma. Ele permite validar sua conta, prevenir acessos não autorizados e facilitar a comunicação segura entre passageiro e motorista.
               </Text>
            </MotiView>
          </MotiView>
        </ScrollView>
      </KeyboardAvoidingView>

      <PhoneAlreadyRegisteredModal
        visible={showRegisteredModal}
        phone={currentPhone}
        onClose={() => setShowRegisteredModal(false)}
        onLogin={() => {
          setShowRegisteredModal(false);
          navigation.navigate("SignIn");
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    justifyContent: "center",
  },
  headerArea: {
    marginBottom: spacing.xl,
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
  formBody: {
    width: "100%",
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.lg,
    elevation: 6,
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  btnText: {
    fontFamily: fonts.bold,
    fontSize: fontSize.lg,
    color: colors.background.primary,
    fontWeight: "800",
  },
});
