import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { driverColors, driverRadius, driverTypography } from '@/theme/driverTheme';

type StatusPillSize = 'sm' | 'md';

type StatusPillVariant =
  | 'online'
  | 'offline'
  | 'onRide'
  | 'negotiating'
  | 'completed'
  | 'cancelled'
  | 'pending'
  | 'arrived'
  | 'inProgress'
  | 'searching'
  | 'warning'
  | 'error';

interface StatusPillProps {
  variant: StatusPillVariant;
  size?: StatusPillSize;
  label?: string;
  style?: ViewStyle;
}

const variantConfig: Record<
  StatusPillVariant,
  { bg: string; border: string; dot: string; defaultLabel: string }
> = {
  online: {
    bg: driverColors.accentBg,
    border: driverColors.accentBorder,
    dot: driverColors.accent,
    defaultLabel: 'Online',
  },
  offline: {
    bg: 'rgba(107,114,128,0.12)',
    border: 'rgba(107,114,128,0.25)',
    dot: '#6b7280',
    defaultLabel: 'Offline',
  },
  onRide: {
    bg: driverColors.infoBg,
    border: driverColors.infoBorder,
    dot: driverColors.info,
    defaultLabel: 'Em corrida',
  },
  negotiating: {
    bg: driverColors.warningBg,
    border: driverColors.warningBorder,
    dot: driverColors.warning,
    defaultLabel: 'Negociando',
  },
  completed: {
    bg: driverColors.accentBg,
    border: driverColors.accentBorder,
    dot: driverColors.accent,
    defaultLabel: 'Concluída',
  },
  cancelled: {
    bg: driverColors.dangerBg,
    border: driverColors.dangerBorder,
    dot: driverColors.danger,
    defaultLabel: 'Cancelada',
  },
  pending: {
    bg: driverColors.warningBg,
    border: driverColors.warningBorder,
    dot: driverColors.warning,
    defaultLabel: 'Pendente',
  },
  arrived: {
    bg: driverColors.accentBg,
    border: driverColors.accentBorder,
    dot: driverColors.accent,
    defaultLabel: 'Chegou',
  },
  inProgress: {
    bg: driverColors.infoBg,
    border: driverColors.infoBorder,
    dot: driverColors.info,
    defaultLabel: 'Em andamento',
  },
  searching: {
    bg: 'rgba(96,165,250,0.12)',
    border: 'rgba(96,165,250,0.25)',
    dot: '#60a5fa',
    defaultLabel: 'Buscando',
  },
  warning: {
    bg: driverColors.warningBg,
    border: driverColors.warningBorder,
    dot: driverColors.warning,
    defaultLabel: 'Atenção',
  },
  error: {
    bg: driverColors.dangerBg,
    border: driverColors.dangerBorder,
    dot: driverColors.danger,
    defaultLabel: 'Erro',
  },
};

const sizeConfig: Record<StatusPillSize, { height: number; dotSize: number; fontSize: number; paddingH: number }> = {
  sm: { height: 22, dotSize: 6, fontSize: 9, paddingH: 8 },
  md: { height: 28, dotSize: 8, fontSize: 10, paddingH: 12 },
};

export default function StatusPill({
  variant,
  size = 'sm',
  label,
  style,
}: StatusPillProps) {
  const cfg = variantConfig[variant];
  const sz = sizeConfig[size];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: sz.height,
          paddingHorizontal: sz.paddingH,
          borderRadius: sz.height / 2,
          backgroundColor: cfg.bg,
          borderWidth: 1,
          borderColor: cfg.border,
        },
        style,
      ]}
    >
      {/* Dot */}
      <View
        style={{
          width: sz.dotSize,
          height: sz.dotSize,
          borderRadius: sz.dotSize / 2,
          backgroundColor: cfg.dot,
        }}
      />
      {/* Label */}
      <Text
        style={{
          fontSize: sz.fontSize,
          fontWeight: '900',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          color: cfg.dot,
        }}
      >
        {label || cfg.defaultLabel}
      </Text>
    </View>
  );
}
