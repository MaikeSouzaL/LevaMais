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

  const validateForm = useCallback((): boolean => {
    if (!state.amount || state.amount <= 0) {
      setState(prev => ({ ...prev, error: 'Valor inválido' }));
      return false;
    }

    switch (state.method) {
      case 'credit_card':
        if (!state.cardNumber || state.cardNumber.replace(/\s/g, '').length < 13) {
          setState(prev => ({ ...prev, error: 'Número de cartão inválido' }));
          return false;
        }
        if (!state.holderName.trim()) {
          setState(prev => ({ ...prev, error: 'Nome do titular é obrigatório' }));
          return false;
        }
        if (!state.expiry || state.expiry.split('/').length !== 2) {
          setState(prev => ({ ...prev, error: 'Data de vencimento inválida' }));
          return false;
        }
        if (!state.cvv || state.cvv.length < 3) {
          setState(prev => ({ ...prev, error: 'CVV inválido' }));
          return false;
        }
        return true;

      case 'pix':
        if (!state.pixKey.trim()) {
          setState(prev => ({ ...prev, error: 'Chave PIX é obrigatória' }));
          return false;
        }
        return true;

      case 'wallet':
      case 'cash':
        return true;

      default:
        return false;
    }
  }, [state]);

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
    submitPayment,
  };
}
