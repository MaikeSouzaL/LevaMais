import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';

type MetricAccent = 'green' | 'blue' | 'yellow' | 'red';
type MetricTrend = 'up' | 'down' | 'neutral';

interface MetricCardProps {
  icon?: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: MetricTrend;
  accent?: MetricAccent;
  index?: number; // para animação staggered
}

const accentConfig: Record<MetricAccent, { bg: string; border: string; text: string }> = {
  green: {
    bg: driverColors.accentBg,
    border: driverColors.accent,
    text: driverColors.accent,
  },
  blue: {
    bg: driverColors.infoBg,
    border: driverColors.info,
    text: driverColors.info,
  },
  yellow: {
    bg: driverColors.warningBg,
    border: driverColors.warning,
    text: driverColors.warning,
  },
  red: {
    bg: driverColors.dangerBg,
    border: driverColors.danger,
    text: driverColors.danger,
  },
};

const trendIcons: Record<MetricTrend, string> = {
  up: '↑',
  down: '↓',
  neutral: '→',
};

const trendColors: Record<MetricTrend, string> = {
  up: driverColors.accent,
  down: driverColors.danger,
  neutral: driverColors.textMuted,
};

export default function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  accent = 'green',
  index = 0,
}: MetricCardProps) {
  const cfg = accentConfig[accent];

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: index * 80 }}
      style={[
        styles.container,
        {
          backgroundColor: cfg.bg,
          borderLeftWidth: 3,
          borderLeftColor: cfg.border,
        },
      ]}
    >
      {/* Icon + Trend Row */}
      <View style={styles.topRow}>
        {icon && <View style={styles.iconWrap}>{icon}</View>}
        {trend && (
          <Text style={[styles.trendText, { color: trendColors[trend] }]}>
            {trendIcons[trend]}
          </Text>
        )}
      </View>

      {/* Value */}
      <Text style={[styles.value, { color: cfg.text }]}>{value}</Text>

      {/* Label */}
      <Text style={styles.label}>{label}</Text>

      {/* Optional subtitle */}
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 100,
    borderRadius: driverRadius.lg,
    padding: driverSpacing.lg,
    gap: 6,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: driverRadius.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: 16,
    fontWeight: '900',
  },
  value: {
    ...driverTypography.price,
  },
  label: {
    ...driverTypography.caption,
    color: driverColors.textMuted,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: driverColors.textMuted,
    marginTop: 2,
  },
});
