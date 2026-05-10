import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Bike, Car, Box, Truck } from "lucide-react-native";

// UI Architecture
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing } from "../../../theme/dimensions";

// Shared Layer Assets
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";

// Architected Category Components
import { DriverProgressHeader } from "../../../components/driver/documents/DriverProgressHeader";
import { CategoryCard } from "../../../components/driver/category/CategoryCard";
import { DriverCategoryFooter } from "../../../components/driver/category/DriverCategoryFooter";

// Standardizing against existing Step2Vehicle system IDs
type CategoryID = "motorcycle" | "car" | "van" | "truck";

export default function DriverCategoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Safely carrying forward upstream parameter states (user payload, selection types)
  const { user, token, selectedProfile } = (route.params || {}) as any;

  const [choice, setChoice] = useState<CategoryID | null>(null);

  const handleProceed = () => {
    if (!choice) return;

    // Proceed directly to dynamic Document Verification screen carrying choices!
    navigation.navigate("DriverDocuments", {
      user: {
        ...user,
        vehicleType: choice, 
      },
      token,
      selectedProfile,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* 🌌 Full Backdrop Cinematic Environment */}
      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#03080D"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      <LinearGradient
        colors={["rgba(9, 26, 47, 0.35)", "transparent", colors.background.primary]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 🔩 Progressive Funnel Header (Step 1) */}
      <DriverProgressHeader currentStep={1} totalSteps={4} />

      <ScrollView 
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🏷️ Descriptive Intro Title */}
        <MotiView
          from={{ opacity: 0, translateY: -10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.intro}
        >
          <Text style={styles.title}>Escolha sua categoria</Text>
          <Text style={styles.desc}>
            Defina como você irá operar dentro do ecossistema LEVA.
          </Text>
        </MotiView>

        {/* 📋 Grid of Core Functional Subcategories */}
        <View style={styles.grid}>
          <CategoryCard
            title="Motoboy"
            description="Ideal para corridas de moto e entregas rápidas na cidade."
            icon={Bike}
            badge="Mais Popular"
            isSelected={choice === "motorcycle"}
            onSelect={() => setChoice("motorcycle")}
            delay={100}
          />

          <CategoryCard
            title="Motorista"
            description="Corridas tradicionais de passageiros com conforto e segurança."
            icon={Car}
            isSelected={choice === "car"}
            onSelect={() => setChoice("car")}
            delay={200}
          />

          <CategoryCard
            title="Utilitário"
            description="Transporte de cargas leves e médias usando furgão ou van."
            icon={Truck} // visual fit for Van/Truck
            isSelected={choice === "van"}
            onSelect={() => setChoice("van")}
            delay={300}
          />

        </View>

        {/* 🚀 Footer execution handler */}
        <DriverCategoryFooter active={!!choice} onProceed={handleProceed} />

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
    paddingTop: spacing.sm,
  },
  intro: {
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  title: {
    fontFamily: fonts.black,
    fontSize: 26,
    color: colors.text.primary,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.4,
  },
  desc: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 20,
    maxWidth: "85%",
  },
  grid: {
    flex: 1,
    justifyContent: "center",
  },
});
