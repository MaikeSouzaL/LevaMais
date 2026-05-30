/**
 * Driver Theme — Design Tokens específicos para a experiência do motorista
 *
 * Estende o sistema de tema base (colors.ts, typography.ts, dimensions.ts, animations.ts)
 * com tokens semânticos focados no fluxo de trabalho do motorista.
 *
 * Inspirado em: Uber Driver, 99 Driver, InDrive Driver
 */

import { colors } from './colors';
import { spacing, borderRadius, shadows } from './dimensions';
import { fontSize, fontWeight, fontFamily } from './typography';
import { duration, spring } from './animations';

// ─── Semantic Color Aliases ───────────────────────────────────────────
export const driverColors = {
  bg: colors.background.primary, // #091A2F
  surface: '#0D1F35', // ligeiramente mais escuro que secondary
  elevated: colors.background.secondary, // #11253E
  accent: colors.primary[500], // #02de95
  accentHover: colors.primary[600], // #02b277
  accentBg: 'rgba(2,222,149,0.12)',
  accentBorder: 'rgba(2,222,149,0.25)',

  danger: colors.error, // #ef4444
  dangerHover: '#dc2626',
  dangerBg: 'rgba(239,68,68,0.12)',
  dangerBorder: 'rgba(239,68,68,0.30)',

  warning: colors.warning, // #f59e0b
  warningBg: 'rgba(245,158,11,0.12)',
  warningBorder: 'rgba(245,158,11,0.30)',

  info: colors.info, // #3b82f6
  infoBg: 'rgba(96,165,250,0.12)',
  infoBorder: 'rgba(96,165,250,0.25)',

  text: colors.text.primary, // #ffffff
  textSecondary: colors.text.secondary, // rgba(255,255,255,0.70)
  textMuted: colors.text.tertiary, // rgba(255,255,255,0.45)
  textDisabled: colors.text.disabled, // rgba(255,255,255,0.25)

  border: colors.border.subtle, // rgba(255,255,255,0.08)
  borderLight: 'rgba(255,255,255,0.06)',
  borderStrong: colors.border.strong, // rgba(255,255,255,0.20)

  glass: 'rgba(17,37,62,0.85)',
  overlay: colors.overlay.heavy, // rgba(0,0,0,0.60)

  // Status do motorista (sistema unificado)
  status: {
    offline: '#6b7280',
    online: colors.primary[500], // #02de95
    onRide: colors.info, // #3b82f6
    negotiating: colors.warning, // #f59e0b
    noBalance: colors.error, // #ef4444
  },
} as const;

// ─── Driver Typography ─────────────────────────────────────────────────
export const driverTypography = {
  heading1: { fontSize: fontSize['3xl'], fontWeight: fontWeight.black }, // 28px, 900
  heading2: { fontSize: fontSize['2xl'], fontWeight: fontWeight.black }, // 22px, 900 (ajustado)
  heading3: { fontSize: fontSize.lg, fontWeight: '800' as const }, // 18px, 800
  body: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold }, // 14px, 600
  bodySmall: { fontSize: fontSize.xs, fontWeight: fontWeight.medium }, // 12px, 500
  caption: {
    fontSize: fontSize.caption,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  price: { fontSize: fontSize['4xl'], fontWeight: fontWeight.black }, // 32px, 900
  priceLarge: { fontSize: fontSize['6xl'], fontWeight: fontWeight.black }, // 48px, 900
  priceSmall: { fontSize: fontSize.lg, fontWeight: fontWeight.bold }, // 18px, 700
} as const;

// ─── Driver Spacing ────────────────────────────────────────────────────
export const driverSpacing = {
  xs: spacing.xs, // 4
  sm: spacing.sm, // 8
  md: spacing.md, // 12
  lg: spacing.lg, // 16
  xl: spacing.xl, // 24
  '2xl': spacing['2xl'], // 32
};

// ─── Driver Border Radius ──────────────────────────────────────────────
export const driverRadius = {
  sm: borderRadius.sm, // 8
  md: borderRadius.md, // 12
  lg: borderRadius.lg, // 16
  xl: borderRadius.xl, // 20
  '2xl': borderRadius['2xl'], // 24
  '3xl': 32,
};

// ─── Driver Shadows ────────────────────────────────────────────────────
export const driverShadows = {
  accentGlow: {
    shadowColor: colors.primary[500],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
  cardElevated: shadows.xl,
  buttonPressed: shadows.sm,
};

// ─── Driver Animation Presets ──────────────────────────────────────────
export const driverAnimation = {
  duration: {
    fast: duration.fast, // 200ms
    normal: duration.normal, // 300ms
    slow: duration.slow, // 500ms
  },
  spring: {
    // Entrada padrão de cards
    fadeSlideUp: {
      damping: 15,
      stiffness: 150,
      mass: 1,
    },
    // Entrada de modais/sheets
    scaleIn: {
      damping: 12,
      stiffness: 120,
      mass: 0.8,
    },
    // Botão e interações
    snappy: spring.snappy,
    // Bottom sheets
    sheet: spring.sheet,
  },
  // Intervalo entre itens staggered
  staggerDelay: 80,
  // Intervalo de animação de pulso
  pulseInterval: 2000,
} as const;

// ─── Driver Status Config ──────────────────────────────────────────────
export const driverStatusConfig = {
  offline: {
    color: driverColors.status.offline,
    icon: 'circle-outline',
    animation: 'none',
  },
  online: {
    color: driverColors.status.online,
    icon: 'circle',
    animation: 'pulse-slow',
  },
  onRide: {
    color: driverColors.status.onRide,
    icon: 'diamond',
    animation: 'pulse-active',
  },
  negotiating: {
    color: driverColors.status.negotiating,
    icon: 'circle-ring',
    animation: 'pulse-fast',
  },
  noBalance: {
    color: driverColors.status.noBalance,
    icon: 'triangle',
    animation: 'blink',
  },
} as const;

// ─── Aggregated Theme Object ───────────────────────────────────────────
export const driverTheme = {
  colors: driverColors,
  typography: driverTypography,
  spacing: driverSpacing,
  radius: driverRadius,
  shadows: driverShadows,
  animation: driverAnimation,
  status: driverStatusConfig,
} as const;

export type DriverTheme = typeof driverTheme;
