import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from "react-native";
import { MotiView } from "moti";
import { useNavigation, useIsFocused } from "@react-navigation/native";
import { CheckCircle2, ShieldCheck, MapPin, CreditCard, MessageSquare, LogOut } from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useAuthStore } from "@/context/authStore";
import { colors } from "@/theme/colors";

export default function ClientOnboardingDashboard({ onContinue }: { onContinue: () => void }) {
  const navigation = useNavigation<any>();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const { logout, userData } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (isFocused) {
      // Simulate loading/checking status
      const timer = setTimeout(() => {
        setLoading(false);
        // Clients are usually 100% after login and terms
        setProgress(100);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isFocused]);

  const onboardingSteps = [
    {
      id: "account",
      title: "Conta Ativada",
      desc: "Seu perfil Leva+ está pronto",
      status: "completed",
      icon: ShieldCheck,
      action: null,
    },
    {
      id: "location",
      title: "Localização",
      desc: userData?.cidade ? `Cidade: ${userData.cidade}` : "Detectando sua cidade...",
      status: userData?.cidade ? "completed" : "processing",
      icon: MapPin,
      action: null,
    },
    {
      id: "payment",
      title: "Forma de Pagamento",
      desc: "Adicione um cartão para facilitar",
      status: "pending",
      icon: CreditCard,
      action: () => navigation.navigate("PaymentsCenter"),
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
                  ) : (
                    <Text style={{ color: "#02de95", fontSize: 10, fontWeight: '900' }}>OPCIONAL</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
          
          <TouchableOpacity 
            style={styles.continueBtn}
            onPress={onContinue}
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
            onPress={() => navigation.navigate("SupportCenter")}
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
});
