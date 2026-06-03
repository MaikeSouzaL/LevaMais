import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, borderRadius, fontSize, fontWeight, shadows } from '@/theme';
import { mapVehicleTypeToEmoji, mapVehicleTypeToName } from '../utils/mappers';
import type { VehicleType } from '../../types';

interface VehicleCardProps {
  type: VehicleType;
  // Props originais
  price?: number;
  capacity?: string;
  selected?: boolean;
  onPress: () => void;
  disabled?: boolean;
  // Props novas (para compatibilidade com SelectVehicleScreen)
  title?: string;
  description?: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
  style?: ViewStyle;
}

export default function VehicleCard({
  type,
  price,
  capacity,
  selected = false,
  onPress,
  disabled = false,
  title,
  description,
  icon,
  badge,
  badgeColor,
  style,
}: VehicleCardProps) {
  const emoji = mapVehicleTypeToEmoji(type);
  const name = title || mapVehicleTypeToName(type);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        disabled && styles.cardDisabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {/* Icon ou Emoji */}
      {icon ? (
        <View style={styles.iconContainer}>
          <Icon name={icon} size={32} color={colors.primary[500]} />
        </View>
      ) : (
        <Text style={styles.emoji}>{emoji}</Text>
      )}

      {/* Info */}
      <View style={styles.info}>
        {!!badge && (
          <View style={styles.badgeContainer}>
            <Text style={[styles.badge, { color: badgeColor || colors.primary[500] }]}>
              {badge}
            </Text>
          </View>
        )}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.capacity}>{description || capacity}</Text>
        {price !== undefined && (
          <Text style={styles.price}>A partir de R$ {price.toFixed(2)}</Text>
        )}
      </View>

      {/* Selection Indicator */}
      {selected && <View style={styles.selectedIndicator} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardSelected: {
    backgroundColor: 'rgba(2, 222, 149, 0.08)',
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  cardDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 40,
    marginRight: spacing.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.lg,
  },
  info: {
    flex: 1,
  },
  badgeContainer: {
    marginBottom: spacing.xs,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(6, 219, 148, 0.2)',
    alignSelf: 'flex-start',
  },
  name: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  capacity: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  price: {
    fontSize: fontSize.sm,
    color: colors.primary[500],
    fontWeight: fontWeight.semibold,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: borderRadius.full,
    backgroundColor: colors.primary[500],
  },
});
