import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

/**
 * Skeleton loader com shimmer animation.
 * Use para loading states em cards, textos e imagens.
 */
export function SkeletonBox({
  width = '100%',
  height = 16,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        animatedStyle,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Skeleton para card de motorista */
export function DriverCardSkeleton() {
  return (
    <View
      style={{ padding: 16, gap: 12, backgroundColor: '#11253E', borderRadius: 16 }}
      accessibilityLabel="Carregando informações do motorista"
    >
      <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <SkeletonBox width={48} height={48} borderRadius={24} />
        <View style={{ flex: 1, gap: 8 }}>
          <SkeletonBox width="60%" height={16} />
          <SkeletonBox width="40%" height={12} />
        </View>
        <SkeletonBox width={64} height={24} borderRadius={12} />
      </View>
      <SkeletonBox width="80%" height={12} />
    </View>
  );
}

/** Skeleton para card de corrida */
export function RideCardSkeleton() {
  return (
    <View
      style={{ padding: 16, gap: 12, backgroundColor: '#11253E', borderRadius: 16 }}
      accessibilityLabel="Carregando corrida"
    >
      <SkeletonBox width="50%" height={20} />
      <View style={{ gap: 8 }}>
        <SkeletonBox width="90%" height={14} />
        <SkeletonBox width="70%" height={14} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <SkeletonBox width={80} height={32} borderRadius={16} />
        <SkeletonBox width={100} height={32} borderRadius={16} />
      </View>
    </View>
  );
}

/** Skeleton para bloco de preço */
export function PriceSkeleton() {
  return (
    <View style={{ alignItems: 'center', gap: 8 }} accessibilityLabel="Carregando preço">
      <SkeletonBox width={120} height={32} borderRadius={8} />
      <SkeletonBox width={80} height={14} borderRadius={7} />
    </View>
  );
}
