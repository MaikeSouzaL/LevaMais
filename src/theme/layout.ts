/**
 * Design System - Layout
 * Breakpoints e padding de container
 */

export const breakpoints = {
  xs: 0,
  sm: 375,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export const containerPadding = {
  mobile: 16,
  tablet: 24,
  desktop: 32,
} as const;

export const maxWidth = {
  mobile: 480,
  tablet: 768,
  desktop: 1280,
} as const;
