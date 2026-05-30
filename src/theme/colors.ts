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
    secondary: 'rgba(255, 255, 255, 0.70)',
    tertiary: 'rgba(255, 255, 255, 0.45)',
    disabled: 'rgba(255, 255, 255, 0.25)',
    inverse: '#091A2F',
  },

  // Status semânticos
  status: {
    searching: '#60A5FA',
    enRoute: '#38BDF8',
    arrived: '#02DE95',
    inProgress: '#02DE95',
    completed: '#02DE95',
    cancelled: '#EF4444',
    pending: '#F59E0B',
  },

  // Status (legado)
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',

  // Overlay
  overlay: {
    heavy: 'rgba(0, 0, 0, 0.60)',
    medium: 'rgba(0, 0, 0, 0.40)',
    light: 'rgba(0, 0, 0, 0.20)',
    legacy: 'rgba(0, 0, 0, 0.5)',
    lightLegacy: 'rgba(0, 0, 0, 0.3)',
  },

  // Borders
  border: {
    subtle: 'rgba(255, 255, 255, 0.08)',
    default: 'rgba(255, 255, 255, 0.12)',
    strong: 'rgba(255, 255, 255, 0.20)',
    light: 'rgba(255, 255, 255, 0.08)',
    medium: 'rgba(255, 255, 255, 0.12)',
  },
} as const;

export const gradients = {
  primary: 'linear-gradient(135deg, #02de95 0%, #01a86f 100%)',
  dark: 'linear-gradient(180deg, #091A2F 0%, #11253E 100%)',
  overlay: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%)',
} as const;
