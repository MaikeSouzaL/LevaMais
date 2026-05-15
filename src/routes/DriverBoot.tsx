import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MotiView } from "moti";
const LogoImg = require("../assets/Logo/logo.png");

import DrawerDriverRoutes from "./drawer.driver.routes";
import rideService from "../services/ride.service";
import { useAuthStore } from "../context/authStore";
import userService from "../services/user.service";
import TermsScreen from "../screens/(public)/TermsScreen";

export default function DriverBoot() {
  const { userData, userType } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [initialRideId, setInitialRideId] = useState<string | null>(null);

  const status = userData?.driverStatus || "none";
  const isApproved = status === "approved";

  useEffect(() => {
    let mounted = true;

    // Só busca corrida ativa se já estiver aprovado
    if (!isApproved) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const res = await rideService.getActive();

        if (!mounted) return;

        if (res?.active && res.ride?._id) {
          setInitialRideId(res.ride._id);
        }
      } catch {
        // fluxo silencioso: se falhar, entra no DriverHome normalmente
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [isApproved]);

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#091A2F",
          padding: 24,
        }}
      >
        <View style={styles.logoWrapper}>
          <MotiView
            from={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: 0.6, scale: 1.1 }}
            transition={{ type: 'timing', duration: 2000, delay: 300 }}
            style={[StyleSheet.absoluteFill, styles.logoGlow]}
            pointerEvents="none"
          >
            <Image source={LogoImg} style={styles.logoImageGlow} resizeMode="contain" />
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.8, translateY: 15 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{
              type: 'spring',
              damping: 15,
              stiffness: 100,
              delay: 100,
            }}
          >
            <Image source={LogoImg} style={styles.logoImage} resizeMode="contain" />
          </MotiView>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.7)", marginTop: 32, fontWeight: '600', letterSpacing: 1 }}>
          Preparando ambiente...
        </Text>
      </View>
    );
  }

  if (userType === "driver") {
    return <DrawerDriverRoutes initialRideId={initialRideId} />;
  }

  return null;
}

const styles = StyleSheet.create({
  logoWrapper: {
    width: 220,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 220,
    height: 80,
  },
  logoImageGlow: {
    width: 220,
    height: 80,
    opacity: 0.5,
  },
  logoGlow: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#02de95",
    shadowRadius: 20,
    shadowOpacity: 0.6,
    shadowOffset: { width: 0, height: 0 },
  }
});

