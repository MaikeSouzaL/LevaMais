import { logger } from '@/utils/logger';
import configService from '@/services/config.service';
import { supabase } from '../lib/supabase';
import { requireUserId } from './supabase-auth.service';
import pricingService from './pricing.service';

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
  /** Saldo via profiles.wallet_balance (mesma carteira usada pelos RPCs). */
  async getBalance(): Promise<DriverBalance> {
    try {
      const userId = await requireUserId();

      const [profileRes, txRes] = await Promise.all([
        supabase.from("profiles").select("wallet_balance").eq("id", userId).maybeSingle(),
        supabase.from("wallet_transactions").select("amount, type").eq("user_id", userId),
      ]);

      if (profileRes.error) throw profileRes.error;

      const transactions = txRes.data || [];
      const totalDeposits = transactions
        .filter((t) => Number(t.amount) > 0)
        .reduce((s, t) => s + Number(t.amount), 0);
      const totalDeductions = transactions
        .filter((t) => Number(t.amount) < 0)
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);


      return {
        id: userId,
        driverId: userId,
        balance: Number(profileRes.data?.wallet_balance ?? 0),
        totalDeposits,
        totalDeductions,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch balance', error);
      throw error;
    }
  }

  /** Deposita via rpc_deposit (atualiza profiles.wallet_balance atomicamente). */
  async addDeposit(amount: number, method: 'credit_card' | 'pix' = 'pix'): Promise<DriverDeposit> {
    try {
      const userId = await requireUserId();
      const isValid = await configService.validateDepositAmount(amount);
      if (!isValid) throw new Error('Valor de depósito inválido');

      const { error } = await supabase.rpc('rpc_deposit', {
        p_amount: amount,
        p_reference: null,
      });
      if (error) throw error;

      logger.info('DRIVER_SERVICE', 'Deposit created via rpc_deposit', { amount });

      return {
        id: `${userId}-${Date.now()}`,
        driverId: userId,
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

  /** @deprecated Use rpc_settle_ride ao concluir corrida. */
  async deductBalance(amount: number, rideId: string): Promise<DriverBalance> {
    logger.warn('DRIVER_SERVICE', 'deductBalance is deprecated — use rpc_settle_ride(rideId) instead', { rideId });
    return this.getBalance();
  }

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

      return (transactions || []).map((item) => ({
        id: item.id,
        type: (
          item.type === "deposit" || item.type === "driver_topup"
            ? "deposit"
            : item.type === "withdrawal"
            ? "withdrawal"
            : item.type === "app_fee_debit"
            ? "app_fee_debit"
            : item.type
        ) as BalanceTransaction["type"],
        amount: Number(item.amount ?? 0),
        reason: item.description || '',
        rideId: item.reference_id || undefined,
        createdAt: item.created_at,
        status: item.status || 'confirmed',
      }));
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch balance history', error);
      return [];
    }
  }

  /** Verifica se motorista tem saldo para cobrir a taxa da corrida. */
  async canAcceptRide(rideValue: number): Promise<boolean> {
    try {
      const [balance, config] = await Promise.all([
        this.getBalance(),
        pricingService.getConfig(),
      ]);
      return balance.balance >= rideValue * (config.appFeePercentage / 100);
    } catch {
      return false;
    }
  }

  /**
   * Gating para ir online:
   * 1. driver_details.status === 'approved'
   * 2. rpc_driver_can_work() verifica saldo mínimo
   */
  async goOnline(): Promise<{ success: boolean; message?: string; error?: string; appFeePercentage?: number }> {
    try {
      const userId = await requireUserId();

      const { data: details, error: detailsError } = await supabase
        .from("driver_details")
        .select("status")
        .eq("id", userId)
        .maybeSingle();

      if (detailsError) throw detailsError;

      if (!details || details.status !== "approved") {
        return {
          success: false,
          error: "Cadastro não aprovado. Complete seu perfil e aguarde a aprovação.",
        };
      }

      const { data: canWorkData, error: rpcError } = await supabase.rpc("rpc_driver_can_work");
      if (rpcError) throw rpcError;

      const canWork = canWorkData?.canWork ?? canWorkData;
      if (!canWork) {
        const minBal = canWorkData?.minBalance ?? 5;
        return {
          success: false,
          error: `Saldo insuficiente. Adicione pelo menos R$ ${Number(minBal).toFixed(2).replace('.', ',')} para ficar online.`,
        };
      }

      const config = await pricingService.getConfig();
      return { success: true, appFeePercentage: config.appFeePercentage };
    } catch (error: any) {
      logger.error('DRIVER_SERVICE', 'goOnline failed', error);
      return {
        success: false,
        error: error?.message || "Não foi possível validar sua conta para ficar online.",
      };
    }
  }

  /** Marca motorista como offline em driver_locations. */
  async goOffline(): Promise<{ success: boolean }> {
    try {
      const userId = await requireUserId();
      await supabase
        .from("driver_locations")
        .upsert(
          { id: userId, is_online: false, updated_at: new Date().toISOString() },
          { onConflict: "id" },
        );
      logger.info('DRIVER_SERVICE', 'Driver went offline');
      return { success: true };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to go offline', error);
      throw error;
    }
  }

  async calculateDeduction(rideValue: number): Promise<number> {
    try {
      const config = await pricingService.getConfig();
      return rideValue * (config.appFeePercentage / 100);
    } catch {
      return rideValue * 0.15;
    }
  }

  /** Solicita saque via rpc_request_withdrawal (debita saldo + cria registro pendente). */
  async requestWithdrawal(amount: number, pixKey: string): Promise<any> {
    try {
      const { data, error } = await supabase.rpc('rpc_request_withdrawal', {
        p_amount: amount,
        p_pix_key: pixKey,
        p_pix_key_type: 'random',
      });
      if (error) throw error;
      logger.info('DRIVER_SERVICE', 'Withdrawal requested', { amount });
      return data;
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to request withdrawal', error);
      throw error;
    }
  }

  async getDepositHistory(limit: number = 20): Promise<DriverDeposit[]> {
    try {
      const history = await this.getBalanceHistory(Math.max(limit, 1) * 3);
      return history
        .filter((item) => item.type === 'deposit')
        .slice(0, limit)
        .map((item) => ({
          id: item.id,
          driverId: '',
          amount: Number(item.amount ?? 0),
          method: 'pix' as const,
          status: (item.status === 'failed'
            ? 'failed'
            : item.status === 'pending'
            ? 'pending'
            : 'confirmed') as DriverDeposit['status'],
          createdAt: item.createdAt,
        }));
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to fetch deposit history', error);
      return [];
    }
  }

  /** Atualiza preferências do motorista em driver_details. */
  async updatePreferences(payload: Partial<DriverPreferences>): Promise<DriverPreferences> {
    const userId = await requireUserId();
    const updates: Record<string, any> = {};

    if (payload.serviceTypes !== undefined) updates.service_types = payload.serviceTypes;
    if (payload.searchRadiusKm !== undefined) updates.search_radius_km = payload.searchRadiusKm;
    if (payload.autoAccept !== undefined) updates.auto_accept = payload.autoAccept;
    if (payload.acceptsCardMachine !== undefined) updates.accepts_card = payload.acceptsCardMachine;
    if (payload.acceptsCash !== undefined) updates.accepts_cash = payload.acceptsCash;
    if (payload.acceptsPix !== undefined) updates.accepts_pix = payload.acceptsPix;

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from("driver_details")
        .update(updates)
        .eq("id", userId);
      if (error) throw error;
    }

    return { serviceTypes: [], selectedVehicles: [], searchRadiusKm: 5, autoAccept: false, ...payload };
  }

  /**
   * Retorna o veículo registrado em driver_details.
   * Modelo de veículo único por motorista — não há lista separada de veículos.
   */
  async listVehicles(): Promise<{ vehicles: DriverVehicle[]; activeVehicleId?: string }> {
    try {
      const userId = await requireUserId();
      const { data: details, error } = await supabase
        .from("driver_details")
        .select("vehicle_type, vehicle_plate, vehicle_model, vehicle_color, vehicle_year, crlv_front_url, vehicle_photo_url, status, created_at, updated_at")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      if (!details?.vehicle_plate) return { vehicles: [], activeVehicleId: undefined };

      const vehicle: DriverVehicle = {
        _id: userId,
        type: (details.vehicle_type || "motorcycle") as DriverVehicle["type"],
        plate: details.vehicle_plate,
        model: details.vehicle_model || "",
        color: details.vehicle_color || undefined,
        year: details.vehicle_year || undefined,
        documents: {
          crlvFront: details.crlv_front_url || undefined,
          vehiclePhoto: details.vehicle_photo_url || undefined,
        },
        status: (details.status === "approved" ? "approved" : "pending") as DriverVehicle["status"],
        createdAt: details.created_at,
        updatedAt: details.updated_at,
      };

      return { vehicles: [vehicle], activeVehicleId: userId };
    } catch (error) {
      logger.error('DRIVER_SERVICE', 'Failed to list vehicles', error);
      return { vehicles: [], activeVehicleId: undefined };
    }
  }

  /** No-op: modelo de veículo único — o veículo em driver_details é sempre o ativo. */
  async addVehicle(_payload: any): Promise<DriverVehicle> {
    throw new Error('Use saveDriverVehicle() de supabase-auth.service para cadastrar veículos.');
  }

  /** No-op: modelo de veículo único — não há múltiplos veículos para ativar. */
  async activateVehicle(_id: string): Promise<any> {
    return { success: true };
  }

  /** No-op: coluna ride_category não existe em driver_details ainda. */
  async setVehicleRideCategory(_id: string, _rideCategory: string): Promise<any> {
    return { success: true };
  }

  async uploadVehicleDocuments(_vehicleId: string, _formData: FormData): Promise<any> {
    throw new Error('Use uploadDriverDocument() de supabase-auth.service para enviar documentos.');
  }
}

export default new DriverService();
