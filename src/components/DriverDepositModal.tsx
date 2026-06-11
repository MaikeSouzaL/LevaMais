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
  Share,
  Linking,
} from 'react-native';
import {
  X,
  Wallet,
  Info,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Copy,
  FileText,
  Zap,
  Check,
  Loader2,
} from 'lucide-react-native';
import Toast from 'react-native-toast-message';
import { useErrorHandler } from '@/hooks/useAsyncHandlers';
import configService, { DriverDepositConfig } from '@/services/config.service';
import depositService, {
  PixDepositResult,
  BoletoDepositResult,
} from '@/services/deposit.service';
import QRCode from 'react-native-qrcode-svg';
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

  type Step =
    | 'select_amount'
    | 'select_method'
    | 'enter_cpf'
    | 'processing_pix'
    | 'processing_boleto'
    | 'success'
    | 'error';

  const [step, setStep] = useState<Step>('select_amount');
  const [pixData, setPixData] = useState<PixDepositResult | null>(null);
  const [boletoData, setBoletoData] = useState<BoletoDepositResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [cpfText, setCpfText] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // Reset modal state when visible changes
  useEffect(() => {
    if (!visible) {
      if (pollRef.current) clearInterval(pollRef.current);
      setStep('select_amount');
      setPixData(null);
      setBoletoData(null);
      setErrorMsg(null);
      setCpfText('');
    }
  }, [visible]);

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
    return customAmount ? parseFloat(customAmount.replace(',', '.')) : 0;
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

  const finalAmount = getFinalAmount();

  const handleConfirmAmount = () => {
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

    setStep('select_method');
  };

  const handleGeneratePix = async () => {
    setErrorMsg(null);
    setSubmitting(true);
    logger.info('DEPOSIT_MODAL', 'Generating PIX', { amount: finalAmount });
    try {
      const pix = await depositService.createPixDeposit(finalAmount, 'driver_balance');
      setPixData(pix);
      setStep('processing_pix');
      startPixPolling(pix.transactionId);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Falha ao iniciar o depósito via PIX.');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateBoleto = async (enteredCpf: string) => {
    setErrorMsg(null);
    setSubmitting(true);
    const cleanCpf = enteredCpf.replace(/\D/g, "");
    logger.info('DEPOSIT_MODAL', 'Generating Boleto', { amount: finalAmount, cpf: cleanCpf });
    try {
      const boleto = await depositService.createBoletoDeposit(finalAmount, {
        account: 'driver_balance',
        taxId: cleanCpf,
      });
      setBoletoData(boleto);
      setStep('processing_boleto');
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Falha ao gerar boleto bancário.');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  };

  const startPixPolling = (txId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const status = await depositService.getPixDepositStatus(txId);
        if (status.status === 'paid') {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('success');
          if (onSuccess) {
            onSuccess(finalAmount);
          }
        } else if (status.status === 'expired' || status.status === 'failed') {
          if (pollRef.current) clearInterval(pollRef.current);
          setErrorMsg(
            status.status === 'expired'
              ? 'Código QR expirado.'
              : 'Pagamento não confirmado.',
          );
          setStep('error');
        }
      } catch {
        /* silenciado */
      }
    }, 4000);
  };

  const handleCopyPix = async () => {
    if (!pixData) return;
    try {
      // @ts-ignore
      const Clipboard = await import('expo-clipboard').catch(() => null);
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(pixData.pixCode);
        Toast.show({ type: 'success', text1: 'Código PIX copiado!' });
      } else {
        await Share.share({ message: pixData.pixCode });
      }
    } catch {}
  };

  const handleCopyBoleto = async () => {
    if (!boletoData?.number) return;
    try {
      // @ts-ignore
      const Clipboard = await import('expo-clipboard').catch(() => null);
      if (Clipboard?.setStringAsync) {
        await Clipboard.setStringAsync(boletoData.number);
        Toast.show({ type: 'success', text1: 'Código do boleto copiado!' });
      } else {
        await Share.share({ message: boletoData.number });
      }
    } catch {}
  };

  const handleOpenBoletoPdf = async () => {
    if (!boletoData?.pdf) return;
    try {
      await Linking.openURL(boletoData.pdf);
    } catch {
      Toast.show({
        type: 'error',
        text1: 'Erro ao abrir PDF',
        text2: 'Não foi possível abrir o link do boleto.',
      });
    }
  };

  const handleBack = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (step === 'select_method') {
      setStep('select_amount');
    } else if (step === 'enter_cpf') {
      setStep('select_method');
    } else if (step === 'processing_pix' || step === 'processing_boleto' || step === 'error') {
      setStep('select_amount');
      setPixData(null);
      setBoletoData(null);
      setErrorMsg(null);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    if (pollRef.current) clearInterval(pollRef.current);
    setSelectedAmount(null);
    setCustomAmount('');
    onClose();
  };

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
                    {/* Header back/close navigation inside Modal */}
                    {step !== 'select_amount' && (
                      <TouchableOpacity
                        onPress={handleBack}
                        activeOpacity={0.7}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          marginBottom: 16,
                          paddingVertical: 4,
                        }}
                      >
                        <ChevronLeft size={18} color="#64748b" style={{ marginRight: 4 }} />
                        <Text style={{ fontSize: 14, color: '#64748b', fontWeight: '600' }}>Voltar</Text>
                      </TouchableOpacity>
                    )}

                    {step === 'select_amount' && (
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
                          onPress={handleConfirmAmount}
                          activeOpacity={0.85}
                          disabled={finalAmount === 0 || submitting}
                          style={[
                            styles.confirmButton,
                            (finalAmount === 0 || submitting) && styles.confirmButtonDisabled,
                          ]}
                        >
                          <Text style={styles.confirmButtonText}>
                            {finalAmount > 0
                              ? `Confirmar R$ ${finalAmount.toFixed(2).replace('.', ',')}`
                              : 'Selecione um valor'}
                          </Text>
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

                    {step === 'select_method' && (
                      <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 }}>
                          Escolha o método de pagamento
                        </Text>
                        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                          Valor do depósito: <Text style={{ fontWeight: '700', color: '#0f172a' }}>R$ {finalAmount.toFixed(2).replace('.', ',')}</Text>
                        </Text>

                        <TouchableOpacity
                          onPress={handleGeneratePix}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1.5,
                            borderColor: '#e2e8f0',
                            flexDirection: 'row',
                            alignItems: 'center',
                          }}
                        >
                          <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: 'rgba(2, 222, 149, 0.1)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}>
                            <Zap size={22} color="#02de95" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>PIX (Stripe)</Text>
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Aprovação imediata e sem taxas.</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => setStep('enter_cpf')}
                          activeOpacity={0.8}
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 16,
                            padding: 16,
                            borderWidth: 1.5,
                            borderColor: '#e2e8f0',
                            flexDirection: 'row',
                            alignItems: 'center',
                            marginTop: 4,
                          }}
                        >
                          <View style={{
                            width: 44,
                            height: 44,
                            borderRadius: 12,
                            backgroundColor: 'rgba(59,130,246,0.1)',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: 12,
                          }}>
                            <FileText size={22} color="#3b82f6" />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>Boleto (Stripe)</Text>
                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Compensação em 1 a 2 dias úteis.</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {step === 'enter_cpf' && (
                      <View style={{ gap: 12 }}>
                        <Text style={{ fontSize: 16, fontWeight: '900', color: '#0f172a', marginBottom: 4 }}>
                          Informe seu CPF
                        </Text>
                        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
                          O CPF é obrigatório para emissão de boleto bancário (Stripe).
                        </Text>

                        <TextInput
                          value={cpfText}
                          onChangeText={(text) => {
                            const raw = text.replace(/\D/g, "").slice(0, 11);
                            let masked = raw;
                            if (raw.length > 9) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6, 9)}-${raw.slice(9)}`;
                            } else if (raw.length > 6) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3, 6)}.${raw.slice(6)}`;
                            } else if (raw.length > 3) {
                              masked = `${raw.slice(0, 3)}.${raw.slice(3)}`;
                            }
                            setCpfText(masked);
                          }}
                          keyboardType="numeric"
                          placeholder="000.000.000-00"
                          placeholderTextColor="#cbd5e1"
                          style={{
                            backgroundColor: '#f8fafc',
                            borderRadius: 12,
                            borderWidth: 1.5,
                            borderColor: cpfText.replace(/\D/g, "").length === 11 ? '#02de95' : '#e2e8f0',
                            color: '#0f172a',
                            fontSize: 16,
                            fontWeight: '700',
                            paddingHorizontal: 16,
                            height: 50,
                            marginBottom: 16,
                          }}
                        />

                        <TouchableOpacity
                          onPress={() => handleGenerateBoleto(cpfText)}
                          disabled={cpfText.replace(/\D/g, "").length !== 11 || submitting}
                          activeOpacity={0.8}
                          style={[
                            styles.confirmButton,
                            (cpfText.replace(/\D/g, "").length !== 11 || submitting) && styles.confirmButtonDisabled,
                          ]}
                        >
                          {submitting ? (
                            <ActivityIndicator color="#091A2F" size="small" />
                          ) : (
                            <Text style={styles.confirmButtonText}>Gerar Boleto</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    )}

                    {step === 'processing_pix' && pixData && (
                      <View style={{ alignItems: 'center', gap: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>PIX Gerado!</Text>
                        <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', paddingHorizontal: 12 }}>
                          Pague pelo QR code ou copie a chave copia e cola abaixo. O saldo será creditado imediatamente após o pagamento.
                        </Text>

                        <View style={{
                          padding: 16,
                          backgroundColor: '#ffffff',
                          borderRadius: 20,
                          borderWidth: 1,
                          borderColor: '#e2e8f0',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginVertical: 12,
                        }}>
                          <QRCode value={pixData.pixCode} size={180} />
                        </View>

                        <TouchableOpacity
                          onPress={handleCopyPix}
                          activeOpacity={0.8}
                          style={[styles.confirmButton, { width: '100%' }]}
                        >
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Copy size={18} color="#091A2F" />
                            <Text style={styles.confirmButtonText}>Copiar Código PIX</Text>
                          </View>
                        </TouchableOpacity>
                      </View>
                    )}

                    {step === 'processing_boleto' && boletoData && (
                      <View style={{ alignItems: 'center', gap: 16 }}>
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Boleto Gerado!</Text>
                        <Text style={{ fontSize: 12, color: '#64748b', textAlign: 'center', paddingHorizontal: 12 }}>
                          Copie o código de barras abaixo ou visualize o boleto em formato PDF para realizar o pagamento. A compensação ocorre em 1 a 2 dias úteis.
                        </Text>

                        {boletoData.number && (
                          <TouchableOpacity
                            onPress={handleCopyBoleto}
                            activeOpacity={0.8}
                            style={{
                              backgroundColor: '#f8fafc',
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: '#e2e8f0',
                              padding: 12,
                              flexDirection: 'row',
                              alignItems: 'center',
                              width: '100%',
                              marginTop: 12,
                            }}
                          >
                            <Copy size={16} color="#64748b" style={{ marginRight: 8 }} />
                            <Text numberOfLines={1} style={{ flex: 1, fontSize: 11, color: '#64748b', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' }}>
                              {boletoData.number}
                            </Text>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#02de95', marginLeft: 8 }}>COPIAR</Text>
                          </TouchableOpacity>
                        )}

                        {boletoData.pdf && (
                          <TouchableOpacity
                            onPress={handleOpenBoletoPdf}
                            activeOpacity={0.8}
                            style={[styles.confirmButton, { width: '100%', backgroundColor: '#02de95', marginTop: 8 }]}
                          >
                            <Text style={styles.confirmButtonText}>Visualizar Boleto (PDF)</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    )}

                    {step === 'success' && (
                      <View style={{ alignItems: 'center', gap: 16, paddingVertical: 12 }}>
                        <CheckCircle2 size={56} color="#02de95" fill="rgba(2,222,149,0.15)" />
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>Depósito Confirmado!</Text>
                        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                          O valor de <Text style={{ fontWeight: '700', color: '#0f172a' }}>R$ {finalAmount.toFixed(2).replace('.', ',')}</Text> foi adicionado com sucesso ao seu saldo de motorista.
                        </Text>

                        <TouchableOpacity
                          onPress={handleClose}
                          activeOpacity={0.8}
                          style={[styles.confirmButton, { width: '100%', marginTop: 12 }]}
                        >
                          <Text style={styles.confirmButtonText}>Concluído</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    {step === 'error' && (
                      <View style={{ alignItems: 'center', gap: 16, paddingVertical: 12 }}>
                        <AlertTriangle size={56} color="#ef4444" />
                        <Text style={{ fontSize: 18, fontWeight: '900', color: '#ef4444' }}>Ocorreu um erro</Text>
                        <Text style={{ fontSize: 13, color: '#64748b', textAlign: 'center' }}>
                          {errorMsg ?? 'Não foi possível processar seu depósito no momento.'}
                        </Text>

                        <TouchableOpacity
                          onPress={() => setStep('select_amount')}
                          activeOpacity={0.8}
                          style={[styles.confirmButton, { width: '100%', marginTop: 12 }]}
                        >
                          <Text style={styles.confirmButtonText}>Tentar Novamente</Text>
                        </TouchableOpacity>
                      </View>
                    )}
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
