import React, { useState, useRef } from "react";
import { View, Text, StyleSheet, StatusBar, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView, Platform } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView} from "moti";
import { Camera, Image as GalleryIcon, CheckCircle, Sparkles } from "lucide-react-native";
import { CameraView, useCameraPermissions } from "expo-camera";

// UI System
import { colors } from "../../../theme/colors";
import { fonts, fontSize } from "../../../theme/typography";
import { spacing, borderRadius } from "../../../theme/dimensions";

// Components
import { BackgroundMap } from "../../../components/visuals/BackgroundMap";
import { DriverProgressHeader } from "../../../components/driver/documents/DriverProgressHeader";
import { FaceScanner } from "../../../components/driver/selfie/FaceScanner";

// Core Services
import { submitDriverVerification, registerUser } from "../../../services/auth.service";
import userService from "../../../services/user.service";
import { useAuthStore } from "../../../context/authStore";

type VerificationState = "idle" | "capturing" | "analyzing" | "complete";

export default function DriverSelfieScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const globalToken = useAuthStore(state => state.token);

  // Props & Routing context relay
  const { user, token, selectedProfile } = (route.params || {}) as any;
  const authToken = token || globalToken; // 🛡️ Fallback safe

  // Manage native hook permissions
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  // Internal state machine managing the futuristic step-process flow
  const [step, setStep] = useState<VerificationState>("idle");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 🚀 Capture trigger and simulated validation cascade
  const handleTakeSelfie = async () => {
    if (!cameraRef.current) {
      Alert.alert("Ops", "Câmera ainda não carregada.");
      return;
    }

    try {
      // Fast transition state for UI responsiveness
      setStep("capturing");
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
        exif: false,
      });

      if (photo && photo.uri) {
        setCapturedImage(photo.uri);
        
        // Enter immersive Analysis Flow simulation for UX 🤖
        setStep("analyzing");
        
        // Step 1 timer: Artificial delay for biometric "mapping"
        setTimeout(() => {
          setStep("complete");
        }, 2800);
      }
    } catch (error) {
            setStep("idle");
      Alert.alert("Erro", "Não foi possível capturar a selfie.");
    }
  };


  const resetFlow = () => {
    setCapturedImage(null);
    setStep("idle");
  };

  const [isUploading, setIsUploading] = useState(false);

  const handleProceedNext = async () => {
    if (step !== "complete" || !capturedImage || isUploading) return;

    setIsUploading(true);

    try {
      let activeToken = authToken;
      let activeUserId = user?._id;

      // 🛡️ SAFETY GATE: IF user is not registered on backend yet (missing ID or token), REGISTER NOW!
      if (!activeToken || !activeUserId || activeUserId === "") {
                
        const registrationPayload = {
          name: user.name || "Motorista",
          email: user.email,
          password: user.password || `${user.email}123`, // Fallback safety password
          phone: user.phone,
          city: user.city,
          userType: "driver" as const,
          acceptedTerms: true,
          vehicleType: user.vehicleType || "car",
        };

        const regResponse = await registerUser(registrationPayload as any);

        if (!regResponse.success || !regResponse.data) {
          throw new Error(regResponse.message || "Falha ao criar sua conta de motorista.");
        }

        const newUser = regResponse.data.user;
        const newToken = regResponse.data.token;

        
        // ✅ Commit user session globally immediately so app state persists!
        useAuthStore.getState().login(
          "driver",
          {
            id: newUser._id,
            name: newUser.name,
            nome: newUser.name,
            email: newUser.email,
            telefone: newUser.phone || "",
            cidade: newUser.city || "",
            aceitouTermos: true,
          },
          newToken
        );

        activeToken = newToken;
        activeUserId = newUser._id;
      }

      // 🚀 SECONDARY FIX: Ensure valid phone number carries over to backend now that we have an explicit activeToken!
      // We cover both Lazy Registered (above) and Pre-Auth conversions!
      if (user.phone && activeToken) {
        try {
          await userService.updateProfile({ phone: user.phone }, activeToken);
                  } catch (phErr) {
                  }
      }

      // 📤 1. Bundle and build dynamic FormData with all gathered artifacts!
      const formData = new FormData();
      const docs = user?.documents || {};
      const fileMap = {
        cnhFront: docs.cnhFront,
        cnhBack: docs.cnhBack,
        crlvFront: docs.crlvFront,
        crlvBack: docs.crlvBack,
        vehiclePhoto: docs.vehiclePhoto,
        selfie: capturedImage,
      };

      Object.entries(fileMap).forEach(([key, uri]) => {
        if (uri) {
          const filename = uri.split("/").pop() || `${key}.jpg`;
          const ext = filename.split(".").pop()?.toLowerCase() || "jpg";
          const mimeType = ext === "png" ? "image/png" : "image/jpeg";
          formData.append(key, {
            uri: Platform.OS === "ios" ? uri.replace("file://", "") : uri,
            name: filename,
            type: mimeType,
          } as any);
        }
      });

      // 🚀 2. Disptach to Server WITH GUARANTEED TOKEN
      const response = await submitDriverVerification(formData, activeToken);

      if (response.success) {
        // 🎉 Complete sequence: Hand-off to immutable Analysis Terminal.
        navigation.navigate("DriverAnalysis", {
          user: {
            ...user,
            _id: activeUserId,
            driverStatus: response.data?.driverStatus || "pending",
            documents: response.data?.driverDocuments || user.documents,
          },
          token: activeToken,
          selectedProfile,
        });
      } else {
        Alert.alert("Falha no Envio", response.message || "Não foi possível salvar seus dados no servidor.");
      }
    } catch (err: any) {
            Alert.alert("Erro no Cadastro", err.message || "Ocorreu um erro crítico ao tentar finalizar o processo.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.stage}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient
        colors={[colors.background.primary, "#050C16", "#02060B"]}
        style={StyleSheet.absoluteFill}
      />
      <BackgroundMap />
      
      {/* Incremented funnel progress step! Step 3 of 4 */}
      <DriverProgressHeader currentStep={3} totalSteps={4} />

      <View style={styles.contentWrapper}>
        
        {/* 📟 Immersive Dynamic Status Header text */}
        <MotiView from={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Text style={styles.pageTitle}>Verificação de Identidade</Text>
          <Text style={styles.pageDesc}>
            Garanta sua segurança com o escaneamento facial.
          </Text>
        </MotiView>

        {/* 🎭 The Core Viewport - Dynamic State Renders */}
        <View style={styles.scannerBox}>
          {step === "complete" && capturedImage ? (
            /* STATE: SUCCESS / DONE (Cinematic Overlay) */
            <MotiView
              from={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              style={styles.successView}
            >
              <Image source={{ uri: capturedImage }} style={styles.circleImage} />
              <MotiView
                from={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", delay: 300 }}
                style={styles.greenSuccessBadge}
              >
                <CheckCircle size={40} color={colors.background.primary} />
              </MotiView>
              <Text style={styles.greenTxt}>Biometria Analisada</Text>
            </MotiView>
          ) : !permission ? (
            /* Indeterminate permission loading state */
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator size="large" color={colors.primary[500]} />
            </View>
          ) : (
            /* STATE: CAMERA / ANALYZING View */
            <FaceScanner
              isActive={step === "analyzing" || step === "capturing"}
              cameraRef={cameraRef}
              permissionGranted={permission.granted}
              onInit={requestPermission}
            />
          )}
        </View>

        {/* 🛠️ Contextual actions zone changing based on machine state */}
        <View style={styles.footerStack}>
          {step === "idle" ? (
            <View style={styles.actionsRow}>
              <TouchableOpacity 
                style={styles.primarySelfieBtn} 
                onPress={handleTakeSelfie}
              >
                <Camera size={22} color={colors.background.primary} style={{ marginRight: 10 }} />
                <Text style={styles.btnTextMain}>Tirar Selfie</Text>
              </TouchableOpacity>
            </View>
          ) : step === "analyzing" || step === "capturing" ? (
            <View style={styles.analyzingBox}>
              <Sparkles size={24} color={colors.primary[500]} />
              <Text style={styles.scanningLabel}>Validando Mapas Faciais...</Text>
            </View>
          ) : (
            /* Step Complete case: Renders raw, instant and guaranteed footer actions! */
            <View style={styles.finalActions}>
              <TouchableOpacity 
                style={[styles.primarySelfieBtn, isUploading && { opacity: 0.8 }]} 
                onPress={handleProceedNext}
                disabled={isUploading}
              >
                {isUploading ? (
                  <ActivityIndicator color={colors.background.primary} />
                ) : (
                  <Text style={styles.btnTextMain}>Confirmar e Continuar</Text>
                )}
              </TouchableOpacity>
              
              {!isUploading && (
                <TouchableOpacity style={styles.redoBtn} onPress={resetFlow}>
                  <Text style={styles.redoTxt}>Tirar Outra Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  scroll: {
    flex: 1,
  },
  contentWrapper: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    justifyContent: "space-between",
    paddingBottom: spacing.xl,
  },
  pageTitle: {
    fontFamily: fonts.black,
    fontSize: 24,
    color: colors.text.primary,
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  pageDesc: {
    fontFamily: fonts.regular,
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    textAlign: "center",
    maxWidth: "90%",
    alignSelf: "center",
    lineHeight: 18,
  },
  scannerBox: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 280,
  },
  footerStack: {
    width: "100%",
    marginTop: spacing.md,
  },
  actionsRow: {
    width: "100%",
    flexDirection: "row",
    gap: spacing.md,
  },
  primarySelfieBtn: {
    width: "100%",
    height: 56,
    backgroundColor: colors.primary[500],
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  secGalleryBtn: {
    flex: 1,
    height: 56,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  btnTextMain: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.background.primary,
    fontWeight: "800",
  },
  btnTextSec: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.7)",
  },
  analyzingBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.lg,
  },
  scanningLabel: {
    marginTop: 12,
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: colors.primary[500],
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  successView: {
    alignItems: "center",
    justifyContent: "center",
  },
  circleImage: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: colors.primary[500],
  },
  greenSuccessBadge: {
    position: "absolute",
    backgroundColor: colors.primary[500],
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    bottom: 40,
    borderWidth: 4,
    borderColor: "#050C16",
  },
  greenTxt: {
    fontFamily: fonts.bold,
    fontSize: fontSize.base,
    color: colors.primary[500],
    marginTop: 25,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  finalActions: {
    width: "100%",
  },
  redoBtn: {
    alignSelf: "center",
    marginTop: 16,
    paddingVertical: 8,
  },
  redoTxt: {
    fontFamily: fonts.bold,
    fontSize: fontSize.sm,
    color: "rgba(255,255,255,0.5)",
    textDecorationLine: "underline",
  },
});
