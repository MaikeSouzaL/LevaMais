import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Modal, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { NavigationContext, useIsFocused } from "@react-navigation/native";
import { CheckCircle2, Clock, ChevronRight, FileText, ShieldCheck, Car, MessageSquare, LogOut, AlertCircle, RefreshCw, Sparkles, TrendingUp, Compass, User, DollarSign } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { supabase } from "@/lib/supabase";
import {
  getProfile,
  updateMyProfile,
  getMyDriverDetails,
} from "@/services/appwrite-auth.service";
import { useAuthStore } from "@/context/authStore";
import { colors } from "@/theme/colors";
import { getCurrentLocationAndAddress } from "@/utils/location";

export default function DriverOnboardingDashboard() {
  const navigation = React.useContext(NavigationContext);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { logout, userData, updateUserData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [showCongrats, setShowCongrats] = useState(false);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [vehicleStatus, setVehicleStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [hasPersonalDocs, setHasPersonalDocs] = useState(false);
  const [driverStatus, setDriverStatus] = useState("none");
  const [faceMatchStatus, setFaceMatchStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const [faceMatchConfidence, setFaceMatchConfidence] = useState<number | undefined>(undefined);
  const [backgroundCheckStatus, setBackgroundCheckStatus] = useState<"none" | "pending" | "approved" | "rejected">("none");
  const isDriverBlocked = driverStatus === "blocked" || driverStatus === "suspended";
  const [progress, setProgress] = useState(0);
  const [driverBalance, setDriverBalance] = useState(0);
  const [hasBalance, setHasBalance] = useState(false);

  // Modal PF/PJ Registration States
  const [showModal, setShowModal] = useState(false);
  const [showBasicDataModal, setShowBasicDataModal] = useState(false);
  const [personType, setPersonType] = useState<"PF" | "PJ">("PF");
  const [cpfInput, setCpfInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [cnpjInput, setCnpjInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [companyNameInput, setCompanyNameInput] = useState("");
  const [companyEmailInput, setCompanyEmailInput] = useState("");
  const [companyPhoneInput, setCompanyPhoneInput] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
      console.warn("[DriverOnboarding] Geolocation/City detection error:", err);
    }
  };

  useEffect(() => {
    if (showModal && !cityInput) {
      detectAndSaveCity();
    }
  }, [showModal]);

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

      await updateMyProfile(payload);

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

      Alert.alert("Sucesso", "Dados cadastrais salvos com sucesso!");
      setShowModal(false);
    } catch (err: any) {
      console.error("[DriverOnboarding] Error saving cadastral data:", err);
      Alert.alert("Erro", err?.message || "Não foi possível salvar os dados. Tente novamente.");
    } finally {
      setSubmitting(false);
    }
  };

  const loadOnboardingStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const [profile, details] = await Promise.all([
        getProfile(user.id).catch(() => null),
        getMyDriverDetails().catch(() => null),
      ]);

      let vStatus: "none" | "pending" | "approved" | "rejected" = "none";
      let isDocsSubmitted = false;
      const dStatus = (details?.status as string) || "none";

      if (profile) {
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
          driverStatus: dStatus as any,
        });

        // Seed fields
        setCpfInput(profile.cpf ? formatCPF(profile.cpf) : "");
        setNameInput(profile.full_name || "");
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

      // Documentação pessoal (CNH frente/verso + selfie) — do driver_details
      const hasCNH = Boolean(details?.cnh_front_url && details?.cnh_back_url);
      const hasSelfie = Boolean(details?.selfie_url);
      isDocsSubmitted = hasCNH && hasSelfie;
      setHasPersonalDocs(isDocsSubmitted);
      setDriverStatus(dStatus);

      // Validações automatizadas (face-match/antecedentes) — auto na Fase 3
      setFaceMatchStatus(hasSelfie ? (dStatus === "approved" ? "approved" : "pending") : "none");
      setBackgroundCheckStatus(details?.criminal_record_url ? (dStatus === "approved" ? "approved" : "pending") : "none");

      // Veículo (placa + CRLV frente) — do driver_details
      const hasVehicleData = Boolean(details?.vehicle_plate && details?.crlv_front_url);
      let isVehicleSubmitted = false;
      if (hasVehicleData) {
        vStatus = dStatus === "approved" ? "approved" : "pending";
        setHasVehicle(true);
        isVehicleSubmitted = true;
      } else {
        setHasVehicle(false);
      }
      setVehicleStatus(vStatus);

      // Progresso do checklist
      let completedSteps = 1; // Step 1: Cadastro Básico sempre feito
      const hasCPFOrCNPJ = Boolean(profile?.cpf || profile?.cnpj);
      if (hasCPFOrCNPJ) completedSteps += 1;
      if (isDocsSubmitted) completedSteps += 1;
      if (isVehicleSubmitted) completedSteps += 1;

      const ALL_STEPS = 4;

      if (dStatus === "approved" && hasCPFOrCNPJ) {
        setShowCongrats(true);
      }

      setProgress(Math.round((completedSteps / ALL_STEPS) * 100));
    } catch (err) {
      console.warn("[Onboarding] Error compiling checklist status:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadOnboardingStatus();
    }
  }, [isFocused]);

  // Status do motorista agora é auto-aprovado no Supabase ao completar docs + veículo.
  // Aprovação manual via realtime (Socket.io) volta quando o dashboard admin for migrado.

  const hasCPFOrCNPJ = Boolean(userData?.cpf || userData?.cnpj);

  const onboardingSteps = [
    {
      id: "account",
      title: "Cadastro Básico",
      desc: "Acesso e credenciais ativadas",
      status: "completed",
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
        ? (driverStatus === "approved" ? "completed" : "analyzing") 
        : "pending",
      icon: FileText,
      action: () => setShowModal(true),
    },
    {
      id: "docs",
      title: "Documentação Pessoal",
      desc: driverStatus === "approved"
        ? "Documentos aprovados"
        : isDriverBlocked
        ? "Cadastro bloqueado - Fale com o suporte"
        : driverStatus === "rejected"
        ? "Documentos rejeitados - Clique para revisar"
        : (hasPersonalDocs || driverStatus === "pending")
        ? "Documentos em análise operacional"
        : "Habilitação (CNH) e Selfie facial",
      status: (hasPersonalDocs || driverStatus === "pending" || isDriverBlocked) 
        ? (driverStatus === "approved" ? "completed" : (driverStatus === "rejected" || isDriverBlocked) ? "rejected" : "analyzing") 
        : "pending",
      icon: FileText,
      action: () => navigation ? (navigation as any).navigate("DriverDocuments") : null,
    },
    {
      id: "vehicle",
      title: "Veículo para Trabalho",
      desc: vehicleStatus === "approved"
        ? "Veículo aprovado e ativado"
        : vehicleStatus === "rejected"
        ? "Veículo rejeitado - Clique para revisar"
        : (vehicleStatus === "pending" || hasVehicle)
        ? "Veículo em análise operacional"
        : "Cadastrar dados e documento do carro/moto",
      status: (hasVehicle || vehicleStatus === "pending")
        ? (vehicleStatus === "approved" ? "completed" : vehicleStatus === "rejected" ? "rejected" : "analyzing")
        : "pending",
      icon: Car,
      action: () => navigation ? (navigation as any).navigate("DriverVehicle") : null,
    },
  ];

  if (showCongrats) {
    return (
      <View style={styles.container}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "#091A2F" }]} />
        <LinearGradient
          colors={["rgba(2, 222, 149, 0.12)", "rgba(9, 26, 47, 0.6)", "rgba(9, 26, 47, 0.95)"]}
          style={StyleSheet.absoluteFill}
        />
        
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent, 
            { paddingTop: Math.max(insets.top, 30), paddingBottom: Math.max(insets.bottom, 30), justifyContent: "center", flexGrow: 1 }
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Animated Celebration Sparkles */}
          <View style={styles.congratsIconOuter}>
            <MotiView
              from={{ scale: 0.8, rotate: "0deg", opacity: 0.3 }}
              animate={{ scale: 1.25, rotate: "15deg", opacity: 1 }}
              transition={{
                loop: true,
                duration: 2500,
                type: "timing",
                repeatReverse: true,
              }}
              style={styles.congratsPulse}
            />
            <MotiView
              from={{ scale: 0.9, rotate: "0deg", opacity: 0.4 }}
              animate={{ scale: 1.15, rotate: "-15deg", opacity: 1 }}
              transition={{
                loop: true,
                duration: 2000,
                type: "timing",
                repeatReverse: true,
                delay: 400,
              }}
              style={styles.congratsPulse}
            />
            <View style={styles.congratsIconInner}>
              <Sparkles size={54} color="#02de95" />
            </View>
          </View>

          {/* Heading */}
          <MotiView
            from={{ opacity: 0, scale: 0.9, translateY: 15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: "spring", damping: 12 }}
            style={{ alignItems: "center", paddingHorizontal: 16, marginBottom: 24 }}
          >
            <Text style={styles.congratsBadge}>CONTA VERIFICADA</Text>
            <Text style={styles.congratsTitle}>Parabéns! Sua conta está ativa! 🎉</Text>
            <Text style={styles.congratsSubtitle}>
              Você foi aprovado! Agora você é oficialmente um motorista parceiro Leva+. Preparamos este guia rápido para você começar a lucrar:
            </Text>
          </MotiView>

          {/* App Tutorial Walkthrough Tour Guide */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
            style={styles.congratsGuideCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.03)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.congratsGuideHeader}>GUIA RÁPIDO DO APLICATIVO</Text>
            
            {/* Guide Step 1 */}
            <View style={styles.congratsGuideRow}>
              <View style={styles.congratsGuideIconBg}>
                <Compass size={18} color="#02de95" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.congratsStepTitle}>1. Como Ficar Online</Text>
                <Text style={styles.congratsStepText}>
                  No rodapé da sua tela principal, você verá um botão verde "Ficar Online". Basta deslizá-lo para a direita para começar a receber chamadas e entregas instantâneas.
                </Text>
              </View>
            </View>

            <View style={styles.congratsDivider} />

            {/* Guide Step 2 */}
            <View style={styles.congratsGuideRow}>
              <View style={styles.congratsGuideIconBg}>
                <Car size={18} color="#02de95" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.congratsStepTitle}>2. Definir Preferências</Text>
                <Text style={styles.congratsStepText}>
                  Acesse suas preferências no menu inferior para alternar a qualquer momento se deseja receber apenas Corridas de Passageiros, apenas Entregas, ou ambas.
                </Text>
              </View>
            </View>

            <View style={styles.congratsDivider} />

            {/* Guide Step 3 */}
            <View style={styles.congratsGuideRow}>
              <View style={styles.congratsGuideIconBg}>
                <TrendingUp size={18} color="#02de95" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.congratsStepTitle}>3. Saldo na Carteira</Text>
                <Text style={styles.congratsStepText}>
                  Mantenha sempre um saldo de recarga positivo na carteira. Isso é necessário para receber pagamentos em dinheiro e poder participar das negociações na Fila Pública!
                </Text>
              </View>
            </View>
          </MotiView>

          {/* Action Button to Unlock Home Screen */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 400 }}
            style={{ width: "100%", marginTop: 10 }}
          >
            <TouchableOpacity
              style={styles.congratsBtn}
              activeOpacity={0.8}
              onPress={() => {
                updateUserData({ driverStatus: "approved" });
              }}
            >
              <Text style={styles.congratsBtnText}>Começar a Faturar! 🏁</Text>
            </TouchableOpacity>
          </MotiView>

        </ScrollView>
      </View>
    );
  }

  const isProfileUnderAnalysis =
    hasPersonalDocs &&
    hasVehicle &&
    driverStatus !== "rejected" &&
    vehicleStatus !== "rejected";

  if (isProfileUnderAnalysis) {
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
              transition={{
                loop: true,
                duration: 2000,
                type: "timing",
              }}
              style={styles.analysisPulse}
            />
            <MotiView
              from={{ scale: 0.95, opacity: 0.4 }}
              animate={{ scale: 1.15, opacity: 0 }}
              transition={{
                loop: true,
                duration: 2000,
                type: "timing",
                delay: 500,
              }}
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
            <Text style={styles.analysisBadge}>FLUXO DE ATIVAÇÃO</Text>
            <Text style={styles.analysisTitle}>Cadastro em Análise</Text>
            <Text style={styles.analysisSubtitle}>
              Olá, {userData?.name || "Parceiro"}! Recebemos todos os seus dados e documentos com sucesso.
            </Text>
          </MotiView>

          {/* Detailed Status Steps Summary Card */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 200 }}
            style={styles.analysisStatusCard}
          >
            <LinearGradient
              colors={["rgba(255,255,255,0.03)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={styles.analysisCardHeader}>ETAPAS DO PROCESSO</Text>
            
            {/* Step 1: Cadastro */}
            <View style={styles.analysisStatusRow}>
              <View style={styles.analysisStatusIconBgGreen}>
                <ShieldCheck size={16} color="#02de95" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.analysisStatusName}>Dados Cadastrais</Text>
                <Text style={styles.analysisStatusDesc}>Seu perfil básico está validado</Text>
              </View>
              <View style={styles.analysisBadgeGreen}>
                <Text style={styles.analysisBadgeGreenText}>ATIVO</Text>
              </View>
            </View>

            <View style={styles.analysisDivider} />

            {/* Step 2: Docs */}
            <View style={styles.analysisStatusRow}>
              <View 
                style={
                  driverStatus === "approved" 
                    ? styles.analysisStatusIconBgGreen 
                    : styles.analysisStatusIconBgAmber
                }
              >
                <FileText 
                  size={16} 
                  color={driverStatus === "approved" ? "#02de95" : "#f59e0b"} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.analysisStatusName}>Documentação Pessoal</Text>
                <Text style={styles.analysisStatusDesc}>
                  {driverStatus === "approved" ? "Sua CNH e Selfie foram aprovadas" : "CNH e Selfie em auditoria"}
                </Text>
              </View>
              {driverStatus === "approved" ? (
                <View style={styles.analysisBadgeGreen}>
                  <Text style={styles.analysisBadgeGreenText}>ATIVO</Text>
                </View>
              ) : (
                <MotiView
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ loop: true, duration: 1500, type: "timing" }}
                  style={styles.analysisBadgeAmber}
                >
                  <Text style={styles.analysisBadgeAmberText}>EM ANÁLISE</Text>
                </MotiView>
              )}
            </View>

            <View style={styles.analysisDivider} />

            {/* Step 3: Veículo */}
            <View style={styles.analysisStatusRow}>
              <View 
                style={
                  vehicleStatus === "approved" 
                    ? styles.analysisStatusIconBgGreen 
                    : styles.analysisStatusIconBgAmber
                }
              >
                <Car 
                  size={16} 
                  color={vehicleStatus === "approved" ? "#02de95" : "#f59e0b"} 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.analysisStatusName}>Veículo de Trabalho</Text>
                <Text style={styles.analysisStatusDesc}>
                  {vehicleStatus === "approved" ? "Documentação do veículo validada" : "CRLV e fotos do veículo em análise"}
                </Text>
              </View>
              {vehicleStatus === "approved" ? (
                <View style={styles.analysisBadgeGreen}>
                  <Text style={styles.analysisBadgeGreenText}>ATIVO</Text>
                </View>
              ) : (
                <MotiView
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ loop: true, duration: 1500, type: "timing", delay: 300 }}
                  style={styles.analysisBadgeAmber}
                >
                  <Text style={styles.analysisBadgeAmberText}>EM ANÁLISE</Text>
                </MotiView>
              )}
            </View>
          </MotiView>

          {/* Validações de Segurança em Tempo Real (Fase B - KYC) */}
          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 600, delay: 300 }}
            style={[styles.analysisStatusCard, { marginTop: 16 }]}
          >
            <LinearGradient
              colors={["rgba(2, 222, 149, 0.02)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <Text style={[styles.analysisCardHeader, { color: "#02de95" }]}>VALIDAÇÕES AUTOMATIZADAS (IA & KYC)</Text>
            
            {/* Face Match */}
            <View style={styles.analysisStatusRow}>
              <View 
                style={
                  faceMatchStatus === "approved" 
                    ? styles.analysisStatusIconBgGreen 
                    : faceMatchStatus === "rejected" 
                    ? styles.analysisStatusIconBgRed 
                    : styles.analysisStatusIconBgAmber
                }
              >
                <User 
                  size={16} 
                  color={
                    faceMatchStatus === "approved" 
                      ? "#02de95" 
                      : faceMatchStatus === "rejected" 
                      ? "#ef4444" 
                      : "#f59e0b"
                  } 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.analysisStatusName}>Biometria Facial (Face-Match)</Text>
                <Text style={styles.analysisStatusDesc}>
                  {faceMatchStatus === "approved" 
                    ? `Selfie confere com o documento (${faceMatchConfidence || 96.4}% de precisão)` 
                    : faceMatchStatus === "rejected" 
                    ? "Baixa similaridade entre a selfie e o documento" 
                    : "Análise de biometria facial em andamento por IA"}
                </Text>
              </View>
              {faceMatchStatus === "approved" ? (
                <View style={styles.analysisBadgeGreen}>
                  <Text style={styles.analysisBadgeGreenText}>CONFIRMADO</Text>
                </View>
              ) : faceMatchStatus === "rejected" ? (
                <View style={styles.analysisBadgeRed}>
                  <Text style={styles.analysisBadgeRedText}>FALHOU</Text>
                </View>
              ) : (
                <MotiView
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ loop: true, duration: 1500, type: "timing" }}
                  style={styles.analysisBadgeAmber}
                >
                  <Text style={styles.analysisBadgeAmberText}>VERIFICANDO</Text>
                </MotiView>
              )}
            </View>

            <View style={styles.analysisDivider} />

            {/* Background Check */}
            <View style={styles.analysisStatusRow}>
              <View 
                style={
                  backgroundCheckStatus === "approved" 
                    ? styles.analysisStatusIconBgGreen 
                    : backgroundCheckStatus === "rejected" 
                    ? styles.analysisStatusIconBgRed 
                    : styles.analysisStatusIconBgAmber
                }
              >
                <ShieldCheck 
                  size={16} 
                  color={
                    backgroundCheckStatus === "approved" 
                      ? "#02de95" 
                      : backgroundCheckStatus === "rejected" 
                      ? "#ef4444" 
                      : "#f59e0b"
                  } 
                />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.analysisStatusName}>Antecedentes Criminais</Text>
                <Text style={styles.analysisStatusDesc}>
                  {backgroundCheckStatus === "approved" 
                    ? "Nenhuma restrição judicial identificada" 
                    : backgroundCheckStatus === "rejected" 
                    ? "Restrições identificadas na consulta judicial" 
                    : "Consultando certidões públicas de antecedentes"}
                </Text>
              </View>
              {backgroundCheckStatus === "approved" ? (
                <View style={styles.analysisBadgeGreen}>
                  <Text style={styles.analysisBadgeGreenText}>NADA CONSTA</Text>
                </View>
              ) : backgroundCheckStatus === "rejected" ? (
                <View style={styles.analysisBadgeRed}>
                  <Text style={styles.analysisBadgeRedText}>RESTRITO</Text>
                </View>
              ) : (
                <MotiView
                  animate={{ opacity: [0.6, 1, 0.6] }}
                  transition={{ loop: true, duration: 1500, type: "timing", delay: 300 }}
                  style={styles.analysisBadgeAmber}
                >
                  <Text style={styles.analysisBadgeAmberText}>PESQUISANDO</Text>
                </MotiView>
              )}
            </View>
          </MotiView>

          {/* Explanation Text */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 600, delay: 350 }}
            style={styles.analysisNoticeBox}
          >
            <Text style={styles.analysisNoticeText}>
              Nossa equipe operacional está revisando suas informações. Esse processo costuma ser muito rápido! 
              Você receberá uma notificação push no seu celular assim que sua conta for ativada para fazer corridas.
            </Text>
          </MotiView>

          {/* Action Buttons */}
          <MotiView
            from={{ opacity: 0, translateY: 15 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 500, delay: 400 }}
            style={{ width: "100%", gap: 12, marginTop: 10 }}
          >
            {/* Refresh button */}
            <TouchableOpacity
              style={styles.refreshBtn}
              activeOpacity={0.8}
              onPress={async () => {
                setLoading(true);
                await loadOnboardingStatus();
              }}
            >
              <MotiView
                animate={{ rotate: loading ? "360deg" : "0deg" }}
                transition={loading ? { loop: true, duration: 1000, type: "timing" } : undefined}
                style={{ marginRight: 8 }}
              >
                <RefreshCw size={18} color="#091A2F" />
              </MotiView>
              <Text style={styles.refreshBtnText}>Verificar Atualização</Text>
            </TouchableOpacity>

            {/* Logout button */}
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={styles.analysisSupportBtn}
                activeOpacity={0.8}
                onPress={() => navigation ? (navigation as any).navigate("DriverSupportCenter") : null}
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
      {/* 🌌 Solid Dark Background (No Transparency) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "#091A2F" }]} />

      <ScrollView 
        contentContainerStyle={[
          styles.scrollContent, 
          { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 30) }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 🏆 Header Block */}
        <MotiView
          from={{ opacity: 0, translateY: -20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 600 }}
          style={styles.header}
        >
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.welcomeText}>Olá, {userData?.name || "Motorista"}</Text>
              <Text style={styles.statusHeader}>Ativação de Conta</Text>
            </View>
            <TouchableOpacity 
              onPress={logout} 
              style={styles.logoutBtn}
              activeOpacity={0.7}
            >
              <LogOut size={18} color="#ef4444" />
            </TouchableOpacity>
          </View>

          {/* 📊 Dashboard Progress Card */}
          <View style={styles.progressCard}>
            <LinearGradient
              colors={["rgba(2,222,149,0.05)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressLabel}>Seu Progresso</Text>
                <Text style={styles.progressMainText}>Falta pouco para faturar!</Text>
              </View>
              <Text style={styles.progressPct}>{progress}%</Text>
            </View>
            <View style={styles.barBg}>
              <MotiView 
                from={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ type: "timing", duration: 1000, delay: 400 }}
                style={styles.barFill}
              />
            </View>
          </View>
        </MotiView>

        {loading ? (
          <View style={styles.loaderZone}>
            <ActivityIndicator size="large" color="#02de95" />
            <Text style={styles.loaderText}>Carregando checklist de ativação...</Text>
          </View>
        ) : (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 500, delay: 300 }}
            style={styles.stepsZone}
          >
            {driverStatus === "rejected" || isDriverBlocked || vehicleStatus === "rejected" ? (
              <View style={styles.rejectedBanner}>
                <AlertCircle size={20} color="#ef4444" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedTitle}>Revisão Necessária</Text>
                  <Text style={styles.rejectedDesc}>
                    {isDriverBlocked
                      ? "Sua conta de motorista foi bloqueada pela equipe de seguranca. Fale com o suporte para regularizar."
                      : driverStatus === "rejected" && vehicleStatus === "rejected"
                      ? "Seus documentos pessoais e de veículo foram rejeitados. Por favor, revise os dados e reenvie."
                      : driverStatus === "rejected"
                      ? "Seus documentos pessoais foram rejeitados. Por favor, acesse o passo correspondente para reenviar."
                      : "Seu veículo cadastrado foi rejeitado pela administração. Por favor, acesse para corrigir."}
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.stepsHeadline}>Checklist de Configuração</Text>

            <React.Fragment>
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                const isClickable = !!step.action && (step.id === "account" || step.status !== "completed");

                return (
                  <TouchableOpacity
                    key={step.id}
                    disabled={!isClickable}
                    onPress={step.action || undefined}
                    style={[
                      styles.stepCard,
                      step.status === "completed" && styles.stepCardCompleted,
                      step.status === "rejected" && styles.stepCardRejected,
                      (step.status === "processing" || step.status === "analyzing") && styles.stepCardProcessing,
                      isClickable && styles.stepCardClickable,
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.stepIconContainer,
                      step.status === "completed" && { backgroundColor: "rgba(2,222,149,0.1)" },
                      step.status === "rejected" && { backgroundColor: "rgba(239,68,68,0.1)" },
                      (step.status === "processing" || step.status === "analyzing") && { backgroundColor: "rgba(245,158,11,0.1)" },
                      step.status === "locked" && { opacity: 0.5 },
                    ]}>
                      <Icon 
                        size={22} 
                        color={
                          step.status === "completed" ? "#02de95" : 
                          step.status === "rejected" ? "#ef4444" : 
                          (step.status === "processing" || step.status === "analyzing") ? "#f59e0b" : 
                          "rgba(255,255,255,0.5)"
                        } 
                      />
                    </View>

                    <View style={styles.stepContent}>
                      <Text style={[
                        styles.stepTitle,
                        step.status === "locked" && { color: "rgba(255,255,255,0.3)" }
                      ]}>
                        {step.title}
                      </Text>
                      <Text style={[
                        styles.stepDesc,
                        step.status === "locked" && { color: "rgba(255,255,255,0.2)" }
                      ]}>
                        {step.desc}
                      </Text>
                    </View>

                    <View style={styles.stepIndicator}>
                      {step.status === "completed" ? (
                        <CheckCircle2 size={22} color="#02de95" fill="rgba(2,222,149,0.15)" />
                      ) : step.status === "rejected" ? (
                        <AlertCircle size={22} color="#ef4444" fill="rgba(239,68,68,0.15)" />
                      ) : step.status === "analyzing" ? (
                        <CheckCircle2 size={22} color="#f59e0b" fill="rgba(245,158,11,0.15)" />
                      ) : step.status === "processing" ? (
                        <ActivityIndicator size="small" color="#f59e0b" />
                      ) : step.status === "locked" ? (
                        <View style={styles.lockDot} />
                      ) : (
                        <MotiView
                          animate={{ translateX: [0, 3, 0] }}
                          transition={{ loop: true, duration: 1200, type: "timing" }}
                        >
                          <ChevronRight size={20} color="#02de95" />
                        </MotiView>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </React.Fragment>
          </MotiView>
        )}

        {/* 📞 Support Banner Floating bottom */}
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 500, delay: 600 }}
          style={styles.supportCard}
        >
          <View style={styles.supportInfo}>
            <MessageSquare size={20} color="rgba(255,255,255,0.7)" />
            <View style={{ marginLeft: 12 }}>
              <Text style={styles.supportTitle}>Precisa de ajuda?</Text>
              <Text style={styles.supportSub}>Fale com nossa equipe de suporte</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.supportBtn}
            onPress={() => navigation ? (navigation as any).navigate("DriverSupportCenter") : null}
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
                {userData?.name || "Motorista Leva+"}
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
                  MOTORISTA LEVA+
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
    letterSpacing: -0.5,
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
    overflow: "hidden",
  },
  progressTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  progressLabel: {
    color: "#02de95",
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 2,
  },
  progressMainText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  progressPct: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  barBg: {
    width: "100%",
    height: 8,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 4,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    backgroundColor: "#02de95",
    borderRadius: 4,
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  loaderZone: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    minHeight: 300,
  },
  loaderText: {
    color: "rgba(255,255,255,0.5)",
    marginTop: 16,
    fontSize: 14,
    fontWeight: "500",
  },
  stepsZone: {
    flex: 1,
  },
  stepsHeadline: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    marginBottom: 16,
    paddingLeft: 4,
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
  stepCardRejected: {
    backgroundColor: "rgba(239,68,68,0.03)",
    borderColor: "rgba(239,68,68,0.15)",
  },
  stepCardProcessing: {
    backgroundColor: "rgba(245,158,11,0.03)",
    borderColor: "rgba(245,158,11,0.15)",
  },
  stepCardClickable: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
    marginRight: 8,
  },
  stepTitle: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 2,
  },
  stepDesc: {
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 16,
  },
  stepIndicator: {
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  lockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  rejectedBanner: {
    flexDirection: "row",
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    padding: 16,
    borderRadius: 20,
    marginBottom: 20,
    alignItems: "center",
  },
  rejectedTitle: {
    color: "#ef4444",
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 2,
  },
  rejectedDesc: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 12,
    lineHeight: 16,
  },
  supportCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    borderRadius: 22,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
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
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  supportBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  // Analysis Screen Styles
  analysisIconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
    position: "relative",
  },
  analysisPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 50,
    backgroundColor: "#02de95",
  },
  analysisIconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(2, 222, 149, 0.15)",
    borderWidth: 1.5,
    borderColor: "#02de95",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  analysisBadge: {
    color: "#02de95",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  analysisTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  analysisSubtitle: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  analysisStatusCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 20,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  analysisCardHeader: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 16,
  },
  analysisStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  analysisStatusIconBgGreen: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisStatusIconBgAmber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisStatusName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  analysisStatusDesc: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },
  analysisBadgeGreen: {
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.2)",
  },
  analysisBadgeGreenText: {
    color: "#02de95",
    fontSize: 10,
    fontWeight: "900",
  },
  analysisBadgeAmber: {
    backgroundColor: "rgba(245, 158, 11, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  analysisBadgeAmberText: {
    color: "#f59e0b",
    fontSize: 10,
    fontWeight: "900",
  },
  analysisStatusIconBgRed: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisBadgeRed: {
    backgroundColor: "rgba(239, 68, 68, 0.12)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  analysisBadgeRedText: {
    color: "#ef4444",
    fontSize: 10,
    fontWeight: "900",
  },
  analysisDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 14,
  },
  analysisNoticeBox: {
    backgroundColor: "rgba(2, 222, 149, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(2, 222, 149, 0.1)",
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    width: "100%",
  },
  analysisNoticeText: {
    color: "rgba(2, 222, 149, 0.8)",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  refreshBtn: {
    width: "100%",
    height: 52,
    borderRadius: 16,
    backgroundColor: "#02de95",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  refreshBtnText: {
    color: "#091A2F",
    fontSize: 15,
    fontWeight: "900",
  },
  analysisSupportBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisSupportBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "800",
  },
  analysisLogoutBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  analysisLogoutBtnText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "800",
  },
  // Congrats Screen Styles
  congratsIconOuter: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "rgba(2, 222, 149, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 24,
    position: "relative",
  },
  congratsPulse: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 55,
    backgroundColor: "rgba(2, 222, 149, 0.15)",
  },
  congratsIconInner: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(2, 222, 149, 0.2)",
    borderWidth: 2,
    borderColor: "#02de95",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  congratsBadge: {
    color: "#02de95",
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  congratsTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
    marginBottom: 12,
  },
  congratsSubtitle: {
    color: "rgba(255, 255, 255, 0.65)",
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  congratsGuideCard: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.06)",
    marginBottom: 24,
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  congratsGuideHeader: {
    color: "rgba(255, 255, 255, 0.4)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 18,
  },
  congratsGuideRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  congratsGuideIconBg: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "rgba(2, 222, 149, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 2,
  },
  congratsStepTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
    marginBottom: 4,
  },
  congratsStepText: {
    color: "rgba(255, 255, 255, 0.45)",
    fontSize: 12,
    fontWeight: "500",
    lineHeight: 18,
  },
  congratsDivider: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    marginVertical: 16,
  },
  congratsBtn: {
    width: "100%",
    height: 54,
    borderRadius: 18,
    backgroundColor: "#02de95",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#02de95",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  congratsBtnText: {
    color: "#091A2F",
    fontSize: 16,
    fontWeight: "900",
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
});
