/**
 * Design System - Typography
 * Fontes, tamanhos e alturas de linha
 */

export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  black: 'Inter_900Black',
} as const;

export const fonts = fontFamily;

export const fontSize = {
  caption: 11,
  label: 12,
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  '6xl': 48,
} as const;

export const lineHeight = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '900',
} as const;

export const textStyles = {
  caption: { fontSize: 11, lineHeight: 16 },
  label: { fontSize: 12, lineHeight: 16 },
  bodySm: { fontSize: 14, lineHeight: 20 },
  body: { fontSize: 16, lineHeight: 24 },
  bodyLg: { fontSize: 18, lineHeight: 26 },
  heading6: { fontSize: 20, lineHeight: 28 },
  heading5: { fontSize: 24, lineHeight: 32 },
  heading4: { fontSize: 28, lineHeight: 36 },
  heading3: { fontSize: 32, lineHeight: 40 },
  heading2: { fontSize: 40, lineHeight: 48 },
  heading1: { fontSize: 48, lineHeight: 56 },
} as const;
