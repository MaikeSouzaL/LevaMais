/**
 * PaymentScreen - Versão Refatorada
 * Seleção de método de pagamento e confirmação
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';

// Design System
import { colors, spacing, fontSize, fontWeight } from '@/theme';

// Componentes Compartilhados
import { PaymentMethodCard, LoadingButton } from '../../../Shared/components';

// Services & Utils
import rideService from '@/services/ride.service';
import { useClientCityStore } from '@/context/clientCityStore';
import { mapServiceModeToApi, mapVehicleTypeToApi, formatBRL } from '@/utils/mappers';

// Types locais
type FinalOrderSummaryData = any; // Tipo simplificado

type PaymentMethod = 'credit_card' | 'pix' | 'cash';

type Params = {
  Payment: {
    amount: number;
    order?: FinalOrderSummaryData;
  };
};

const PAYMENT_METHODS = [
  {
    id: 'credit_card' as PaymentMethod,
    icon: <MaterialIcons name="credit-card" size={24} color={colors.text.primary} />,
    label: 'Cartão de Crédito',
    sublabel: 'Visa final 4242',
  },
  {
    id: 'pix' as PaymentMethod,
    icon: <MaterialCommunityIcons name="qrcode-scan" size={24} color="#32BCAD" />,
    label: 'Pix',
    sublabel: 'Aprovação imediata',
  },
  {
    id: 'cash' as PaymentMethod,
    icon: <FontAwesome5 name="money-bill-wave" size={20} color="#85bb65" />,
    label: 'Dinheiro',
    sublabel: 'Pagar diretamente ao motorista',
  },
];

export default function PaymentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const detectedCity = useClientCityStore((s) => s.city);
  const route = useRoute<RouteProp<Params, 'Payment'>>();
  const amount = route.params?.amount || 0;
  const order = route.params?.order;

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('credit_card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirmPayment = async () => {
    setError(null);

    if (!order) {
      (navigation as any).navigate('Home', {
        startSearch: true,
        searchData: {
          title: 'Buscando motorista',
          price: formatBRL(amount),
          eta: 'Chegada em ~5 min',
        },
      });
      return;
    }

    if (!order.pickupLatLng || !order.dropoffLatLng) {
      setError('Faltam coordenadas de coleta/destino. Selecione no mapa e tente novamente.');
      return;
    }

    try {
      setLoading(true);

      const ride = await rideService.create({
        serviceType: mapServiceModeToApi(order.serviceMode),
        vehicleType: mapVehicleTypeToApi(order.vehicleType),
        cityId: detectedCity?.cityId,
        purposeId: order.purposeId,
        pickup: {
          address: order.pickupAddress,
          latitude: order.pickupLatLng.latitude,
          longitude: order.pickupLatLng.longitude,
        },
        dropoff: {
          address: order.dropoffAddress,
          latitude: order.dropoffLatLng.latitude,
          longitude: order.dropoffLatLng.longitude,
        },
        pricing: {
          basePrice: order.pricing.base,
          distancePrice: order.pricing.distancePrice,
          serviceFee: order.pricing.serviceFee,
          total: order.pricing.total,
          currency: 'BRL',
        },
        distance: {
          value: Math.round((order.pricing.distanceKm || 0) * 1000),
          text: `${order.pricing.distanceKm?.toFixed?.(1) ?? order.pricing.distanceKm} km`,
        },
        duration: {
          value: (order.etaMinutes || 0) * 60,
          text: order.etaMinutes ? `${order.etaMinutes} min` : '',
        },
        details: {
          itemType: order.itemType,
          needsHelper: order.helperIncluded,
          insurance: (order.insuranceLevel as any) || 'none',
        },
        payment: {
          method: {
            type: order.paymentMethodRaw || selectedMethod,
          },
        },
      });

      (navigation as any).navigate('Home', {
        startSearch: true,
        rideId: ride._id,
        searchData: {
          title: 'Buscando motorista',
          price: formatBRL(amount),
          eta: order.etaText || 'Chegada em ~5 min',
          rideId: ride._id,
        },
      });
    } catch (e: any) {
      const rideId = e?.response?.data?.rideId;
      const message = e?.response?.data?.error || e?.message;

      if (rideId) {
        setError('Você já possui uma corrida ativa. Abrindo...');
        setTimeout(() => {
          (navigation as any).navigate('RideTracking', { rideId });
        }, 1000);
        return;
      }

      setError(message || 'Falha ao confirmar pedido. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pagamento</Text>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, spacing.xl) + 96 },
        ]}
      >
        <Text style={styles.amountLabel}>Valor a pagar</Text>
        <Text style={styles.amountValue}>{formatBRL(amount)}</Text>

        <Text style={styles.sectionTitle}>Escolha a forma de pagamento</Text>

        {PAYMENT_METHODS.map((method) => (
          <PaymentMethodCard
            key={method.id}
            id={method.id}
            icon={method.icon}
            label={method.label}
            sublabel={method.sublabel}
            selected={selectedMethod === method.id}
            onPress={() => setSelectedMethod(method.id)}
          />
        ))}
      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.lg }]}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <LoadingButton
          title={`Pagar ${formatBRL(amount)}`}
          onPress={handleConfirmPayment}
          loading={loading}
          variant="primary"
          disabled={loading}
        />
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
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  scrollContent: {
    padding: spacing.xl,
  },
  amountLabel: {
    color: colors.text.secondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  amountValue: {
    color: colors.text.primary,
    fontSize: 40,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing['3xl'],
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.lg,
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
  errorContainer: {
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: spacing.md,
    backgroundColor: 'rgba(255, 75, 75, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.25)',
  },
  errorText: {
    color: '#ffb3b3',
    fontSize: fontSize.sm,
  },
});
