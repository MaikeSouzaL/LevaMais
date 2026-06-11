import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AuthRoutes from "./auth.routes";
import ClientBoot from "./ClientBoot";
import DriverBoot from "./DriverBoot";
import { useAuthStore, type UserType } from "../context/authStore";
import {
  getProfile,
  updateProfile,
} from "../services/appwrite-auth.service";
import { supabase } from "../lib/supabase";
import TermsScreen from "../screens/(public)/TermsScreen";
import notificationService from "../services/notification.service";

function RouteFallbackLoader() {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#091A2F",
      }}
    >
      <Text style={{ color: "rgba(255,255,255,0.75)" }}>
        Preparando seu perfil...
      </Text>
    </View>
  );
}

export default function Routes() {
  const {
    hasHydrated,
    isAuthenticated,
    userType,
    userData,
    token,
    updateUserType,
    updateUserData,
    login,
    logout,
  } = useAuthStore();
  const [resolvingProfile, setResolvingProfile] = useState(false);

  // Sincroniza sessão Supabase → authStore ao iniciar o app
  useEffect(() => {
    let mounted = true;

    async function syncSupabaseSession() {
      if (!hasHydrated) return;

      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        if (isAuthenticated) logout();
        return;
      }

      // Já está autenticado com dados completos — não precisa recarregar
      if (isAuthenticated && userType && userData?.id) return;

      setResolvingProfile(true);
      try {
        const profile = await getProfile(session.user.id);
        if (!mounted) return;

        if (!profile) {
          logout();
          return;
        }

        if (!profile.role) {
          if (isAuthenticated) {
            logout();
          }
          return;
        }

        login(
          (profile.role as "client" | "driver") ?? null,
          {
            id: session.user.id,
            name: profile.full_name || "",
            nome: profile.full_name || "",
            email: session.user.email || "",
            telefone: profile.phone || "",
            cidade: profile.city || "",
            fotoPerfil: profile.avatar_url || undefined,
            aceitouTermos: profile.accepted_terms,
            tourSeen: profile.tour_seen,
          },
          session.access_token,
        );
      } catch {
        if (mounted) logout();
      } finally {
        if (mounted) setResolvingProfile(false);
      }
    }

    syncSupabaseSession();

    // Listener de mudanças de sessão (token refresh, logout externo).
    // IMPORTANTE: só deslogar em evento SIGNED_OUT explícito. Não derrubar por
    // `!session` — eventos como INITIAL_SESSION podem chegar sem sessão durante
    // o onboarding e destruiriam a sessão recém-criada (quebrava os UPDATEs no perfil).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        if (event === "SIGNED_OUT") {
          if (useAuthStore.getState().isAuthenticated) logout();
        } else if (event === "TOKEN_REFRESHED" && session) {
          updateUserData({ token: session.access_token } as any);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [hasHydrated]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && !token) {
      logout();
    }
  }, [hasHydrated, isAuthenticated, token, logout]);

  useEffect(() => {
    if (isAuthenticated && token && userData?.id) {
      notificationService.initialize().catch((err) => {
        console.error("Erro ao inicializar serviço de notificações:", err);
      });
    }
  }, [isAuthenticated, token, userData?.id]);

  if (!hasHydrated) {
    return <RouteFallbackLoader />;
  }

  if (!isAuthenticated) {
    return <AuthRoutes />;
  }

  if (resolvingProfile) {
    return <RouteFallbackLoader />;
  }

  // ⚖️ LEGAL GATEKEEPER: todos os usuários autenticados devem aceitar os termos
  if (!userData?.aceitouTermos) {
    const handleAccept = async () => {
      try {
        if (userData?.id) {
          await updateProfile(userData.id, { accepted_terms: true });
        }
        updateUserData({ aceitouTermos: true });
      } catch (e) {
        console.error("Erro ao aceitar termos:", e);
      }
    };
    return <TermsScreen onAccept={handleAccept} />;
  }

  if (userType === "driver") {
    return <DriverBoot />;
  }

  if (userType === "client") {
    return <ClientBoot />;
  }

  // Conta autenticada que NÃO é cliente nem entregador (ex.: admin do painel web,
  // ou perfil sem role). O app é só para clientes/entregadores — em vez de travar
  // no loader "Preparando seu perfil", mostra um aviso com opção de sair.
  return <BlockedAccountScreen email={userData?.email} role={userType} onLogout={logout} />;
}

function BlockedAccountScreen({
  email,
  role,
  onLogout,
}: {
  email?: string;
  role?: UserType;
  onLogout: () => void;
}) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#091A2F",
        padding: 28,
      }}
    >
      <Text style={{ color: "#fff", fontSize: 20, fontWeight: "800", marginBottom: 12, textAlign: "center" }}>
        Conta sem acesso ao app
      </Text>
      <Text
        style={{
          color: "rgba(255,255,255,0.65)",
          fontSize: 14,
          textAlign: "center",
          lineHeight: 21,
          marginBottom: 28,
        }}
      >
        {email ? `O e-mail ${email} ` : "Esta conta "}
        {role === "admin"
          ? "é uma conta de administrador (painel web)."
          : "não tem um perfil de cliente ou entregador."}
        {"\n"}Use uma conta de cliente ou entregador para acessar o aplicativo.
      </Text>
      <TouchableOpacity
        onPress={onLogout}
        style={{
          height: 54,
          paddingHorizontal: 36,
          borderRadius: 16,
          backgroundColor: "#02de95",
          alignItems: "center",
          justifyContent: "center",
        }}
        activeOpacity={0.85}
      >
        <Text style={{ color: "#091A2F", fontWeight: "900", fontSize: 16 }}>Sair e usar outra conta</Text>
      </TouchableOpacity>
    </View>
  );
}
