import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Car, MapPin, ChevronRight } from 'lucide-react-native';
import { formatBRL } from '@/utils/mappers';
import GlassCard from '../cards/GlassCard';
import StatusPill from '../feedback/StatusPill';
import { driverColors, driverRadius, driverSpacing } from '@/theme/driverTheme';

interface HistoryRideItem {
  _id: string;
  status: string;
  serviceType: string;
  vehicleType: string;
  pickup?: { address?: string };
  dropoff?: { address?: string };
  pricing?: { total?: number };
  distance?: { text?: string };
  declinedByMe?: boolean;
  createdAt?: string;
  completedAt?: string;
  cancelledAt?: string;
}

interface HistoryRideCardProps {
  item: HistoryRideItem;
  index: number;
  declinedByMe?: boolean;
  onPress: (item: HistoryRideItem) => void;
}

function getStatusVariant(status: string, declinedByMe: boolean): any {
  if (status === 'completed') return 'completed';
  if (status.startsWith('cancelled') || status === 'expired') return 'cancelled';
  if (declinedByMe) return 'error';
  return 'inProgress';
}

function getStatusLabel(status: string, declinedByMe: boolean): string {
  if (declinedByMe) return 'Recusada';
  const map: Record<string, string> = {
    completed: 'Concluída',
    cancelled: 'Cancelada',
    cancelled_by_client: 'Cancelada',
    cancelled_by_driver: 'Cancelada',
    cancelled_no_driver: 'Sem motorista',
    expired: 'Expirada',
    requesting: 'Buscando',
    driver_assigned: 'Alocado',
    accepted: 'A caminho',
    driver_arriving: 'Chegando',
    arrived: 'No local',
    in_progress: 'Em andamento',
  };
  return map[status] || status;
}

function formatDate(item: HistoryRideItem): string {
  const value = item.completedAt || item.cancelledAt || item.createdAt;
  if (!value) return '-';
  const dt = new Date(value);
  if (Number.isNaN(dt.getTime())) return '-';
  return dt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * HistoryRideCard — Card compacto para histórico de corridas.
 *
 * Layout horizontal: barra lateral colorida → ícone veículo → info → preço
 */
export default function HistoryRideCard({ item, index, declinedByMe = false, onPress }: HistoryRideCardProps) {
  const variant = getStatusVariant(item.status, declinedByMe);
  const statusLabel = getStatusLabel(item.status, declinedByMe);
  const isCompleted = item.status === 'completed';
  const total = item.pricing?.total ?? 0;

  // Cor da barra lateral
  const sideColor =
    variant === 'completed' ? driverColors.accent
    : variant === 'cancelled' || variant === 'error' ? driverColors.danger
    : driverColors.warning;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 8 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15, delay: Math.min(index * 40, 200) }}
    >
      <TouchableOpacity activeOpacity={0.7} onPress={() => onPress(item)}>
        <View style={styles.card}>
          {/* Colored side bar */}
          <View style={[styles.sideBar, { backgroundColor: sideColor }]} />

          {/* Content */}
          <View style={styles.content}>
            {/* Top row: status + date */}
            <View style={styles.topRow}>
              <StatusPill variant={variant} size="sm" label={statusLabel} />
              <Text style={styles.date}>{formatDate(item)}</Text>
            </View>

            {/* Addresses */}
            <View style={styles.addresses}>
              {item.pickup?.address && (
                <View style={styles.addressRow}>
                  <View style={[styles.dot, { backgroundColor: driverColors.accent }]} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.pickup.address}</Text>
                </View>
              )}
              {item.dropoff?.address && (
                <View style={styles.addressRow}>
                  <View style={[styles.dot, { backgroundColor: driverColors.danger }]} />
                  <Text style={styles.addressText} numberOfLines={1}>{item.dropoff.address}</Text>
                </View>
              )}
            </View>

            {/* Bottom row: vehicle + distance + price */}
            <View style={styles.bottomRow}>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {item.vehicleType === 'motorcycle' ? '🏍' : '🚗'} {item.serviceType === 'delivery' ? 'Entrega' : 'Corrida'}
                </Text>
                {item.distance?.text && (
                  <Text style={styles.metaText}> · {item.distance.text}</Text>
                )}
              </View>
              <Text style={[styles.price, { color: isCompleted ? driverColors.accent : driverColors.textMuted }]}>
                {formatBRL(total)}
              </Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    borderRadius: driverRadius.lg,
    backgroundColor: driverColors.surface,
    borderWidth: 1,
    borderColor: driverColors.borderLight,
    overflow: 'hidden',
    marginBottom: driverSpacing.sm,
  },
  sideBar: {
    width: 4,
  },
  content: {
    flex: 1,
    padding: driverSpacing.md,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    color: driverColors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  addresses: {
    gap: 4,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  addressText: {
    flex: 1,
    color: driverColors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    color: driverColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  price: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
