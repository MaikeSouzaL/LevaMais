import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Animated, Easing } from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { logger } from '@/utils/logger';

interface QueueTagYellowProps {
  queueCount: number;
  minValue: number;
  onPress?: () => void;
  pulsing?: boolean;
}

export function QueueTagYellow({
  queueCount,
  minValue,
  onPress,
  pulsing = true,
}: QueueTagYellowProps) {
  const pulseAnimation = new Animated.Value(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!pulsing || queueCount === 0) {
      pulseAnimation.setValue(0);
      return;
    }

    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [pulsing, queueCount]);

  const opacity = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  const scale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  if (queueCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => {
        logger.info('QUEUE_TAG', 'Queue tag pressed', { queueCount });
        if (onPress) onPress();
      }}
      activeOpacity={0.8}
    >
      <Animated.View
        style={{
          opacity,
          transform: [{ scale }],
        }}
      >
        <View className="bg-[#fbbf24]/90 rounded-2xl px-6 py-4 flex-row items-center gap-3 shadow-2xl border-2 border-[#f59e0b]">
          {/* Exclamation Icon with pulse effect */}
          <View className="relative">
            <Icon name="notifications-active" size={24} color="#d97706" />
            {/* Pulse rings */}
            <Animated.View
              style={{
                position: 'absolute',
                width: 24,
                height: 24,
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#d97706',
                opacity: pulseAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.3, 0],
                }),
                transform: [
                  {
                    scale: pulseAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [1, 1.4],
                    }),
                  },
                ],
              }}
            />
          </View>

          {/* Text Content */}
          <View className="flex-1">
            <Text className="text-[#92400e] font-black text-lg">
              {queueCount} CORRIDA{queueCount !== 1 ? 'S' : ''} NA FILA
            </Text>
            <Text className="text-[#b45309] font-bold text-xs mt-1">
              Valor mínimo: R$ {minValue.toFixed(2)}
            </Text>
          </View>

          {/* Arrow Icon */}
          <Icon name="arrow-forward" size={24} color="#d97706" />
        </View>
      </Animated.View>

      {/* Bottom Info Text */}
      <Text className="text-[#fbbf24] text-xs font-bold text-center mt-2">
        Toque para ver detalhes
      </Text>
    </TouchableOpacity>
  );
}

/**
 * Alternative: Floating Button Style (if you want a smaller version)
 */
export function QueueTagYellowFloating({
  queueCount,
  onPress,
}: {
  queueCount: number;
  onPress?: () => void;
}) {
  const pulseAnimation = new Animated.Value(0);

  useEffect(() => {
    if (queueCount === 0) {
      pulseAnimation.setValue(0);
      return;
    }

    const startAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 0,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    startAnimation();
  }, [queueCount]);

  const scale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.1],
  });

  if (queueCount === 0) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={() => {
        logger.info('QUEUE_TAG_FLOATING', 'Queue tag pressed', { queueCount });
        if (onPress) onPress();
      }}
      activeOpacity={0.8}
      className="absolute top-4 right-4 z-50"
    >
      <Animated.View
        style={{
          transform: [{ scale }],
        }}
      >
        <View className="bg-[#fbbf24] rounded-full w-16 h-16 items-center justify-center shadow-2xl border-2 border-[#f59e0b]">
          {/* Pulse Background */}
          <Animated.View
            style={{
              position: 'absolute',
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: '#fbbf24',
              opacity: pulseAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 0],
              }),
              transform: [
                {
                  scale: pulseAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1, 1.5],
                  }),
                },
              ],
            }}
          />

          {/* Icon and Count */}
          <View className="items-center justify-center">
            <Icon name="notifications-active" size={28} color="#d97706" />
            <Text className="text-[#92400e] font-black text-xs absolute bottom-1">
              {queueCount}
            </Text>
          </View>
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}
