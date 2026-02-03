/**
 * Design System - Colors
 * Inspirado em Uber, 99 e iFood
 */

export const colors = {
  // Primary (Verde Leva Mais)
  primary: {
    50: '#e6faf4',
    100: '#b3f0df',
    200: '#80e6ca',
    300: '#4ddcb5',
    400: '#1ad2a0',
    500: '#02de95', // Principal
    600: '#02b277',
    700: '#018659',
    800: '#015a3b',
    900: '#002e1d',
  },

  // Background (Escuro - Tema Original)
  background: {
    primary: '#091A2F', // Fundo principal (Azul Profundo)
    secondary: '#11253E', // Cards e elevações (Surface Primary)
    tertiary: '#1E2D3D', // Inputs e áreas interativas (Surface Secondary)
  },

  // Texto
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.75)',
    tertiary: 'rgba(255, 255, 255, 0.55)',
    disabled: 'rgba(255, 255, 255, 0.35)',
  },

  // Status
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Overlay
  overlay: 'rgba(0, 0, 0, 0.5)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Borders
  border: {
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
  },
} as const;

export const gradients = {
  primary: 'linear-gradient(135deg, #02de95 0%, #01a86f 100%)',
  dark: 'linear-gradient(180deg, #091A2F 0%, #11253E 100%)',
  overlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
} as const;
