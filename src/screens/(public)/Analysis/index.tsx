import React from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { colors } from "@/theme";
import { fonts } from "@/theme";
import { spacing } from "@/theme";
import { useNavigation } from "@react-navigation/native";
import { useAuthStore } from "@/context/authStore";

// Visual foundation
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";

// Modular components
import { AnalysisHeader } from "../../../components/driver/analysis/AnalysisHeader";
import { AnalysisIllustration } from "../../../components/driver/analysis/AnalysisIllustration";
import { VerificationStatusCard } from "../../../components/driver/analysis/VerificationStatusCard";
import { AnalysisEstimate } from "../../../components/driver/analysis/AnalysisEstimate";
import { AnalysisFooter } from "../../../components/driver/analysis/AnalysisFooter";

export default function DriverAnalysisScreen() {
  const navigation = useNavigation<any>();
  const logout = useAuthStore((state) => state.logout);

  const handleFinish = () => {
    logout();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌌 Futuristic Base Stack */}
      <LinearGradient
        colors={[colors.background.primary, "#081321", "#040911"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <BackgroundMap />
      </View>

      {/* 🏢 Static Header */}
      <AnalysisHeader />

      {/* 📜 Content Scroll container enforcing internal responsiveness */}
      <ScrollView 
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* 🚀 The High-Tech Composition Layer */}
        <AnalysisIllustration />

        {/* 💬 Introduction textual block */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 800, delay: 300 }}
          style={styles.textZone}
        >
          <Text style={styles.headline}>Cadastro em Análise</Text>
          <Text style={styles.subhead}>
            Nossa tecnologia de segurança e equipe operacional já estão validando suas informações.
          </Text>
        </MotiView>

        {/* 📋 Status Dashboard Layer */}
        <VerificationStatusCard />

        {/* ⏳ Temporal disclosures */}
        <AnalysisEstimate />
        
        {/* 🏁 Final call to action */}
        <AnalysisFooter onPress={handleFinish} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: "center",
  },
  textZone: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  headline: {
    fontFamily: fonts.black,
    fontSize: 28,
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  subhead: {
    fontFamily: fonts.regular,
    fontSize: 15,
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 10,
  },
});
