import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';

interface CreditCardInputProps {
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvv: string;
  onCardNumberChange: (text: string) => void;
  onHolderNameChange: (text: string) => void;
  onExpiryChange: (text: string) => void;
  onCvvChange: (text: string) => void;
  style?: ViewStyle;
  editable?: boolean;
}

const detectCardBrand = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'unknown' => {
  const digits = cardNumber.replace(/\s/g, '');
  if (/^4/.test(digits)) return 'visa';
  if (/^5[1-5]/.test(digits)) return 'mastercard';
  if (/^3[47]/.test(digits)) return 'amex';
  return 'unknown';
};

const formatCardNumber = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};

const formatExpiry = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
};

const validateCard = (cardNumber: string): boolean => {
  const digits = cardNumber.replace(/\s/g, '');
  if (digits.length < 13) return false;

  let sum = 0;
  let isEven = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits[i], 10);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
};

export const CreditCardInput: React.FC<CreditCardInputProps> = ({
  cardNumber,
  holderName,
  expiry,
  cvv,
  onCardNumberChange,
  onHolderNameChange,
  onExpiryChange,
  onCvvChange,
  style,
  editable = true,
}) => {
  const brand = useMemo(() => detectCardBrand(cardNumber), [cardNumber]);
  const isValid = useMemo(() => validateCard(cardNumber), [cardNumber]);

  const brandIcon = {
    visa: <Icon name="cc-visa" size={28} color="#1a56db" />,
    mastercard: <Icon name="cc-mastercard" size={28} color="#eb001b" />,
    amex: <Icon name="cc-amex" size={28} color="#006fcf" />,
    unknown: <Icon name="credit-card" size={28} color="rgba(255,255,255,0.5)" />,
  };

  const expiryParts = expiry.split('/');
  const expiryValid =
    expiryParts.length === 2 &&
    parseInt(expiryParts[0]) > 0 &&
    parseInt(expiryParts[0]) <= 12;

  const cvvValid = cvv.length >= 3 && cvv.length <= 4;

  return (
    <View style={[styles.container, style]}>
      {/* Card Preview */}
      <View
        style={[
          styles.cardPreview,
          { borderColor: isValid && cardNumber ? '#02de95' : 'rgba(255,255,255,0.2)' },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Número do Cartão</Text>
          {brandIcon[brand]}
        </View>

        <Text style={styles.cardNumber}>
          {cardNumber || '•••• •••• •••• ••••'}
        </Text>

        <View style={styles.cardFooter}>
          <View style={styles.cardFooterSection}>
            <Text style={styles.cardFooterLabel}>Titular</Text>
            <Text style={styles.cardFooterValue}>
              {holderName.toUpperCase() || 'NOME COMPLETO'}
            </Text>
          </View>
          <View style={styles.cardFooterSection}>
            <Text style={styles.cardFooterLabel}>Vencimento</Text>
            <Text style={styles.cardFooterValue}>{expiry || 'MM/YY'}</Text>
          </View>
        </View>
      </View>

      {/* Form Inputs */}
      <View style={styles.form}>
        {/* Card Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número do Cartão</Text>
          <TextInput
            style={[
              styles.input,
              {
                borderColor: isValid && cardNumber ? '#02de95' : 'rgba(255,255,255,0.2)',
              },
            ]}
            placeholder="0000 0000 0000 0000"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={formatCardNumber(cardNumber)}
            onChangeText={(text) => onCardNumberChange(formatCardNumber(text))}
            keyboardType="numeric"
            maxLength={19}
            editable={editable}
          />
          {cardNumber && (
            <View style={styles.validation}>
              <Icon
                name={isValid ? 'check-circle' : 'cancel'}
                size={16}
                color={isValid ? '#02de95' : '#ef4444'}
              />
              <Text style={{ color: isValid ? '#02de95' : '#ef4444', fontSize: fontSize.xs }}>
                {isValid ? 'Válido' : 'Inválido'}
              </Text>
            </View>
          )}
        </View>

        {/* Holder Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome do Titular</Text>
          <TextInput
            style={styles.input}
            placeholder="Nome completo"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={holderName}
            onChangeText={onHolderNameChange}
            editable={editable}
          />
        </View>

        {/* Expiry and CVV */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1, marginRight: spacing.sm }]}>
            <Text style={styles.label}>Vencimento</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: expiryValid && expiry ? '#02de95' : 'rgba(255,255,255,0.2)',
                },
              ]}
              placeholder="MM/YY"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={expiry}
              onChangeText={(text) => onExpiryChange(formatExpiry(text))}
              keyboardType="numeric"
              maxLength={5}
              editable={editable}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>CVV</Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: cvvValid ? '#02de95' : 'rgba(255,255,255,0.2)',
                },
              ]}
              placeholder="000"
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={cvv}
              onChangeText={(text) => onCvvChange(text.replace(/\D/g, '').slice(0, 4))}
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              editable={editable}
            />
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityNotice}>
          <Icon name="lock" size={16} color="#02de95" />
          <Text style={styles.securityText}>
            Seus dados estão seguros com criptografia SSL
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  cardPreview: {
    backgroundColor: 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    padding: spacing.lg,
    gap: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  cardNumber: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  cardFooterSection: {
    gap: spacing.xs,
  },
  cardFooterLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  cardFooterValue: {
    color: 'white',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  form: {
    gap: spacing.md,
  },
  inputGroup: {
    gap: spacing.xs,
  },
  label: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  input: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: fontSize.sm,
    fontFamily: Platform.OS === 'web' ? 'monospace' : 'System',
  },
  row: {
    flexDirection: 'row',
  },
  validation: {
    flexDirection: 'row',
    gap: spacing.xs,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  securityNotice: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'center',
    backgroundColor: 'rgba(2,222,149,0.1)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  securityText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    flex: 1,
  },
});
