/**
 * RideTrackingScreen - Versão Refatorada
 * Acompanhamento da corrida em tempo real
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

// Design System
import { colors, spacing, fontSize } from '@/theme';

// Hooks
import { useDriverSearch, useMapLocation } from '../../../Shared/hooks';

export default function RideTrackingScreen() {
  const route = useRoute();
  const { rideId } = (route.params as any) || {};
  
  const mapLocation = useMapLocation();
  const driverSearch = useDriverSearch();

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapLocation.mapRef}
        style={styles.map}
        initialRegion={mapLocation.region || undefined}
        showsUserLocation
      >
        {driverSearch.driverFoundState.location && (
          <Marker coordinate={driverSearch.driverFoundState.location} />
        )}
      </MapView>

      <View style={styles.infoCard}>
        <Text style={styles.title}>Motorista a caminho</Text>
        <Text style={styles.subtitle}>
          {driverSearch.driverFoundState.etaText || 'Calculando...'}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  map: { ...StyleSheet.absoluteFillObject },
  infoCard: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.background.secondary,
    padding: spacing.lg,
    borderRadius: 12,
  },
  title: { color: colors.text.primary, fontSize: fontSize.lg, fontWeight: '700' },
  subtitle: { color: colors.text.secondary, fontSize: fontSize.sm, marginTop: spacing.xs },
});
