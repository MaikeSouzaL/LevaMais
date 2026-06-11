import React from 'react';
import { View, TouchableOpacity, ViewStyle, StyleSheet } from 'react-native';
import { driverColors, driverRadius, driverSpacing, driverShadows } from '@/theme/driverTheme';

type GlassCardVariant = 'default' | 'elevated' | 'accent' | 'danger' | 'warning' | 'info';
type GlassCardPadding = 'sm' | 'md' | 'lg';

interface GlassCardProps {
  variant?: GlassCardVariant;
  padding?: GlassCardPadding;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'none';
}

const variantStyles: Record<GlassCardVariant, ViewStyle> = {
  default: {
    backgroundColor: driverColors.surface,
    borderColor: driverColors.borderLight,
    borderWidth: 1,
  },
  elevated: {
    backgroundColor: driverColors.elevated,
    borderColor: driverColors.border,
    borderWidth: 1,
  },
  accent: {
    backgroundColor: driverColors.accentBg,
    borderColor: driverColors.accentBorder,
    borderWidth: 1.5,
  },
  danger: {
    backgroundColor: driverColors.dangerBg,
    borderColor: driverColors.dangerBorder,
    borderWidth: 1,
  },
  warning: {
    backgroundColor: driverColors.warningBg,
    borderColor: driverColors.warningBorder,
    borderWidth: 1,
  },
  info: {
    backgroundColor: driverColors.infoBg,
    borderColor: driverColors.infoBorder,
    borderWidth: 1,
  },
};

const paddingMap: Record<GlassCardPadding, number> = {
  sm: driverSpacing.md, // 12
  md: driverSpacing.lg, // 16
  lg: driverSpacing.xl, // 24
};

export default function GlassCard({
  variant = 'default',
  padding = 'md',
  onPress,
  disabled = false,
  style,
  children,
  accessibilityLabel,
  accessibilityRole,
}: GlassCardProps) {
  const cardStyle: ViewStyle = {
    borderRadius: driverRadius.xl,
    padding: paddingMap[padding],
    ...variantStyles[variant],
    opacity: disabled ? 0.5 : 1,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
        style={[cardStyle, style]}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={accessibilityRole || 'button'}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={[cardStyle, style]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityRole || 'none'}
    >
      {children}
    </View>
  );
}
