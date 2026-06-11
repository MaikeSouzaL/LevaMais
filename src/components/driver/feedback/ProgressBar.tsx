import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { driverColors, driverRadius } from '@/theme/driverTheme';

interface ProgressBarProps {
  /** 0–1 (0% a 100%) */
  progress: number;
  height?: number;
  color?: string;
  trackColor?: string;
  showGlow?: boolean;
  animated?: boolean;
  style?: ViewStyle;
}

export default function ProgressBar({
  progress,
  height = 8,
  color = driverColors.accent,
  trackColor = 'rgba(255,255,255,0.06)',
  showGlow = true,
  animated = true,
  style,
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(1, progress));
  const sharedProgress = useSharedValue(animated ? 0 : clampedProgress);

  useEffect(() => {
    if (animated) {
      sharedProgress.value = withTiming(clampedProgress, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
    }
  }, [clampedProgress, animated]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${sharedProgress.value * 100}%`,
  }));

  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: trackColor,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            height: '100%',
            borderRadius: height / 2,
            backgroundColor: color,
            ...(showGlow
              ? {
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.4,
                  shadowRadius: 6,
                  elevation: 3,
                }
              : {}),
          },
          barStyle,
        ]}
      />
    </View>
  );
}
