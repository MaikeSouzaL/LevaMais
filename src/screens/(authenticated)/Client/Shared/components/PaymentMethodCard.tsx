/**
 * PaymentMethodCard - Card de seleção de método de pagamento
 * Usado na tela PaymentScreen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';

interface PaymentMethodCardProps {
  id: string;
  icon: React.ReactNode;
  label: string;
  sublabel?: string;
  selected?: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export default function PaymentMethodCard({
  icon,
  label,
  sublabel,
  selected = false,
  onPress,
  style,
}: PaymentMethodCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.cardSelected,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon */}
      <View style={styles.iconContainer}>{icon}</View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={styles.label}>{label}</Text>
        {sublabel && <Text style={styles.sublabel}>{sublabel}</Text>}
      </View>

      {/* Radio Button */}
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected && <View style={styles.radioInner} />}
      </View>
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
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardSelected: {
    backgroundColor: 'rgba(2, 222, 149, 0.1)',
    borderColor: colors.primary[500],
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: spacing.md,
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
    marginBottom: 2,
  },
  sublabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.text.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: colors.primary[500],
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary[500],
  },
});
