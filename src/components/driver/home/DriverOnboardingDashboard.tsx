import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { MotiView, AnimatePresence } from "moti";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { CheckCircle2, Clock, ChevronRight, FileText, ShieldCheck, Car, MessageSquare, LogOut, AlertCircle } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import userService from "@/services/user.service";
import driverService from "@/services/driver.service";
import { useAuthStore } from "@/context/authStore";
import { colors } from "@/theme/colors";

export default function DriverOnboardingDashboard() {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { logout, userData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [hasVehicle, setHasVehicle] = useState(false);
  const [hasPersonalDocs, setHasPersonalDocs] = useState(false);
  const [driverStatus, setDriverStatus] = useState("none");
  const [progress, setProgress] = useState(0);

  const loadOnboardingStatus = async () => {
    try {
      const [profile, fleetData] = await Promise.all([
        userService.getProfile().catch(() => null),
        driverService.listVehicles().catch(() => ({ vehicles: [] })),
      ]);

      if (profile) {
        // Verify CNH & Selfie
        const d = profile.driverDocuments || {};
        const hasCNH = Boolean(d.cnhFront && d.cnhBack);
        const hasSelfie = Boolean(d.selfie);
        setHasPersonalDocs(hasCNH && hasSelfie);
        setDriverStatus(profile.driverStatus || "none");
      }

      if (fleetData && fleetData.vehicles) {
        setHasVehicle(fleetData.vehicles.length > 0);
      }

      // Calculate custom completion scale
      let completedSteps = 1; // Step 1: Account Created is always done.
      if (profile && profile.driverDocuments && profile.driverDocuments.selfie && profile.driverDocuments.cnhFront) {
        completedSteps += 1;
      }
      if (fleetData && fleetData.vehicles && fleetData.vehicles.length > 0) {
        completedSteps += 1;
      }
      if (profile?.driverStatus === "approved") {
        completedSteps += 1;
      }

      setProgress(Math.round((completedSteps / 4) * 100));
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

  const onboardingSteps = [
    {
      id: "account",
      title: "Cadastro Básico",
      desc: "Acesso e credenciais ativadas",
      status: "completed",
      icon: ShieldCheck,
      action: null,
    },
    {
      id: "docs",
      title: "Documentação Pessoal",
      desc: "Habilitação (CNH) e Selfie facial",
      status: hasPersonalDocs ? "completed" : "pending",
      icon: FileText,
      action: () => navigation.navigate("DriverDocuments"),
    },
    {
      id: "vehicle",
      title: "Veículo para Trabalho",
      desc: "Cadastrar dados e documento do carro/moto",
      status: hasVehicle ? "completed" : "pending",
      icon: Car,
      action: () => navigation.navigate("DriverVehicle"),
    },
    {
      id: "approval",
      title: "Aprovação do Perfil",
      desc: driverStatus === "pending" ? "Em análise operacional" : driverStatus === "rejected" ? "Revisão necessária" : "Aguardando envio de itens",
      status: driverStatus === "approved" ? "completed" : (hasPersonalDocs && hasVehicle) ? "processing" : "locked",
      icon: Clock,
      action: null,
    },
  ];

  return (
    <View style={styles.container}>
      {/* 🌌 Glass Backing allowing the map to peek through */}
      <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={["rgba(9,26,47,0.9)", "rgba(9,26,47,0.98)"]}
        style={StyleSheet.absoluteFill}
      />

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
            {driverStatus === "rejected" ? (
              <View style={styles.rejectedBanner}>
                <AlertCircle size={20} color="#ef4444" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rejectedTitle}>Revisão Necessária</Text>
                  <Text style={styles.rejectedDesc}>
                    Alguns de seus documentos foram rejeitados. Por favor, revise e envie novamente.
                  </Text>
                </View>
              </View>
            ) : null}

            <Text style={styles.stepsHeadline}>Checklist de Configuração</Text>

            <React.Fragment>
              {onboardingSteps.map((step) => {
                const Icon = step.icon;
                const isClickable = !!step.action && step.status !== "completed";

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
                      step.status === "processing" && { backgroundColor: "rgba(245,158,11,0.1)" },
                      step.status === "locked" && { opacity: 0.5 },
                    ]}>
                      <Icon 
                        size={22} 
                        color={
                          step.status === "completed" ? "#02de95" : 
                          step.status === "processing" ? "#f59e0b" : 
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
            onPress={() => navigation.navigate("DriverSupportCenter")}
          >
            <Text style={styles.supportBtnText}>Chat</Text>
          </TouchableOpacity>
        </MotiView>
      </ScrollView>
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
});
