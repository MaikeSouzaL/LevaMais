import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Modal, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { NavigationContext } from "@react-navigation/native";
import { CheckCircle2, ShieldCheck, MapPin, CreditCard, MessageSquare, LogOut, FileText, User, ChevronRight, Clock, RefreshCw } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "@/context/authStore";
import { colors } from "@/theme/colors";
import { account } from "@/lib/appwrite";
import {
  getProfile,
  saveClientKyc,
  uploadClientSelfie,
  getKycSelfieUrl,
  updateMyProfile,
} from "@/services/appwrite-auth.service";
import { getCurrentLocationAndAddress } from "@/utils/location";
import * as ImagePicker from "expo-image-picker";


export default function ClientOnboardingDashboard({ onContinue }: { onContinue: () => void }) {
  const navigation = React.useContext(NavigationContext);
  const isFocused = true; // No boot phase, we assume it's focused or handled by parent.
  const insets = useSafeAreaInsets();
  const { logout, userData, updateUserData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [verificationStatus, setVerificationStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [cpfStatus, setCpfStatus] = useState<"unchecked" | "valid" | "invalid" | "manual_review">("unchecked");
  const [selfieStatus, setSelfieStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");

  // Modal PF/PJ Registration States
  const [showModal, setShowModal] = useState(false);
  const [showBasicDataModal, setShowBasicDataModal] = useState(false);
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");
  const [cpfInput, setCpfInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cnpjInput, setCnpjInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyEmailInput, setCompanyEmailInput] = useState("");
  const [companyPhoneInput, setCompanyPhoneInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showApprovalReady, setShowApprovalReady] = useState(false);

  // Dynamic formatting masks
  const formatCPF = (text: string) => {
    const nums = text.replace(/\D/g, "");
    return nums
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2")
      .substring(0, 14);
  };

  const formatCNPJ = (text: string) => {
    const nums = text.replace(/\D/g, "");
    return nums
      .replace(/(\d{2})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1/$2")
      .replace(/(\d{4})(\d{1,2})$/, "$1-$2")
      .substring(0, 18);
  };

  const formatPhone = (text: string) => {
    const nums = text.replace(/\D/g, "");
    return nums
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d{4})$/, "$1-$2")
      .substring(0, 15);
  };

  const detectAndSaveCity = async () => {
    try {
      const res = await getCurrentLocationAndAddress();
      if (res && res.address?.city) {
        const detectedCity = res.address.city;
        await updateMyProfile({ city: detectedCity }).catch(() => {});
        updateUserData({ cidade: detectedCity, city: detectedCity });
        setCityInput(detectedCity);
      }
    } catch (err) {
      console.warn("[ClientOnboarding] Geolocation/City detection error:", err);
    }
  };

  useEffect(() => {
    if (showModal && !cityInput) {
      detectAndSaveCity();
    }
  }, [showModal]);

  const [uploadingSelfie, setUploadingSelfie] = useState(false);
  const [hasSelfieUploaded, setHasSelfieUploaded] = useState(false);
  const handleUploadSelfie = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        cameraType: ImagePicker.CameraType.front,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.6,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        await handleFaceVerificationSuccess(result.assets[0]);
      }
    } catch (e) {
      console.error("[ClientOnboarding] Camera error:", e);
      Alert.alert("Erro", "Não foi possível abrir a câmera.");
    }
  };

  const handleFaceVerificationSuccess = async (asset: ImagePicker.ImagePickerAsset) => {
    try {
      setUploadingSelfie(true);
      if (!asset.uri) throw new Error("Imagem inválida (sem caminho local).");

      // Upload para o Storage do Appwrite
      const { kyc_status } = await uploadClientSelfie(asset.uri);

      // Recarrega status para obter URL assinada e refletir aprovação
      await loadClientStatus();

      Alert.alert(
        "Sucesso",
        kyc_status === "approved"
          ? "Biometria enviada e conta aprovada!"
          : "Biometria facial enviada com sucesso!",
      );
    } catch (e: any) {
      console.error("[ClientOnboarding] Error uploading selfie:", e);
      Alert.alert("Erro", e?.message || "Não foi possível enviar a foto da biometria. Tente novamente.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const loadClientStatus = async () => {
    try {
      const user = await account.get().catch(() => null);
      if (!user) {
        setLoading(false);
        return;
      }
      const profile = await getProfile(user.$id).catch(() => null);
      if (profile) {
        const hasDoc = Boolean(profile.cpf || profile.cnpj);
        const selfiePath = profile.selfie_url || null;
        const hasSelfie = Boolean(selfiePath);
        const vStatus: "none" | "pending" | "approved" | "rejected" =
          profile.kyc_status === "approved"
            ? "approved"
            : hasDoc || hasSelfie
              ? "pending"
              : "none";
        const cStatus: "unchecked" | "valid" | "invalid" | "manual_review" = hasDoc
          ? vStatus === "approved" ? "valid" : "manual_review"
          : "unchecked";
        const sStatus: "none" | "pending" | "approved" | "rejected" = hasSelfie
          ? vStatus === "approved" ? "approved" : "pending"
          : "none";

        const selfieUrl = await getKycSelfieUrl(selfiePath);

        updateUserData({
          cidade: profile.city || "",
          city: profile.city || "",
          cpf: profile.cpf || "",
          cnpj: profile.cnpj || "",
          phone: profile.phone || "",
          telefone: profile.phone || "",
          companyName: profile.company_name || "",
          companyEmail: profile.company_email || "",
          companyPhone: profile.company_phone || "",
          fotoPerfil: selfieUrl || profile.avatar_url || "",
          clientVerification: {
            status: vStatus,
            documents: { selfie: selfiePath },
            cpfStatus: cStatus,
            selfieStatus: sStatus,
          },
        });

        setHasSelfieUploaded(hasSelfie);
        setVerificationStatus(vStatus);
        setCpfStatus(cStatus);
        setSelfieStatus(sStatus);

        if (hasDoc && hasSelfie && vStatus === "approved") {
          setShowApprovalReady(true);
        }

        // Seed fields
        setCpfInput(profile.cpf ? formatCPF(profile.cpf) : "");
        setNameInput("");
        setCnpjInput(profile.cnpj ? formatCNPJ(profile.cnpj) : "");
        setPhoneInput(profile.phone ? formatPhone(profile.phone) : "");
        setCompanyNameInput(profile.company_name || "");
        setCompanyEmailInput(profile.company_email || "");
        setCompanyPhoneInput(profile.company_phone ? formatPhone(profile.company_phone) : "");
        setCityInput(profile.city || "");
        setPersonType(profile.cnpj ? "PJ" : "PF");

        if (!profile.city) {
          detectAndSaveCity();
        }
      }
    } catch (err) {
      console.warn("[ClientOnboarding] Error loading status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadClientStatus();
    }
  }, [isFocused]);

  // KYC agora é auto-aprovado no Supabase ao completar dados + selfie.
  // Aprovação manual via realtime (Socket.io) será reintroduzida quando o
  // dashboard admin for migrado para o Supabase (fase futura).

  const handleSaveCadastral = async () => {
    // Basic validations
    if (personType === "PF") {
      const cleanCPF = cpfInput.replace(/\D/g, "");
      if (cleanCPF.length !== 11) {
        Alert.alert("Erro", "O CPF deve ter 11 dígitos.");
        return;
      }
      if (!nameInput.trim()) {
        Alert.alert("Erro", "O Nome Completo é obrigatório.");
        return;
      }
    } else {
      const cleanCNPJ = cnpjInput.replace(/\D/g, "");
      if (cleanCNPJ.length !== 14) {
        Alert.alert("Erro", "O CNPJ deve ter 14 dígitos.");
        return;
      }
      if (!companyNameInput.trim()) {
        Alert.alert("Erro", "A Razão Social é obrigatória para Pessoa Jurídica.");
        return;
      }
    }

    const cleanPhone = phoneInput.replace(/\D/g, "");
    if (cleanPhone && (cleanPhone.length < 10 || cleanPhone.length > 11)) {
      Alert.alert("Erro", "Por favor, insira um telefone válido com DDD (10 ou 11 dígitos).");
      return;
    }

    if (!cityInput.trim()) {
      Alert.alert("Erro", "O preenchimento da cidade é obrigatório.");
      return;
    }

    setSubmitting(true);
    try {
      const cleanCPF = cpfInput.replace(/\D/g, "");
      const cleanCNPJ = cnpjInput.replace(/\D/g, "");

      const payload =
        personType === "PF"
          ? {
              city: cityInput.trim(),
              phone: cleanPhone || userData?.phone || undefined,
              cpf: cleanCPF,
              full_name: nameInput.trim(),
              cnpj: "",
              company_name: "",
              company_email: "",
              company_phone: "",
            }
          : {
              city: cityInput.trim(),
              phone: cleanPhone || userData?.phone || undefined,
              cnpj: cleanCNPJ,
              cpf: "",
              company_name: companyNameInput.trim(),
              company_email: companyEmailInput.trim(),
              company_phone: companyPhoneInput.replace(/\D/g, ""),
            };

      const { kyc_status } = await saveClientKyc(payload);

      updateUserData({
        cidade: payload.city,
        city: payload.city,
        cpf: payload.cpf || "",
        cnpj: payload.cnpj || "",
        phone: payload.phone || "",
        telefone: payload.phone || "",
        companyName: payload.company_name || "",
        companyEmail: payload.company_email || "",
        companyPhone: payload.company_phone || "",
      });

      const hasDoc = Boolean(payload.cpf || payload.cnpj);
      setCpfStatus(hasDoc ? (kyc_status === "approved" ? "valid" : "manual_review") : "unchecked");
      setVerificationStatus(kyc_status as any);

      Alert.alert("Sucesso", "Dados cadastrais salvos com sucesso!");
      setShowModal(false);
      onContinue();
    } catch (err: any) {
      console.error("[ClientOnboarding] Error saving cadastral data:", err);
      Alert.alert("Erro", err?.message || "Não foi possível salvar os dados. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const hasCPFOrCNPJ = Boolean(userData?.cpf || userData?.cnpj);
  const hasSelfie = hasSelfieUploaded;

  let globalStatus = "incomplete";
  if (hasCPFOrCNPJ && hasSelfie) {
    globalStatus = verificationStatus === "pending" ? "pending" : verificationStatus === "rejected" ? "rejected" : "approved";
  }

  const onboardingSteps = [
    {
      id: "account",
      title: "Conta Ativada",
      desc: "Seu perfil Leva+ está pronto",
      status: "completed" as const,
      icon: ShieldCheck,
      action: () => setShowBasicDataModal(true),
    },
    {
      id: "cadastral",
      title: "Dados Cadastrais",
      desc: hasCPFOrCNPJ 
        ? (userData?.cpf 
            ? `Pessoa Física (CPF: ${userData?.cpf})` 
            : `Pessoa Jurídica (CNPJ: ${userData?.cnpj})`)
        : "Cadastre seu CPF ou CNPJ para segurança",
      status: hasCPFOrCNPJ 
        ? (cpfStatus === "valid" ? ("completed" as const) : (cpfStatus === "invalid" ? ("rejected" as const) : ("review" as const))) 
        : ("pending" as const),
      icon: FileText,
      action: () => setShowModal(true),
    },
    {
      id: "facial",
      title: "Verificação Facial",
      desc: hasSelfie
        ? (selfieStatus === "approved" ? "Foto de rosto verificada" : selfieStatus === "rejected" ? "Foto recusada, envie novamente" : "Foto em análise")
        : uploadingSelfie
        ? "Enviando selfie..."
        : "Envie uma selfie nítida de rosto",
      status: hasSelfie
        ? (selfieStatus === "approved" ? ("completed" as const) : (selfieStatus === "rejected" ? ("rejected" as const) : ("review" as const)))
        : uploadingSelfie
        ? ("processing" as const)
        : ("pending" as const),
      icon: User,
      action: selfieStatus === "approved" ? undefined : handleUploadSelfie,
    },
  ];

  if (loading) {
     return (
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color="#02de95" />
            <Text style={{ color: 'rgba(255,255,255,0.6)', marginTop: 16 }}>Ativando sua conta...</Text>
        </View>
     );
  }

  if (globalStatus === "pending" || showApprovalReady) {
    const approvedNow = showApprovalReady || globalStatus === "approved";
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#091A2F" }]} />
        <LinearGradient
          colors={["rgba(2, 222, 149, 0.08)", "rgba(9, 26, 47, 0.4)", "rgba(9, 26, 47, 0.9)"]}
          style={StyleSheet.absoluteFill}
        />
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: Math.max(insets.top, 30), paddingBottom: Math.max(insets.bottom, 30), justifyContent: "center", flexGrow: 1 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Glowing Clock Icon */}
          <View style={styles.analysisIconOuter}>
            <MotiView
              from={{ scale: 0.9, opacity: 0.2 }}
              animate={{ scale: 1.3, opacity: 0 }}
              transition={{ loop: true, duration: 2000, type: "timing" }}
              style={styles.analysisPulse}
            />
            <MotiView
              from={{ scale: 0.95, opacity: 0.4 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{ loop: true, duration: 2000, type: "timing", delay: 500 }}
              style={styles.analysisPulse}
            />
            <View style={styles.analysisIconInner}>
              <Clock size={48} color="#02de95" />
            </View>
          </View>

          {/* Heading */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={{ alignItems: "center", paddingHorizontal: 16 }}
          >
            <Text style={styles.analysisBadge}>FLUXO DE SEGURANÇA</Text>
            <Text style={styles.analysisTitle}>{approvedNow ? "Parabéns! Conta Aprovada" : "Conta em Análise"}</Text>
            <Text style={styles.analysisSubtitle}>
              {approvedNow
                ? `Olá, ${userData?.name || "Cliente"}! Sua conta foi aprovada com sucesso.`
                : `Olá, ${userData?.name || "Cliente"}! Recebemos seus dados e sua foto de verificação com sucesso.`}
            </Text>
          </MotiView>

          {/* Explanation Text */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600, delay: 200 }}
            style={styles.analysisNoticeBox}
          >
            <Text style={styles.analysisNoticeText}>
              {approvedNow
                ? "Sua conta está pronta para uso. Toque em Continuar para acessar a tela inicial."
                : "Nossa equipe está revisando suas informações de segurança. Esse processo costuma ser rápido! Você será liberado para pedir viagens assim que a conta for aprovada."}
            </Text>
          </MotiView>

          {/* Action Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 300 }}
            style={{ width: "100%", gap: 12, marginTop: 10 }}
          >
            {approvedNow ? (
              <TouchableOpacity
                style={styles.refreshBtn}
                activeOpacity={0.8}
                onPress={onContinue}
              >
                <Text style={styles.refreshBtnText}>Continuar</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={styles.refreshBtn}
                activeOpacity={0.8}
                onPress={async () => {
                  setLoading(true);
                  await loadClientStatus();
                }}
              >
                <MotiView
                  animate={{ rotate: loading ? "360deg" : "0deg" }}
                  transition={loading ? { loop: true, duration: 1000, type: "timing" } : undefined}
                  style={{ marginRight: 8 }}
                >
                  <RefreshCw size={18} color="#091A2F" />
                </MotiView>
                <Text style={styles.refreshBtnText}>Atualizar Status</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={styles.analysisSupportBtn}
                activeOpacity={0.8}
                onPress={() => navigation ? (navigation as any).navigate("SupportCenter") : null}
              >
                <MessageSquare size={16} color="#fff" style={{ marginRight: 6 }} />
                <Text style={styles.analysisSupportBtnText}>Suporte</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.analysisLogoutBtn}
                activeOpacity={0.8}
                onPress={logout}
              >
                <LogOut size={16} color="#ef4444" style={{ marginRight: 6 }} />
                <Text style={styles.analysisLogoutBtnText}>Sair</Text>
              </TouchableOpacity>
            </View>
          </MotiView>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#091A2F" }]} />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 30) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Olá, {userData?.name || "Cliente"}</Text>
              <Text style={styles.statusHeader}>Sua Conta Leva+</Text>
            </View>
            <TouchableOpacity 
              onPress={logout} 
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          <View style={[styles.progressCard, globalStatus === "pending" && { borderColor: "rgba(245, 158, 11, 0.3)" }]}>
            <LinearGradient
              colors={globalStatus === "pending" ? ["rgba(245, 158, 11, 0.1)", "transparent"] : ["rgba(2,222,149,0.05)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.progressTop}>
              <View>
                <Text style={[styles.progressLabel, globalStatus === "pending" && { color: "#F59E0B" }]}>Status da Conta</Text>
                <Text style={[styles.progressMainText, globalStatus === "pending" && { color: "#FBBF24" }]}>
                  {globalStatus === "pending" ? "Em fase de aprovação" : "Complete seu cadastro"}
                </Text>
              </View>
              {globalStatus === "pending" ? (
                <Clock size={32} color="#F59E0B" />
              ) : (
                <CheckCircle2 size={32} color={globalStatus === "approved" ? "#02de95" : "rgba(255,255,255,0.2)"} />
              )}
            </View>
          </View>
        </MotiView>

        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 500, delay: 300 }}
          style={styles.stepsZone}
        >
          <Text style={styles.stepsHeadline}>Tudo pronto por aqui</Text>

           {onboardingSteps.map((step) => {
            const Icon = step.icon;
            const isClickable = !!step.action && (step.id === "account" || step.id === "cadastral" || step.status !== "completed");

            return (
              <TouchableOpacity
                key={step.id}
                disabled={!isClickable}
                onPress={step.action || undefined}
                style={[
                  styles.stepCard,
                  step.status === "completed" && styles.stepCardCompleted,
                  step.status === "processing" && styles.stepCardProcessing,
                  step.status === "review" && { borderColor: "rgba(245, 158, 11, 0.3)" },
                  step.status === "rejected" && { borderColor: "rgba(239, 68, 68, 0.3)" },
                  isClickable && styles.stepCardClickable,
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.stepIconContainer,
                  step.status === "completed" && { backgroundColor: "rgba(2,222,149,0.1)" },
                  step.status === "processing" && { backgroundColor: "rgba(2,222,149,0.05)" },
                  step.status === "review" && { backgroundColor: "rgba(245, 158, 11, 0.1)" },
                  step.status === "rejected" && { backgroundColor: "rgba(239, 68, 68, 0.1)" },
                ]}>
                  <Icon 
                    size={22} 
                    color={step.status === "completed" ? "#02de95" : step.status === "review" ? "#F59E0B" : step.status === "rejected" ? "#EF4444" : "rgba(255,255,255,0.5)"} 
                  />
                </View>

                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>

                <View style={styles.stepIndicator}>
                  {step.status === "completed" ? (
                    <CheckCircle2 size={22} color="#02de95" />
                  ) : step.status === "processing" ? (
                    <ActivityIndicator size="small" color="#02de95" />
                  ) : step.status === "review" ? (
                    <Clock size={20} color="#F59E0B" />
                  ) : step.status === "rejected" ? (
                    <ChevronRight size={20} color="#EF4444" />
                  ) : step.id === "payment" ? (
                    <Text style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: '900' }}>OPCIONAL</Text>
                  ) : (
                    <ChevronRight size={20} color="#02de95" />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity 
            style={[
              styles.continueBtn,
              globalStatus !== "approved" && { backgroundColor: "rgba(2, 222, 149, 0.4)" }
            ]}
            onPress={() => {
              if (globalStatus === "pending") {
                Alert.alert(
                  "Conta em Análise",
                  "Seus documentos e biometria estão sendo analisados pela nossa equipe. Você será liberado para usar o app assim que for aprovado!"
                );
                return;
              }
              if (!hasCPFOrCNPJ) {
                Alert.alert(
                  "Segurança Leva+",
                  "Para a sua segurança e conformidade, é obrigatório preencher seus dados cadastrais (CPF ou CNPJ) antes de começar a pedir viagens.",
                  [
                    { text: "Cadastrar Agora", onPress: () => setShowModal(true) }
                  ]
                );
                return;
              }
              if (cpfStatus === "invalid") {
                Alert.alert(
                  "Seus dados cadastrais foram recusados",
                  "Os seus dados cadastrais foram recusados pela nossa equipe. Por favor, atualize seus dados cadastrais para prosseguir.",
                  [
                    { text: "Atualizar Dados", onPress: () => setShowModal(true) }
                  ]
                );
                return;
              }
              if (!hasSelfie) {
                Alert.alert(
                  "Verificação Facial Obrigatória",
                  "Para aumentar a segurança de nossos motoristas e parceiros, solicitamos que você envie uma foto de verificação facial (Selfie) antes de prosseguir.",
                  [
                    { text: "Tirar Foto Agora", onPress: handleUploadSelfie }
                  ]
                );
                return;
              }
              if (selfieStatus === "rejected") {
                Alert.alert(
                  "Sua foto foi recusada",
                  "A sua última selfie foi recusada pela nossa equipe. Por favor, envie uma nova foto seguindo as instruções.",
                  [
                    { text: "Tirar Nova Foto", onPress: handleUploadSelfie }
                  ]
                );
                return;
              }
              onContinue();
            }}
          >
            <Text style={styles.continueBtnText}>Começar a Usar</Text>
          </TouchableOpacity>
        </MotiView>

        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 600 }}
          style={styles.supportCard}
        >
          <View style={styles.supportInfo}>
            <MessageSquare size={20} color="rgba(255,255,255,0.7)" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supportTitle}>Suporte 24h</Text>
              <Text style={styles.supportSub}>Estamos aqui para ajudar</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.supportBtn}
            onPress={() => navigation ? (navigation as any).navigate("SupportCenter") : null}
          >
            <Text style={styles.supportBtnText}>Chat</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>

      {/* Sleek PF/PJ Registration Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 30 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <FileText size={24} color="#02de95" />
              <Text style={styles.modalTitle}>Dados Cadastrais</Text>
              <Text style={styles.modalSub}>Preencha seus dados com segurança</Text>
            </View>

            {/* Tab Selector for PF / PJ */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tabButton, personType === "PF" && styles.tabButtonActive]}
                onPress={() => setPersonType("PF")}
              >
                <User size={16} color={personType === "PF" ? "#091A2F" : "rgba(255,255,255,0.6)"} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, personType === "PF" && styles.tabTextActive]}>Pessoa Física</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tabButton, personType === "PJ" && styles.tabButtonActive]}
                onPress={() => setPersonType("PJ")}
              >
                <FileText size={16} color={personType === "PJ" ? "#091A2F" : "rgba(255,255,255,0.6)"} style={{ marginRight: 6 }} />
                <Text style={[styles.tabText, personType === "PJ" && styles.tabTextActive]}>Pessoa Jurídica</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              
              {/* Conditional Input based on PF/PJ */}
              {personType === "PF" ? (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Nome Completo *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Seu Nome Completo"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={nameInput}
                      onChangeText={setNameInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CPF *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="000.000.000-00"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      value={cpfInput}
                      onChangeText={(t) => setCpfInput(formatCPF(t))}
                    />
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>CNPJ *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="00.000.000/0000-00"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      value={cnpjInput}
                      onChangeText={(t) => setCnpjInput(formatCNPJ(t))}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Razão Social / Nome Fantasia *</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Nome da sua Empresa"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      value={companyNameInput}
                      onChangeText={setCompanyNameInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>E-mail Corporativo</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="empresa@exemplo.com"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={companyEmailInput}
                      onChangeText={setCompanyEmailInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Telefone Corporativo</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="(00) 00000-0000"
                      placeholderTextColor="rgba(255,255,255,0.25)"
                      keyboardType="numeric"
                      value={companyPhoneInput}
                      onChangeText={(t) => setCompanyPhoneInput(formatPhone(t))}
                    />
                  </View>
                </View>
              )}

              {/* Shared Fields (Phone & City) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Telefone Celular (Já verificado) 🔒</Text>
                <TextInput
                  style={[styles.textInput, { opacity: 0.65, backgroundColor: "rgba(255,255,255,0.05)" }]}
                  placeholder="(00) 00000-0000"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  keyboardType="numeric"
                  value={phoneInput}
                  editable={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Cidade de Atuação *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Nome da Cidade"
                  placeholderTextColor="rgba(255,255,255,0.25)"
                  value={cityInput}
                  onChangeText={setCityInput}
                />
              </View>

              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowModal(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Voltar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSaveBtn}
                onPress={handleSaveCadastral}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#091A2F" />
                ) : (
                  <Text style={styles.modalSaveText}>Salvar Dados</Text>
                )}
              </TouchableOpacity>
            </View>
          </MotiView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Sleek Basic Data Display Modal */}
      <Modal
        visible={showBasicDataModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBasicDataModal(false)}
      >
        <View style={styles.modalOverlay}>
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 30 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 15 }}
            style={styles.modalContainer}
          >
            <View style={styles.modalHeader}>
              <ShieldCheck size={28} color="#02de95" />
              <Text style={styles.modalTitle}>Cadastro Básico</Text>
              <Text style={styles.modalSub}>Informações obtidas no pré-cadastro</Text>
            </View>

            <View style={{ alignItems: "center", marginVertical: 24 }}>
              {/* Glowing Profile Ring */}
              <View style={{
                width: 96,
                height: 96,
                borderRadius: 48,
                borderWidth: 2,
                borderColor: "#02de95",
                padding: 3,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "rgba(2, 222, 149, 0.05)",
                shadowColor: "#02de95",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
                elevation: 4,
                marginBottom: 16
              }}>
                {userData?.fotoPerfil || userData?.profilePhoto ? (
                  <Image
                    source={{ uri: userData.fotoPerfil || userData.profilePhoto }}
                    style={{ width: 88, height: 88, borderRadius: 44 }}
                  />
                ) : (
                  <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: "rgba(255,255,255,0.06)", justifyContent: "center", alignItems: "center" }}>
                    <User size={44} color="rgba(255,255,255,0.4)" />
                  </View>
                )}
              </View>

              {/* User Name & Profile Badge */}
              <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", textAlign: "center", marginBottom: 6 }}>
                {userData?.name || "Usuário Leva+"}
              </Text>
              
              <View style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: "rgba(2, 222, 149, 0.15)",
                borderWidth: 1,
                borderColor: "rgba(2, 222, 149, 0.25)",
                marginBottom: 20
              }}>
                <Text style={{ color: "#02de95", fontSize: 11, fontWeight: "900", letterSpacing: 0.5 }}>
                  CLIENTE LEVA+
                </Text>
              </View>
            </View>

            {/* Email Field Panel */}
            <View style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginBottom: 20 }}>
              <Text style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: "600", marginBottom: 4 }}>
                Endereço de E-mail
              </Text>
              <Text style={{ color: "#fff", fontSize: 15, fontWeight: "700" }}>
                {userData?.email || "Não informado"}
              </Text>
            </View>

            {/* Verification Success Notice */}
            <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "rgba(2, 222, 149, 0.05)", borderRadius: 16, padding: 12, borderWidth: 1, borderColor: "rgba(2, 222, 149, 0.1)", marginBottom: 24 }}>
              <ShieldCheck size={18} color="#02de95" style={{ marginRight: 10 }} />
              <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, flex: 1, lineHeight: 16 }}>
                Conta verificada e integrada com segurança via login unificado Leva+.
              </Text>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={{
                width: "100%",
                height: 52,
                borderRadius: 16,
                backgroundColor: "#02de95",
                justifyContent: "center",
                alignItems: "center"
              }}
              onPress={() => setShowBasicDataModal(false)}
            >
              <Text style={{ color: "#091A2F", fontSize: 16, fontWeight: "800" }}>
                Fechar
              </Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  header: {
    marginTop: 20,
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  welcomeText: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
    fontWeight: "600",
  },
  statusHeader: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "900",
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(239,68,68,0.1)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
  },
  progressCard: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: '100%'
  },
  progressLabel: {
    color: "#02de95",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  progressMainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  stepsZone: {
    flex: 1,
  },
  stepsHeadline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 16,
  },
  stepCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  stepCardCompleted: {
    backgroundColor: "rgba(2,222,149,0.03)",
    borderColor: "rgba(2,222,149,0.12)",
  },
  stepCardProcessing: {
    backgroundColor: "rgba(2,222,149,0.02)",
  },
  stepCardClickable: {
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  stepIconContainer: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    justifyContent: "center",
    alignItems: "center",
  },
  stepContent: {
    flex: 1,
    marginLeft: 16,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
  stepDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  stepIndicator: {
    alignItems: "center",
    justifyContent: "center",
  },
  continueBtn: {
    backgroundColor: "#02de95",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 12,
  },
  continueBtnText: {
    color: "#091A2F",
    fontSize: 16,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  supportCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 22,
    padding: 16,
    marginTop: 20,
  },
  supportInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  supportTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  supportSub: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
  },
  supportBtn: {
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  supportBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  // Modal Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(9, 26, 47, 0.85)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0B1E36",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    maxHeight: "85%",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
  },
  modalHeader: {
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    marginTop: 8,
  },
  modalSub: {
    color: "rgba(255, 255, 255, 0.5)",
    fontSize: 13,
    fontWeight: "500",
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 16,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  tabButtonActive: {
    backgroundColor: "#02de95",
  },
  tabText: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 13,
    fontWeight: "700",
  },
  tabTextActive: {
    color: "#091A2F",
    fontWeight: "800",
  },
  modalScroll: {
    flexGrow: 0,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    borderRadius: 16,
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalCancelText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 15,
    fontWeight: "700",
  },
  modalSaveBtn: {
    flex: 2,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#02de95",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  modalSaveText: {
    color: "#091A2F",
    fontSize: 15,
    fontWeight: "900",
  },

  // Analysis Screen Styles
  analysisIconOuter: { alignSelf: "center", width: 100, height: 100, justifyContent: "center", alignItems: "center", marginBottom: 24, marginTop: 20 },
  analysisPulse: { position: "absolute", width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(2,222,149,0.15)", borderWidth: 1, borderColor: "rgba(2,222,149,0.3)" },
  analysisIconInner: { width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(2,222,149,0.1)", justifyContent: "center", alignItems: "center", borderWidth: 2, borderColor: "rgba(2,222,149,0.4)", shadowColor: "#02de95", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8 },
  analysisBadge: { color: "#02de95", fontSize: 11, fontWeight: "900", letterSpacing: 1.5, backgroundColor: "rgba(2,222,149,0.1)", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, overflow: "hidden", marginBottom: 12 },
  analysisTitle: { color: "#fff", fontSize: 26, fontWeight: "800", marginBottom: 12, textAlign: "center" },
  analysisSubtitle: { color: "rgba(255,255,255,0.7)", fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 10 },
  analysisNoticeBox: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", borderRadius: 16, padding: 16, marginVertical: 24 },
  analysisNoticeText: { color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 20, textAlign: "center" },
  refreshBtn: { flexDirection: "row", width: "100%", height: 54, borderRadius: 16, backgroundColor: "#02de95", justifyContent: "center", alignItems: "center", shadowColor: "#02de95", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 4 },
  refreshBtnText: { color: "#091A2F", fontSize: 16, fontWeight: "800" },
  analysisSupportBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)", flexDirection: "row", justifyContent: "center", alignItems: "center" },
  analysisSupportBtnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
  analysisLogoutBtn: { flex: 1, height: 50, borderRadius: 14, backgroundColor: "rgba(239,68,68,0.05)", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)", flexDirection: "row", justifyContent: "center", alignItems: "center" },
  analysisLogoutBtnText: { color: "#ef4444", fontSize: 15, fontWeight: "600" }
});
