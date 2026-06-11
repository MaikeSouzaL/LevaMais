import React from "react";
import { getLucideIcon } from "@/utils/iconMapper";

export interface IconProps {
  /** Nome do ícone (estilo Lucide ou legado Material/Ionicons). Resolvido para o componente Lucide. */
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
  className?: string;
}

/**
 * Ícone único do app — sempre Lucide.
 *
 * Substitui MaterialIcons/MaterialCommunityIcons/Ionicons/FontAwesome5/Feather.
 * Para dados dinâmicos (configs, listas), passe a string em `name`.
 * Em código novo, prefira importar o componente Lucide diretamente.
 */
export function Icon({ name, size = 24, color = "#000", strokeWidth, style, ...rest }: IconProps) {
  const LucideComponent = getLucideIcon(name);
  return <LucideComponent size={size} color={color} strokeWidth={strokeWidth} style={style} {...rest} />;
}

export default Icon;
