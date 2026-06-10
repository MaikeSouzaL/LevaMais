import apiClient from './api';
import { logger } from '@/utils/logger';
import configService from '@/services/config.service';
import depositService from '@/services/deposit.service';
import { supabase } from '../lib/supabase';
import { requireUserId } from './supabase-auth.service';

export interface DriverBalance {
  id: string;
  driverId: string;
  balance: number;
  totalDeposits: number;
  totalDeductions: number;
  lastUpdated: string;
}

export interface DriverDeposit {
  id: string;
  driverId: string;
  amount: number;
  method: 'credit_card' | 'pix' | 'bank_transfer';
  status: 'pending' | 'confirmed' | 'failed';
  createdAt: string;
}

export interface BalanceTransaction {
  id: string;
  type: 'deposit' | 'deduction' | 'withdrawal' | 'driver_topup' | 'app_fee_debit';
  amount: number;
  reason?: string;
  rideId?: string;
  createdAt: string;
  status?: string;
}

export interface DriverPreferences {
  serviceTypes: Array<'ride' | 'delivery'>;
  selectedVehicles: Array<'motorcycle' | 'car' | 'van' | 'truck'>;
  searchRadiusKm: number;
  autoAccept: boolean;
  acceptsCardMachine?: boolean;
  acceptsCash?: boolean;
  acceptsPix?: boolean;
}

export type RideCategoryKey = 'moto' | 'car_economy' | 'car_comfort' | 'car_luxury';

export interface DriverVehicle {
  _id: string;
  type: 'motorcycle' | 'car' | 'van' | 'truck';
  plate: string;
  model: string;
  color?: string;
  year?: number;
  renavam?: string;
  rideCategory?: RideCategoryKey | null;
  documents?: {
    crlvFront?: string;
    crlvBack?: string;
    vehiclePhoto?: string;
    submittedAt?: string;
  };
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

class DriverService {
  // Get current balance
  async getBalance(): Promise<DriverBalance> {
    try {
      const userId = await requireUserId();
      const { data: details, error } = await supabase
        .from("driver_details")
        .select("balance, total_earnings, total_withdrawn")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      const balance: DriverBalance = {
        id: userId,
        driverId: userId,
        balance: Number(details?.balance || 0),
        totalDeposits: Number(details?.total_earnings || 0),
        totalDeductions: Number(details?.total_withdrawn || 0),
        lastUpdated: new Date().toISOString(),
      };
      
      logger.info('DRIVER_SERVICE', 'Balance fetched', {
        balance: balance.balance,
        totalDeposits: balance.totalDeposits,
      });
      return balance;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch balance', error);
      throw error;
    }
  }

  // Add deposit
  async addDeposit(amount: number, method: 'credit_card' | 'pix' = 'pix'): Promise<DriverDeposit> {
    try {
      const userId = await requireUserId();
      const isValid = await configService.validateDepositAmount(amount);
      if (!isValid) {
        throw new Error('Invalid deposit amount');
      }

      if (method !== 'pix') {
        throw new Error('Depósitos do motorista usam PIX ou boleto via gateway de pagamento.');
      }

      // Buscar saldo atual do motorista
      const { data: details, error: detailsError } = await supabase
        .from("driver_details")
        .select("balance, total_earnings")
        .eq("id", userId)
        .maybeSingle();

      if (detailsError) throw detailsError;

      const currentBalance = Number(details?.balance || 0);
      const currentEarnings = Number(details?.total_earnings || 0);

      // Atualizar saldo do motorista
      const { error: updateError } = await supabase
        .from("driver_details")
        .update({
          balance: currentBalance + amount,
          total_earnings: currentEarnings + amount,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Inserir transação
      const { data: tx, error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          type: "driver_topup",
          amount: amount,
          description: "Depósito PIX (Motorista)",
          status: "completed",
        })
        .select()
        .single();

      if (txError) throw txError;

      logger.info('DRIVER_SERVICE', 'Deposit created', {
        amount: amount,
        status: 'confirmed',
      });

      return {
        id: tx.id,
        driverId: userId,
        amount,
        method,
        status: 'confirmed',
        createdAt: tx.created_at,
      };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to add deposit', error);
      throw error;
    }
  }

  // Deduct balance (when ride is completed)
  async deductBalance(amount: number, rideId: string): Promise<DriverBalance> {
    try {
      const userId = await requireUserId();

      // Buscar saldo atual e deduções do motorista
      const { data: details, error: detailsError } = await supabase
        .from("driver_details")
        .select("balance, total_earnings, total_withdrawn")
        .eq("id", userId)
        .maybeSingle();

      if (detailsError) throw detailsError;

      const currentBalance = Number(details?.balance || 0);
      const currentDeductions = Number(details?.total_withdrawn || 0);

      // Atualizar saldo e deduções
      const { error: updateError } = await supabase
        .from("driver_details")
        .update({
          balance: currentBalance - amount,
          total_withdrawn: currentDeductions + amount,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // Inserir transação
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          type: "deduction",
          amount: amount,
          description: `Desconto de taxa - Corrida ${rideId}`,
          reference_id: rideId,
          status: "completed",
        });

      if (txError) throw txError;

      const balance: DriverBalance = {
        id: userId,
        driverId: userId,
        balance: currentBalance - amount,
        totalDeposits: Number(details?.total_earnings || 0),
        totalDeductions: currentDeductions + amount,
        lastUpdated: new Date().toISOString(),
      };

      logger.info('DRIVER_SERVICE', 'Balance deducted', {
        amount,
        newBalance: balance.balance,
        rideId,
      });

      return balance;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to deduct balance', error);
      throw error;
    }
  }

  // Get balance history/transactions
  async getBalanceHistory(limit: number = 50): Promise<BalanceTransaction[]> {
    try {
      const userId = await requireUserId();

      const { data: transactions, error } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) throw error;

      const normalized: BalanceTransaction[] = (transactions || []).map((item) => ({
        id: item.id,
        type: (item.type === "topup" || item.type === "driver_topup" ? "deposit" : item.type === "withdrawal" ? "withdrawal" : item.type) as any,
        amount: Number(item.amount || 0),
        reason: item.description || '',
        rideId: item.reference_id || undefined,
        createdAt: item.created_at,
        status: item.status || 'completed',
      }));

      logger.info('DRIVER_SERVICE', 'Balance history fetched', {
        count: normalized.length,
      });
      return normalized;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch balance history', error);
      return [];
    }
  }

  // Check if driver can accept a ride (has sufficient balance)
  async canAcceptRide(rideValue: number): Promise<boolean> {
    try {
      const balance = await this.getBalance();
      const configResponse = await apiClient.get('/config/ride-settings').catch(() => null);
      const appFeePct = (configResponse?.data?.config?.appFeePercentage || 15) / 100;
      const canAccept = balance.balance >= rideValue * appFeePct;

      logger.info('DRIVER_SERVICE', 'Ride acceptance check', {
        rideValue,
        canAccept,
        currentBalance: balance.balance,
      });

      return canAccept;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Error checking ride acceptance', error);
      return false;
    }
  }

  // Go online (requires approval, docs, vehicle, balance)
  async goOnline(): Promise<{ success: boolean; message?: string; error?: string; appFeePercentage?: number }> {
    try {
      const response = await apiClient.post<any>('/drivers/go-online');

      logger.info('DRIVER_SERVICE', 'Driver went online');
      return {
        success: response.data?.success || true,
        message: response.data?.message,
        appFeePercentage: response.data?.appFeePercentage,
      };
    } catch (error: any) {
      const status = error.response?.status;
      if (status === 400 || status === 403) {
        logger.warn('DRIVER_SERVICE', 'Failed to go online due to validation error', {
          status,
          error: error.response?.data?.error || error.message
        });
      } else {
        logger.error('DRIVER_SERVICE', 'Failed to go online due to system error', error);
      }
      return {
        success: false,
        error: error.response?.data?.error || 'Voce precisa ter cadastro aprovado, documentos enviados e saldo positivo.',
        message: error.response?.data?.message,
      };
    }
  }

  // Go offline
  async goOffline(): Promise<{ success: boolean }> {
    try {
      const response = await apiClient.post<{ success: boolean }>('/drivers/go-offline');

      logger.info('DRIVER_SERVICE', 'Driver went offline');
      return response.data;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to go offline', error);
      throw error;
    }
  }

  // Calculate deduction amount for a ride
  async calculateDeduction(rideValue: number): Promise<number> {
    try {
      const configResponse = await apiClient.get('/config/ride-settings').catch(() => null);
      const appFeePct = (configResponse?.data?.config?.appFeePercentage || 15) / 100;
      return rideValue * appFeePct;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to calculate deduction', error);
      return rideValue * 0.15;
    }
  }

  // Get deposit history
  async getDepositHistory(limit: number = 20): Promise<DriverDeposit[]> {
    try {
      const history = await this.getBalanceHistory(Math.max(limit, 1) * 3);
      const deposits = history
        .filter((item) => item.type === 'deposit')
        .slice(0, limit)
        .map((item) => ({
          status: (item.status === 'failed'
            ? 'failed'
            : item.status === 'pending'
            ? 'pending'
            : 'confirmed') as DriverDeposit['status'],
          id: item.id,
          driverId: '',
          amount: Number(item.amount || 0),
          method: 'pix' as const,
          createdAt: item.createdAt,
        }));

      logger.info('DRIVER_SERVICE', 'Deposit history fetched', {
        count: deposits.length,
      });
      return deposits;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch deposit history', error);
      return [];
    }
  }

  // Request withdrawal
  async requestWithdrawal(amount: number, pixKey: string): Promise<any> {
    try {
      const userId = await requireUserId();

      // 1. Check current driver balance
      const { data: details, error: detailsError } = await supabase
        .from("driver_details")
        .select("balance, total_withdrawn")
        .eq("id", userId)
        .maybeSingle();

      if (detailsError) throw detailsError;

      const currentBalance = Number(details?.balance || 0);
      if (currentBalance < amount) {
        throw new Error("Saldo insuficiente");
      }

      // 2. Deduct balance in driver_details
      const currentWithdrawn = Number(details?.total_withdrawn || 0);
      const { error: updateError } = await supabase
        .from("driver_details")
        .update({
          balance: currentBalance - amount,
          total_withdrawn: currentWithdrawn + amount,
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // 3. Create withdrawal request
      const { data: wRequest, error: wError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: userId,
          amount,
          pix_key: pixKey,
          pix_key_type: "random", // default key type fallback
          status: "pending",
        })
        .select()
        .single();

      if (wError) throw wError;

      // 4. Create ledger transaction record
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          type: "withdrawal",
          amount,
          description: `Saque via Pix`,
          status: "pending",
        });

      if (txError) throw txError;

      logger.info('DRIVER_SERVICE', 'Withdrawal requested', {
        amount,
      });

      return wRequest;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to request withdrawal', error);
      throw error;
    }
  }

  async updatePreferences(payload: Partial<DriverPreferences>): Promise<DriverPreferences> {
    const response = await apiClient.put('/drivers/preferences', payload);
    return response.data?.data;
  }

  // 🚗 Listar toda a frota de veículos cadastrada pelo motorista
  async listVehicles(): Promise<{ vehicles: DriverVehicle[]; activeVehicleId?: string }> {
    try {
      const response = await apiClient.get<any>('/drivers/vehicles');
      return {
        vehicles: response.data?.vehicles || [],
        activeVehicleId: response.data?.activeVehicleId,
      };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to list vehicles', error);
      throw error;
    }
  }

  // 📝 Adicionar novo veículo para a análise da administração
  async addVehicle(payload: {
    type: 'motorcycle' | 'car' | 'van' | 'truck';
    plate: string;
    model: string;
    color?: string;
    year?: number;
    renavam?: string;
    rideCategory?: 'car_economy' | 'car_comfort' | 'car_luxury';
    documents?: any;
  }): Promise<DriverVehicle> {
    try {
      const response = await apiClient.post<any>('/drivers/vehicles', payload);
      return response.data?.vehicle;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to add vehicle', error);
      throw error;
    }
  }

  // 📸 Enviar documentos do veículo (CRLV Frente, Verso e Foto do Veículo)
  async uploadVehicleDocuments(vehicleId: string, formData: FormData): Promise<any> {
    try {
      const response = await apiClient.post<any>(`/drivers/vehicles/${vehicleId}/documents`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to upload vehicle documents', error);
      throw error;
    }
  }

  // ⚡️ Definir veículo aprovado como o veículo ativo no momento
  async activateVehicle(id: string): Promise<any> {
    try {
      const response = await apiClient.patch<any>(`/drivers/vehicles/${id}/activate`);
      return response.data;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to activate vehicle', error);
      throw error;
    }
  }

  async setVehicleRideCategory(
    id: string,
    rideCategory: 'car_economy' | 'car_comfort' | 'car_luxury',
  ): Promise<any> {
    try {
      const response = await apiClient.patch<any>(`/drivers/vehicles/${id}/ride-category`, { rideCategory });
      return response.data;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to set vehicle ride category', error);
      throw error;
    }
  }
}

export default new DriverService();
