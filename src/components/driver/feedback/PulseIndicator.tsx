import React from 'react';
import { View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { driverColors } from '@/theme/driverTheme';
import { DriverStatusType, statusPulseConfig } from './animations';

interface PulseIndicatorProps {
  /** Tipo de status (determina cor e velocidade do pulso) */
  status: DriverStatusType;
  /** Tamanho do ponto central */
  size?: number;
  /** Mostrar anel de pulso externo */
  showRing?: boolean;
}

/**
 * PulseIndicator — Indicador de status com animação de pulso.
 *
 * Usa os padrões definidos em animations.ts:
 * - online: pulso lento verde (2s)
 * - onRide: pulso médio azul (1.5s)
 * - negotiating: pulso rápido amarelo (500ms)
 * - noBalance: pisca vermelho (1s)
 * - offline: estático cinza
 */
export function PulseIndicator({
  status,
  size = 10,
  showRing = true,
}: PulseIndicatorProps) {
  const config = statusPulseConfig[status];
  const hasPulse = config.interval > 0 && showRing;

  return (
    <View style={[styles.container, { width: size + 12, height: size + 12 }]}>
      {/* Anel externo pulsante */}
      {hasPulse && (
        <MotiView
          from={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 2.2 }}
          transition={{
            type: 'timing',
            duration: config.interval,
            loop: true,
          }}
          style={[
            styles.ring,
            {
              width: size + 12,
              height: size + 12,
              borderRadius: (size + 12) / 2,
              borderColor: config.color,
            },
          ]}
        />
      )}

      {/* Ponto central */}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: config.color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ring: {
    position: 'absolute',
    borderWidth: 2,
  },
  dot: {},
});

export default PulseIndicator;
