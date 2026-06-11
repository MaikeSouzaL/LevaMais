/**
 * StatusBadge - Badge de status
 * Mostra status da corrida com cor e texto
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { mapRideStatusToText, mapRideStatusToColor } from '../utils/mappers';
import type { RideStatus } from '../../types';

interface StatusBadgeProps {
  status: RideStatus;
  size?: 'small' | 'medium' | 'large';
}

export default function StatusBadge({ status, size = 'medium' }: StatusBadgeProps) {
  const text = mapRideStatusToText(status);
  const color = mapRideStatusToColor(status);

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.sm,
          fontSize: fontSize.xs,
        };
      case 'medium':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.md,
          fontSize: fontSize.sm,
        };
      case 'large':
        return {
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
          fontSize: fontSize.base,
        };
    }
  };

  const sizeStyles = getSizeStyles();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: `${color}20`,
          borderColor: `${color}60`,
          paddingVertical: sizeStyles.paddingVertical,
          paddingHorizontal: sizeStyles.paddingHorizontal,
        },
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color,
            fontSize: sizeStyles.fontSize,
          },
        ]}
      >
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: borderRadius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontWeight: fontWeight.bold,
  },
});
