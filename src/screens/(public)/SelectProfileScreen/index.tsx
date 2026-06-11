import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Car, Briefcase } from "lucide-react-native";
import Toast from "react-native-toast-message";

// API & State Hooks
import { useAuthStore } from "../../../context/authStore";
import {
  signUpWithEmail,
  updateProfile,
  updateMyProfile,
  createDriverDetails,
  getProfile,
} from "../../../services/appwrite-auth.service";
import { account } from "../../../lib/appwrite";

// UI Tokens
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing } from "../../../theme/dimensions";

// Shared Assets/Components
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";

// Modular High-Performance Components (Architected for Clean Architecture)
import { ModeHeader } from "../../../components/select-mode/ModeHeader";
import { ModeSelectionCard } from "../../../components/select-mode/ModeSelectionCard";
import { ModeFooter } from "../../../components/select-mode/ModeFooter";

type ProfileType = "client" | "driver";

interface SelectProfileParams {
  supabaseUserId?: string; // presente quando usuário já autenticou (Google)
  user: {
    _id?: string;
    name: string;
    email: string;
    password?: string;
    phone?: string;
    city?: string;
    userType?: string;
    googleId?: string;
    profilePhoto?: string;
    acceptedTerms: boolean;
  };
  token?: string;
}

export default function SelectProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { supabaseUserId, user, token: initialToken } = (route.params || {}) as SelectProfileParams;
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuthStore();

  async function handleProceed() {
    if (!user || !selectedProfile) return;

    const choice = selectedProfile;
    setLoading(true);

    try {
      // Scenario A: já autenticado via Google ou login prévio.
      // Verifica a sessão real do Appwrite — se existir, é cenário A (update),
      // caso contrário cai no cadastro manual (cenário B).
      const sessionUser = await account.get().catch(() => null);

      if (sessionUser) {
        const existingId = sessionUser.$id;

        await updateMyProfile({
          role: choice,
          phone: user.phone,
        });

        if (choice === "driver") {
          await createDriverDetails(existingId).catch(() => {}); // ignora se já existe
        }

        login(
          choice,
          {
            id: existingId,
            name: user.name,
            nome: user.name,
            email: user.email,
            telefone: user.phone || "",
            cidade: user.city || "",
            fotoPerfil: user.profilePhoto,
            aceitouTermos: false,
            driverStatus: choice === "driver" ? "pending" : undefined,
          },
          initialToken || "",
        );

        Toast.show({
          type: "success",
          text1: "Acesso liberado!",
          text2: `Bem-vindo ao Leva Mais, ${user.name}!`,
        });
        return;
      }

      // Scenario B: cadastro manual — cria conta no Appwrite
      const { session, user: awUser } = await signUpWithEmail(
        user.email,
        user.password || "",
        user.name,
        user.phone,
      );

      if (!session || !awUser) {
        Toast.show({
          type: "error",
          text1: "Erro ao criar conta",
          text2: "Verifique seu e-mail e tente novamente",
        });
        return;
      }

      await updateProfile(awUser.$id, {
        role: choice,
        phone: user.phone,
      });

      if (choice === "driver") {
        await createDriverDetails(awUser.$id).catch(() => {});
      }

      login(
        choice,
        {
          id: awUser.$id,
          name: user.name,
          nome: user.name,
          email: user.email,
          telefone: user.phone || "",
          cidade: user.city || "",
          aceitouTermos: false,
          driverStatus: choice === "driver" ? "pending" : undefined,
        },
        session.secret,
      );

      Toast.show({
        type: "success",
        text1: "Conta criada!",
        text2: choice === "driver" ? "Bem-vindo, parceiro!" : "Seja bem-vindo!",
      });
    } catch (error: any) {
      Toast.show({
        type: "error",
        text1: "Falha ao finalizar cadastro",
        text2: error.message || "Verifique sua internet e tente novamente",
      });
    } finally {
      setLoading(false);
    }
  }

  // Dynamic button label logic based on runtime user interaction state
  const currentLabel = !selectedProfile 
    ? "Escolha seu modo" 
    : selectedProfile === "driver" 
      ? "Quero trabalhar" 
      : "Acessar como cliente";
  // Determine ambient glow colors based on selected mode
  const glowColor = selectedProfile === "client" 
    ? "#02de95" 
    : selectedProfile === "driver" 
      ? "#00F3FF" 
      : "#091A2F";

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🎬 Depth Stacking (No moving particles, clean cinematic map as ordered previously) */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#03080E"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />

      {/* Dynamic Ambient Glow Sphere 1 (Top Left) */}
      <MotiView
        animate={{
          backgroundColor: glowColor,
          opacity: selectedProfile ? 0.15 : 0.05,
        }}
        transition={{ type: "timing", duration: 500 }}
        style={[styles.ambientGlow, styles.glowTopLeft]}
      />

      {/* Dynamic Ambient Glow Sphere 2 (Bottom Right) */}
      <MotiView
        animate={{
          backgroundColor: glowColor,
          opacity: selectedProfile ? 0.18 : 0.05,
        }}
        transition={{ type: "timing", duration: 500 }}
        style={[styles.ambientGlow, styles.glowBottomRight]}
      />

      <LinearGradient
        colors={["rgba(9, 26, 47, 0.35)", "transparent", colors.background.primary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 🛡️ Componentized Header */}
      <ModeHeader />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingBottom: insets.bottom + spacing.lg }
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Animated Text Header */}
        <MotiView
          from={{ opacity: 0, translateY: -15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.textHeader}
        >
          <Text style={styles.mainHeading}>Como deseja usar o Leva+?</Text>
          <Text style={styles.subHeading}>Escolha como deseja acessar o ecossistema Leva+.</Text>
        </MotiView>

        {/* 💠 Modular Selection Section */}
        <View style={styles.selectionZone}>
          <ModeSelectionCard
            isSelected={selectedProfile === "client"}
            onSelect={() => setSelectedProfile("client")}
            title="Pedir corridas e entregas"
            description="Solicite corridas, acompanhe entregas e negocie preços em tempo real."
            Icon={Car}
            accentColor={colors.primary[500]}
            iconBgColor="rgba(2, 222, 149, 0.1)"
          />
          <ModeSelectionCard
            isSelected={selectedProfile === "driver"}
            onSelect={() => setSelectedProfile("driver")}
            title="Trabalhar no Leva+"
            description="Faça corridas, entregas e aumente seus ganhos utilizando o Leva+."
            Icon={Briefcase}
            accentColor="#00F3FF"
            iconBgColor="rgba(0, 243, 255, 0.1)"
          />
        </View>

        {/* 🚀 Modularized Action Footer */}
        <ModeFooter 
          isEnabled={!!selectedProfile && !loading}
          onPress={handleProceed}
          buttonLabel={loading ? "Acessando..." : currentLabel}
          selectedProfile={selectedProfile}
        />

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    justifyContent: "space-between",
  },
  textHeader: {
    alignItems: "center",
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  mainHeading: {
    fontFamily: fonts.black,
    fontSize: 28,
    fontWeight: "900",
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  subHeading: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "85%",
    lineHeight: 22,
  },
  selectionZone: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  ambientGlow: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    pointerEvents: "none",
  },
  glowTopLeft: {
    top: -50,
    left: -80,
  },
  glowBottomRight: {
    bottom: 50,
    right: -100,
  },

});
