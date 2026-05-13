import apiClient from './api';
import { logger } from '@/utils/logger';

export interface WithdrawRequest {
  amount: number;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
  pixKey: string;
  scheduledFor?: string;
  notes?: string;
}

export interface Withdraw {
  id: string;
  amount: number;
  pixKey: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  completedAt?: string;
  failureReason?: string;
  transactionId?: string;
}

export interface DriverBalance {
  available: number;
  totalEarnings: number;
  totalWithdrawn: number;
  pending: number;
}

class WithdrawService {
  async getBalance(): Promise<DriverBalance> {
    try {
      logger.info('WithdrawService', 'Buscando saldo do motorista');
      const response = await apiClient.get('/withdraws/balance');
      return response.data?.balance || {
        available: 0,
        totalEarnings: 0,
        totalWithdrawn: 0,
        pending: 0,
      };
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao buscar saldo', error as Error);
      throw error;
    }
  }

  async requestWithdraw(request: WithdrawRequest): Promise<Withdraw> {
    try {
      logger.info('WithdrawService', 'Solicitando saque', {
        amount: request.amount,
        pixKeyType: request.pixKeyType,
      });

      const response = await apiClient.post('/withdraws/request', request);

      if (response.data?.success) {
        logger.info('WithdrawService', 'Saque solicitado com sucesso', {
          withdrawId: response.data?.withdraw?.id,
        });
        return response.data.withdraw;
      }

      throw new Error(response.data?.error || 'Erro ao solicitar saque');
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao solicitar saque', error as Error);
      throw error;
    }
  }

  async listWithdraws(limit = 20, offset = 0): Promise<Withdraw[]> {
    try {
      logger.info('WithdrawService', 'Buscando histórico de saques');
      const response = await apiClient.get('/withdraws/history', {
        params: { limit, offset },
      });
      return response.data?.withdraws || [];
    } catch (error) {
      logger.error(
        'WithdrawService',
        'Erro ao buscar histórico de saques',
        error as Error
      );
      throw error;
    }
  }

  async getWithdrawStatus(withdrawId: string): Promise<Withdraw> {
    try {
      logger.info('WithdrawService', `Buscando status do saque ${withdrawId}`);
      const response = await apiClient.get(`/withdraws/${withdrawId}`);
      return response.data?.withdraw;
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao buscar status do saque', error as Error);
      throw error;
    }
  }

  async cancelWithdraw(withdrawId: string): Promise<void> {
    try {
      logger.info('WithdrawService', `Cancelando saque ${withdrawId}`);
      await apiClient.post(`/withdraws/${withdrawId}/cancel`);
      logger.info('WithdrawService', 'Saque cancelado com sucesso');
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao cancelar saque', error as Error);
      throw error;
    }
  }

  async validatePixKey(pixKey: string): Promise<{ valid: boolean; accountHolder?: string }> {
    try {
      logger.info('WithdrawService', `Validando chave PIX: ${pixKey.substring(0, 5)}...`);
      const response = await apiClient.post('/withdraws/validate-pix', { pixKey });
      return response.data || { valid: false };
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao validar chave PIX', error as Error);
      return { valid: false };
    }
  }

  async getWithdrawLimits(): Promise<{
    minAmount: number;
    maxAmount: number;
    dailyLimit: number;
    monthlyLimit: number;
    remainingDaily: number;
    remainingMonthly: number;
  }> {
    try {
      const response = await apiClient.get('/withdraws/limits');
      return response.data?.limits || {
        minAmount: 10,
        maxAmount: 10000,
        dailyLimit: 5000,
        monthlyLimit: 50000,
        remainingDaily: 5000,
        remainingMonthly: 50000,
      };
    } catch {
      return {
        minAmount: 10,
        maxAmount: 10000,
        dailyLimit: 5000,
        monthlyLimit: 50000,
        remainingDaily: 5000,
        remainingMonthly: 50000,
      };
    }
  }

  async scheduleWithdraw(request: WithdrawRequest & { scheduledFor: string }): Promise<Withdraw> {
    try {
      logger.info('WithdrawService', 'Agendando saque', {
        amount: request.amount,
        scheduledFor: request.scheduledFor,
      });

      const response = await apiClient.post('/withdraws/schedule', request);

      if (response.data?.success) {
        logger.info('WithdrawService', 'Saque agendado com sucesso');
        return response.data.withdraw;
      }

      throw new Error(response.data?.error || 'Erro ao agendar saque');
    } catch (error) {
      logger.error('WithdrawService', 'Erro ao agendar saque', error as Error);
      throw error;
    }
  }
}

export default new WithdrawService();
