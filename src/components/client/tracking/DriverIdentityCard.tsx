import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import { Star, Shield, Navigation, MessageCircle } from 'lucide-react-native';
import { driverColors, driverRadius } from '@/theme/driverTheme';
import GlassCard from '@/components/driver/cards/GlassCard';

interface DriverIdentity {
  id: string;
  name: string;
  phone?: string;
  profilePhoto?: string;
  rating: number;
  totalRatings?: number;
  vehicle: {
    type: string;
    plate: string;
    model: string;
    color: string;
    year?: number;
  };
}

interface DriverIdentityCardProps {
  driver: DriverIdentity;
  eta?: string;
  etaDistance?: string;
  onChat?: () => void;
  onCancel?: () => void;
}

/**
 * DriverIdentityCard — Card "Seu motorista está chegando" estilo Uber.
 *
 * Exibe:
 * - Foto do motorista (ou inicial) com borda verde
 * - Nome, rating, número de avaliações
 * - Veículo: modelo, cor, placa, ano
 * - ETA em tempo real
 * - Botões: Ligar, Chat, Cancelar
 */
export function DriverIdentityCard({
  driver,
  eta,
  etaDistance,
  onChat,
  onCancel,
}: DriverIdentityCardProps) {
  const vehicleLabel = driver.vehicle.type === 'motorcycle' ? 'Moto'
    : driver.vehicle.type === 'car' ? 'Carro'
    : driver.vehicle.type === 'van' ? 'Van'
    : 'Caminhão';

  const vehicleIcon = driver.vehicle.type === 'motorcycle' ? '🏍'
    : driver.vehicle.type === 'car' ? '🚗'
    : driver.vehicle.type === 'van' ? '🚐'
    : '🚛';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 300 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 18, stiffness: 180 }}
      style={styles.container}
    >
      {/* Driver Photo + Name Section */}
      <View style={styles.headerRow}>
        {/* Photo */}
        <View style={styles.photoOuter}>
          {driver.profilePhoto ? (
            <Image source={{ uri: driver.profilePhoto }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoInitial}>{driver.name[0]?.toUpperCase()}</Text>
            </View>
          )}
          {/* ETA Badge */}
          {eta && (
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{eta}</Text>
            </View>
          )}
        </View>

        {/* Name + Rating */}
        <View style={styles.nameSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={styles.driverName}>{driver.name}</Text>
            <View style={styles.verifiedBadge}>
              <Shield size={10} color={driverColors.accent} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Star size={14} color="#FBBF24" fill="#FBBF24" />
            <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
            {driver.totalRatings != null && (
              <Text style={styles.ratingSub}>({driver.totalRatings} avaliações)</Text>
            )}
          </View>
        </View>
      </View>

      {/* Vehicle Info Card */}
      <GlassCard variant="default" padding="md" style={{ marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={styles.vehicleIconWrap}>
            <Text style={{ fontSize: 24 }}>{vehicleIcon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.vehicleModel}>
              {driver.vehicle.model} ({driver.vehicle.color})
            </Text>
            <Text style={styles.vehicleDetails}>
              {driver.vehicle.plate.toUpperCase()} · {vehicleLabel}
              {driver.vehicle.year ? ` · ${driver.vehicle.year}` : ''}
            </Text>
          </View>
        </View>
      </GlassCard>

      {/* ETA + Distance */}
      {eta && etaDistance && (
        <View style={styles.etaRow}>
          <Navigation size={18} color={driverColors.accent} />
          <Text style={styles.etaLabel}>Motorista a caminho</Text>
          <Text style={styles.etaValue}>{eta} ({etaDistance})</Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {onChat && (
          <TouchableOpacity style={styles.actionBtnFull} onPress={onChat} activeOpacity={0.8}>
            <MessageCircle size={20} color={driverColors.info} />
            <Text style={[styles.actionLabel, { color: driverColors.info }]}>Chat</Text>
          </TouchableOpacity>
        )}
        {onCancel && (
          <TouchableOpacity style={styles.cancelBtn} onPress={onCancel} activeOpacity={0.8}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    marginHorizontal: 16,
    marginBottom: 0,
    borderRadius: 28,
    backgroundColor: driverColors.bg,
    borderWidth: 1.5,
    borderColor: driverColors.accentBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  photoOuter: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    borderColor: driverColors.accent,
  },
  photo: {
    width: '100%', height: '100%', borderRadius: 36,
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: driverColors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 36,
  },
  photoInitial: {
    color: driverColors.accent,
    fontSize: 28,
    fontWeight: '900',
  },
  etaBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: driverColors.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    minWidth: 40,
    alignItems: 'center',
  },
  etaText: {
    color: driverColors.bg,
    fontSize: 11,
    fontWeight: '900',
  },
  nameSection: {
    flex: 1,
  },
  driverName: {
    color: driverColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  verifiedBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: driverColors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: driverColors.accentBorder,
  },
  ratingText: {
    color: driverColors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  ratingSub: {
    color: driverColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  vehicleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleModel: {
    color: driverColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  vehicleDetails: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: driverColors.accentBg,
    borderRadius: 14,
  },
  etaLabel: {
    color: driverColors.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  etaValue: {
    color: driverColors.accent,
    fontSize: 14,
    fontWeight: '900',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnFull: {
    flex: 1,
    height: 48,
    borderRadius: 16,
    backgroundColor: driverColors.infoBg,
    borderWidth: 1.5,
    borderColor: driverColors.infoBorder,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  actionLabel: {
    color: driverColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  cancelBtn: {
    flex: 0.8,
    height: 48,
    borderRadius: 16,
    backgroundColor: driverColors.dangerBg,
    borderWidth: 1,
    borderColor: driverColors.dangerBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: driverColors.danger,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});

export default DriverIdentityCard;
