import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { MotiView, AnimatePresence } from 'moti';
import { Clock, Route, Star, Minus, Plus, Send, Car, Package } from 'lucide-react-native';
import { formatBRL } from '@/utils/mappers';
import CountdownRing from '../feedback/CountdownRing';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface IncomingOfferSheetProps {
  isVisible: boolean;
  request: any;
  countdown: number | null;
  onAccept: () => void;
  onReject: () => void;
  onViewDetail?: () => void; // Left for interface compatibility
  onCounter?: (amount: number, message: string) => Promise<void>;
  acceptLoading?: boolean;
  rejectLoading?: boolean;
}

/**
 * IncomingOfferSheet — Compact premium overlay for new ride requests.
 *
 * Optimized to take much less screen height, allowing drivers to see the map:
 * - Removed "Ver Detalhes" button completely.
 * - Placed "Recusar" button to the left of the Accept/Propose button in a single row.
 * - Styled the quick proposal increase buttons (+R$1, +R$2, etc.) in solid white for clear separation.
 * - Reduced paddings, margins, and font sizes for an extremely compact height.
 * - Locked proposals to a maximum of 2x (double) the original base value.
 * - Disabled increase / quick add buttons once the maximum limit is reached.
 */
export function IncomingOfferSheet({
  isVisible,
  request,
  countdown,
  onAccept,
  onReject,
  onCounter,
  acceptLoading,
  rejectLoading,
}: IncomingOfferSheetProps) {
  const offer = request;
  const baseValue = Number(offer?.negotiation?.clientOffer ?? offer?.pricing?.total ?? 0);
  const maxLimit = baseValue * 2;
  
  // State variables for Direct Negotiation
  const [counterValue, setCounterValue] = React.useState<number>(baseValue);

  React.useEffect(() => {
    setCounterValue(baseValue);
  }, [offer?.rideId, baseValue]);

  const step = 1;
  const decrement = () => setCounterValue(v => Math.max(baseValue, Math.round((v - step) * 100) / 100));
  const increment = () => setCounterValue(v => Math.min(maxLimit, Math.round((v + step) * 100) / 100));

  const routeDistanceMeters = Number(offer?.distance?.value ?? 0);
  const routeDurationSeconds = Number(offer?.duration?.value ?? 0);
  const toPickupDistanceMeters = Number(offer?.distanceToPickup ?? 0);
  const toPickupDurationSeconds = Number(offer?.durationToPickup?.value ?? offer?.etaToPickup?.value ?? 0);

  const fmtDuration = (s: number) =>
    typeof s === 'number' && s > 0 ? `${Math.max(1, Math.round(s / 60))} min` : '--';
  const fmtDistance = (m: number) =>
    typeof m === 'number' && m > 0 ? `${(m / 1000).toFixed(1).replace('.', ',')} km` : '--';

  const pickup = offer?.pickup?.address || '--';
  const dropoff = offer?.dropoff?.address || '--';
  const valuePerKm = routeDistanceMeters > 0 ? baseValue / (routeDistanceMeters / 1000) : 0;

  const passengerRating = Number(offer?.client?.rating || 5).toFixed(1);
  const ridesCount = Number(offer?.client?.ridesCount || offer?.client?.totalRides || 0);
  const clientName = offer?.client?.name || 'Passageiro';
  const vehicleLabel = offer?.vehicleType === 'motorcycle' ? 'Moto' : 'Carro';

  const rawPayment =
    typeof offer?.payment?.method === 'object'
      ? offer?.payment?.method?.type
      : offer?.payment?.method;
  const paymentLabel =
    String(rawPayment || 'cash').toLowerCase() === 'pix' ? 'Pix'
    : String(rawPayment || '').toLowerCase() === 'card' ? 'Cartão'
    : 'Dinheiro';

  const driverEarnings = React.useMemo(() => {
    const fee = Number(offer?.financialRisk?.estimatedPlatformFee || baseValue * 0.2);
    return Math.max(0, counterValue - fee);
  }, [counterValue, offer?.financialRisk?.estimatedPlatformFee, baseValue]);

  const isCounter = counterValue > baseValue;

  const handleMainButtonPress = () => {
    if (isCounter) {
      if (onCounter) {
        onCounter(counterValue, "Negociação justa");
      }
    } else {
      onAccept();
    }
  };

  return (
    <AnimatePresence>
      {isVisible && offer?.rideId && (
        <MotiView
          key={offer?.rideId || 'none'}
          from={{ opacity: 0, translateY: 300 }}
          animate={{ opacity: 1, translateY: 0 }}
          exit={{ opacity: 0, translateY: 300 }}
          transition={{ type: 'spring', damping: 18, stiffness: 180 }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 999,
          }}
        >
          <View
            style={{
              backgroundColor: driverColors.bg,
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingTop: 12,
              paddingBottom: 24,
              paddingHorizontal: 16,
              borderTopWidth: 2,
              borderColor: driverColors.accentBorder,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -12 },
              shadowOpacity: 0.5,
              shadowRadius: 25,
              elevation: 35,
            }}
          >
            {/* Handle */}
            <View style={{ alignItems: 'center', marginBottom: 10 }}>
              <View
                style={{
                  width: 44,
                  height: 5,
                  borderRadius: 2.5,
                  backgroundColor: 'rgba(255,255,255,0.15)',
                }}
              />
            </View>

            {/* ── Price Card ── */}
            <View
              style={{
                backgroundColor: driverColors.surface,
                borderRadius: driverRadius.xl,
                padding: 12,
                borderWidth: 1,
                borderColor: driverColors.border,
                marginBottom: 10,
              }}
            >
              {/* Service Type Capsule Header */}
              {(() => {
                const isDelivery = offer?.serviceType === 'delivery';
                const badgeColor = isDelivery ? '#10B981' : '#3B82F6';
                const badgeBg = isDelivery ? 'rgba(16, 185, 129, 0.08)' : 'rgba(59, 130, 246, 0.08)';
                const badgeBorder = isDelivery ? 'rgba(16, 185, 129, 0.25)' : 'rgba(59, 130, 246, 0.25)';
                const label = isDelivery ? 'ENTREGA DE ENCOMENDA 📦' : 'CORRIDA DE PASSAGEIRO 🚗';
                const IconComponent = isDelivery ? Package : Car;

                return (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: badgeBg,
                      borderWidth: 1.2,
                      borderColor: badgeBorder,
                      borderRadius: 12,
                      paddingVertical: 6,
                      paddingHorizontal: 12,
                      marginBottom: 12,
                      alignSelf: 'flex-start',
                      gap: 6,
                    }}
                  >
                    <IconComponent size={14} color={badgeColor} strokeWidth={2.5} />
                    <Text
                      style={{
                        color: badgeColor,
                        fontSize: 10,
                        fontWeight: '900',
                        letterSpacing: 0.8,
                        textTransform: 'uppercase',
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                );
              })()}

              {/* Price + Countdown */}
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <View>
                  <Text style={{ color: driverColors.text, fontSize: 38, fontWeight: '900', letterSpacing: -1 }}>
                    {formatBRL(baseValue)}
                  </Text>
                  <Text style={{ color: driverColors.textSecondary, fontSize: 12, fontWeight: '700', marginTop: -4 }}>
                    {valuePerKm > 0 ? `${formatBRL(valuePerKm)}/km` : '--/km'}
                  </Text>
                </View>
                {countdown !== null && countdown > 0 && (
                  <View style={{ alignItems: 'center' }}>
                    <CountdownRing current={countdown} total={60} size={50} strokeWidth={4} />
                    <Text style={{ color: driverColors.textMuted, fontSize: 8, fontWeight: '700', marginTop: 2 }}>EXPIRA</Text>
                  </View>
                )}
              </View>

              {/* Passenger info */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <View
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    backgroundColor: driverColors.accentBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Text style={{ color: driverColors.accent, fontSize: 14, fontWeight: '900' }}>
                    {clientName[0]?.toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={{ color: driverColors.text, fontSize: 13, fontWeight: '800' }}>{clientName}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                      <Star size={10} color="#FBBF24" fill="#FBBF24" />
                      <Text style={{ color: driverColors.textMuted, fontSize: 10, fontWeight: '700' }}>{passengerRating}</Text>
                    </View>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10 }}>·</Text>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10, fontWeight: '600' }}>
                      {ridesCount} {ridesCount === 1 ? 'corrida' : 'corridas'}
                    </Text>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10 }}>·</Text>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10, fontWeight: '600' }}>
                      {vehicleLabel}
                    </Text>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10 }}>·</Text>
                    <Text style={{ color: driverColors.textMuted, fontSize: 10, fontWeight: '600' }}>
                      {paymentLabel}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Route Timeline */}
              <View style={{ borderTopWidth: 1, borderTopColor: driverColors.borderLight, paddingTop: 8 }}>
                {/* To Pickup */}
                <View style={{ flexDirection: 'row', marginBottom: 6 }}>
                  <Route size={14} color={driverColors.accent} style={{ marginTop: 2, marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: driverColors.text, fontSize: 12, fontWeight: '900', marginBottom: 1 }}>
                      {fmtDuration(toPickupDurationSeconds)} ({fmtDistance(toPickupDistanceMeters)}) até a coleta
                    </Text>
                    <Text style={{ color: driverColors.textSecondary, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                      🟢 {pickup}
                    </Text>
                  </View>
                </View>

                {/* To Dropoff */}
                <View style={{ flexDirection: 'row' }}>
                  <Clock size={14} color="#FB923C" style={{ marginTop: 2, marginRight: 6 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: driverColors.text, fontSize: 12, fontWeight: '900', marginBottom: 1 }}>
                      {fmtDuration(routeDurationSeconds)} ({fmtDistance(routeDistanceMeters)}) até o destino
                    </Text>
                    <Text style={{ color: driverColors.textSecondary, fontSize: 11, fontWeight: '600' }} numberOfLines={1}>
                      🔴 {dropoff}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* ── Action Buttons (Side by Side) ── */}
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 4 }}>
              {/* Reject (Left Side) */}
              <TouchableOpacity
                onPress={onReject}
                disabled={acceptLoading || rejectLoading}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  height: 48,
                  borderRadius: 14,
                  borderWidth: 1.5,
                  borderColor: driverColors.dangerBorder,
                  backgroundColor: driverColors.dangerBg,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {rejectLoading ? (
                  <ActivityIndicator color={driverColors.danger} size="small" />
                ) : (
                  <Text
                    style={{
                      color: driverColors.danger,
                      fontWeight: '800',
                      fontSize: 13,
                      textTransform: 'uppercase',
                    }}
                  >
                    Recusar
                  </Text>
                )}
              </TouchableOpacity>

              {/* Accept / Propose — CTA principal (Right Side) */}
              <TouchableOpacity
                onPress={handleMainButtonPress}
                disabled={acceptLoading || rejectLoading}
                activeOpacity={0.85}
                style={{
                  flex: 2.2,
                  height: 48,
                  borderRadius: 14,
                  backgroundColor: driverColors.accent,
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  shadowColor: driverColors.accent,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.25,
                  shadowRadius: 8,
                  elevation: 4,
                }}
              >
                {acceptLoading ? (
                  <ActivityIndicator color={driverColors.bg} size="small" />
                ) : isCounter ? (
                  <>
                    <Send size={15} color={driverColors.bg} />
                    <Text
                      style={{
                        color: driverColors.bg,
                        fontWeight: '900',
                        fontSize: 13,
                        textTransform: 'uppercase',
                        letterSpacing: 0.3,
                      }}
                      numberOfLines={1}
                    >
                      Propor {formatBRL(counterValue)}
                    </Text>
                  </>
                ) : (
                  <Text
                    style={{
                      color: driverColors.bg,
                      fontWeight: '900',
                      fontSize: 13,
                      textTransform: 'uppercase',
                      letterSpacing: 0.3,
                    }}
                    numberOfLines={1}
                  >
                    ACEITAR • {formatBRL(baseValue)}
                  </Text>
                )}
              </TouchableOpacity>
            </View>

            {/* ── Proposal Adjuster Section ── */}
            <View
              style={{
                marginTop: 6,
                backgroundColor: driverColors.surface,
                borderRadius: driverRadius.lg,
                padding: 10,
                borderWidth: 1,
                borderColor: driverColors.border,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: driverColors.text, fontWeight: '800', fontSize: 12 }}>
                  Ajustar Valor da Proposta
                </Text>
                <Text style={{ color: driverColors.textMuted, fontSize: 10, fontWeight: '700' }}>
                  Máx: {formatBRL(maxLimit)}
                </Text>
              </View>

              {/* Value adjuster row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: driverColors.bg,
                  borderRadius: 12,
                  padding: 4,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: driverColors.border,
                }}
              >
                <TouchableOpacity
                  onPress={decrement}
                  disabled={counterValue <= baseValue}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: 'rgba(255,255,255,0.08)',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: counterValue <= baseValue ? 0.4 : 1,
                  }}
                >
                  <Minus size={14} color="#fff" />
                </TouchableOpacity>
                <View style={{ flex: 1, alignItems: 'center' }}>
                  <Text style={{ color: driverColors.accent, fontSize: 18, fontWeight: '900' }}>
                    {formatBRL(counterValue)}
                  </Text>
                  <Text style={{ color: driverColors.textSecondary, fontSize: 9, marginTop: 1 }}>
                    Você receberá ≈ {formatBRL(driverEarnings)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={increment}
                  disabled={counterValue >= maxLimit}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: driverColors.accent,
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: counterValue >= maxLimit ? 0.4 : 1,
                  }}
                >
                  <Plus size={14} color={driverColors.bg} />
                </TouchableOpacity>
              </View>

              {/* Quick add buttons (styled in white) */}
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[1, 2, 5, 10].map(v => {
                  const targetValue = counterValue + v;
                  const isDisabled = targetValue > maxLimit;
                  return (
                    <TouchableOpacity
                      key={v}
                      disabled={isDisabled}
                      onPress={() => setCounterValue(cv => Math.min(maxLimit, Math.round((cv + v) * 100) / 100))}
                      style={{
                        flex: 1,
                        backgroundColor: '#ffffff',
                        borderRadius: 8,
                        paddingVertical: 6,
                        alignItems: 'center',
                        borderWidth: 1,
                        borderColor: 'rgba(255,255,255,0.2)',
                        opacity: isDisabled ? 0.35 : 1,
                      }}
                    >
                      <Text style={{ color: '#091A2F', fontSize: 11, fontWeight: '900' }}>
                        +R${v}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        </MotiView>
      )}
    </AnimatePresence>
  );
}

export default IncomingOfferSheet;
