import React from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Bell } from 'lucide-react-native';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface AlertBadgeProps {
  /** Número de alertas não lidos */
  count: number;
  /** Cor de destaque (ex: amarelo para alertas, vermelho para urgentes) */
  accent?: 'warning' | 'danger' | 'info';
  onPress?: () => void;
}

const accentConfig = {
  warning: { bg: driverColors.warningBg, dot: driverColors.warning, border: driverColors.warningBorder },
  danger: { bg: driverColors.dangerBg, dot: driverColors.danger, border: driverColors.dangerBorder },
  info: { bg: driverColors.infoBg, dot: driverColors.info, border: driverColors.infoBorder },
};

export default function AlertBadge({
  count,
  accent = 'warning',
  onPress,
}: AlertBadgeProps) {
  const cfg = accentConfig[accent];

  if (count === 0) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.silent}
        accessibilityLabel="Notificações"
        accessibilityRole="button"
      >
        <Bell size={20} color={driverColors.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[styles.container, { backgroundColor: cfg.bg, borderColor: cfg.border }]}
      accessibilityLabel={`${count} notificações não lidas`}
      accessibilityRole="button"
    >
      <Bell size={18} color={cfg.dot} />
      <MotiView
        from={{ scale: 0.5 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 10 }}
        key={String(count)}
        style={[styles.badgeCircle, { backgroundColor: cfg.dot }]}
      >
        <Text style={styles.badgeText}>
          {count > 99 ? '99+' : count}
        </Text>
      </MotiView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: driverRadius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  silent: {
    width: 44,
    height: 44,
    borderRadius: driverRadius.md,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: driverColors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeCircle: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: driverColors.bg,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: driverColors.text,
  },
});
