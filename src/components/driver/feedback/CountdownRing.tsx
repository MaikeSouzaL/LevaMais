import React, { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { driverColors, driverRadius } from '@/theme/driverTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CountdownRingProps {
  /** Valor atual (ex: segundos restantes) */
  current: number;
  /** Valor total (ex: 60 segundos) */
  total: number;
  /** Tamanho do anel em pixels */
  size?: number;
  /** Espessura da linha do anel */
  strokeWidth?: number;
  /** Mostrar número central */
  showNumber?: boolean;
  /** Formatar o número central */
  formatNumber?: (current: number) => string;
}

function getCountdownColor(pct: number): string {
  if (pct > 0.6) return driverColors.accent; // verde
  if (pct > 0.3) return driverColors.warning; // amarelo
  return driverColors.danger; // vermelho
}

export default function CountdownRing({
  current,
  total,
  size = 56,
  strokeWidth = 4,
  showNumber = true,
  formatNumber,
}: CountdownRingProps) {
  const safeTotal = Math.max(1, total);
  const safeCurrent = Math.max(0, Math.min(safeTotal, current));
  const pct = safeCurrent / safeTotal;
  const color = getCountdownColor(pct);

  // SVG geometry
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Animação do dash offset
  const animatedOffset = useSharedValue(circumference * (1 - pct));

  useEffect(() => {
    animatedOffset.value = withTiming(circumference * (1 - pct), {
      duration: 400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [pct, circumference]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: animatedOffset.value,
  }));

  const displayNumber = formatNumber
    ? formatNumber(safeCurrent)
    : String(Math.round(safeCurrent));

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Background circle */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Svg>

      {/* Foreground animated circle */}
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <AnimatedCircle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          animatedProps={animatedProps}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </Svg>

      {/* Center number */}
      {showNumber && (
        <View style={styles.center}>
          <Text style={[styles.number, { color }]}>{displayNumber}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontSize: 17,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
