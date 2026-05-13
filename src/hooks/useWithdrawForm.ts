import { useState, useCallback } from 'react';
import { logger } from '@/utils/logger';
import withdrawService, { DriverBalance, Withdraw } from '@/services/withdraw.service';

interface UseWithdrawFormState {
  balance: DriverBalance | null;
  withdrawList: Withdraw[];
  loading: boolean;
  submitting: boolean;
  error: string | null;
}

export function useWithdrawForm() {
  const [state, setState] = useState<UseWithdrawFormState>({
    balance: null,
    withdrawList: [],
    loading: true,
    submitting: false,
    error: null,
  });

  const loadBalance = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      logger.info('WithdrawForm', 'Carregando saldo');
      const balance = await withdrawService.getBalance();
      setState(prev => ({ ...prev, balance, loading: false }));
      return balance;
    } catch (error) {
      logger.error('WithdrawForm', 'Erro ao carregar saldo', error as Error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: (error as Error).message,
      }));
      throw error;
    }
  }, []);

  const loadWithdrawHistory = useCallback(async (limit = 20, offset = 0) => {
    try {
      logger.info('WithdrawForm', 'Carregando histórico de saques');
      const withdraws = await withdrawService.listWithdraws(limit, offset);
      setState(prev => ({ ...prev, withdrawList: withdraws }));
      return withdraws;
    } catch (error) {
      logger.error(
        'WithdrawForm',
        'Erro ao carregar histórico de saques',
        error as Error
      );
      throw error;
    }
  }, []);

  const submitWithdraw = useCallback(
    async (data: {
      amount: number;
      pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
      pixKey: string;
      notes?: string;
    }) => {
      setState(prev => ({ ...prev, submitting: true, error: null }));
      try {
        logger.info('WithdrawForm', `Solicitando saque de R$ ${data.amount}`, {
          pixKeyType: data.pixKeyType,
        });

        const response = await withdrawService.requestWithdraw({
          amount: data.amount,
          pixKeyType: data.pixKeyType,
          pixKey: data.pixKey,
          notes: data.notes,
        });

        logger.info('WithdrawForm', 'Saque solicitado com sucesso', {
          withdrawId: response.id,
        });

        // Recarregar saldo
        await loadBalance();
        await loadWithdrawHistory();

        setState(prev => ({ ...prev, submitting: false }));
        return response;
      } catch (error) {
        const errorMsg = (error as Error).message || 'Erro ao solicitar saque';
        logger.error('WithdrawForm', errorMsg, error as Error);
        setState(prev => ({ ...prev, submitting: false, error: errorMsg }));
        throw error;
      }
    },
    [loadBalance, loadWithdrawHistory]
  );

  const cancelWithdraw = useCallback(async (withdrawId: string) => {
    try {
      logger.info('WithdrawForm', `Cancelando saque ${withdrawId}`);
      await withdrawService.cancelWithdraw(withdrawId);
      logger.info('WithdrawForm', 'Saque cancelado com sucesso');
      await loadWithdrawHistory();
      return true;
    } catch (error) {
      logger.error('WithdrawForm', 'Erro ao cancelar saque', error as Error);
      throw error;
    }
  }, [loadWithdrawHistory]);

  const scheduleWithdraw = useCallback(
    async (data: {
      amount: number;
      pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
      pixKey: string;
      scheduledFor: string;
      notes?: string;
    }) => {
      setState(prev => ({ ...prev, submitting: true, error: null }));
      try {
        logger.info('WithdrawForm', `Agendando saque para ${data.scheduledFor}`);

        const response = await withdrawService.scheduleWithdraw({
          amount: data.amount,
          pixKeyType: data.pixKeyType,
          pixKey: data.pixKey,
          scheduledFor: data.scheduledFor,
          notes: data.notes,
        });

        logger.info('WithdrawForm', 'Saque agendado com sucesso');
        await loadBalance();
        await loadWithdrawHistory();

        setState(prev => ({ ...prev, submitting: false }));
        return response;
      } catch (error) {
        const errorMsg = (error as Error).message || 'Erro ao agendar saque';
        logger.error('WithdrawForm', errorMsg, error as Error);
        setState(prev => ({ ...prev, submitting: false, error: errorMsg }));
        throw error;
      }
    },
    [loadBalance, loadWithdrawHistory]
  );

  return {
    ...state,
    loadBalance,
    loadWithdrawHistory,
    submitWithdraw,
    cancelWithdraw,
    scheduleWithdraw,
  };
}
