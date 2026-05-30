import React from 'react';
import { View, Text } from 'react-native';
import { getStatusMeta } from '../../utils/rideStatusMeta';

interface RideStatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
}

export function RideStatusBadge({ status, size = 'md' }: RideStatusBadgeProps) {
  const meta = getStatusMeta(status);

  const paddingMap = { sm: { px: 8, py: 2 }, md: { px: 12, py: 4 }, lg: { px: 16, py: 6 } };
  const fontMap = { sm: 10, md: 12, lg: 14 };
  const { px, py } = paddingMap[size];
  const dotSize = size === 'sm' ? 6 : 8;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: px,
        paddingVertical: py,
        backgroundColor: meta.bgColor,
        borderRadius: 20,
        alignSelf: 'flex-start',
      }}
      accessibilityLabel={`Status: ${meta.label}`}
      accessibilityRole="text"
    >
      <View
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: dotSize / 2,
          backgroundColor: meta.color,
        }}
      />
      <Text
        style={{
          color: meta.color,
          fontSize: fontMap[size],
          fontWeight: '700',
        }}
      >
        {meta.label}
      </Text>
    </View>
  );
}
