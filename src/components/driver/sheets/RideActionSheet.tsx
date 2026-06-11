import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Linking, Platform } from 'react-native';
import { MotiView } from 'moti';
import {
  MapPin, Navigation, MessageCircle, Phone, AlertTriangle, Star, ChevronRight,
} from 'lucide-react-native';
import { driverColors, driverTypography, driverRadius, driverSpacing } from '@/theme/driverTheme';
import GlassCard from '../cards/GlassCard';
import StatusPill from '../feedback/StatusPill';
import ProgressBar from '../feedback/ProgressBar';

type RidePhase = 'toPickup' | 'arrived' | 'inProgress';

interface RideActionSheetProps {
  /** Fase atual da corrida */
  phase: RidePhase;
  /** Ganho estimado */
  earnings: number;
  /** Distância total em km */
  distanceKm: number;
  /** Tempo estimado em minutos */
  etaMinutes: number;
  /** Nome do cliente */
  clientName: string;
  /** Rating do cliente */
  clientRating: number;
  /** Telefone do cliente (para ligação) */
  clientPhone?: string;
  /** Endereço de pickup */
  pickupAddress: string;
  /** Endereço de dropoff */
  dropoffAddress: string;
  /** Ações */
  onArrived: () => void;
  onStartRide: () => void;
  onOpenChat: () => void;
  onCancelRide: () => void;
  onNavigateToPickup?: () => void;
  onNavigateToDropoff?: () => void;
  /** Loading states */
  isArriving?: boolean;
  isStarting?: boolean;
  unreadMessages?: number;
}

/**
 * RideActionSheet — Painel de ações durante a corrida (visão do motorista).
 *
 * Exibe:
 * - Indicador de fase (progress bar horizontal)
 * - Ganho estimado + distância + ETA
 * - Card do cliente (nome, rating, foto)
 * - Botões de ação contextual (Cheguei / Iniciar / Chat / Navegar / Ligar / Cancelar)
 */
export function RideActionSheet({
  phase,
  earnings,
  distanceKm,
  etaMinutes,
  clientName,
  clientRating,
  clientPhone,
  pickupAddress,
  dropoffAddress,
  onArrived,
  onStartRide,
  onOpenChat,
  onCancelRide,
  onNavigateToPickup,
  onNavigateToDropoff,
  isArriving = false,
  isStarting = false,
  unreadMessages = 0,
}: RideActionSheetProps) {
  const formattedEarnings = `R$ ${earnings.toFixed(2).replace('.', ',')}`;

  // Progresso da fase (0 = toPickup, 0.5 = arrived, 1 = inProgress/completed)
  const phaseProgress = phase === 'toPickup' ? 0.33 : phase === 'arrived' ? 0.66 : 1;

  const handleCall = () => {
    if (clientPhone) {
      Linking.openURL(`tel:${clientPhone}`);
    }
  };

  const handleNavigate = () => {
    const address = phase === 'toPickup' ? pickupAddress : dropoffAddress;
    const encoded = encodeURIComponent(address);
    const url = Platform.select({
      ios: `maps://app?daddr=${encoded}&dirflg=d`,
      android: `google.navigation:q=${encoded}`,
    });
    if (url) Linking.openURL(url);
  };

  return (
    <View style={{ paddingHorizontal: driverSpacing.lg, paddingBottom: 40, gap: 16 }}>
      {/* ── Progress Phase Indicator ── */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={phaseLabel}>Indo buscar</Text>
          <Text style={phaseLabel}>Cliente embarcou</Text>
          <Text style={phaseLabel}>Destino final</Text>
        </View>
        <ProgressBar progress={phaseProgress} height={6} color={phase === 'inProgress' ? driverColors.accent : driverColors.info} />
        {phase === 'arrived' && (
          <StatusPill variant="arrived" size="sm" style={{ alignSelf: 'center', marginTop: 8 }} />
        )}
      </View>

      {/* ── Earnings + Stats ── */}
      <GlassCard variant="elevated" padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={earningsText}>{formattedEarnings}</Text>
            <Text style={statsLabel}>Ganho</Text>
          </View>
          <View style={divider} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={statsValue}>{distanceKm.toFixed(1).replace('.', ',')} km</Text>
            <Text style={statsLabel}>Distância</Text>
          </View>
          <View style={divider} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={statsValue}>{etaMinutes} min</Text>
            <Text style={statsLabel}>Tempo est.</Text>
          </View>
        </View>
      </GlassCard>

      {/* ── Client Card ── */}
      <GlassCard variant="default" padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={clientAvatar}>
            <Text style={clientAvatarText}>{clientName[0]?.toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={clientNameText}>{clientName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Star size={12} color="#FBBF24" fill="#FBBF24" />
              <Text style={clientMeta}>{clientRating.toFixed(1)}</Text>
            </View>
          </View>
          {clientPhone && (
            <TouchableOpacity onPress={handleCall} style={iconBtn} activeOpacity={0.7}>
              <Phone size={18} color={driverColors.accent} />
            </TouchableOpacity>
          )}
        </View>
      </GlassCard>

      {/* ── Addresses ── */}
      <GlassCard variant="default" padding="md">
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
          <View style={[dot, { backgroundColor: driverColors.accent, marginTop: 3 }]} />
          <Text style={addressText} numberOfLines={1}>{pickupAddress}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
          <View style={[dot, { backgroundColor: driverColors.danger, marginTop: 3 }]} />
          <Text style={addressText} numberOfLines={1}>{dropoffAddress}</Text>
        </View>
      </GlassCard>

      {/* ── Action Buttons ── */}
      <View style={{ gap: 10 }}>
        {/* Primary action: context-dependent */}
        {phase === 'toPickup' && (
          <TouchableOpacity style={primaryBtn} onPress={onArrived} disabled={isArriving} activeOpacity={0.85}>
            <MapPin size={18} color={driverColors.bg} />
            <Text style={primaryBtnText}>{isArriving ? 'Aguarde...' : 'CHEGUEI NA COLETA'}</Text>
          </TouchableOpacity>
        )}
        {phase === 'arrived' && (
          <TouchableOpacity style={primaryBtn} onPress={onStartRide} disabled={isStarting} activeOpacity={0.85}>
            <Navigation size={18} color={driverColors.bg} />
            <Text style={primaryBtnText}>{isStarting ? 'Iniciando...' : 'INICIAR CORRIDA'}</Text>
          </TouchableOpacity>
        )}

        {/* Secondary actions row */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity style={secondaryBtn} onPress={onOpenChat} activeOpacity={0.8}>
            <MessageCircle size={18} color={driverColors.text} />
            <Text style={secondaryText}>Chat</Text>
            {unreadMessages > 0 && (
              <View style={unreadBadge}>
                <Text style={unreadBadgeText}>{unreadMessages > 9 ? '9+' : unreadMessages}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={secondaryBtn} onPress={handleNavigate} activeOpacity={0.8}>
            <Navigation size={18} color={driverColors.info} />
            <Text style={[secondaryText, { color: driverColors.info }]}>Navegar</Text>
          </TouchableOpacity>

          {clientPhone && (
            <TouchableOpacity style={secondaryBtn} onPress={handleCall} activeOpacity={0.8}>
              <Phone size={18} color={driverColors.accent} />
              <Text style={[secondaryText, { color: driverColors.accent }]}>Ligar</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={dangerBtn} onPress={onCancelRide} activeOpacity={0.8}>
            <AlertTriangle size={16} color={driverColors.danger} />
            <Text style={dangerText}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────
const phaseLabel: any = { color: driverColors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const };

const earningsText: any = { color: driverColors.accent, fontSize: 22, fontWeight: '900', fontVariant: ['tabular-nums'] };
const statsValue: any = { color: driverColors.text, fontSize: 17, fontWeight: '800' };
const statsLabel: any = { color: driverColors.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' as const, marginTop: 2 };
const divider: any = { width: 1, height: 28, backgroundColor: driverColors.border };

const clientAvatar: any = { width: 44, height: 44, borderRadius: 22, backgroundColor: driverColors.accentBg, alignItems: 'center', justifyContent: 'center' };
const clientAvatarText = { color: driverColors.accent, fontSize: 18, fontWeight: '900' as const };
const clientNameText: any = { color: driverColors.text, fontSize: 15, fontWeight: '800' };
const clientMeta: any = { color: driverColors.textMuted, fontSize: 12, fontWeight: '600' };
const iconBtn: any = { width: 40, height: 40, borderRadius: 12, backgroundColor: driverColors.accentBg, alignItems: 'center', justifyContent: 'center' };

const dot = { width: 8, height: 8, borderRadius: 4 };
const addressText: any = { flex: 1, color: driverColors.textSecondary, fontSize: 13, fontWeight: '600' };

const primaryBtn: any = {
  height: 52,
  borderRadius: 16,
  backgroundColor: driverColors.accent,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  shadowColor: driverColors.accent,
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.25,
  shadowRadius: 8,
  elevation: 4,
};
const primaryBtnText: any = { color: driverColors.bg, fontWeight: '900', fontSize: 14, textTransform: 'uppercase' as const, letterSpacing: 0.5 };

const secondaryBtn: any = {
  flex: 1,
  height: 44,
  borderRadius: 14,
  backgroundColor: 'rgba(255,255,255,0.04)',
  borderWidth: 1,
  borderColor: driverColors.border,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};
const secondaryText: any = { color: driverColors.text, fontWeight: '700', fontSize: 11, textTransform: 'uppercase' as const };

const dangerBtn: any = {
  flex: 1,
  height: 44,
  borderRadius: 14,
  backgroundColor: driverColors.dangerBg,
  borderWidth: 1,
  borderColor: driverColors.dangerBorder,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
};
const dangerText: any = { color: driverColors.danger, fontWeight: '700', fontSize: 11, textTransform: 'uppercase' as const };

const unreadBadge: any = {
  position: 'absolute',
  top: -4,
  right: -4,
  minWidth: 18,
  height: 18,
  borderRadius: 9,
  backgroundColor: driverColors.danger,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 4,
  borderWidth: 1.5,
  borderColor: driverColors.bg,
};
const unreadBadgeText = { color: driverColors.text, fontSize: 9, fontWeight: '900' as const };
