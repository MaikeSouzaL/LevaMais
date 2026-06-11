import React, { useEffect } from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { Power } from 'lucide-react-native';
import { driverColors, driverRadius, driverTypography } from '@/theme/driverTheme';

interface OnlineToggleProps {
  isOnline: boolean;
  isLoading?: boolean;
  onlineDuration?: string; // ex: "2h 34min"
  onToggle: () => void;
  /** Texto quando está offline (placeholder do botão) */
  offlineText?: string;
  /** Texto quando está online */
  onlineText?: string;
}

/**
 * OnlineToggle — Toggle unificado online/offline para o motorista.
 *
 * Substitui ModernSwitch e OnlineOfflineToggle com um único componente
 * de botão gigante com animações Reanimated.
 */
export default function OnlineToggle({
  isOnline,
  isLoading = false,
  onlineDuration,
  onToggle,
  offlineText = 'TOCAR PARA CONECTAR',
  onlineText = 'VOCÊ ESTÁ ONLINE',
}: OnlineToggleProps) {
  // Animação de pulso quando online
  const pulseOpacity = useSharedValue(0.4);

  useEffect(() => {
    if (isOnline) {
      pulseOpacity.value = withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseOpacity.value = withTiming(0, { duration: 200 });
    }
  }, [isOnline]);

  // Cor de fundo animada
  const bgProgress = useSharedValue(isOnline ? 1 : 0);

  useEffect(() => {
    bgProgress.value = withSpring(isOnline ? 1 : 0, {
      damping: 15,
      stiffness: 150,
    });
  }, [isOnline]);

  const containerStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      ['rgba(255,255,255,0.05)', driverColors.accent],
    ),
    borderColor: interpolateColor(
      bgProgress.value,
      [0, 1],
      [driverColors.border, driverColors.accent],
    ),
  }));

  const textColor = useAnimatedStyle(() => ({
    color: interpolateColor(
      bgProgress.value,
      [0, 1],
      [driverColors.textMuted, driverColors.bg],
    ),
  }));

  // Anel de pulso
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulseOpacity.value,
  }));

  return (
    <TouchableOpacity
      onPress={onToggle}
      disabled={isLoading}
      activeOpacity={0.85}
      style={styles.touchable}
      accessibilityLabel={isOnline ? 'Ficar offline' : 'Ficar online'}
      accessibilityRole="switch"
      accessibilityState={{ checked: isOnline }}
    >
      <Animated.View style={[styles.container, containerStyle]}>
        {/* Pulse ring (online only) */}
        {isOnline && (
          <Animated.View style={[styles.pulseRing, pulseStyle]} />
        )}

        {/* Inner content */}
        <Animated.View style={styles.content}>
          {isLoading ? (
            <ActivityIndicator
              color={isOnline ? driverColors.bg : driverColors.accent}
              size="small"
            />
          ) : (
            <Power
              size={22}
              color={isOnline ? driverColors.bg : driverColors.accent}
              style={isOnline ? {} : { opacity: 0.6 }}
            />
          )}

          <Animated.Text style={[styles.label, textColor]}>
            {isOnline ? onlineText : offlineText}
          </Animated.Text>
        </Animated.View>

        {/* Online duration */}
        {isOnline && onlineDuration && (
          <Text style={styles.duration}>{onlineDuration}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    width: '100%',
  },
  container: {
    width: '100%',
    height: 64,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  pulseRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: driverColors.accent,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  duration: {
    fontSize: 11,
    fontWeight: '600',
    color: driverColors.bg,
    opacity: 0.7,
    marginTop: 2,
  },
});
