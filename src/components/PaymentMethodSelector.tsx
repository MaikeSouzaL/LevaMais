import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

export type PaymentMethodType = 'credit_card' | 'pix' | 'cash' | 'wallet';

interface PaymentMethodOption {
  id: PaymentMethodType;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
  color: string;
  isAvailable?: boolean;
}

interface PaymentMethodSelectorProps {
  selected?: PaymentMethodType;
  onSelect: (method: PaymentMethodType) => void;
  methods?: PaymentMethodType[];
  style?: ViewStyle;
}

const defaultMethods: PaymentMethodOption[] = [
  {
    id: 'credit_card',
    label: 'Cartão de Crédito',
    sublabel: 'Pagamento no app',
    icon: <Icon name="credit-card" size={24} color={colors.text.primary} />,
    color: '#3b82f6',
    isAvailable: true,
  },
  {
    id: 'pix',
    label: 'PIX',
    sublabel: 'Aprovação imediata',
    icon: <Icon name="qrcode-scan" size={24} color="#32BCAD" />,
    color: '#32BCAD',
    isAvailable: true,
  },
  {
    id: 'wallet',
    label: 'Carteira',
    sublabel: 'Saldo disponível',
    icon: <Icon name="account-balance-wallet" size={24} color="#02de95" />,
    color: '#02de95',
    isAvailable: true,
  },
  {
    id: 'cash',
    label: 'Dinheiro',
    sublabel: 'Pagar ao motorista',
    icon: <Icon name="money-bill-wave" size={20} color="#85bb65" />,
    color: '#85bb65',
    isAvailable: true,
  },
];

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  selected = 'credit_card',
  onSelect,
  methods = ['credit_card', 'pix', 'wallet', 'cash'],
  style,
}) => {
  const availableMethods = defaultMethods.filter(m => 
    methods.includes(m.id) && m.isAvailable !== false
  );

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>Método de Pagamento</Text>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {availableMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => onSelect(method.id)}
            activeOpacity={0.7}
            style={[
              styles.methodCard,
              selected === method.id && styles.methodCardActive,
            ]}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${method.color}20` },
              ]}
            >
              {method.icon}
            </View>
            
            <Text
              style={[
                styles.methodLabel,
                selected === method.id && { color: method.color },
              ]}
            >
              {method.label}
            </Text>
            
            <Text style={styles.methodSublabel}>{method.sublabel}</Text>
            
            {selected === method.id && (
              <View
                style={[
                  styles.checkmark,
                  { backgroundColor: method.color },
                ]}
              >
                <Icon name="check" size={16} color="white" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginHorizontal: spacing.md,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  methodCard: {
    width: 140,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    gap: spacing.xs,
  },
  methodCardActive: {
    borderColor: '#02de95',
    backgroundColor: 'rgba(2,222,149,0.08)',
  },
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodLabel: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    textAlign: 'center',
  },
  methodSublabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
