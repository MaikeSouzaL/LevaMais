/**
 * Design System - Animations
 * Durações e easings para animações
 */

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
