/**
 * Design System - Animations
 * Durações, easings e spring presets
 */

export const duration = {
  instant: 100,
  fast: 200,
  normal: 300,
  slow: 500,
  glacial: 800,
} as const;

export const spring = {
  bouncy: { damping: 10, stiffness: 100, mass: 1 },
  smooth: { damping: 16, stiffness: 120, mass: 1 },
  snappy: { damping: 20, stiffness: 200, mass: 0.5 },
  sheet: { damping: 32, stiffness: 300, mass: 0.8 },
} as const;

// Legacy — mantido para compatibilidade
export const animations = {
  duration: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  easing: {
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
    spring: 'spring',
  },
} as const;

export const transitions = {
  fade: {
    duration: 200,
    easing: 'ease-in-out',
  },
  slide: {
    duration: 300,
    easing: 'ease-out',
  },
  scale: {
    duration: 200,
    easing: 'spring',
  },
} as const;
