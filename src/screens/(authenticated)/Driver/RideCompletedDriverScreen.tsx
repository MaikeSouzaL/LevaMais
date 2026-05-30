import React from 'react';
import { View, Text, TouchableOpacity, Linking, Platform, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import { CheckCircle, Star, MapPin, TrendingUp, Home, ChevronRight } from 'lucide-react-native';
import { formatBRL } from '@/utils/mappers';
import GlassCard from '@/components/driver/cards/GlassCard';
import ProgressBar from '@/components/driver/feedback/ProgressBar';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';

interface RideCompletedDriverProps {
  rideId: string;
  earnings: number;
  netEarnings?: number;
  clientName?: string;
  clientRating?: number;
  clientInitial?: string;
  pickupAddress?: string;
  dropoffAddress?: string;
  distanceText?: string;
  durationText?: string;
  paymentMethod?: string;
  riderRating?: { stars: number; comment?: string };
  onRateClient: () => void;
  onViewDetails: () => void;
  onGoHome: () => void;
}

export default function RideCompletedDriverScreen({
  rideId,
  earnings,
  netEarnings,
  clientName = 'Passageiro',
  clientRating = 5,
  clientInitial,
  pickupAddress = '-',
  dropoffAddress = '-',
  distanceText,
  durationText,
  paymentMethod,
  riderRating,
  onRateClient,
  onViewDetails,
  onGoHome,
}: RideCompletedDriverProps) {
  const displayNet = netEarnings ?? earnings;
  const initial = clientInitial || clientName[0]?.toUpperCase() || 'P';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      {/* Checkmark + Title */}
      <MotiView
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 8, stiffness: 150 }}
        style={styles.hero}
      >
        <View style={styles.checkCircle}>
          <CheckCircle size={48} color={driverColors.accent} fill={driverColors.accent} />
        </View>
        <Text style={styles.title}>CORRIDA FINALIZADA</Text>
        <Text style={styles.subtitle}>Pagamento processado com sucesso</Text>
      </MotiView>

      {/* Earnings Card */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 200 }}
      >
        <GlassCard variant="accent" padding="lg" style={{ alignItems: 'center', marginBottom: driverSpacing.lg }}>
          <Text style={styles.earningsLabel}>Seu ganho total</Text>
          <Text style={styles.earningsValue}>{formatBRL(earnings)}</Text>
          {netEarnings != null && netEarnings !== earnings && (
            <Text style={styles.netLabel}>({formatBRL(netEarnings)} líquido)</Text>
          )}
        </GlassCard>
      </MotiView>

      {/* Route Summary */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 350 }}
      >
        <GlassCard variant="default" padding="md" style={{ marginBottom: driverSpacing.md }}>
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: driverColors.accent }]} />
            <Text style={styles.routeText} numberOfLines={1}>{pickupAddress}</Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routeRow}>
            <View style={[styles.dot, { backgroundColor: driverColors.danger }]} />
            <Text style={styles.routeText} numberOfLines={1}>{dropoffAddress}</Text>
          </View>

          <View style={styles.metaRow}>
            {distanceText && <Text style={styles.metaText}>🚗 {distanceText}</Text>}
            {durationText && <Text style={styles.metaText}>⏱ {durationText}</Text>}
            {paymentMethod && <Text style={styles.metaText}>💰 {paymentMethod}</Text>}
          </View>
        </GlassCard>
      </MotiView>

      {/* Client Rating */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 500 }}
      >
        <GlassCard variant="default" padding="md" style={{ marginBottom: driverSpacing.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.clientName}>{clientName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                <Star size={12} color="#FBBF24" fill="#FBBF24" />
                <Text style={styles.clientMeta}>{clientRating.toFixed(1)}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.rateBtn} onPress={onRateClient} activeOpacity={0.85}>
              <Text style={styles.rateBtnText}>Avaliar</Text>
            </TouchableOpacity>
          </View>

          {/* Rider's rating of driver */}
          {riderRating?.stars && (
            <View style={styles.riderRating}>
              <Text style={styles.riderLabel}>Cliente te avaliou:</Text>
              <View style={{ flexDirection: 'row', gap: 2, marginTop: 4 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={18}
                    color="#FBBF24"
                    fill={star <= riderRating.stars ? '#FBBF24' : 'transparent'}
                  />
                ))}
              </View>
              {riderRating.comment && (
                <Text style={styles.riderComment}>"{riderRating.comment}"</Text>
              )}
            </View>
          )}
        </GlassCard>
      </MotiView>

      {/* Action Buttons */}
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 12, delay: 650 }}
        style={styles.actions}
      >
        <TouchableOpacity style={styles.secondaryBtn} onPress={onViewDetails} activeOpacity={0.85}>
          <Text style={styles.secondaryBtnText}>Ver Detalhes</Text>
          <ChevronRight size={16} color={driverColors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryBtn} onPress={onGoHome} activeOpacity={0.85}>
          <Home size={18} color={driverColors.bg} />
          <Text style={styles.primaryBtnText}>Voltar ao Mapa</Text>
        </TouchableOpacity>
      </MotiView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: driverColors.bg,
    paddingHorizontal: driverSpacing.lg,
    paddingTop: driverSpacing['2xl'],
  },
  hero: {
    alignItems: 'center',
    marginBottom: driverSpacing.xl,
  },
  checkCircle: {
    marginBottom: 16,
  },
  title: {
    color: driverColors.text,
    fontSize: 22,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  subtitle: {
    color: driverColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 6,
  },
  earningsLabel: {
    ...driverTypography.caption,
    color: driverColors.accent,
    marginBottom: 6,
  },
  earningsValue: {
    fontSize: driverTypography.priceLarge.fontSize,
    fontWeight: '900',
    color: driverColors.accent,
    fontVariant: ['tabular-nums'],
  },
  netLabel: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  routeText: {
    flex: 1,
    color: driverColors.text,
    fontSize: 13,
    fontWeight: '700',
  },
  routeLine: {
    width: 1.5,
    height: 14,
    backgroundColor: driverColors.border,
    marginLeft: 3,
    marginVertical: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: driverColors.borderLight,
  },
  metaText: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: driverColors.accentBg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: driverColors.accentBorder,
  },
  avatarText: {
    color: driverColors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  clientName: {
    color: driverColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  clientMeta: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  rateBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: driverColors.accent,
    backgroundColor: driverColors.accentBg,
  },
  rateBtnText: {
    color: driverColors.accent,
    fontWeight: '800',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  riderRating: {
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: driverColors.borderLight,
    alignItems: 'center',
  },
  riderLabel: {
    color: driverColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  riderComment: {
    color: driverColors.textSecondary,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 'auto',
    marginBottom: driverSpacing['2xl'],
  },
  secondaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: driverColors.border,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  secondaryBtnText: {
    color: driverColors.text,
    fontWeight: '800',
    fontSize: 13,
    textTransform: 'uppercase',
  },
  primaryBtn: {
    flex: 1,
    height: 50,
    borderRadius: 16,
    backgroundColor: driverColors.accent,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryBtnText: {
    color: driverColors.bg,
    fontWeight: '900',
    fontSize: 13,
    textTransform: 'uppercase',
  },
});
