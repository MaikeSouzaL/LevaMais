import apiClient from './api';
import { logger } from '@/utils/logger';
import configService from '@/services/config.service';

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
  type: 'deposit' | 'deduction' | 'withdrawal';
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
}

export interface DriverVehicle {
  _id: string;
  type: 'motorcycle' | 'car' | 'van' | 'truck';
  plate: string;
  model: string;
  color?: string;
  year?: number;
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
      const response = await apiClient.get<any>('/drivers/balance');
      const data = response.data?.data || response.data;
      
      const balance: DriverBalance = {
        id: '',
        driverId: '',
        balance: data.balance || 0,
        totalDeposits: data.totalDeposits || 0,
        totalDeductions: data.totalDeductions || 0,
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
  async addDeposit(amount: number, method: 'credit_card' | 'pix' = 'credit_card'): Promise<DriverDeposit> {
    try {
      // Validate amount against config
      const isValid = await configService.validateDepositAmount(amount);
      if (!isValid) {
        throw new Error('Invalid deposit amount');
      }

      const response = await apiClient.post<any>('/drivers/balance/deposit', {
        amount,
        method,
      });

      logger.info('DRIVER_SERVICE', 'Deposit created', {
        amount: amount,
        status: 'completed',
      });

      return {
        id: '',
        driverId: '',
        amount,
        method,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to add deposit', error);
      throw error;
    }
  }

  // Deduct balance (when ride is completed)
  async deductBalance(amount: number, rideId: string): Promise<DriverBalance> {
    try {
      const response = await apiClient.post<any>('/drivers/balance/deduct', {
        amount,
        rideId,
      });

      const data = response.data?.data || response.data;
      const balance: DriverBalance = {
        id: '',
        driverId: '',
        balance: data.balance || 0,
        totalDeposits: data.totalDeposits || 0,
        totalDeductions: data.totalDeductions || 0,
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
      const response = await apiClient.get<any>('/drivers/balance/history', {
        params: { limit },
      });
      const items = Array.isArray(response.data?.data) ? response.data.data : [];

      const normalized: BalanceTransaction[] = items.map((item: any) => ({
        id: String(item?.id || ''),
        type: item?.type,
        amount: Number(item?.amount || 0),
        reason: item?.reason || '',
        rideId: item?.rideId ? String(item.rideId) : undefined,
        createdAt: item?.createdAt || new Date().toISOString(),
        status: item?.status,
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
      const response = await apiClient.post<any>('/drivers/check-ride-availability', {
        rideValue,
      });

      const canAccept = response.data?.canAccept || false;

      logger.info('DRIVER_SERVICE', 'Ride acceptance check', {
        rideValue,
        canAccept,
        currentBalance: response.data?.currentBalance,
      });

      return canAccept;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Error checking ride acceptance', error);
      // Fallback: try to get balance directly
      try {
        const balance = await this.getBalance();
        return balance.balance >= rideValue * 0.2; // Need 20% of ride value
      } catch {
        return false;
      }
    }
  }

  // Go online (requires balance check)
  async goOnline(): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await apiClient.post<any>('/drivers/go-online');

      logger.info('DRIVER_SERVICE', 'Driver went online');
      return { success: response.data?.success || true };
    } catch (error: any) {
      logger.error('DRIVER_SERVICE', 'Failed to go online', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Você precisa de saldo para ficar online. Faça um depósito.',
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
      const deductionPercent = await configService.getDeductionPercentage();
      const deductionAmount = rideValue * deductionPercent;

      logger.info('DRIVER_SERVICE', 'Deduction calculated', {
        rideValue,
        deductionPercent: deductionPercent * 100,
        deductionAmount,
      });

      return deductionAmount;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to calculate deduction', error);
      // Fallback to 20%
      return rideValue * 0.2;
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
          // map wallet-ledger status to DriverDeposit contract
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
      const response = await apiClient.post('/drivers/balance/withdrawal-request', {
        amount,
        pixKey,
      });

      logger.info('DRIVER_SERVICE', 'Withdrawal requested', {
        amount,
      });

      return response.data;
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
}

export default new DriverService();
