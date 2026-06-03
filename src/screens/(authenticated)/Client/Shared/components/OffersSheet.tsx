/**
 * OffersSheet - Bottom sheet unificado para ofertas de veículos
 * Substitui os 4 sheets anteriores (Car, Moto, Van, Truck)
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, borderRadius, fontSize, fontWeight } from '@/theme';
import { formatBRL } from '../utils/formatters';
import {
  mapVehicleTypeToEmoji,
  mapVehicleTypeToName,
} from '../utils/mappers';
import type { VehicleType, RideOffer } from '../../types';
import BottomSheet from './BottomSheet';

interface OffersSheetProps {
  visible: boolean;
  onClose: () => void;
  vehicleType: VehicleType;
  offers: RideOffer[];
  selectedOfferId?: string;
  onSelectOffer: (offerId: string) => void;
  onConfirm: () => void;
  loading?: boolean;
}

export default function OffersSheet({
  visible,
  onClose,
  vehicleType,
  offers,
  selectedOfferId,
  onSelectOffer,
  onConfirm,
  loading = false,
}: OffersSheetProps) {
  const vehicleName = mapVehicleTypeToName(vehicleType);
  const vehicleEmoji = mapVehicleTypeToEmoji(vehicleType);

  const getCapacityText = (type: VehicleType): string => {
    const capacities: Record<VehicleType, string> = {
      motorcycle: '1 pessoa • Rápido',
      car: '4 pessoas • Conforto',
      van: '8 pessoas • Grupo',
      truck: 'Carga grande',
    };
    return capacities[type];
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height="60%">
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>{vehicleEmoji}</Text>
          <Text style={styles.title}>Escolha sua {vehicleName}</Text>
          <Text style={styles.subtitle}>{getCapacityText(vehicleType)}</Text>
        </View>

        {/* Offers List */}
        <ScrollView
          style={styles.offersList}
          showsVerticalScrollIndicator={false}
        >
          {offers.map((offer) => {
            const isSelected = offer.id === selectedOfferId;
            const isAvailable = offer.available;

            return (
              <TouchableOpacity
                key={offer.id}
                style={[
                  styles.offerCard,
                  isSelected && styles.offerCardSelected,
                  !isAvailable && styles.offerCardDisabled,
                ]}
                onPress={() => isAvailable && onSelectOffer(offer.id)}
                disabled={!isAvailable}
                activeOpacity={0.7}
              >
                <View style={styles.offerInfo}>
                  <Text style={styles.offerPrice}>
                    {formatBRL(offer.price)}
                  </Text>
                  <Text style={styles.offerDetails}>
                    {Math.round(offer.estimatedDistance / 1000)} km • {' '}
                    {Math.round(offer.estimatedDuration / 60)} min
                  </Text>
                  {!isAvailable && (
                    <Text style={styles.unavailableText}>Indisponível</Text>
                  )}
                </View>

                {isSelected && (
                  <Icon
                    name="check-circle"
                    size={24}
                    color={colors.primary[500]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.confirmButton,
            (!selectedOfferId || loading) && styles.confirmButtonDisabled,
          ]}
          onPress={onConfirm}
          disabled={!selectedOfferId || loading}
          activeOpacity={0.8}
        >
          <Text style={styles.confirmButtonText}>
            {loading ? 'Confirmando...' : 'Confirmar'}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  emoji: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: fontSize['2xl'],
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  offersList: {
    flex: 1,
    marginBottom: spacing.lg,
  },
  offerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  offerCardSelected: {
    backgroundColor: 'rgba(2, 222, 149, 0.08)',
    borderColor: colors.primary[500],
    borderWidth: 2,
  },
  offerCardDisabled: {
    opacity: 0.5,
  },
  offerInfo: {
    flex: 1,
  },
  offerPrice: {
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  offerDetails: {
    fontSize: fontSize.sm,
    color: colors.text.tertiary,
  },
  unavailableText: {
    fontSize: fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  },
  confirmButton: {
    backgroundColor: colors.primary[500],
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    backgroundColor: colors.border.medium,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    color: colors.text.primary,
  },
});
