import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Modal, Alert, Image, KeyboardAvoidingView, Platform } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { NavigationContext } from "@react-navigation/native";
import { CheckCircle2, ShieldCheck, MapPin, CreditCard, MessageSquare, LogOut, FileText, User, ChevronRight } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "@/context/authStore";
import { colors } from "@/theme/colors";
import userService from "@/services/user.service";
import { getCurrentLocationAndAddress } from "@/utils/location";
import * as ImagePicker from "expo-image-picker";

export default function ClientOnboardingDashboard({ onContinue }: { onContinue: () => void }) {
  const navigation = React.useContext(NavigationContext);
  const isFocused = true; // No boot phase, we assume it's focused or handled by parent.
  const insets = useSafeAreaInsets();
  const { logout, userData, updateUserData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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
        
        // Update on backend
        const updated = await userService.updateProfile({ city: detectedCity });
        if (updated) {
          updateUserData({
            cidade: updated.cidade || updated.city || detectedCity,
            city: updated.city || updated.cidade || detectedCity,
          });
          setCityInput(updated.city || updated.cidade || detectedCity);
        }
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

  const handleUploadSelfie = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permissão necessária", "Precisamos de acesso à câmera para tirar sua foto de verificação facial.");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets?.[0]?.uri) return;

      const localUri = result.assets[0].uri;
      setUploadingSelfie(true);
      
      const remoteUrl = await userService.uploadProfilePhoto(localUri);
      
      updateUserData({
        fotoPerfil: remoteUrl,
      });

      Alert.alert("Sucesso", "Foto de verificação facial enviada com sucesso!");
    } catch (e: any) {
      console.error("[ClientOnboarding] Error uploading selfie:", e);
      Alert.alert("Erro", "Não foi possível enviar a imagem. Tente novamente.");
    } finally {
      setUploadingSelfie(false);
    }
  };

  const loadClientStatus = async () => {
    try {
      const profile = await userService.getProfile().catch(() => null);
      if (profile) {
        updateUserData({
          cidade: profile.cidade || profile.city || "",
          city: profile.city || profile.cidade || "",
          cpf: profile.cpf || "",
          cnpj: profile.cnpj || "",
          phone: profile.phone || profile.telefone || "",
          telefone: profile.telefone || profile.phone || "",
          companyName: profile.companyName || "",
          companyEmail: profile.companyEmail || "",
          companyPhone: profile.companyPhone || "",
          paymentMethods: profile.paymentMethods || [],
          fotoPerfil: profile.profilePhoto || "",
        });

        // Se o cliente ja preencheu CPF/CNPJ e fez a verificação facial, pula direto para o app!
        const alreadyCompliant = Boolean(
          (profile.cpf || profile.cnpj) && 
          profile.profilePhoto
        );
        if (alreadyCompliant) {
          onContinue();
          return;
        }
        
        // Seed fields
        setCpfInput(profile.cpf ? formatCPF(profile.cpf) : "");
        setNameInput("");
        setCnpjInput(profile.cnpj ? formatCNPJ(profile.cnpj) : "");
        setPhoneInput(profile.phone || profile.telefone ? formatPhone(profile.phone || profile.telefone || "") : "");
        setCompanyNameInput(profile.companyName || "");
        setCompanyEmailInput(profile.companyEmail || "");
        setCompanyPhoneInput(profile.companyPhone ? formatPhone(profile.companyPhone) : "");
        setCityInput(profile.city || profile.cidade || "");
        
        if (profile.cnpj) {
          setPersonType("PJ");
        } else {
          setPersonType("PF");
        }

        // If city is not set, run detection in background
        if (!profile.city && !profile.cidade) {
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

      const payload: any = {
        city: cityInput.trim(),
        phone: cleanPhone,
      };

      if (personType === "PF") {
        payload.cpf = cleanCPF;
        payload.name = nameInput.trim();
        payload.cnpj = ""; // Clear CNPJ if they switched to PF
        payload.companyName = "";
        payload.companyEmail = "";
        payload.companyPhone = "";
      } else {
        payload.cnpj = cleanCNPJ;
        payload.cpf = ""; // Clear CPF if they switched to PJ
        payload.companyName = companyNameInput.trim();
        payload.companyEmail = companyEmailInput.trim();
        payload.companyPhone = companyPhoneInput.replace(/\D/g, "");
      }

      const updatedUser = await userService.updateProfile(payload);
      if (updatedUser) {
        updateUserData({
          cidade: updatedUser.cidade || updatedUser.city || "",
          city: updatedUser.city || updatedUser.cidade || "",
          cpf: updatedUser.cpf || "",
          cnpj: updatedUser.cnpj || "",
          phone: updatedUser.phone || updatedUser.telefone || "",
          telefone: updatedUser.telefone || updatedUser.phone || "",
          companyName: updatedUser.companyName || "",
          companyEmail: updatedUser.companyEmail || "",
          companyPhone: updatedUser.companyPhone || "",
        });

        Alert.alert("Sucesso", "Dados cadastrais atualizados com sucesso!");
        setShowModal(false);
        onContinue();
      }
    } catch (err: any) {
      console.error("[ClientOnboarding] Error saving cadastral data:", err);
      const errMsg = err?.response?.data?.message || err?.message || "Não foi possível salvar os dados. Tente novamente.";
      if (errMsg.includes("coincidem") || errMsg.includes("batem") || errMsg.includes("CPF") || errMsg.includes("divergentes")) {
        Alert.alert("⚠️ Dados Divergentes", errMsg);
      } else {
        Alert.alert("Erro", errMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const hasCPFOrCNPJ = Boolean(userData?.cpf || userData?.cnpj);
  const hasPayment = Boolean(userData?.paymentMethods && userData.paymentMethods.length > 0);
  const hasSelfie = Boolean(userData?.fotoPerfil);

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
      status: hasCPFOrCNPJ ? ("completed" as const) : ("pending" as const),
      icon: FileText,
      action: () => setShowModal(true),
    },
    {
      id: "location",
      title: "Localização",
      desc: userData?.cidade ? `Cidade: ${userData.cidade}` : "Detectando sua cidade...",
      status: userData?.cidade ? ("completed" as const) : ("processing" as const),
      icon: MapPin,
      action: null,
    },
    {
      id: "facial",
      title: "Verificação Facial",
      desc: hasSelfie
        ? "Foto de rosto verificada"
        : uploadingSelfie
        ? "Enviando selfie..."
        : "Envie uma selfie nítida de rosto",
      status: hasSelfie
        ? ("completed" as const)
        : uploadingSelfie
        ? ("processing" as const)
        : ("pending" as const),
      icon: User,
      action: handleUploadSelfie,
    },
    {
      id: "payment",
      title: "Forma de Pagamento",
      desc: hasPayment ? "Cartão de crédito cadastrado" : "Adicione um cartão para facilitar",
      status: hasPayment ? ("completed" as const) : ("pending" as const),
      icon: CreditCard,
      action: () => navigation ? (navigation as any).navigate("PaymentsCenter") : null,
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

          <View style={styles.progressCard}>
            <LinearGradient
              colors={["rgba(2,222,149,0.05)", "transparent"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
            <View style={styles.progressTop}>
              <View>
                <Text style={styles.progressLabel}>Status da Conta</Text>
                <Text style={styles.progressMainText}>Você já pode pedir sua Leva!</Text>
              </View>
              <CheckCircle2 size={32} color="#02de95" />
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
                  isClickable && styles.stepCardClickable,
                ]}
                activeOpacity={0.8}
              >
                <View style={[
                  styles.stepIconContainer,
                  step.status === "completed" && { backgroundColor: "rgba(2,222,149,0.1)" },
                  step.status === "processing" && { backgroundColor: "rgba(2,222,149,0.05)" },
                ]}>
                  <Icon 
                    size={22} 
                    color={step.status === "completed" ? "#02de95" : "rgba(255,255,255,0.5)"} 
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
              (!hasCPFOrCNPJ || !hasSelfie) && { backgroundColor: "rgba(2, 222, 149, 0.4)" }
            ]}
            onPress={() => {
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
});
