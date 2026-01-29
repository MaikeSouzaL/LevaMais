import React from "react";
import { View, Text } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

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
   * @default "#0f231c"
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
  backgroundColor = "#0f231c",
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
          gap: 16,
        }}
      >
        {/* Ícone com círculo de fundo */}
        <View
          style={{
            width: 64,
            height: 64,
            borderRadius: 32,
            backgroundColor: `${accentColor}1F`, // 12% opacity
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MaterialIcons name="my-location" size={32} color={accentColor} />
        </View>

        {/* Título */}
        <Text
          style={{
            color: "#fff",
            fontSize: 18,
            fontWeight: "700",
          }}
        >
          {title}
        </Text>

        {/* Subtítulo */}
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
  );
}
