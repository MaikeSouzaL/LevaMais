import apiClient from './api';
import { logger } from '@/utils/logger';

export type PaymentMethod = 'credit_card' | 'pix' | 'cash' | 'wallet';

export interface PaymentCard {
  id: string;
  brand: 'visa' | 'mastercard' | 'amex';
  lastFour: string;
  holderName: string;
  expiryMonth: number;
  expiryYear: number;
  isDefault: boolean;
}

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  rideId?: string;
  deliveryId?: string;
  description?: string;
  cardId?: string;
  pixKey?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  amount: number;
  method: PaymentMethod;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  receipt?: {
    id: string;
    date: string;
    amount: number;
    method: PaymentMethod;
  };
  error?: string;
}

class PaymentService {
  async listCards(): Promise<PaymentCard[]> {
    try {
      logger.info('PaymentService', 'Buscando cartões salvos');
      const response = await apiClient.get('/payments/cards');
      return response.data?.cards || [];
    } catch (error) {
      logger.error('PaymentService', 'Erro ao listar cartões', error as Error);
      throw error;
    }
  }

  async addCard(cardData: {
    cardNumber: string;
    holderName: string;
    expiryMonth: number;
    expiryYear: number;
    cvv: string;
  }): Promise<PaymentCard> {
    try {
      logger.info('PaymentService', 'Adicionando novo cartão');
      const response = await apiClient.post('/payments/cards', cardData);
      return response.data?.card;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao adicionar cartão', error as Error);
      throw error;
    }
  }

  async deleteCard(cardId: string): Promise<void> {
    try {
      logger.info('PaymentService', `Deletando cartão ${cardId}`);
      await apiClient.delete(`/payments/cards/${cardId}`);
    } catch (error) {
      logger.error('PaymentService', 'Erro ao deletar cartão', error as Error);
      throw error;
    }
  }

  async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    try {
      logger.info('PaymentService', 'Processando pagamento', { method: request.method, amount: request.amount });
      
      const response = await apiClient.post('/payments/process', request);
      
      if (response.data?.success) {
        logger.info('PaymentService', 'Pagamento processado com sucesso', {
          transactionId: response.data?.transactionId,
        });
      } else {
        logger.warn('PaymentService', 'Pagamento falhou', response.data?.error);
      }
      
      return response.data;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao processar pagamento', error as Error);
      throw error;
    }
  }

  async validatePixKey(pixKey: string): Promise<{ valid: boolean; name?: string }> {
    try {
      logger.info('PaymentService', `Validando chave PIX: ${pixKey.substring(0, 5)}...`);
      const response = await apiClient.post('/payments/pix/validate', { pixKey });
      return response.data;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao validar chave PIX', error as Error);
      throw error;
    }
  }

  async createPixDeposit(amount: number): Promise<{
    transactionId: string;
    amount: number;
    pixCode: string;
    qrCodeData: string;
    expiresIn: number;
    status: string;
    instructions: string[];
  }> {
    try {
      logger.info('PaymentService', `Criando depósito PIX de R$ ${amount}`);
      const response = await apiClient.post('/payments/deposit/pix', { amount });
      return response.data;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao criar depósito PIX', error as Error);
      throw error;
    }
  }

  async submitExitFeedback(data: {
    reason: string;
    category: string;
    details?: string;
  }): Promise<{ success: boolean; feedbackId: string }> {
    try {
      logger.info('PaymentService', 'Enviando feedback de saída', { category: data.category });
      const response = await apiClient.post('/payments/feedback/exit', data);
      return response.data;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao enviar feedback', error as Error);
      throw error;
    }
  }

  async submitVerification(data: {
    documentType: 'rg' | 'cnh' | 'passaporte';
    documentFront: string;
    documentBack?: string;
    selfie: string;
  }): Promise<{
    success: boolean;
    verificationId: string;
    status: string;
    estimatedReviewTime: string;
  }> {
    try {
      logger.info('PaymentService', `Submetendo verificação de ${data.documentType}`);
      const response = await apiClient.post('/payments/verification/submit', data);
      return response.data;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao submeter verificação', error as Error);
      throw error;
    }
  }

  async getPaymentReceipt(transactionId: string): Promise<any> {
    try {
      logger.info('PaymentService', `Buscando recibo ${transactionId}`);
      const response = await apiClient.get(`/payments/receipts/${transactionId}`);
      return response.data?.receipt;
    } catch (error) {
      logger.error('PaymentService', 'Erro ao buscar recibo', error as Error);
      throw error;
    }
  }

  async getPaymentHistory(limit = 50, offset = 0): Promise<any[]> {
    try {
      logger.info('PaymentService', 'Buscando histórico de pagamentos');
      const response = await apiClient.get('/payments/history', {
        params: { limit, offset },
      });
      return response.data?.payments || [];
    } catch (error) {
      logger.error('PaymentService', 'Erro ao buscar histórico de pagamentos', error as Error);
      throw error;
    }
  }

  async processRefund(transactionId: string, reason: string): Promise<void> {
    try {
      logger.info('PaymentService', `Processando reembolso para ${transactionId}`);
      await apiClient.post(`/payments/refund/${transactionId}`, { reason });
    } catch (error) {
      logger.error('PaymentService', 'Erro ao processar reembolso', error as Error);
      throw error;
    }
  }

  async estimatePaymentFee(amount: number, method: PaymentMethod): Promise<number> {
    try {
      const response = await apiClient.get('/payments/estimate-fee', {
        params: { amount, method },
      });
      return response.data?.fee || 0;
    } catch {
      return 0;
    }
  }
}

export default new PaymentService();
