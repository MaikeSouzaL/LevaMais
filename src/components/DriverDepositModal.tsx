import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import { Modal } from '@/components/Modal';
import { useErrorHandler } from '@/hooks/useAsyncHandlers';
import configService, { DriverDepositConfig } from '@/services/config.service';
import driverService from '@/services/driver.service';
import { logger } from '@/utils/logger';

interface DriverDepositModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
}

export function DriverDepositModal({
  visible,
  onClose,
  onSuccess,
}: DriverDepositModalProps) {
  const { handleError } = useErrorHandler('DriverDepositModal');
  const [config, setConfig] = useState<DriverDepositConfig | null>(null);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Load config on mount
  useEffect(() => {
    if (!visible) return;

    const loadConfig = async () => {
      try {
        setLoading(true);
        const depositConfig = await configService.getDepositConfig();
        setConfig(depositConfig);
        logger.info('DEPOSIT_MODAL', 'Config loaded', {
          presets: depositConfig.presets,
          minDeposit: depositConfig.minDeposit,
          maxDeposit: depositConfig.maxDeposit,
        });
      } catch (error) {
        handleError(error, 'Falha ao carregar configuração de depósito');
      } finally {
        setLoading(false);
      }
    };

    loadConfig();
  }, [visible]);

  const handleSelectPreset = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    logger.info('DEPOSIT_MODAL', 'Preset selected', { amount });
  };

  const handleCustomAmountChange = (text: string) => {
    setCustomAmount(text);
    setSelectedAmount(null);
    logger.info('DEPOSIT_MODAL', 'Custom amount entered', { amount: text });
  };

  const getFinalAmount = (): number => {
    if (selectedAmount) return selectedAmount;
    return customAmount ? parseFloat(customAmount) : 0;
  };

  const validateAmount = (amount: number): boolean => {
    if (!config) return false;

    if (amount < config.minDeposit) {
      Toast.show({
        type: 'error',
        text1: 'Valor mínimo',
        text2: `Depósito mínimo é R$ ${config.minDeposit.toFixed(2)}`,
      });
      return false;
    }

    if (amount > config.maxDeposit) {
      Toast.show({
        type: 'error',
        text1: 'Valor máximo',
        text2: `Depósito máximo é R$ ${config.maxDeposit.toFixed(2)}`,
      });
      return false;
    }

    return true;
  };

  const handleConfirmDeposit = async () => {
    try {
      const finalAmount = getFinalAmount();

      if (finalAmount === 0) {
        Toast.show({
          type: 'error',
          text1: 'Selecione um valor',
          text2: 'Escolha um dos valores sugeridos ou insira um customizado',
        });
        return;
      }

      if (!validateAmount(finalAmount)) {
        return;
      }

      setSubmitting(true);
      logger.info('DEPOSIT_MODAL', 'Processing deposit', { amount: finalAmount });

      // Call backend to process deposit
      await driverService.addDeposit(finalAmount);

      logger.info('DEPOSIT_MODAL', 'Deposit successful', { amount: finalAmount });

      Toast.show({
        type: 'success',
        text1: 'Depósito realizado',
        text2: `R$ ${finalAmount.toFixed(2)} adicionado ao seu saldo`,
      });

      if (onSuccess) {
        onSuccess(finalAmount);
      }

      // Reset and close
      setSelectedAmount(null);
      setCustomAmount('');
      onClose();
    } catch (error) {
      handleError(error, 'Falha ao processar depósito');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Modal visible={visible} onClose={onClose} type="info">
        <View className="flex items-center justify-center p-6">
          <ActivityIndicator size="large" color="#02de95" />
          <Text className="text-white mt-4">Carregando...</Text>
        </View>
      </Modal>
    );
  }

  if (!config) {
    return (
      <Modal visible={visible} onClose={onClose} type="error" title="Erro">
        <Text className="text-white">Falha ao carregar configuração</Text>
      </Modal>
    );
  }

  const finalAmount = getFinalAmount();

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      type="info"
      title="Adicionar Saldo"
      onConfirm={finalAmount > 0 ? handleConfirmDeposit : undefined}
      confirmText={submitting ? 'Processando...' : 'Confirmar'}
    >
      <ScrollView
        className="w-full"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
      >
        {/* Info Box */}
        <View className="bg-[#0ea5e9]/10 border border-[#0ea5e9]/30 rounded-lg p-4 mb-6">
          <View className="flex-row items-start gap-3">
            <MaterialIcons name="info" size={20} color="#0ea5e9" />
            <View className="flex-1">
              <Text className="text-[#0ea5e9] font-bold mb-1">Como funciona</Text>
              <Text className="text-[#0ea5e9]/80 text-xs leading-4">
                Você precisa de um saldo mínimo para aceitar corridas. A cada corrida
                completada, a taxa da plataforma é descontada do seu saldo.
              </Text>
            </View>
          </View>
        </View>

        {/* Presets */}
        <Text className="text-white font-bold text-sm mb-3">Valores sugeridos:</Text>
        <View className="flex-row flex-wrap gap-2 mb-6">
          {config.presets.map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => handleSelectPreset(preset)}
              className={`flex-1 min-w-[45%] p-4 rounded-lg border-2 items-center ${
                selectedAmount === preset
                  ? 'bg-[#02de95]/20 border-[#02de95]'
                  : 'bg-[#0f172a] border-[#334155]'
              }`}
            >
              <Text
                className={`text-lg font-bold ${
                  selectedAmount === preset ? 'text-[#02de95]' : 'text-white'
                }`}
              >
                R$ {preset}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <View className="mb-6">
          <Text className="text-white font-bold text-sm mb-3">Ou insira um valor:</Text>
          <View className="flex-row items-center bg-[#0f172a] border border-[#334155] rounded-lg overflow-hidden">
            <Text className="text-white font-bold px-4">R$</Text>
            <TextInput
              placeholder="0.00"
              placeholderTextColor="#64748b"
              value={customAmount}
              onChangeText={handleCustomAmountChange}
              keyboardType="decimal-pad"
              editable={!submitting}
              className="flex-1 px-4 py-3 text-white"
              style={{
                color: 'white',
                paddingHorizontal: 16,
                paddingVertical: 12,
                flex: 1,
              }}
            />
          </View>
          {customAmount && (
            <Text className="text-[#94a3b8] text-xs mt-2">
              Mínimo: R$ {config.minDeposit.toFixed(2)} | Máximo: R${' '}
              {config.maxDeposit.toFixed(2)}
            </Text>
          )}
        </View>

        {/* Summary */}
        {finalAmount > 0 && (
          <View className="bg-[#0ea5e9]/5 border border-[#0ea5e9]/20 rounded-lg p-4 mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-[#94a3b8]">Valor do depósito:</Text>
              <Text className="text-white font-bold text-lg">R$ {finalAmount.toFixed(2)}</Text>
            </View>
            <View className="border-t border-[#334155] pt-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-[#94a3b8] text-sm">Saldo após depósito:</Text>
                <Text className="text-[#02de95] font-bold">+R$ {finalAmount.toFixed(2)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Warning if high deduction */}
        <View className="bg-[#f59e0b]/10 border border-[#f59e0b]/30 rounded-lg p-4">
          <View className="flex-row items-start gap-3">
            <MaterialIcons name="warning" size={20} color="#f59e0b" />
            <View className="flex-1">
              <Text className="text-[#f59e0b] font-bold mb-1">Importante</Text>
              <Text className="text-[#f59e0b]/80 text-xs leading-4">
                A taxa da plataforma e descontada do seu saldo a cada corrida. Exemplo: numa corrida de R$ 50 com taxa de 15%, voce
                pagara R$ 7,50 do seu saldo.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
}
