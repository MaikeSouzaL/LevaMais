import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { TrendingUp } from 'lucide-react-native';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface EarningsBadgeProps {
  /** Valor formatado: ex "R$ 234,50" */
  amount: string;
  /** Número de corridas hoje */
  ridesCount?: number;
  /** Animação de entrada */
  animate?: boolean;
}

export default function EarningsBadge({
  amount,
  ridesCount,
  animate = true,
}: EarningsBadgeProps) {
  const Wrapper = animate ? MotiView : View;
  const animProps = animate
    ? {
        from: { opacity: 0, translateY: -10 },
        animate: { opacity: 1, translateY: 0 },
        transition: { type: 'spring' as const, damping: 15 },
      }
    : {};

  return (
    <Wrapper {...animProps} style={styles.container}>
      <View style={styles.iconWrap}>
        <TrendingUp size={14} color={driverColors.accent} />
      </View>
      <View>
        <Text style={styles.amount}>{amount}</Text>
        {ridesCount !== undefined && (
          <Text style={styles.subtitle}>
            {ridesCount} {ridesCount === 1 ? 'corrida' : 'corridas'} hoje
          </Text>
        )}
      </View>
    </Wrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: driverRadius.lg,
    backgroundColor: driverColors.accentBg,
    borderWidth: 1,
    borderColor: driverColors.accentBorder,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(2,222,149,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amount: {
    fontSize: 15,
    fontWeight: '900',
    color: driverColors.accent,
    fontVariant: ['tabular-nums'],
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '600',
    color: driverColors.textMuted,
    marginTop: 1,
  },
});
