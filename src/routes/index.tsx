import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import AuthRoutes from "./auth.routes";
import ClientBoot from "./ClientBoot";
import DriverBoot from "./DriverBoot";
import { useAuthStore } from "../context/authStore";
import { getProfile } from "../services/auth.service";

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
    logout,
  } = useAuthStore();
  const [resolvingProfile, setResolvingProfile] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function resolveProfileIfNeeded() {
      if (!hasHydrated) return;
      if (!isAuthenticated || !token) return;

      const needsUserType = !userType;
      const needsUserData = 
        !userData?.id || 
        (userType === "driver" && userData?.driverStatus !== "approved");

      if (!needsUserType && !needsUserData) return;

      setResolvingProfile(true);
      try {
        const response = await getProfile(token);
        const user = response?.data?.user;

        if (!mounted) return;

        if (!response.success || !user) {
          logout();
          return;
        }

        if (user.userType) {
          updateUserType(user.userType);
        }

        updateUserData({
          id: user._id,
          name: user.name,
          nome: user.name,
          email: user.email,
          telefone: user.phone || "",
          cidade: user.city || "",
          fotoPerfil: user.profilePhoto,
          googleId: user.googleId,
          aceitouTermos: Boolean(user.acceptedTerms),
          vehicleType: user.vehicleType,
          vehicleInfo: user.vehicleInfo,
          driverStatus: user.driverStatus || "none",
        });
      } catch {
        if (mounted) logout();
      } finally {
        if (mounted) setResolvingProfile(false);
      }
    }

    resolveProfileIfNeeded();

    return () => {
      mounted = false;
    };
  }, [
    token,
    logout,
  ]);

  useEffect(() => {
    if (!hasHydrated) return;
    if (isAuthenticated && !token) {
      logout();
    }
  }, [hasHydrated, isAuthenticated, token, logout]);

  if (!hasHydrated) {
    return <RouteFallbackLoader />;
  }

  if (!isAuthenticated) {
    return <AuthRoutes />;
  }

  if (resolvingProfile) {
    return <RouteFallbackLoader />;
  }

  if (userType === "client") {
    return <ClientBoot />;
  }

  if (userType === "driver") {
    return <DriverBoot />;
  }

  return <RouteFallbackLoader />;
}
