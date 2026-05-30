import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MotiView } from 'moti';
import {
  MapPin, Navigation, Clock, Star, DollarSign, MessageCircle, Check, X,
} from 'lucide-react-native';
import { formatBRL } from '@/utils/mappers';
import GlassCard from './GlassCard';
import CountdownRing from '../feedback/CountdownRing';
import StatusPill from '../feedback/StatusPill';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';

export type RideRequestItem = {
  rideId: string;
  status?: string;
  serviceType?: string;
  vehicleType?: string;
  client?: {
    id?: string;
    name?: string;
    phone?: string;
    profilePhoto?: string;
    rating?: number;
    ridesCount?: number;
  } | null;
  pickup?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  dropoff?: {
    address?: string;
    latitude?: number;
    longitude?: number;
  };
  pricing?: { total?: number; platformFee?: number };
  distance?: { text?: string; value?: number };
  duration?: { text?: string; value?: number };
  distanceToPickup?: number;
  payment?: { method?: { type?: string } | string };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    myOffer?: {
      amount: number;
      driverAmount?: number;
      status: string;
    } | null;
  };
  countdown?: number | null;
  isWaitingInQueue?: boolean;
};

export type RideRequestCardProps = {
  item: RideRequestItem;
  onAccept: (rideId: string) => void;
  onReject: (rideId: string) => void;
  onOpenDetail?: (item: any) => void;
  onCounterOffer?: (rideId: string) => void;
};

/**
 * RideRequestCard — Card de solicitação de corrida redesenhado.
 *
 * Layout:
 * ┌──────────────────────────────────────────────┐
 * │ 🟢 StatusPill                    ⏱ Countdown │
 * │                                              │
 * │ R$ 25,00                    🚗 3.2 km       │
 * │ R$ 7,81/km                                   │
 * │                                              │
 * │ ┌──────────────────────────────────────────┐ │
 * │ │ 🟢 Pickup address                        │ │
 * │ │ 🔴 Dropoff address                       │ │
 * │ └──────────────────────────────────────────┘ │
 * │                                              │
 * │ 👤 Maria S.  ⭐ 4.8  💰 Dinheiro             │
 * │                                              │
 * │ [ ❌ ]  [ 💬 Propor ]  [ ✅ ACEITAR ]        │
 * └──────────────────────────────────────────────┘
 */
export function RideRequestCard({
  item,
  onAccept,
  onReject,
  onOpenDetail,
  onCounterOffer,
}: RideRequestCardProps) {
  const finalPrice = item.negotiation?.clientOffer ?? item.pricing?.total ?? 0;
  const myOffer = item.negotiation?.myOffer;
  const isQueue = item.isWaitingInQueue === true;
  const isRejected = myOffer?.status === 'rejected';
  const isClientCountered = myOffer?.status === 'client_countered';
  const isPending = !!myOffer && !isRejected && !isClientCountered;
  const isCancelled = item.status === 'cancelled_by_client';

  const rawPaymentType =
    typeof item.payment?.method === 'object'
      ? (item.payment?.method as any)?.type
      : item.payment?.method;
  const paymentType = String(rawPaymentType || 'cash').toLowerCase();
  const paymentLabel =
    paymentType === 'pix' ? 'Pix'
    : paymentType === 'wallet' ? 'Carteira'
    : paymentType === 'card' ? 'Cartão'
    : 'Dinheiro';

  const clientName = item.client?.name || 'Cliente';
  const clientRating = Number(item.client?.rating || 5).toFixed(1);
  const vehicleIcon = item.vehicleType === 'motorcycle' ? '🏍' : '🚗';
  const vehicleLabel = item.vehicleType === 'motorcycle' ? 'Moto' : 'Carro';

  const valuePerKm =
    item.distance?.value && item.distance.value > 0
      ? finalPrice / (item.distance.value / 1000)
      : 0;

  // Status para StatusPill
  const pillVariant = isCancelled ? 'cancelled'
    : isRejected ? 'error'
    : isClientCountered ? 'warning'
    : isPending ? 'negotiating'
    : isQueue ? 'searching'
    : 'online';

  const pillLabel = isCancelled ? 'Cancelado'
    : isRejected ? 'Recusada'
    : isClientCountered ? 'Contraproposta'
    : isPending ? 'Negociando'
    : isQueue ? 'Fila'
    : 'Disponível';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'spring', damping: 15 }}
      style={{ marginBottom: driverSpacing.md }}
    >
      <GlassCard
        variant={isClientCountered ? 'accent' : isRejected ? 'danger' : 'default'}
        padding="md"
        onPress={isRejected || isCancelled ? undefined : () => onOpenDetail?.(item)}
      >
        {/* ── Header Row: Status + Countdown ── */}
        <View style={row}>
          <StatusPill variant={pillVariant} size="sm" label={pillLabel} />
          {(() => {
            const isDelivery = item.serviceType === 'delivery';
            const badgeColor = isDelivery ? '#10B981' : '#3B82F6';
            const badgeBg = isDelivery ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)';
            const badgeBorder = isDelivery ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)';
            const label = isDelivery ? 'Entrega 📦' : 'Corrida 🚗';
            return (
              <View
                style={{
                  backgroundColor: badgeBg,
                  borderColor: badgeBorder,
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingVertical: 3,
                  paddingHorizontal: 8,
                  marginLeft: 8,
                }}
              >
                <Text style={{ color: badgeColor, fontSize: 9, fontWeight: '900', textTransform: 'uppercase' }}>
                  {label}
                </Text>
              </View>
            );
          })()}
          <View style={{ flex: 1 }} />
          {!isCancelled && !isRejected && item.countdown != null && item.countdown > 0 && (
            <CountdownRing current={item.countdown} total={60} size={40} strokeWidth={3} />
          )}
        </View>

        {/* ── Price Row ── */}
        <View style={[row, { marginTop: 10, alignItems: 'baseline' }]}>
          <View>
            <Text style={priceText}>{formatBRL(finalPrice)}</Text>
            {valuePerKm > 0 && (
              <Text style={priceSubtext}>{formatBRL(valuePerKm)}/km</Text>
            )}
          </View>
          <View style={{ flex: 1 }} />
          <View style={statsRow}>
            {item.distance?.text && (
              <View style={statPill}>
                <Navigation size={11} color={driverColors.info} />
                <Text style={statText}>{item.distance.text}</Text>
              </View>
            )}
            {item.duration?.text && (
              <View style={statPill}>
                <Clock size={11} color={driverColors.warning} />
                <Text style={[statText, { color: driverColors.warning }]}>{item.duration.text}</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── Address Block ── */}
        <View style={addressBlock}>
          <View style={addressRow}>
            <View style={[dotStyle, { backgroundColor: driverColors.accent }]} />
            <Text style={addressText} numberOfLines={1}>
              {item.pickup?.address || 'Origem'}
            </Text>
          </View>
          <View style={[dotLine]} />
          <View style={addressRow}>
            <View style={[dotStyle, { backgroundColor: driverColors.danger }]} />
            <Text style={addressText} numberOfLines={1}>
              {item.dropoff?.address || 'Destino'}
            </Text>
          </View>
        </View>

        {/* ── Client + Meta Row ── */}
        <View style={[row, { marginTop: 12, marginBottom: 14 }]}>
          <View style={clientRow}>
            <View style={avatarCircle}>
              <Text style={avatarText}>{clientName[0]?.toUpperCase()}</Text>
            </View>
            <View>
              <Text style={clientNameText}>{clientName}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Star size={11} color="#FBBF24" fill="#FBBF24" />
                <Text style={clientMeta}>{clientRating}</Text>
              </View>
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={vehiclePill}>
              <Text style={{ fontSize: 13 }}>{vehicleIcon}</Text>
              <Text style={vehicleText}>{vehicleLabel}</Text>
            </View>
            <View style={paymentPill}>
              <DollarSign size={10} color={driverColors.textMuted} />
              <Text style={paymentText}>{paymentLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── Action Buttons ── */}
        {isCancelled ? (
          <View style={infoBar}>
            <Text style={infoBarText}>Cancelado pelo cliente</Text>
          </View>
        ) : isRejected ? (
          <View style={[infoBar, { borderColor: driverColors.dangerBorder, backgroundColor: driverColors.dangerBg }]}>
            <Text style={[infoBarText, { color: driverColors.danger }]}>Você recusou esta oferta</Text>
          </View>
        ) : isClientCountered ? (
          <View style={buttonRow}>
            <TouchableOpacity style={rejectBtn} onPress={() => onReject(item.rideId)} activeOpacity={0.7}>
              <X size={14} color={driverColors.danger} />
              <Text style={rejectText}>Recusar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={acceptBtn} onPress={() => onAccept(item.rideId)} activeOpacity={0.85}>
              <Check size={16} color={driverColors.bg} strokeWidth={3} />
              <Text style={acceptText}>Aceitar {formatBRL(myOffer!.amount)}</Text>
            </TouchableOpacity>
          </View>
        ) : isPending ? (
          <View style={buttonRow}>
            <View style={waitingBar}>
              <ActivityIndicator size="small" color={driverColors.warning} />
              <Text style={waitingText}>Aguardando resposta</Text>
            </View>
            <TouchableOpacity style={rejectBtn} onPress={() => onReject(item.rideId)} activeOpacity={0.7}>
              <X size={13} color={driverColors.danger} />
              <Text style={rejectText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={buttonRow}>
            <TouchableOpacity style={rejectBtn} onPress={() => onReject(item.rideId)} activeOpacity={0.7}>
              <X size={14} color={driverColors.danger} />
              <Text style={rejectText}>Recusar</Text>
            </TouchableOpacity>
            {item.negotiation?.enabled && (
              <TouchableOpacity
                style={counterBtn}
                onPress={() => onCounterOffer?.(item.rideId)}
                activeOpacity={0.85}
              >
                <MessageCircle size={13} color={driverColors.accent} />
                <Text style={counterText}>Propor</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={acceptBtn} onPress={() => onAccept(item.rideId)} activeOpacity={0.85}>
              <Check size={16} color={driverColors.bg} strokeWidth={3} />
              <Text style={acceptText}>Aceitar</Text>
            </TouchableOpacity>
          </View>
        )}
      </GlassCard>
    </MotiView>
  );
}

// ─── Styles ───────────────────────────────────────────────
const row: any = { flexDirection: 'row' as const, alignItems: 'center' as const };

const priceText: any = {
  fontSize: driverTypography.price.fontSize,
  fontWeight: '900' as const,
  color: driverColors.accent,
  fontVariant: ['tabular-nums'],
};

const priceSubtext: any = {
  fontSize: 12,
  fontWeight: '600',
  color: driverColors.textMuted,
  marginTop: 1,
};

const statsRow: any = { flexDirection: 'row' as const, gap: 6 };

const statPill: any = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 4,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: driverColors.borderLight,
};

const statText: any = {
  fontSize: 11,
  fontWeight: '700',
  color: driverColors.info,
};

const addressBlock: any = {
  marginTop: 14,
  padding: 12,
  borderRadius: driverRadius.md,
  backgroundColor: 'rgba(255,255,255,0.02)',
  borderWidth: 1,
  borderColor: driverColors.borderLight,
  gap: 8,
};

const addressRow: any = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10 };

const dotStyle: any = { width: 8, height: 8, borderRadius: 4 };

const dotLine: any = {
  width: 1.5,
  height: 14,
  backgroundColor: 'rgba(255,255,255,0.15)',
  marginLeft: 3,
};

const addressText: any = {
  flex: 1,
  color: driverColors.text,
  fontSize: 13,
  fontWeight: '700',
};

const clientRow: any = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8 };

const avatarCircle: any = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: driverColors.accentBg,
  alignItems: 'center',
  justifyContent: 'center',
};

const avatarText: any = { color: driverColors.accent, fontSize: 14, fontWeight: '900' as const };

const clientNameText: any = {
  color: driverColors.text,
  fontSize: 13,
  fontWeight: '800',
};

const clientMeta: any = {
  color: driverColors.textMuted,
  fontSize: 11,
  fontWeight: '600',
};

const vehiclePill: any = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  paddingHorizontal: 8,
  paddingVertical: 3,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.04)',
};

const vehicleText: any = {
  color: driverColors.textSecondary,
  fontSize: 10,
  fontWeight: '800',
};

const paymentPill: any = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 3,
  paddingHorizontal: 6,
  paddingVertical: 3,
  borderRadius: 8,
  backgroundColor: 'rgba(255,255,255,0.03)',
};

const paymentText: any = {
  color: driverColors.textMuted,
  fontSize: 10,
  fontWeight: '700',
};

const buttonRow: any = { flexDirection: 'row' as const, gap: 6 };

const rejectBtn: any = {
  flex: 1,
  height: 40,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: driverColors.dangerBorder,
  backgroundColor: driverColors.dangerBg,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
};

const rejectText: any = {
  color: driverColors.danger,
  fontWeight: '900',
  fontSize: 11,
  textTransform: 'uppercase' as const,
};

const counterBtn: any = {
  flex: 1.2,
  height: 40,
  borderRadius: 12,
  borderWidth: 1.5,
  borderColor: driverColors.accentBorder,
  backgroundColor: driverColors.accentBg,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
};

const counterText: any = {
  color: driverColors.accent,
  fontWeight: '900',
  fontSize: 11,
  textTransform: 'uppercase' as const,
};

const acceptBtn: any = {
  flex: 1.2,
  height: 40,
  borderRadius: 12,
  backgroundColor: driverColors.accent,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 5,
};

const acceptText: any = {
  color: driverColors.bg,
  fontWeight: '900',
  fontSize: 11,
  textTransform: 'uppercase' as const,
};

const infoBar: any = {
  height: 40,
  borderRadius: 12,
  backgroundColor: driverColors.dangerBg,
  borderWidth: 1,
  borderColor: driverColors.dangerBorder,
  alignItems: 'center',
  justifyContent: 'center',
};

const infoBarText: any = {
  color: driverColors.danger,
  fontWeight: '900',
  fontSize: 11,
  textTransform: 'uppercase' as const,
  letterSpacing: 0.5,
};

const waitingBar: any = {
  flex: 1.8,
  height: 40,
  borderRadius: 12,
  backgroundColor: driverColors.warningBg,
  borderWidth: 1,
  borderColor: driverColors.warningBorder,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};

const waitingText: any = {
  color: driverColors.warning,
  fontWeight: '900',
  fontSize: 11,
  textTransform: 'uppercase' as const,
};
