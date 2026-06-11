/**
 * EmptyState - Estado vazio
 * Exibido quando não há dados para mostrar
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight } from '@/theme';
import LoadingButton from './LoadingButton';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon
        name={icon}
        size={64}
        color={colors.text.disabled}
        style={styles.icon}
      />
      <Text style={styles.title}>{title}</Text>
      {!!description && <Text style={styles.description}>{description}</Text>}
      {!!actionLabel && !!onAction && (
        <LoadingButton
          title={actionLabel}
          onPress={onAction}
          variant="primary"
          fullWidth={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
  },
  icon: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: fontSize.base,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
