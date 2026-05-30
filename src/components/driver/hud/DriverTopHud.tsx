import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import EarningsBadge from './EarningsBadge';
import AlertBadge from './AlertBadge';
import StatusPill from '../feedback/StatusPill';
import { driverColors, driverRadius, driverSpacing } from '@/theme/driverTheme';

export interface DriverTopHudProps {
  /** Valor formatado dos ganhos de hoje */
  todayEarnings?: string;
  /** Número de corridas hoje */
  ridesCount?: number;
  /** Solicitações pendentes (badge vermelho) */
  pendingRequests?: number;
  /** Corridas agendadas disponíveis */
  scheduledCount?: number;
  /** Placa do veículo (opcional, exibida abaixo dos ganhos) */
  plate?: string | null;
  /** Estado online do motorista */
  online?: boolean;
  /** Estado de trabalho (online/onRide/negotiating) */
  workStatus?: 'offline' | 'online' | 'onRide' | 'negotiating';
  onPressNotifications?: () => void;
}

/**
 * DriverTopHud — HUD superior redesenhado para o motorista.
 *
 * Inspirado no Uber Driver: 3 zonas —
 * 1. EarningsBadge (ganhos do dia),
 * 2. AlertBadge (notificações),
 * 3. StatusPill (online/offline/em corrida)
 *
 * Removeu a placa do carro (movida para o perfil).
 */
export function DriverTopHud({
  todayEarnings = 'R$ 0,00',
  ridesCount,
  pendingRequests = 0,
  scheduledCount = 0,
  plate,
  online = false,
  workStatus,
  onPressNotifications,
}: DriverTopHudProps) {
  // Determina o status visual
  const resolvedStatus = workStatus || (online ? 'online' : 'offline');

  // Contagem combinada de alertas
  const totalAlerts = pendingRequests + scheduledCount;

  // Cor do alerta: vermelho se tem solicitações, verde se só agendadas, info se zero
  const alertAccent = pendingRequests > 0 ? 'danger' : scheduledCount > 0 ? 'warning' : 'info';

  return (
    <MotiView
      from={{ opacity: 0, translateY: -15 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={styles.container}
    >
      {/* 1. Ganhos */}
      <EarningsBadge
        amount={todayEarnings}
        ridesCount={ridesCount}
      />

      {/* 2. Placa (opcional, secundária) */}
      {!!plate && (
        <View style={styles.plateWrap}>
          <Text style={styles.plate}>{plate}</Text>
        </View>
      )}

      {/* Spacer */}
      <View style={{ flex: 1 }} />

      {/* 3. Alertas */}
      <AlertBadge
        count={totalAlerts}
        accent={alertAccent}
        onPress={onPressNotifications}
      />

      {/* 4. Status */}
      <StatusPill
        variant={resolvedStatus}
        size="md"
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  plateWrap: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: driverRadius.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: driverColors.borderLight,
  },
  plate: {
    fontSize: 12,
    fontWeight: '700',
    color: driverColors.textSecondary,
    letterSpacing: 0.5,
  },
});

export default DriverTopHud;
