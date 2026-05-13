import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView, Alert } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { FileText, Truck, Shield, BadgeCheck } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import Toast from "react-native-toast-message";

// UI Architecture
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

// Assets
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";

// Modular Components
import { DriverProgressHeader } from "../../../components/driver/documents/DriverProgressHeader";
import { UploadDocumentCard } from "../../../components/driver/documents/UploadDocumentCard";
import { DualUploadDocumentCard } from "../../../components/driver/documents/DualUploadDocumentCard";
import { TipsCard } from "../../../components/driver/documents/TipsCard";
import { DriverCategoryFooter } from "../../../components/driver/category/DriverCategoryFooter";

type DocState = {
  uri: string | null;
  loading: boolean;
};

type DocTarget = "cnhFront" | "cnhBack" | "crlvFront" | "crlvBack" | "photo";

export default function DriverDocumentsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // Context persistence from upstream screens
  const { user, token, selectedProfile } = (route.params || {}) as any;

  // Expanded managed file state variables
  const [cnhFront, setCnhFront] = useState<DocState>({ uri: null, loading: false });
  const [cnhBack, setCnhBack] = useState<DocState>({ uri: null, loading: false });
  const [crlvFront, setCrlvFront] = useState<DocState>({ uri: null, loading: false });
  const [crlvBack, setCrlvBack] = useState<DocState>({ uri: null, loading: false });
  const [vehiclePhoto, setVehiclePhoto] = useState<DocState>({ uri: null, loading: false });

  // Unified State Mapping
  const setters: Record<DocTarget, React.Dispatch<React.SetStateAction<DocState>>> = {
    cnhFront: setCnhFront,
    cnhBack: setCnhBack,
    crlvFront: setCrlvFront,
    crlvBack: setCrlvBack,
    photo: setVehiclePhoto,
  };

  // Generic file picker handler integrating native permissions and loading simulations
  const handlePick = async (
    source: "camera" | "gallery", 
    target: DocTarget
  ) => {
    try {
      // 1. Permission Request Flow
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à câmera.");
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permissão negada", "Precisamos de acesso à galeria.");
          return;
        }
      }

      // 2. Execute Action
      const options: ImagePicker.ImagePickerOptions = {
        mediaTypes: "images",
        allowsEditing: true,
        quality: 0.8,
      };

      const result = source === "camera" 
        ? await ImagePicker.launchCameraAsync(options) 
        : await ImagePicker.launchImageLibraryAsync(options);

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedUri = result.assets[0].uri;
        
        // Activate artificial "Upload State"
        setters[target]((prev) => ({ ...prev, loading: true }));
        
        // Simulate API roundtrip
        setTimeout(() => {
          setters[target]({ uri: selectedUri, loading: false });
          Toast.show({
            type: "success",
            text1: "Documento anexado!",
            text2: "Passo validado.",
          });
        }, 1200);
      }

    } catch (error) {
            Toast.show({ type: "error", text1: "Falha ao selecionar arquivo." });
    }
  };

  const handleClear = (target: DocTarget) => {
    setters[target]({ uri: null, loading: false });
  };

  // Verification gating: MUST require all 5 artifacts to proceed
  const isReady = 
    !!cnhFront.uri && 
    !!cnhBack.uri && 
    !!crlvFront.uri && 
    !!crlvBack.uri && 
    !!vehiclePhoto.uri;

  const handleFinalize = () => {
    if (!isReady) {
      Alert.alert("Campos incompletos", "Por favor, envie todos os documentos exigidos.");
      return;
    }

    // Transfer complete document inventory next in flow pipeline
    navigation.navigate("DriverSelfie", {
      user: {
        ...user,
        documents: {
          cnhFront: cnhFront.uri,
          cnhBack: cnhBack.uri,
          crlvFront: crlvFront.uri,
          crlvBack: crlvBack.uri,
          vehiclePhoto: vehiclePhoto.uri,
        }
      },
      token,
      selectedProfile,
    });
  };

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <LinearGradient
        colors={[colors.background.primary, "#060E18", "#03080D"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      
      <DriverProgressHeader currentStep={2} totalSteps={4} />

      <ScrollView 
        contentContainerStyle={[styles.scrollArea, { paddingBottom: insets.bottom + spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: 15 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.intro}
        >
          <Text style={styles.mainTitle}>Envie seus documentos</Text>
          <Text style={styles.subText}>
            Anexe fotos nítidas dos seus documentos originais.
          </Text>
        </MotiView>

        {/* 🆔 DUAL CNH CARD */}
        <DualUploadDocumentCard 
          title="CNH (Habilitação)"
          description="Tire foto da frente e do verso (com QR Code)"
          icon={Shield}
          front={cnhFront}
          back={cnhBack}
          onPickFront={(s) => handlePick(s, "cnhFront")}
          onClearFront={() => handleClear("cnhFront")}
          onPickBack={(s) => handlePick(s, "cnhBack")}
          onClearBack={() => handleClear("cnhBack")}
          delay={100}
        />

        {/* 📜 DUAL CRLV CARD */}
        <DualUploadDocumentCard 
          title="Documento do Veículo"
          description="Certificado de Registro (CRLV) atualizado"
          icon={FileText}
          front={crlvFront}
          back={crlvBack}
          onPickFront={(s) => handlePick(s, "crlvFront")}
          onClearFront={() => handleClear("crlvFront")}
          onPickBack={(s) => handlePick(s, "crlvBack")}
          onClearBack={() => handleClear("crlvBack")}
          delay={200}
        />

        {/* 🚗 SINGLE VEHICLE PHOTO */}
        <UploadDocumentCard
          title="Foto do Veículo"
          description="Foto visível da placa e modelo"
          icon={Truck}
          uri={vehiclePhoto.uri}
          loading={vehiclePhoto.loading}
          onCameraPress={() => handlePick("camera", "photo")}
          onGalleryPress={() => handlePick("gallery", "photo")}
          onClear={() => handleClear("photo")}
          delay={300}
        />

        <TipsCard />

        <DriverCategoryFooter active={isReady} onProceed={handleFinalize} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scrollArea: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl,
  },
  intro: {
    marginBottom: spacing.xl,
  },
  mainTitle: {
    fontFamily: fonts.black,
    fontSize: 26,
    color: colors.text.primary,
    fontWeight: "900",
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subText: {
    fontFamily: fonts.regular,
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    lineHeight: 21,
  },
});
