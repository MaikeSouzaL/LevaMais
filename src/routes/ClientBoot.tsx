import React, { useEffect, useState } from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { MotiView } from "moti";
const LogoImg = require("../assets/Logo/logo.png");

import DrawerClienteRoutes from "./drawer.cliente.routes";
import rideService from "../services/ride.service";
import {
  getCurrentLocation,
  obterEnderecoPorCoordenadas,
  checkLocationPermission,
  requestLocationPermission,
} from "../utils/location";
import { useClientCityStore } from "../context/clientCityStore";
import { logger } from "../utils/logger";
import { useAuthStore } from "../context/authStore";
import { getProfile as getSupabaseProfile, updateMyProfile } from "../services/appwrite-auth.service";
import TermsScreen from "../screens/(public)/TermsScreen";
import ClientOnboardingDashboard from "../components/client/home/ClientOnboardingDashboard";
import LocationPermissionScreen from "../screens/(public)/LocationPermissionScreen";

/** Resolve com `fallback` se a promise não completar em `ms` — evita boot travado por backend offline. */
function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default function ClientBoot() {
  const { userData, updateUserData, token } = useAuthStore();
  const setCity = useClientCityStore((s) => s.setCity);
  const [loading, setLoading] = useState(true);
  const [showLocationPermission, setShowLocationPermission] = useState(false);
  const [initialRideId, setInitialRideId] = useState<string | null>(null);


  const persistActivated = async () => {
    try {
      // tour_seen migrado para o Supabase (não depende mais do Node.js)
      await updateMyProfile({ tour_seen: true }).catch(() => {});
      updateUserData({ tourSeen: true });
    } catch {}
  };

  // Helper function to run the location detection and active ride fetch
  async function runBootstrap(hasPermission: boolean, mounted: boolean) {
    try {
      if (hasPermission) {
        logger.info("ClientBoot", "Iniciando detecção de cidade...");
        const coords = await getCurrentLocation();

        if (coords && mounted) {
          logger.debug("ClientBoot", "GPS obtido", {
            lat: coords.latitude,
            lng: coords.longitude,
          });

          const addr = await obterEnderecoPorCoordenadas(
            coords.latitude,
            coords.longitude,
          );
          logger.debug("ClientBoot", "Reverse geocode", {
            city: addr?.city,
            region: addr?.region,
            subregion: addr?.subregion,
          });

          // Mapa de estados para siglas (reverse geocode pode retornar nome completo)
          const estadoParaSigla: Record<string, string> = {
            Acre: "AC",
            Alagoas: "AL",
            Amapá: "AP",
            Amazonas: "AM",
            Bahia: "BA",
            Ceará: "CE",
            "Distrito Federal": "DF",
            "Espírito Santo": "ES",
            Goiás: "GO",
            Maranhão: "MA",
            "Mato Grosso": "MT",
            "Mato Grosso do Sul": "MS",
            "Minas Gerais": "MG",
            Pará: "PA",
            Paraíba: "PB",
            Paraná: "PR",
            Pernambuco: "PE",
            Piauí: "PI",
            "Rio de Janeiro": "RJ",
            "Rio Grande do Norte": "RN",
            "Rio Grande do Sul": "RS",
            Rondônia: "RO",
            Roraima: "RR",
            "Santa Catarina": "SC",
            "São Paulo": "SP",
            Sergipe: "SE",
            Tocantins: "TO",
          };

          // Converter estado para sigla
          const stateCode =
            addr?.region && addr.region.length > 2
              ? estadoParaSigla[addr.region] || addr.region
              : addr?.region;

          // Use reverse-geocode data directly (backend city endpoint removed)
          const cityName = addr?.city || addr?.subregion;
          if (cityName && stateCode) {
            setCity({
              cityId: `${cityName}-${stateCode}`.toLowerCase().replace(/\s+/g, '-'),
              name: cityName,
              state: stateCode,
              source: "gps",
              updatedAt: Date.now(),
            });
            logger.info("ClientBoot", "Cidade detectada via GPS", {
              name: cityName,
              state: stateCode,
            });
          } else {
            logger.warn("ClientBoot", "Cidade/estado não detectados via reverse geocode");
          }
        } else {
          logger.warn("ClientBoot", "GPS não disponível ou não montado");
        }
      } else {
        logger.info("ClientBoot", "Permissão de localização não concedida, pulando GPS");
      }

      // Busca perfil atualizado no Supabase (migrado — não depende mais do Node.js)
      const userId = userData?.id || userData?._id;
      if (userId && mounted) {
        const profile = await getSupabaseProfile(userId).catch(() => null);
        if (profile && mounted) {
          const hasDoc = Boolean(profile.cpf || profile.cnpj);
          const selfiePath = profile.selfie_url || null;
          const hasSelfie = Boolean(selfiePath);
          const vStatus =
            profile.kyc_status === "approved"
              ? "approved"
              : hasDoc || hasSelfie
                ? "pending"
                : "none";
          updateUserData({
            cidade: profile.city || "",
            city: profile.city || "",
            cpf: profile.cpf || "",
            cnpj: profile.cnpj || "",
            phone: profile.phone || "",
            telefone: profile.phone || "",
            fotoPerfil: profile.avatar_url || "",
            clientVerification: {
              status: vStatus,
              documents: { selfie: selfiePath },
              cpfStatus: hasDoc ? (vStatus === "approved" ? "valid" : "manual_review") : "unchecked",
              selfieStatus: hasSelfie ? (vStatus === "approved" ? "approved" : "pending") : "none",
            },
          } as any);
        }
      }

      // 2) Retomar corrida ativa — ainda no Node.js (migração Fase 4).
      // Blindado com timeout para o boot nunca travar se o backend estiver fora.
      try {
        const res = await withTimeout(rideService.getActive(), 4000, null);
        if (!mounted) return;
        if (res?.active && res.ride?._id) {
          const ride = res.ride;
          const activeTrackingStatuses = ["accepted", "driver_arriving", "arrived", "in_progress"];
          if (ride.driverId && activeTrackingStatuses.includes(ride.status)) {
            setInitialRideId(res.ride._id);
          }
        }
      } catch (rideErr) {
        logger.warn("ClientBoot", "getActive indisponível (backend Node offline?)", rideErr);
      }
    } catch (e: any) {
      logger.error("ClientBoot", "Erro no fluxo de bootstrap", e);
    } finally {
      if (mounted) setLoading(false);
    }
  }

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const alreadyGranted = await checkLocationPermission();
        if (!mounted) return;

        if (alreadyGranted) {
          await runBootstrap(true, mounted);
        } else {
          setShowLocationPermission(true);
          setLoading(false);
        }
      } catch (err) {
        logger.error("ClientBoot", "Erro ao verificar permissão inicial", err);
        if (mounted) {
          setShowLocationPermission(true);
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  if (showLocationPermission) {
    return (
      <LocationPermissionScreen
        onAllow={async () => {
          setShowLocationPermission(false);
          setLoading(true);
          const granted = await requestLocationPermission();
          await runBootstrap(granted, true);
        }}
        onSkip={async () => {
          setShowLocationPermission(false);
          setLoading(true);
          await runBootstrap(false, true);
        }}
      />
    );
  }

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
          Carregando...
        </Text>
      </View>
    );
  }

  const isClientCompliant = Boolean(
    (userData?.cpf || userData?.cnpj) &&
    userData?.clientVerification?.documents?.selfie &&
    userData?.clientVerification?.status === "approved"
  );

  // Se não estiver com os dados e a selfie aprovados, mostra dashboard de ativação
  if (!isClientCompliant) {
    return <ClientOnboardingDashboard onContinue={persistActivated} />;
  }

  return <DrawerClienteRoutes initialRideId={initialRideId} onActivated={persistActivated} />;
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
