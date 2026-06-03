import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ViewStyle,
} from 'react-native';
import { Icon } from "@/components/ui/Icon";
import { colors, spacing, fontSize, fontWeight, borderRadius } from '@/theme';
import { formatBRL } from '@/utils/mappers';

export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

interface WithdrawFormProps {
  balance: number;
  minAmount?: number;
  maxAmount?: number;
  onSubmit?: (data: {
    amount: number;
    pixKeyType: PixKeyType;
    pixKey: string;
  }) => void;
  style?: ViewStyle;
  editable?: boolean;
}

const validatePixKey = (key: string, type: PixKeyType): boolean => {
  const cleanKey = key.replace(/\D/g, '');

  switch (type) {
    case 'cpf':
      return cleanKey.length === 11;
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key);
    case 'phone':
      return cleanKey.length >= 10 && cleanKey.length <= 13;
    case 'random':
      return key.length >= 20;
    default:
      return false;
  }
};

const inferPixType = (key: string): PixKeyType => {
  const cleanKey = key.replace(/\D/g, '');

  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) return 'email';
  if (cleanKey.length === 11) return 'cpf';
  if (cleanKey.length >= 10 && cleanKey.length <= 13) return 'phone';
  return 'random';
};

const formatCPF = (text: string): string => {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return digits.slice(0, 3) + '.' + digits.slice(3);
  if (digits.length <= 9)
    return (
      digits.slice(0, 3) + '.' + digits.slice(3, 6) + '.' + digits.slice(6)
    );
  return (
    digits.slice(0, 3) +
    '.' +
    digits.slice(3, 6) +
    '.' +
    digits.slice(6, 9) +
    '-' +
    digits.slice(9)
  );
};

export const WithdrawForm: React.FC<WithdrawFormProps> = ({
  balance,
  minAmount = 10,
  maxAmount = 10000,
  onSubmit,
  style,
  editable = true,
}) => {
  const [amount, setAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [selectedType, setSelectedType] = useState<PixKeyType>('email');

  const amountNumber = useMemo(() => Number(amount) || 0, [amount]);
  const isValidAmount = useMemo(
    () => amountNumber >= minAmount && amountNumber <= maxAmount && amountNumber <= balance,
    [amountNumber, minAmount, maxAmount, balance]
  );
  const isValidKey = useMemo(
    () => validatePixKey(pixKey, selectedType),
    [pixKey, selectedType]
  );
  const canSubmit = isValidAmount && isValidKey;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handlePixKeyChange = (text: string) => {
    setPixKey(text);
  };

  const handleTypeSelect = (type: PixKeyType) => {
    setSelectedType(type);
  };

  const handleSubmit = () => {
    if (canSubmit && onSubmit) {
      onSubmit({
        amount: amountNumber,
        pixKeyType: selectedType,
        pixKey,
      });
    }
  };

  const pixTypes = [
    {
      id: 'cpf' as PixKeyType,
      label: 'CPF',
      icon: <Icon name="assignment-ind" size={16} color="white" />,
      placeholder: '000.000.000-00',
    },
    {
      id: 'email' as PixKeyType,
      label: 'Email',
      icon: <Icon name="mail" size={16} color="white" />,
      placeholder: 'seu@email.com',
    },
    {
      id: 'phone' as PixKeyType,
      label: 'Telefone',
      icon: <Icon name="phone" size={16} color="white" />,
      placeholder: '(11) 99999-9999',
    },
    {
      id: 'random' as PixKeyType,
      label: 'Aleatória',
      icon: <Icon name="vpn-key" size={16} color="white" />,
      placeholder: 'UUID PIX',
    },
  ];

  return (
    <ScrollView style={[styles.container, style]} showsVerticalScrollIndicator={false}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View>
          <Text style={styles.balanceLabel}>Saldo Disponível</Text>
          <Text style={styles.balanceAmount}>{formatBRL(balance)}</Text>
        </View>
        <View style={styles.limitInfo}>
          <Text style={styles.limitLabel}>Mínimo</Text>
          <Text style={styles.limitValue}>{formatBRL(minAmount)}</Text>
        </View>
        <View style={styles.limitInfo}>
          <Text style={styles.limitLabel}>Máximo</Text>
          <Text style={styles.limitValue}>{formatBRL(maxAmount)}</Text>
        </View>
      </View>

      {/* Amount Input */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Valor do Saque</Text>
        <View
          style={[
            styles.amountInput,
            {
              borderColor: amount
                ? isValidAmount
                  ? '#02de95'
                  : '#ef4444'
                : 'rgba(255,255,255,0.2)',
            },
          ]}
        >
          <Text style={styles.currencySymbol}>R$</Text>
          <TextInput
            style={styles.amountInputField}
            placeholder={formatBRL(minAmount)}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={amount}
            onChangeText={handleAmountChange}
            keyboardType="decimal-pad"
            editable={editable}
          />
          {amount && (
            <Icon
              name={isValidAmount ? 'check-circle' : 'cancel'}
              size={20}
              color={isValidAmount ? '#02de95' : '#ef4444'}
            />
          )}
        </View>

        {amount && !isValidAmount && (
          <Text style={styles.errorText}>
            {amountNumber < minAmount
              ? `Mínimo de ${formatBRL(minAmount)}`
              : amountNumber > maxAmount
              ? `Máximo de ${formatBRL(maxAmount)}`
              : 'Saldo insuficiente'}
          </Text>
        )}
      </View>

      {/* PIX Key Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Tipo de Chave PIX</Text>
        <View style={styles.typeGrid}>
          {pixTypes.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonActive,
              ]}
              onPress={() => handleTypeSelect(type.id)}
              disabled={!editable}
            >
              <View style={styles.typeIcon}>{type.icon}</View>
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.id && { color: '#02de95' },
                ]}
              >
                {type.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* PIX Key Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>
          {pixTypes.find((t) => t.id === selectedType)?.label || 'Chave PIX'}
        </Text>
        <View
          style={[
            styles.pixInput,
            {
              borderColor: pixKey
                ? isValidKey
                  ? '#02de95'
                  : '#ef4444'
                : 'rgba(255,255,255,0.2)',
            },
          ]}
        >
          <Icon
            name="qrcode-scan"
            size={20}
            color="rgba(255,255,255,0.5)"
          />
          <TextInput
            style={styles.pixInputField}
            placeholder={pixTypes.find((t) => t.id === selectedType)?.placeholder}
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={selectedType === 'cpf' ? formatCPF(pixKey) : pixKey}
            onChangeText={handlePixKeyChange}
            keyboardType={selectedType === 'email' ? 'email-address' : 'default'}
            editable={editable}
          />
          {pixKey && (
            <Icon
              name={isValidKey ? 'check-circle' : 'cancel'}
              size={20}
              color={isValidKey ? '#02de95' : '#ef4444'}
            />
          )}
        </View>

        {pixKey && !isValidKey && (
          <Text style={styles.errorText}>
            {selectedType === 'cpf'
              ? 'CPF inválido'
              : selectedType === 'email'
              ? 'Email inválido'
              : selectedType === 'phone'
              ? 'Telefone inválido'
              : 'Chave PIX inválida'}
          </Text>
        )}

        <View style={styles.securityInfo}>
          <Icon name="info" size={14} color="rgba(255,255,255,0.6)" />
          <Text style={styles.securityText}>
            Verifique se a chave PIX está correta
          </Text>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
        onPress={handleSubmit}
        disabled={!canSubmit || !editable}
      >
        <Icon name="call-made" size={20} color="white" />
        <Text style={styles.submitButtonText}>
          Solicitar Saque de {formatBRL(amountNumber)}
        </Text>
      </TouchableOpacity>

      <View style={{ height: spacing.lg }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  balanceCard: {
    flexDirection: 'row',
    backgroundColor: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    color: 'white',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  limitInfo: {
    flex: 1,
    alignItems: 'center',
  },
  limitLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
  limitValue: {
    color: 'white',
    fontWeight: fontWeight.bold,
  },
  section: {
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: fontSize.base,
    fontWeight: fontWeight.bold,
  },
  sectionLabel: {
    color: colors.text.primary,
    fontSize: fontSize.sm,
    fontWeight: fontWeight.bold,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  currencySymbol: {
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
  },
  amountInputField: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.lg,
    fontWeight: fontWeight.bold,
    paddingVertical: spacing.md,
  },
  typeGrid: {
    flexDirection: 'row',
    gap: spacing.sm,
    flexWrap: 'wrap',
  },
  typeButton: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: spacing.xs,
  },
  typeButtonActive: {
    borderColor: '#02de95',
    backgroundColor: 'rgba(2,222,149,0.1)',
  },
  typeIcon: {
    width: 36,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typeLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  pixInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.secondary,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  pixInputField: {
    flex: 1,
    color: colors.text.primary,
    fontSize: fontSize.base,
    paddingVertical: spacing.md,
  },
  errorText: {
    color: '#ef4444',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.bold,
  },
  securityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  securityText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: fontSize.xs,
    flex: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#02de95',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    marginTop: spacing.lg,
  },
  submitButtonDisabled: {
    backgroundColor: 'rgba(2,222,149,0.4)',
  },
  submitButtonText: {
    color: '#091A2F',
    fontWeight: fontWeight.bold,
    fontSize: fontSize.base,
  },
});
