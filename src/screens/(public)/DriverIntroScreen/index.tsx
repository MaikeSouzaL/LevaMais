import React from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Clock, Coins, Zap, TrendingUp } from "lucide-react-native";

// UI System
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing } from "../../../theme/dimensions";

// Visual/Logic Containers
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";

// Explicitly Architected Driver Modules
import { DriverIntroHeader } from "../../../components/driver/DriverIntroHeader";
import { DriverHeroIllustration } from "../../../components/driver/DriverHeroIllustration";
import { BenefitCard } from "../../../components/driver/BenefitCard";
import { DriverIntroFooter } from "../../../components/driver/DriverIntroFooter";

export default function DriverIntroScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Safe extraction of original pipeline context (user data passed downstream)
  const { user, token, selectedProfile } = (route.params || {}) as any;

  const handleContinue = () => {
    // Advance sequentially to Category Selection Screen next!
    navigation.navigate("DriverCategory", {
      user,
      token,
      selectedProfile: selectedProfile || "driver",
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌌 Cinematic Ambient Backdrop */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#030910"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      <LinearGradient
        colors={["rgba(9, 26, 47, 0.3)", "transparent", colors.background.primary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 🛸 Custom Navigation Driver Header */}
      <DriverIntroHeader />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🎨 Epic Dynamic Illustration (Motoboy / Cars / Gains Floating) */}
        <DriverHeroIllustration />

        {/* 📝 Catchy Titles */}
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600, delay: 100 }}
          style={styles.titleBlock}
        >
          <Text style={styles.headTitle}>Trabalhe no LEVA</Text>
          <Text style={styles.subTitle}>
            Comece a faturar fazendo corridas e entregas com autonomia e transparência.
          </Text>
        </MotiView>

        {/* 💎 The Elite 4 Benefits Grid */}
        <View style={styles.grid}>
          <BenefitCard 
            icon={Clock} 
            title="Horários flexíveis" 
            delay={200} 
          />
          <BenefitCard 
            icon={TrendingUp} 
            title="Ganhos em tempo real" 
            delay={300} 
          />
          <BenefitCard 
            icon={Zap} 
            title="PIX rápido" 
            delay={400} 
          />
          <BenefitCard 
            icon={Coins} 
            title="Negociação inteligente" 
            delay={500} 
          />
        </View>

        {/* 🚀 Final Call To Action */}
        <DriverIntroFooter onContinue={handleContinue} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
  },
  titleBlock: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  headTitle: {
    fontFamily: fonts.black,
    fontSize: 28,
    color: colors.text.primary,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.5,
  },
  subTitle: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 21,
    maxWidth: "90%",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: spacing.md,
  },
});
