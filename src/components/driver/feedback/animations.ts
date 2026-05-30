/**
 * Driver Animation Hooks — Padrões de animação reutilizáveis para o motorista.
 *
 * Unifica os padrões do SPARC P3:
 * - fadeSlideUp: entrada padrão de cards
 * - scaleIn: entrada de modais/sheets
 * - pulseRing: indicador de atividade
 * - staggerDelay: intervalo entre itens
 */

import { useMemo } from 'react';

// ─── Animation Configs (reutilizáveis com Moti) ────────────────────────

export const fadeSlideUp = (delay: number = 0) => ({
  from: { opacity: 0, translateY: 15 },
  animate: { opacity: 1, translateY: 0 },
  transition: { type: 'spring' as const, damping: 15, stiffness: 150, delay },
});

export const scaleIn = (delay: number = 0) => ({
  from: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: 'spring' as const, damping: 12, stiffness: 120, delay },
});

export const slideUp = (delay: number = 0) => ({
  from: { opacity: 0, translateY: 300 },
  animate: { opacity: 1, translateY: 0 },
  exit: { opacity: 0, translateY: 300 },
  transition: { type: 'spring' as const, damping: 18, stiffness: 180, delay },
});

export const pulseRing = {
  from: { opacity: 0.6, scale: 1 },
  animate: { opacity: 0, scale: 1.5 },
  transition: { type: 'timing' as const, loop: true as const, duration: 1500 },
};

export const pulseFast = {
  from: { opacity: 0.8, scale: 1 },
  animate: { opacity: 0, scale: 1.3 },
  transition: { type: 'timing' as const, loop: true as const, duration: 600 },
};

export const bounceIn = (delay: number = 0) => ({
  from: { opacity: 0, scale: 0.3 },
  animate: { opacity: 1, scale: 1 },
  transition: { type: 'spring' as const, damping: 6, stiffness: 200, delay },
});

// ─── Stagger helper ─────────────────────────────────────────────────────

/**
 * Gera delay escalonado para listas animadas.
 * @param index - índice do item (0-based)
 * @param baseDelay - delay base em ms (default: 80)
 */
export function useStaggerDelay(index: number, baseDelay: number = 80): number {
  return Math.min(index * baseDelay, 400); // cap at 400ms
}

// ─── Countdown color helper ──────────────────────────────────────────────

/**
 * Retorna cor baseada na porcentagem restante do countdown.
 * Verde (100-60%) → Amarelo (60-30%) → Vermelho (30-0%)
 */
export function countdownColor(pct: number): string {
  if (pct > 0.6) return '#02de95';
  if (pct > 0.3) return '#F59E0B';
  return '#ef4444';
}

// ─── Status pulse config ─────────────────────────────────────────────────

export const statusPulseConfig = {
  online: { interval: 2000, color: '#02de95' },
  onRide: { interval: 1500, color: '#60a5fa' },
  negotiating: { interval: 500, color: '#F59E0B' },
  noBalance: { interval: 1000, color: '#ef4444' },
  offline: { interval: 0, color: '#6b7280' },
} as const;

export type DriverStatusType = keyof typeof statusPulseConfig;
