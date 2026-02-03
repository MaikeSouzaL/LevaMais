/**
 * SelectVehicleScreen - Versão Refatorada
 * Usa VehicleCard compartilhado e design system
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Design System
import { colors, spacing, fontSize, borderRadius } from '@/theme';

// Componentes Compartilhados
import { VehicleCard } from '../../../Shared/components';

// Tipos
import type { VehicleType } from '../../../types';

type RouteParams = {
  pickup?: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff?: {
    address: string;
    latitude: number;
    longitude: number;
  };
};

const VEHICLES: Array<{
  type: VehicleType;
  title: string;
  description: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
  badgeColor?: string;
}> = [
  {
    type: 'motorcycle',
    title: 'Moto',
    description: 'Pequenos pacotes e documentos até 20kg',
    icon: 'two-wheeler',
    badge: 'Mais rápido',
    badgeColor: colors.primary[500],
  },
  {
    type: 'car',
    title: 'Carro',
    description: 'Compras de mercado ou caixas médias',
    icon: 'directions-car',
  },
  {
    type: 'van',
    title: 'Van',
    description: 'Móveis pequenos ou muitas caixas',
    icon: 'airport-shuttle',
  },
  {
    type: 'truck',
    title: 'Caminhão',
    description: 'Mudanças e grandes cargas comerciais',
    icon: 'local-shipping',
    badge: 'Grandes volumes',
    badgeColor: colors.text.tertiary,
  },
];

export default function SelectVehicleScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const params = route.params as RouteParams;

  const handleBack = () => {
    if ((navigation as any).canGoBack()) {
      (navigation as any).goBack();
    } else {
      (navigation as any).navigate('Home');
    }
  };

  const handleSelect = (type: VehicleType) => {
    (navigation as any).navigate('ServicePurpose', {
      vehicleType: type,
      pickup: params?.pickup,
      dropoff: params?.dropoff,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Qual o veículo ideal?</Text>
          <Text style={styles.headerSubtitle}>
            Selecione o veículo ideal para sua entrega
          </Text>
        </View>
        
        <View style={styles.headerSpacer} />
      </View>

      {/* Vehicle List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {VEHICLES.map((vehicle) => (
          <VehicleCard
            key={vehicle.type}
            type={vehicle.type}
            title={vehicle.title}
            description={vehicle.description}
            icon={vehicle.icon}
            badge={vehicle.badge}
            badgeColor={vehicle.badgeColor}
            onPress={() => handleSelect(vehicle.type)}
            style={styles.vehicleCard}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.xl,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  vehicleCard: {
    marginBottom: spacing.md,
  },
});
