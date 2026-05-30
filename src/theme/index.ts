/**
 * Design System - Index
 * Exporta todos os tokens do design system
 * Mantém compatibilidade com tema antigo
 */

export { colors, gradients } from './colors';
export { spacing, borderRadius, touchTargets, shadows } from './dimensions';
export { fonts, fontFamily, fontSize, lineHeight, fontWeight, textStyles } from './typography';
export { animations, transitions, duration as animationDuration, spring } from './animations';
export { breakpoints, containerPadding, maxWidth } from './layout';
export { iconSizes } from './icons';

// Tema antigo (mantido para compatibilidade)
const theme = {
  COLORS: {
    WHITE: "#FFFFFF",

    // Nova Paleta (Baseada na imagem enviada)
    BRAND_LIGHT: "#00E096", // Verde Neon Principal (Botões, Bordas, Ícones)
    BRAND_MID: "#00C483",   // Verde um pouco mais fechado
    BRAND_DARK: "#091A2F",  // Fundo Principal (Azul Profundo)

    SECONDARY_BLUE: "#38BDF8", // Azul "Recomendado" (Ciano/Sky)

    // Cores de Superfície (Cards)
    SURFACE_PRIMARY: "#11253E", // Card Ativo (Azul escuro levemente mais claro)
    SURFACE_SECONDARY: "#1E2D3D", // Card Inativo

    // Mantendo alguns tons de cinza úteis, mas ajustando para o dark mode
    GRAY_100: "#E1E1E6",
    GRAY_200: "#C4C4CC",
    GRAY_300: "#8D8D99",
    GRAY_400: "#7C7C8A",
    GRAY_500: "#505059",
    GRAY_600: "#323238",
    GRAY_700: "#29292E",
    GRAY_800: "#202024",

    BACKGROUND: "#091A2F", // Fundo principal agora é escuro
  },
  FONT_FAMILY: {
    REGULAR: "Inter_400Regular",
    MEDIUM: "Inter_500Medium",
    SEMIBOLD: "Inter_600SemiBold",
    BOLD: "Inter_700Bold",
    BLACK: "Inter_900Black",
  },
  FONT_SIZE: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    XXXL: 32,
    EXTRA_LARGE: 64,
  },
};

export default theme;
