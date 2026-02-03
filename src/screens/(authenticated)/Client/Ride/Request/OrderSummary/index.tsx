/**
 * OrderSummaryScreen - Versão Refatorada
 * Resumo final do pedido antes do pagamento
 * 
 * NOTA: Versão simplificada e modular
 */

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';

// Design System
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

// Componentes Compartilhados
import { LoadingButton, EmptyState } from '../../../Shared/components';

// Utils
import { formatBRL } from '@/utils/mappers';

// Types locais
type FinalOrderSummaryData = {
  vehicleType: string;
  pickupAddress: string;
  pickupNeighborhood?: string;
  dropoffAddress: string;
  dropoffNeighborhood?: string;
  etaMinutes?: number;
  servicePurposeLabel?: string;
  itemType?: string;
  helperIncluded?: boolean;
  insuranceLevel: string;
  pricing: {
    base: number;
    distancePrice: number;
    serviceFee: number;
    total: number;
    distanceKm: number;
  };
  paymentSummary: string;
};

type Params = { FinalOrderSummary: { data: FinalOrderSummaryData } };

const mapVehicleTypeToName = (type: string) => {
  const names: Record<string, string> = {
    moto: 'Moto',
    car: 'Carro',
    van: 'Van',
    truck: 'Caminhão',
  };
  return names[type] || 'Veículo';
};

const VEHICLE_ICONS = {
  moto: '🛵',
  car: '🚗',
  van: '🚐',
  truck: '🚚',
};

const getInsuranceLabel = (level: string) => {
  if (level === 'premium') return 'Premium';
  if (level === 'basic') return 'Básico Ativado';
  return 'Não contratado';
};

// Componente Row
const Row = ({ label, value, muted, highlight }: {
  label: string;
  value: string;
  muted?: boolean;
  highlight?: boolean;
}) => (
  <View style={styles.row}>
    <Text style={[styles.rowLabel, muted && styles.rowLabelMuted]}>{label}</Text>
    <Text style={[styles.rowValue, highlight && styles.rowValueHighlight]}>{value}</Text>
  </View>
);

export default function OrderSummaryScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<RouteProp<Params, 'FinalOrderSummary'>>();
  const navigation = useNavigation();
  const data = route.params?.data;

  const handleBack = () => {
    (navigation as any).navigate('Home', {
      reopenOffers: true,
      vehicleType: data?.vehicleType,
    });
  };

  const handleConfirm = () => {
    if (!data) return;
    (navigation as any).navigate('Payment', {
      amount: data.pricing.total,
      order: data,
    });
  };

  if (!data) {
    return (
      <EmptyState
        icon="receipt"
        title="Sem dados do pedido"
        description="Não foi possível carregar os dados do pedido"
        actionLabel="Voltar"
        onAction={() => navigation.goBack()}
      />
    );
  }

  const vehicleIcon = VEHICLE_ICONS[data.vehicleType as keyof typeof VEHICLE_ICONS];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backText}>‹ Voltar</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Resumo do pedido</Text>
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editText}>Editar</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 96 },
        ]}
      >
        {/* Addresses */}
        <View style={styles.addressesContainer}>
          {/* Pickup */}
          <View style={styles.addressRow}>
            <View style={styles.addressIconContainer}>
              <View style={styles.pickupDot} />
              <View style={styles.addressLine} />
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>COLETA</Text>
              <Text style={styles.addressText}>{data.pickupAddress}</Text>
              {!!data.pickupNeighborhood && (
                <Text style={styles.addressNeighborhood}>{data.pickupNeighborhood}</Text>
              )}
            </View>
          </View>

          {/* Dropoff */}
          <View style={styles.addressRow}>
            <View style={styles.addressIconContainer}>
              <Text style={styles.dropoffIcon}>📍</Text>
            </View>
            <View style={styles.addressInfo}>
              <Text style={styles.addressLabel}>DESTINO</Text>
              <Text style={styles.addressText}>{data.dropoffAddress}</Text>
              {!!data.dropoffNeighborhood && (
                <Text style={styles.addressNeighborhood}>{data.dropoffNeighborhood}</Text>
              )}
            </View>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Service Info */}
        <View style={styles.serviceCard}>
          <View style={styles.vehicleIconContainer}>
            <Text style={styles.vehicleIcon}>{vehicleIcon}</Text>
          </View>
          <View style={styles.serviceInfo}>
            <View style={styles.serviceHeader}>
              <Text style={styles.serviceTitle}>
                Entrega • {mapVehicleTypeToName(data.vehicleType)}
              </Text>
              {!!data.etaMinutes && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Rápido</Text>
                </View>
              )}
            </View>
            {!!data.etaMinutes && (
              <Text style={styles.etaText}>
                Chegada estimada: <Text style={styles.etaValue}>{data.etaMinutes} min</Text>
              </Text>
            )}
            {!!data.servicePurposeLabel && (
              <Text style={styles.purposeText}>
                Finalidade: <Text style={styles.purposeValue}>{data.servicePurposeLabel}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.sectionTitle}>DETALHES DA CORRIDA</Text>
          {!!data.itemType && <Row label="Tipo de item" value={data.itemType} />}
          {typeof data.helperIncluded !== 'undefined' && (
            <Row label="Ajudante" value={data.helperIncluded ? 'Incluído' : 'Não incluso'} />
          )}
          <Row
            label="Seguro"
            value={getInsuranceLabel(data.insuranceLevel)}
            highlight={data.insuranceLevel !== 'none'}
          />
        </View>

        <View style={styles.divider} />

        {/* Pricing */}
        <View style={styles.pricingCard}>
          <Row label="Tarifa base" value={formatBRL(data.pricing.base)} muted />
          <Row
            label={`Distância (${data.pricing.distanceKm.toFixed(1)} km)`}
            value={formatBRL(data.pricing.distancePrice)}
            muted
          />
          <View style={styles.pricingDivider}>
            <Row label="Taxa de serviço" value={formatBRL(data.pricing.serviceFee)} muted />
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{formatBRL(data.pricing.total)}</Text>
          </View>
        </View>

        {/* Payment Method */}
        <TouchableOpacity style={styles.paymentCard} activeOpacity={0.7}>
          <View style={styles.paymentContent}>
            <View style={styles.paymentIconContainer}>
              <Text>💳</Text>
            </View>
            <View>
              <Text style={styles.paymentLabel}>PAGAMENTO</Text>
              <Text style={styles.paymentValue}>{data.paymentSummary}</Text>
            </View>
          </View>
          <Text style={styles.chevron}>›</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}>
        <LoadingButton
          title="Confirmar Pedido →"
          onPress={handleConfirm}
          variant="primary"
        />
        <Text style={styles.footerNote}>
          Ao confirmar, buscaremos um motorista próximo a você.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: spacing.sm,
  },
  backText: {
    color: colors.text.tertiary,
    fontSize: fontSize.base,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  editButton: {
    padding: spacing.sm,
  },
  editText: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  addressesContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  addressRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    marginBottom: spacing.md,
  },
  addressIconContainer: {
    width: 24,
    alignItems: 'center',
  },
  pickupDot: {
    height: 14,
    width: 14,
    borderRadius: 7,
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: colors.background.primary,
  },
  addressLine: {
    width: 2,
    flexGrow: 1,
    borderLeftWidth: 2,
    borderStyle: 'dotted',
    borderColor: colors.border.light,
    marginVertical: spacing.xs,
    minHeight: 40,
  },
  dropoffIcon: {
    fontSize: 20,
    marginTop: -4,
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  addressText: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  addressNeighborhood: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginBottom: spacing.lg,
  },
  serviceCard: {
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  vehicleIconContainer: {
    height: 48,
    width: 48,
    borderRadius: borderRadius.md,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleIcon: {
    fontSize: 24,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  serviceTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  badge: {
    backgroundColor: 'rgba(2, 222, 149, 0.1)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  badgeText: {
    color: colors.primary[500],
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  etaText: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  etaValue: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
  },
  purposeText: {
    color: colors.text.tertiary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },
  purposeValue: {
    color: colors.text.primary,
  },
  detailsContainer: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: fontWeight.bold,
    color: colors.text.tertiary,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  pricingCard: {
    backgroundColor: 'rgba(22, 46, 37, 0.3)',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  pricingDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
    paddingBottom: spacing.sm,
    marginBottom: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    color: colors.text.primary,
    fontWeight: fontWeight.semibold,
    fontSize: fontSize.lg,
  },
  totalValue: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold,
    fontSize: 24,
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background.secondary,
    borderWidth: 1,
    borderColor: colors.border.light,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  paymentContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  paymentIconContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginRight: spacing.md,
  },
  paymentLabel: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
  },
  paymentValue: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.semibold,
  },
  chevron: {
    color: colors.text.tertiary,
    fontSize: fontSize.lg,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: 'rgba(15, 35, 28, 0.95)',
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
  },
  footerNote: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.text.tertiary,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  rowLabel: {
    color: colors.text.tertiary,
    fontSize: fontSize.sm,
  },
  rowLabelMuted: {
    color: colors.text.tertiary,
  },
  rowValue: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
  },
  rowValueHighlight: {
    color: colors.primary[500],
    fontWeight: fontWeight.bold,
  },
});
