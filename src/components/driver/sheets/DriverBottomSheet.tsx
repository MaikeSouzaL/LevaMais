import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { Car, Package, Star, TrendingUp, Clock, AlertTriangle, Settings, ClipboardList } from 'lucide-react-native';
import { MotiView } from 'moti';

import OnlineToggle from '../hud/OnlineToggle';
import GlassCard from '../cards/GlassCard';
import MetricCard from '../cards/MetricCard';
import { driverColors, driverTheme } from '@/theme/driverTheme';

export type DriverServicePrefs = {
  ride: boolean;
  delivery: boolean;
};

interface DriverStats {
  rating?: number;
  acceptanceRate?: number;
  onlineTime?: number;
  earnings?: number;
}

interface DriverBottomSheetProps {
  online: boolean;
  services: DriverServicePrefs;
  isTogglingOnline?: boolean;
  onToggleOnline: () => void;
  onToggleService: (key: keyof DriverServicePrefs) => void;
  snapPoints?: string[];
  vehicleType?: string;
  stats?: DriverStats;
  driverBalance?: number | null;
  onAddBalance?: () => void;
  onPressOffers: () => void;
  hasPendingOffer?: boolean;
  offersPulseToken?: number;
  pendingNegotiationsCount?: number;
  clientCounteredCount?: number;
  onPressNegotiations?: () => void;
}

export function DriverBottomSheet({
  online,
  services,
  isTogglingOnline,
  onToggleOnline,
  onToggleService,
  snapPoints: userSnapPoints,
  vehicleType,
  stats,
  driverBalance,
  onAddBalance,
  onPressOffers,
  hasPendingOffer = false,
  offersPulseToken = 0,
  pendingNegotiationsCount = 0,
  clientCounteredCount = 0,
  onPressNegotiations,
}: DriverBottomSheetProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Snap points dinâmicos melhorados
  const finalSnapPoints = useMemo(() => {
    if (userSnapPoints) return userSnapPoints;
    const hasNoBalance = driverBalance !== undefined && driverBalance !== null && driverBalance <= 0 && !online;

    if (hasNoBalance) return ['48%', '64%'];
    // 3 snap points: collapsed (só toggle + stats), expanded (preferências), full (menu completo)
    return showSettings ? ['30%', '58%'] : ['20%', '35%'];
  }, [userSnapPoints, driverBalance, online, showSettings]);

  const canDoRides = vehicleType === 'car' || vehicleType === 'motorcycle';

  const displayRating = stats?.rating != null ? stats.rating.toFixed(1) : '5.0';
  const displayBalance =
    driverBalance != null
      ? `R$ ${Number(driverBalance).toFixed(2).replace('.', ',')}`
      : 'R$ 0,00';

  const displayOnlineTime = useMemo(() => {
    if (stats?.onlineTime == null) return '00:00';
    const totalSecs = Math.round(stats.onlineTime);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;

    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }, [stats?.onlineTime]);

  return (
    <BottomSheet
      index={0}
      snapPoints={finalSnapPoints}
      enablePanDownToClose={false}
      backgroundStyle={{
        backgroundColor: driverColors.bg,
        borderRadius: 32,
        borderWidth: 1.5,
        borderColor: driverColors.border,
      }}
      handleIndicatorStyle={{
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 44,
      }}
    >
      <BottomSheetScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 10,
          paddingBottom: 40,
        }}
      >
        {/* ── Zero Balance Warning ── */}
        {driverBalance !== undefined && driverBalance !== null && driverBalance <= 0 && !online && (
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: -10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ marginBottom: 16 }}
          >
            <GlassCard variant="danger" padding="lg">
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={{
                    backgroundColor: driverColors.dangerBg,
                    padding: 10,
                    borderRadius: 14,
                  }}
                >
                  <AlertTriangle size={20} color={driverColors.danger} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      color: driverColors.danger,
                      fontWeight: '900',
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                    }}
                  >
                    Saldo Insuficiente
                  </Text>
                  <Text
                    style={{
                      color: driverColors.textSecondary,
                      fontSize: 11,
                      fontWeight: '600',
                      marginTop: 4,
                      lineHeight: 15,
                    }}
                  >
                    Você precisa de saldo positivo para ficar online e aceitar
                    corridas.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={onAddBalance}
                activeOpacity={0.85}
                style={{
                  marginTop: 14,
                  backgroundColor: driverColors.accent,
                  borderRadius: 16,
                  paddingVertical: 12,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    color: driverColors.bg,
                    fontWeight: '900',
                    fontSize: 13,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Adicionar Saldo
                </Text>
              </TouchableOpacity>
            </GlassCard>
          </MotiView>
        )}

        {/* ── Stats Row ── */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <MetricCard
            icon={<Star size={14} color="#FBBF24" fill="#FBBF24" />}
            label="Avaliação"
            value={displayRating}
            accent="yellow"
          />
          <MetricCard
            icon={<TrendingUp size={14} color={driverColors.accent} />}
            label="Saldo"
            value={displayBalance}
            accent="green"
          />
          <MetricCard
            icon={<Clock size={14} color={driverColors.info} />}
            label="Tempo Online"
            value={displayOnlineTime}
            accent="blue"
          />
        </View>

        {/* ── Negotiations Banner ── */}
        {(pendingNegotiationsCount > 0 || clientCounteredCount > 0) && online && (
          <TouchableOpacity
            onPress={onPressNegotiations || onPressOffers}
            activeOpacity={0.85}
            style={{ marginBottom: 18 }}
          >
            <GlassCard
              variant={clientCounteredCount > 0 ? 'accent' : 'warning'}
              padding="md"
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <MotiView
                    from={{ scale: 0.7 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ type: 'timing', loop: true, duration: 1800 }}
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor:
                        clientCounteredCount > 0
                          ? driverColors.accent
                          : driverColors.warning,
                    }}
                  />
                  <View>
                    <Text
                      style={{
                        color: driverColors.text,
                        fontWeight: '900',
                        fontSize: 12,
                      }}
                    >
                      {clientCounteredCount > 0
                        ? 'Contraproposta do Cliente!'
                        : 'Negociações Pendentes'}
                    </Text>
                    <Text
                      style={{
                        color: driverColors.textMuted,
                        fontSize: 10,
                        fontWeight: '600',
                        marginTop: 2,
                      }}
                    >
                      {clientCounteredCount > 0
                        ? `Você tem ${clientCounteredCount} contraproposta(s) aguardando`
                        : `Você tem ${pendingNegotiationsCount} negociação(ões) em aberto`}
                    </Text>
                  </View>
                </View>
                <MotiView
                  from={{ translateX: 0 }}
                  animate={{ translateX: [0, 6, 0] }}
                  transition={{ type: 'timing', loop: true, duration: 2000 }}
                >
                  <Text
                    style={{
                      color:
                        clientCounteredCount > 0
                          ? driverColors.accent
                          : driverColors.warning,
                      fontWeight: '900',
                      fontSize: 12,
                    }}
                  >
                    Ver →
                  </Text>
                </MotiView>
              </View>
            </GlassCard>
          </TouchableOpacity>
        )}

        {/* ── Main Action Row: Settings + Toggle + Offers ── */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: showSettings ? 18 : 0,
          }}
        >
          {/* Settings gear button */}
          <TouchableOpacity
            onPress={() => setShowSettings((prev) => !prev)}
            activeOpacity={0.8}
            style={{
              width: 54,
              height: 54,
              borderRadius: 27,
              backgroundColor: showSettings
                ? driverColors.accentBg
                : 'rgba(255,255,255,0.04)',
              borderWidth: 1.5,
              borderColor: showSettings
                ? driverColors.accent
                : driverColors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Settings
              size={20}
              color={
                showSettings ? driverColors.accent : driverColors.textSecondary
              }
              strokeWidth={2.5}
            />
          </TouchableOpacity>

          {/* Online Toggle (unified) */}
          <View style={{ flex: 1 }}>
            <OnlineToggle
              isOnline={online}
              isLoading={!!isTogglingOnline}
              onToggle={onToggleOnline}
              onlineDuration={
                online && stats?.onlineTime
                  ? `Online há ${displayOnlineTime}`
                  : undefined
              }
            />
          </View>

          {/* Offers clipboard button */}
          <MotiView
            key={`offers-pulse-${offersPulseToken}-${hasPendingOffer ? 'on' : 'off'}`}
            from={
              hasPendingOffer
                ? { scale: 0.7, opacity: 0.4 }
                : { scale: 1, opacity: 1 }
            }
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'timing',
              duration: hasPendingOffer ? 320 : 180,
            }}
            style={{ position: 'relative' }}
          >
            {/* Burst rings when pending */}
            {hasPendingOffer && (
              <>
                <MotiView
                  key={`offers-burst-outer-${offersPulseToken}`}
                  from={{ opacity: 0.65, scale: 0.45 }}
                  animate={{ opacity: 0, scale: 1.85 }}
                  transition={{ type: 'timing', duration: 620 }}
                  style={{
                    position: 'absolute',
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    borderWidth: 2,
                    borderColor: 'rgba(251,191,36,0.95)',
                    top: 0,
                    left: 0,
                  }}
                />
                <MotiView
                  key={`offers-burst-inner-${offersPulseToken}`}
                  from={{ opacity: 0.75, scale: 0.35 }}
                  animate={{ opacity: 0, scale: 1.35 }}
                  transition={{ type: 'timing', duration: 500 }}
                  style={{
                    position: 'absolute',
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    borderWidth: 1.5,
                    borderColor: 'rgba(251,191,36,0.7)',
                    top: 0,
                    left: 0,
                  }}
                />
              </>
            )}
            <TouchableOpacity
              onPress={onPressOffers}
              activeOpacity={0.8}
              style={{
                width: 54,
                height: 54,
                borderRadius: 27,
                backgroundColor: hasPendingOffer
                  ? '#FBBF24'
                  : 'rgba(255,255,255,0.04)',
                borderWidth: 1.5,
                borderColor: hasPendingOffer
                  ? 'rgba(251,191,36,0.9)'
                  : driverColors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MotiView
                key={`offers-icon-pop-${offersPulseToken}-${hasPendingOffer ? 'pending' : 'idle'}`}
                from={
                  hasPendingOffer
                    ? { scale: 0.7, rotate: '0deg' }
                    : { scale: 1, rotate: '0deg' }
                }
                animate={{ scale: 1, rotate: '0deg' }}
                transition={{ type: 'spring', damping: 9, stiffness: 180 }}
              >
                <ClipboardList
                  size={20}
                  color={
                    hasPendingOffer
                      ? driverColors.bg
                      : driverColors.textSecondary
                  }
                  strokeWidth={2.5}
                />
              </MotiView>
            </TouchableOpacity>
          </MotiView>
        </View>

        {/* ── Service Preferences (expandable) ── */}
        {showSettings && (
          <MotiView
            from={{ opacity: 0, scale: 0.95, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            style={{ marginTop: 6 }}
          >
            <GlassCard variant="default" padding="lg">
              <Text
                style={{
                  color: driverColors.textMuted,
                  fontSize: 10,
                  fontWeight: '900',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 12,
                }}
              >
                Preferências de Serviço
              </Text>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  onPress={() => canDoRides && onToggleService('ride')}
                  activeOpacity={0.8}
                  disabled={!canDoRides}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: services.ride
                      ? driverColors.accent
                      : driverColors.border,
                    backgroundColor: services.ride
                      ? driverColors.accentBg
                      : 'rgba(255,255,255,0.03)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: !canDoRides ? 0.4 : 1,
                  }}
                >
                  <Car
                    size={18}
                    color={
                      services.ride
                        ? driverColors.accent
                        : driverColors.textMuted
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: services.ride
                        ? driverColors.text
                        : driverColors.textMuted,
                      fontWeight: '900',
                      fontSize: 13,
                    }}
                  >
                    Corridas
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onToggleService('delivery')}
                  activeOpacity={0.8}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 16,
                    borderWidth: 2,
                    borderColor: services.delivery
                      ? driverColors.accent
                      : driverColors.border,
                    backgroundColor: services.delivery
                      ? driverColors.accentBg
                      : 'rgba(255,255,255,0.03)',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Package
                    size={18}
                    color={
                      services.delivery
                        ? driverColors.accent
                        : driverColors.textMuted
                    }
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={{
                      color: services.delivery
                        ? driverColors.text
                        : driverColors.textMuted,
                      fontWeight: '900',
                      fontSize: 13,
                    }}
                  >
                    Entregas
                  </Text>
                </TouchableOpacity>
              </View>

              {!canDoRides && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: 'rgba(255,255,255,0.02)',
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: driverColors.borderLight,
                  }}
                >
                  <Text
                    style={{
                      color: driverColors.textMuted,
                      fontSize: 10.5,
                      textAlign: 'center',
                      fontWeight: '600',
                    }}
                  >
                    Corridas de passageiros bloqueadas para seu tipo de
                    veículo.
                  </Text>
                </View>
              )}

              {!services.ride && !services.delivery && (
                <View
                  style={{
                    marginTop: 12,
                    padding: 12,
                    backgroundColor: driverColors.warningBg,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: driverColors.warningBorder,
                  }}
                >
                  <Text
                    style={{
                      color: driverColors.warning,
                      fontWeight: '900',
                      fontSize: 10.5,
                      textAlign: 'center',
                    }}
                  >
                    Ative ao menos 1 serviço para receber solicitações.
                  </Text>
                </View>
              )}
            </GlassCard>
          </MotiView>
        )}
      </BottomSheetScrollView>
    </BottomSheet>
  );
}
