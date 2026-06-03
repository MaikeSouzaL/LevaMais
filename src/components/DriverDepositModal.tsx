import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Modal as RNModal,
  Animated,
  Dimensions,
  StyleSheet,
  Keyboard,
  Platform,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
} from 'react-native';
import { X, Wallet, Info, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useErrorHandler } from '@/hooks/useAsyncHandlers';
import configService, { DriverDepositConfig } from '@/services/config.service';
import driverService from '@/services/driver.service';
import { logger } from '@/utils/logger';
import { MotiView } from 'moti';

const { width, height: windowHeight } = Dimensions.get('window');

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
  const scrollRef = useRef<ScrollView | null>(null);
  const [keyboardShown, setKeyboardShown] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, () => setKeyboardShown(true));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardShown(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

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

  const handleClose = () => {
    setSelectedAmount(null);
    setCustomAmount('');
    onClose();
  };

  const finalAmount = getFinalAmount();

  if (!visible) return null;

  return (
    <RNModal transparent visible={visible} animationType="none">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[
          styles.overlay,
          keyboardShown && {
            justifyContent: 'flex-start',
            paddingTop: Platform.OS === 'ios' ? 75 : 45,
          }
        ]}>
          <View style={styles.backdrop} />

          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
          >
            <MotiView
              from={{ opacity: 0, scale: 0.9, translateY: 30 }}
              animate={{ opacity: 1, scale: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              style={[
                styles.container,
                { maxHeight: keyboardShown ? windowHeight * 0.48 : '92%' }
              ]}
            >
              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                activeOpacity={0.7}
                style={styles.closeButton}
              >
                <X size={18} color="#94a3b8" strokeWidth={2.5} />
              </TouchableOpacity>

              <ScrollView
                ref={(ref) => { scrollRef.current = ref; }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                bounces={false}
                keyboardShouldPersistTaps="handled"
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#02de95" />
                    <Text style={styles.loadingText}>Carregando...</Text>
                  </View>
                ) : !config ? (
                  <View style={styles.loadingContainer}>
                    <AlertTriangle size={32} color="#ef4444" />
                    <Text style={[styles.loadingText, { color: '#ef4444' }]}>
                      Falha ao carregar configuração
                    </Text>
                  </View>
                ) : (
                  <>
                    {/* Header with Icon */}
                    <View style={styles.header}>
                      <View style={styles.iconWrapper}>
                        <Wallet size={28} color="#02de95" />
                      </View>
                      <Text style={styles.title}>Adicionar Saldo</Text>
                      <Text style={styles.subtitle}>
                        Mantenha seu saldo positivo para aceitar corridas e entregas.
                      </Text>
                    </View>

                    {/* Preset Amount Grid */}
                    <Text style={styles.sectionLabel}>Valores sugeridos</Text>
                    <View style={styles.presetsGrid}>
                      {config.presets.map((preset) => {
                        const isSelected = selectedAmount === preset;
                        return (
                          <TouchableOpacity
                            key={preset}
                            onPress={() => handleSelectPreset(preset)}
                            activeOpacity={0.7}
                            style={[
                              styles.presetCard,
                              isSelected && styles.presetCardSelected,
                            ]}
                          >
                            {isSelected && (
                              <View style={styles.presetCheck}>
                                <CheckCircle2 size={14} color="#02de95" fill="#02de95" />
                              </View>
                            )}
                            <Text
                              style={[
                                styles.presetText,
                                isSelected && styles.presetTextSelected,
                              ]}
                            >
                              R$ {preset}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Custom Amount Input */}
                    <Text style={styles.sectionLabel}>Ou insira um valor</Text>
                    <View
                      style={[
                        styles.customInputWrapper,
                        customAmount.length > 0 && styles.customInputWrapperActive,
                      ]}
                    >
                      <Text style={styles.currencyPrefix}>R$</Text>
                      <TextInput
                        placeholder="0,00"
                        placeholderTextColor="#cbd5e1"
                        value={customAmount}
                        onChangeText={handleCustomAmountChange}
                        keyboardType="decimal-pad"
                        editable={!submitting}
                        style={styles.customInput}
                        onFocus={() => {
                          setTimeout(() => {
                            scrollRef.current?.scrollToEnd({ animated: true });
                          }, 300);
                        }}
                      />
                    </View>
                    {customAmount.length > 0 && (
                      <Text style={styles.limitsHint}>
                        Mínimo: R$ {config.minDeposit.toFixed(2)} · Máximo: R${' '}
                        {config.maxDeposit.toFixed(2)}
                      </Text>
                    )}

                    {/* Summary Card */}
                    {finalAmount > 0 && (
                      <MotiView
                        from={{ opacity: 0, translateY: 8 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        transition={{ type: 'timing', duration: 250 }}
                        style={styles.summaryCard}
                      >
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Valor do depósito</Text>
                          <Text style={styles.summaryValue}>
                            R$ {finalAmount.toFixed(2).replace('.', ',')}
                          </Text>
                        </View>
                        <View style={styles.summaryDivider} />
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Será adicionado ao saldo</Text>
                          <Text style={styles.summaryValueGreen}>
                            +R$ {finalAmount.toFixed(2).replace('.', ',')}
                          </Text>
                        </View>
                      </MotiView>
                    )}

                    {/* Info Tip */}
                    <View style={styles.infoBox}>
                      <Info size={16} color="#64748b" style={{ marginTop: 1 }} />
                      <Text style={styles.infoText}>
                        A taxa da plataforma é descontada do seu saldo a cada corrida completada.
                      </Text>
                    </View>

                    {/* Confirm Button */}
                    <TouchableOpacity
                      onPress={handleConfirmDeposit}
                      activeOpacity={0.85}
                      disabled={finalAmount === 0 || submitting}
                      style={[
                        styles.confirmButton,
                        (finalAmount === 0 || submitting) && styles.confirmButtonDisabled,
                      ]}
                    >
                      {submitting ? (
                        <ActivityIndicator color="#091A2F" size="small" />
                      ) : (
                        <Text style={styles.confirmButtonText}>
                          {finalAmount > 0
                            ? `Confirmar R$ ${finalAmount.toFixed(2).replace('.', ',')}`
                            : 'Selecione um valor'}
                        </Text>
                      )}
                    </TouchableOpacity>

                    {/* Cancel Link */}
                    <TouchableOpacity
                      onPress={handleClose}
                      activeOpacity={0.7}
                      style={styles.cancelLink}
                    >
                      <Text style={styles.cancelLinkText}>Cancelar</Text>
                    </TouchableOpacity>
                  </>
                )}
              </ScrollView>
            </MotiView>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  keyboardView: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: width * 0.92,
    maxHeight: '92%',
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 20,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 16,
  },
  loadingText: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 4,
  },
  iconWrapper: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(2, 222, 149, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(2, 222, 149, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 17,
    fontWeight: '500',
    paddingHorizontal: 8,
  },

  // Presets
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    rowGap: 8,
  },
  presetCard: {
    width: '48%',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presetCardSelected: {
    backgroundColor: 'rgba(2, 222, 149, 0.06)',
    borderColor: '#02de95',
  },
  presetCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  presetText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#334155',
  },
  presetTextSelected: {
    color: '#059669',
  },

  // Custom Input
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    marginBottom: 6,
  },
  customInputWrapperActive: {
    borderColor: '#02de95',
    backgroundColor: 'rgba(2, 222, 149, 0.03)',
  },
  currencyPrefix: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94a3b8',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    padding: 0,
  },
  limitsHint: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    marginBottom: 20,
    marginTop: 4,
    paddingLeft: 4,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginBottom: 16,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 16,
    color: '#0f172a',
    fontWeight: '900',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 12,
  },
  summaryValueGreen: {
    fontSize: 16,
    color: '#02de95',
    fontWeight: '900',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#64748b',
    lineHeight: 17,
    fontWeight: '500',
  },

  // Confirm Button
  confirmButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#02de95',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  confirmButtonDisabled: {
    backgroundColor: '#e2e8f0',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#091A2F',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },

  // Cancel Link
  cancelLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelLinkText: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
});
