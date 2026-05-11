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
import { registerUser } from "../../../services/auth.service";
import userService from "../../../services/user.service";

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

  // Parameter parsing preserving upstream lifecycle safety
  const { user, token: initialToken } = (route.params || {}) as SelectProfileParams;
  const [selectedProfile, setSelectedProfile] = useState<ProfileType | null>(null);
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuthStore();

  async function handleProceed() {
    if (!user) {
      console.error("Profile Data missing upstream");
      return;
    }
    
    const choice = selectedProfile || "client";

    if (choice === "client") {
      setLoading(true);
      try {
        // 🌐 Scenerio A: User originated from Google (Already in DB, has _id and token)
        if (user._id && user._id.length > 5) {
          
          // 🚀 CRITICAL FIX: Persist validated phone number to Backend DATABASE before finalizing login!
          // This prevents the login sequence from repeatedly asking for phone updates!
          if (user.phone && initialToken) {
            try {
              await userService.updateProfile({ phone: user.phone }, initialToken);
              console.log("[SelectProfile] Phone number successfully synchronized to backend.");
            } catch (err) {
              console.error("[SelectProfile] Failed silently syncing phone number:", err);
              // Keep going, we won't block entry, but this should pass.
            }
          }

          login(
            "client",
            {
              id: user._id,
              name: user.name,
              nome: user.name,
              email: user.email,
              telefone: user.phone || "",
              cidade: user.city || "",
              fotoPerfil: user.profilePhoto,
              googleId: user.googleId,
              aceitouTermos: true,
            },
            initialToken || "",
          );
          Toast.show({
            type: "success",
            text1: "Acesso liberado!",
            text2: `Bem-vindo ao Leva+, ${user.name}!`,
          });
          return;
        }

        // 📝 Scenerio B: Manual User Signup (Needs to be persisted in backend)
        const response = await registerUser({
          name: user.name,
          email: user.email,
          password: user.password || "",
          phone: user.phone,
          city: user.city,
          userType: "client",
          acceptedTerms: true,
          googleId: user.googleId, // 🔗 Important: Ensure metadata links correctly!
          profilePhoto: user.profilePhoto,
        });

        if (response.success && response.data) {
          const { user: registeredUser, token } = response.data;
          login(
            "client",
            {
              id: registeredUser._id,
              name: registeredUser.name,
              nome: registeredUser.name,
              email: registeredUser.email,
              telefone: registeredUser.phone || "",
              cidade: registeredUser.city || "",
              fotoPerfil: registeredUser.profilePhoto,
              googleId: registeredUser.googleId,
              aceitouTermos: true,
            },
            token,
          );
          Toast.show({
            type: "success",
            text1: "Conta criada!",
            text2: "Seja bem-vindo!",
          });
        } else {
          Toast.show({
            type: "error",
            text1: "Erro ao finalizar acesso",
            text2: response.message || "Tente novamente em instantes",
          });
        }
      } catch (error: any) {
        Toast.show({
          type: "error",
          text1: "Falha na conexão",
          text2: "Verifique sua internet e tente novamente",
        });
      } finally {
        setLoading(false);
      }
    } else {
      // Diverting into High-Conversion Benefits Intro Screen first!
      navigation.navigate("DriverIntro", {
        selectedProfile: choice,
        user,
        token: initialToken,
      });
    }
  }

  // Dynamic button label logic based on runtime user interaction state
  const currentLabel = !selectedProfile 
    ? "Escolha seu modo" 
    : selectedProfile === "driver" 
      ? "Quero trabalhar" 
      : "Acessar como cliente";

  return (
    <View style={styles.screenContainer}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🎬 Depth Stacking (No moving particles, clean cinematic map as ordered previously) */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#03080E"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
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
          <Text style={styles.mainHeading}>Como deseja usar o LEVA?</Text>
          <Text style={styles.subHeading}>
            Escolha como deseja acessar o ecossistema LEVA.
          </Text>
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
            title="Trabalhar no LEVA"
            description="Faça corridas, entregas e aumente seus ganhos utilizando o LEVA."
            Icon={Briefcase}
            accentColor="#FFF"
            iconBgColor="rgba(255, 255, 255, 0.05)"
          />

        </View>

        {/* 🚀 Modularized Action Footer */}
        <ModeFooter 
          isEnabled={!!selectedProfile && !loading}
          onPress={handleProceed}
          buttonLabel={loading ? "Acessando..." : currentLabel}
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
});
