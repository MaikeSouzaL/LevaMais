import React from 'react';
import { View, Text } from 'react-native';

interface AddressRowProps {
  pickupLabel?: string;
  dropoffLabel?: string;
  pickupAddress: string;
  dropoffAddress: string;
  compact?: boolean;
}

export function AddressRow({
  pickupLabel = 'Embarque',
  dropoffLabel = 'Destino',
  pickupAddress,
  dropoffAddress,
  compact = false,
}: AddressRowProps) {
  const dotSize = compact ? 8 : 10;
  const lineWidth = compact ? 1.5 : 2;

  return (
    <View style={{ gap: compact ? 6 : 10 }}>
      {/* Pickup */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: compact ? 8 : 10 }}>
        <View style={{ alignItems: 'center', width: dotSize + 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: '#02DE95',
              marginTop: 4,
            }}
          />
          <View
            style={{ width: lineWidth, flex: 1, backgroundColor: 'rgba(2,222,149,0.3)' }}
          />
        </View>
        <View style={{ flex: 1, paddingBottom: compact ? 8 : 14 }}>
          {!compact && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {pickupLabel}
            </Text>
          )}
          <Text
            style={{
              color: '#fff',
              fontSize: compact ? 13 : 15,
              fontWeight: compact ? '500' : '600',
            }}
            numberOfLines={2}
            accessibilityLabel={`Embarque: ${pickupAddress}`}
          >
            {pickupAddress}
          </Text>
        </View>
      </View>
      {/* Dropoff */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: compact ? 8 : 10 }}>
        <View style={{ alignItems: 'center', width: dotSize + 4 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          <View
            style={{
              width: dotSize,
              height: dotSize,
              borderRadius: dotSize / 2,
              backgroundColor: '#EF4444',
              marginTop: 4,
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          {!compact && (
            <Text
              style={{
                color: 'rgba(255,255,255,0.45)',
                fontSize: 11,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {dropoffLabel}
            </Text>
          )}
          <Text
            style={{
              color: '#fff',
              fontSize: compact ? 13 : 15,
              fontWeight: compact ? '500' : '600',
            }}
            numberOfLines={2}
            accessibilityLabel={`Destino: ${dropoffAddress}`}
          >
            {dropoffAddress}
          </Text>
        </View>
      </View>
    </View>
  );
}
