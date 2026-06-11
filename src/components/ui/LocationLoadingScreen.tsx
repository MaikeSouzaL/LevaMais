import React from "react";
import { View, Text, Image, StyleSheet } from "react-native";
import { Icon } from "@/components/ui/Icon";
import { MotiView } from "moti";
const LogoImg = require("../../assets/Logo/logo.png");

interface LocationLoadingScreenProps {
  /**
   * Mensagem principal exibida durante o carregamento
   * @default "Localizando você..."
   */
  title?: string;
  /**
   * Mensagem secundária/subtítulo
   * @default "Aguarde enquanto buscamos sua posição"
   */
  subtitle?: string;
  /**
   * Cor de fundo da tela
   * @default "#091A2F"
   */
  backgroundColor?: string;
  /**
   * Cor do ícone e acentos
   * @default "#02de95"
   */
  accentColor?: string;
}

/**
 * Tela de loading moderna para quando estamos buscando a localização do usuário via GPS.
 * Exibe feedback visual elegante com ícone animado e mensagens customizáveis.
 *
 * @example
 * ```tsx
 * {!region && <LocationLoadingScreen />}
 * ```
 *
 * @example Com mensagens customizadas
 * ```tsx
 * <LocationLoadingScreen
 *   title="Buscando motoristas..."
 *   subtitle="Procurando motoristas próximos a você"
 * />
 * ```
 */
export function LocationLoadingScreen({
  title = "Localizando você...",
  subtitle = "Aguarde enquanto buscamos sua posição",
  backgroundColor = "#091A2F",
  accentColor = "#02de95",
}: LocationLoadingScreenProps) {
  return (
    <View
      style={{
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor,
      }}
    >
      <View
        style={{
          alignItems: "center",
          gap: 24,
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

        <View style={{ height: 12 }} />

        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${accentColor}1F`,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon name="my-location" size={32} color={accentColor} />
        </View>

        <View style={{ alignItems: "center", gap: 8 }}>
          <Text
            style={{
              color: "#fff",
              fontSize: 18,
              fontWeight: "700",
            }}
          >
            {title}
          </Text>

          <Text
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: 14,
              textAlign: "center",
              paddingHorizontal: 32,
            }}
          >
            {subtitle}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoWrapper: {
    width: 220,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 10,
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
