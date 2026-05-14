import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import paymentService, { PaymentMethod } from '@/services/payment.service';

interface PaymentFormState {
  method: PaymentMethod;
  cardNumber: string;
  holderName: string;
  expiry: string;
  cvv: string;
  pixKey: string;
  amount: number;
  description?: string;
  loading: boolean;
  error: string | null;
}

function validatePaymentState(state: PaymentFormState): string | null {
  if (!state.amount || state.amount <= 0) {
    return 'Valor inválido';
  }

  switch (state.method) {
    case 'credit_card':
      if (!state.cardNumber || state.cardNumber.replace(/\s/g, '').length < 13) {
        return 'Número de cartão inválido';
      }
      if (!state.holderName.trim()) {
        return 'Nome do titular é obrigatório';
      }
      if (!state.expiry || state.expiry.split('/').length !== 2) {
        return 'Data de vencimento inválida';
      }
      if (!state.cvv || state.cvv.length < 3) {
        return 'CVV inválido';
      }
      return null;

    case 'pix':
      if (!state.pixKey.trim()) {
        return 'Chave PIX é obrigatória';
      }
      return null;

    case 'wallet':
    case 'cash':
      return null;

    default:
      return 'Método de pagamento inválido';
  }
}

export function usePaymentForm(initialAmount: number) {
  const [state, setState] = useState<PaymentFormState>({
    method: 'credit_card',
    cardNumber: '',
    holderName: '',
    expiry: '',
    cvv: '',
    pixKey: '',
    amount: initialAmount,
    loading: false,
    error: null,
  });

  const updateMethod = useCallback((method: PaymentMethod) => {
    setState(prev => ({ ...prev, method, error: null }));
  }, []);

  const updateCardNumber = useCallback((text: string) => {
    setState(prev => ({ ...prev, cardNumber: text }));
  }, []);

  const updateHolderName = useCallback((text: string) => {
    setState(prev => ({ ...prev, holderName: text }));
  }, []);

  const updateExpiry = useCallback((text: string) => {
    setState(prev => ({ ...prev, expiry: text }));
  }, []);

  const updateCvv = useCallback((text: string) => {
    setState(prev => ({ ...prev, cvv: text }));
  }, []);

  const updatePixKey = useCallback((text: string) => {
    setState(prev => ({ ...prev, pixKey: text }));
  }, []);

  const updateAmount = useCallback((amount: number) => {
    setState(prev => ({ ...prev, amount }));
  }, []);

  const validateForm = useCallback((options?: { silent?: boolean }): boolean => {
    const nextError = validatePaymentState(state);
    if (!options?.silent) {
      setState(prev => ({ ...prev, error: nextError }));
    }
    return !nextError;
  }, [state]);

  const canSubmit = useCallback((): boolean => !validatePaymentState(state), [state]);

  const submitPayment = useCallback(async (onSuccess: (response: any) => void) => {
    if (!validateForm()) {
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      logger.info('PaymentForm', `Processando pagamento com ${state.method}`);

      const request = {
        amount: state.amount,
        method: state.method,
        description: state.description,
        pixKey: state.pixKey || undefined,
      };

      const response = await paymentService.processPayment(request as any);

      if (response.success) {
        logger.info('PaymentForm', 'Pagamento bem-sucedido');
        setState(prev => ({
          ...prev,
          loading: false,
          cardNumber: '',
          holderName: '',
          expiry: '',
          cvv: '',
          pixKey: '',
          error: null,
        }));
        onSuccess(response);
      } else {
        const errorMsg = response.error || 'Erro ao processar pagamento';
        logger.error('PaymentForm', 'Falha no pagamento', new Error(errorMsg));
        setState(prev => ({ ...prev, loading: false, error: errorMsg }));
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      logger.error('PaymentForm', 'Erro ao processar pagamento', error as Error);
      setState(prev => ({ ...prev, loading: false, error: errorMsg }));
    }
  }, [state, validateForm]);

  return {
    ...state,
    updateMethod,
    updateCardNumber,
    updateHolderName,
    updateExpiry,
    updateCvv,
    updatePixKey,
    updateAmount,
    validateForm,
    canSubmit,
    submitPayment,
  };
}
