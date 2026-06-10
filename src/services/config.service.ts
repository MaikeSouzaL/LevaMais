import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';
import { supabase } from '../lib/supabase';

export interface RideCategory {
  id: string;
  name: string;
  minPassengers: number;
  maxPassengers: number;
  icon?: string;
  basePrice?: number;
  costPerKm?: number;
}

export interface DeliveryType {
  id: string;
  name: string;
  maxWeight: number;
  icon?: string;
}

export interface DeliveryVehicle {
  id: string;
  name: string;
  maxWeight: number;
  costPerKm: number;
  icon?: string;
}

export interface CancelReason {
  id: string;
  label: string;
  category: 'driver' | 'client' | 'system';
}

export interface DriverDepositConfig {
  minDeposit: number;
  maxDeposit: number;
  presets: number[];
  currency: string;
  deductionPercentage: number;
}

export interface RideSettings {
  searchTimeout: number;
  queueRedispatchInterval: number;
  maxQueueRetries: number;
  minValueMultiplier: number;
}

export interface SupportChannels {
  phone: string;
  email: string;
  whatsapp: string;
  helpCenterUrl?: string;
}

export interface PolicyVersions {
  consentVersion: string;
  termsVersion: string;
  privacyPolicyVersion: string;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class ConfigService {
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes
  private cache: Map<string, CacheEntry<any>> = new Map();

  // Fallback values if backend is unavailable
  private fallbacks = {
    rideCategories: [
      { id: 'standard', name: 'Standard', minPassengers: 1, maxPassengers: 4, icon: 'car', basePrice: 5, costPerKm: 2 },
      { id: 'comfort', name: 'Comfort', minPassengers: 1, maxPassengers: 4, icon: 'crown', basePrice: 8, costPerKm: 2.5 },
      { id: 'premium', name: 'Premium', minPassengers: 1, maxPassengers: 4, icon: 'star', basePrice: 12, costPerKm: 3 },
    ],
    deliveryTypes: [
      { id: 'envelope', name: 'Envelope', maxWeight: 0.5, icon: 'mail' },
      { id: 'small_box', name: 'Caixa Pequena', maxWeight: 5, icon: 'package' },
      { id: 'medium_box', name: 'Caixa Média', maxWeight: 15, icon: 'package' },
      { id: 'large_box', name: 'Caixa Grande', maxWeight: 30, icon: 'package' },
    ],
    deliveryVehicles: [
      { id: 'motorcycle', name: 'Moto', maxWeight: 5, costPerKm: 1.0, icon: 'scooter' },
      { id: 'car', name: 'Carro', maxWeight: 30, costPerKm: 2.0, icon: 'car' },
      { id: 'van', name: 'Van', maxWeight: 800, costPerKm: 3.5, icon: 'van' },
      { id: 'truck', name: 'Caminhão', maxWeight: 3000, costPerKm: 5.0, icon: 'truck' },
    ],
    cancelReasons: [
      { id: 'not_found', label: 'Endereço não encontrado', category: 'driver' as const },
      { id: 'far', label: 'Distância muito grande', category: 'driver' as const },
      { id: 'no_driver', label: 'Nenhum motorista disponível', category: 'system' as const },
      { id: 'timeout', label: 'Tempo de espera excedido', category: 'system' as const },
      { id: 'client_request', label: 'Cancelado pelo cliente', category: 'client' as const },
      { id: 'other', label: 'Outro motivo', category: 'client' as const },
    ],
    depositConfig: {
      minDeposit: 5,
      maxDeposit: 1000,
      presets: [5, 10, 15, 20, 50, 100],
      currency: 'BRL',
      deductionPercentage: 15,
    },
    rideSettings: {
      searchTimeout: 300, // 5 minutes in seconds
      queueRedispatchInterval: 60, // 1 minute in seconds
      maxQueueRetries: 3,
      minValueMultiplier: 1.0,
    },
    supportChannels: {
      phone: '0800123456',
      email: 'suporte@levamais.app',
      whatsapp: '5500000000000',
      helpCenterUrl: '',
    },
    policyVersions: {
      consentVersion: '2026-05-14',
      termsVersion: '2026-05-14',
      privacyPolicyVersion: '2026-05-14',
    },
  };

  private isCached(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    const isExpired = Date.now() - entry.timestamp > this.cacheTimeout;
    if (isExpired) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  private getCachedData<T>(key: string): T | null {
    if (!this.isCached(key)) return null;
    return this.cache.get(key)?.data || null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async getGlobalConfigFromDb(): Promise<any> {
    try {
      const { data, error } = await supabase
        .from("platform_config")
        .select("*")
        .eq("key", "global_config")
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") return {};
        throw error;
      }
      return data?.value || {};
    } catch (err) {
      logger.warn('CONFIG', 'Failed to fetch platform config from DB', err);
      return {};
    }
  }

  async getRideCategories(): Promise<RideCategory[]> {
    const cacheKey = 'ride_categories';

    try {
      const cached = this.getCachedData<RideCategory[]>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      let categories = this.fallbacks.rideCategories;
      if (config?.vehiclePricing) {
        categories = Object.entries(config.vehiclePricing).map(([id, val]: any) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          minPassengers: 1,
          maxPassengers: 4,
          icon: id === 'motorcycle' ? 'scooter' : 'car',
          basePrice: val.minimumFee || 5,
          costPerKm: val.pricePerKm || 2,
        }));
      }

      this.setCachedData(cacheKey, categories);
      return categories;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch ride categories, using fallback', error);
      return this.fallbacks.rideCategories;
    }
  }

  async getDeliveryTypes(): Promise<DeliveryType[]> {
    return this.fallbacks.deliveryTypes;
  }

  async getDeliveryVehicles(): Promise<DeliveryVehicle[]> {
    const cacheKey = 'delivery_vehicles';

    try {
      const cached = this.getCachedData<DeliveryVehicle[]>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      let vehicles = this.fallbacks.deliveryVehicles;
      if (config?.vehiclePricing) {
        vehicles = Object.entries(config.vehiclePricing).map(([id, val]: any) => ({
          id,
          name: id.charAt(0).toUpperCase() + id.slice(1),
          maxWeight: id === 'motorcycle' ? 5 : id === 'car' ? 30 : id === 'van' ? 800 : 3000,
          costPerKm: val.pricePerKm || 2.0,
          icon: id === 'motorcycle' ? 'scooter' : 'car',
        }));
      }

      this.setCachedData(cacheKey, vehicles);
      return vehicles;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch delivery vehicles, using fallback', error);
      return this.fallbacks.deliveryVehicles;
    }
  }

  async getCancelReasons(category?: 'driver' | 'client'): Promise<CancelReason[]> {
    const reasons = this.fallbacks.cancelReasons;
    if (category) {
      return reasons.filter((r) => r.category === category);
    }
    return reasons;
  }

  async getDepositConfig(): Promise<DriverDepositConfig> {
    const cacheKey = 'deposit_config';

    try {
      const cached = this.getCachedData<DriverDepositConfig>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      const appFee = Number(config?.appFeePercentage || 15);
      const res: DriverDepositConfig = {
        minDeposit: 5,
        maxDeposit: 1000,
        presets: [5, 10, 15, 20, 50, 100],
        currency: 'BRL',
        deductionPercentage: appFee,
      };

      this.setCachedData(cacheKey, res);
      return res;
    } catch {
      return this.fallbacks.depositConfig;
    }
  }

  async getRideSettings(): Promise<RideSettings> {
    const cacheKey = 'ride_settings';

    try {
      const cached = this.getCachedData<RideSettings>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      const res: RideSettings = {
        searchTimeout: Number(config?.rideSearchTimeoutSeconds || 60),
        queueRedispatchInterval: 60,
        maxQueueRetries: 3,
        minValueMultiplier: 1.0,
      };

      this.setCachedData(cacheKey, res);
      return res;
    } catch {
      return this.fallbacks.rideSettings;
    }
  }

  async getSupportChannels(): Promise<SupportChannels> {
    const cacheKey = 'support_channels';

    try {
      const cached = this.getCachedData<SupportChannels>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      const channels: SupportChannels = {
        phone: config?.supportChannels?.phone || this.fallbacks.supportChannels.phone,
        email: config?.supportChannels?.email || this.fallbacks.supportChannels.email,
        whatsapp: config?.supportChannels?.whatsapp || this.fallbacks.supportChannels.whatsapp,
        helpCenterUrl: config?.supportChannels?.helpCenterUrl || '',
      };

      this.setCachedData(cacheKey, channels);
      return channels;
    } catch {
      return this.fallbacks.supportChannels;
    }
  }

  async getPolicyVersions(): Promise<PolicyVersions> {
    const cacheKey = 'policy_versions';

    try {
      const cached = this.getCachedData<PolicyVersions>(cacheKey);
      if (cached) return cached;

      const config = await this.getGlobalConfigFromDb();
      const versions: PolicyVersions = {
        consentVersion: config?.policyVersions?.consentVersion || this.fallbacks.policyVersions.consentVersion,
        termsVersion: config?.policyVersions?.termsVersion || this.fallbacks.policyVersions.termsVersion,
        privacyPolicyVersion: config?.policyVersions?.privacyPolicyVersion || this.fallbacks.policyVersions.privacyPolicyVersion,
      };

      this.setCachedData(cacheKey, versions);
      return versions;
    } catch {
      return this.fallbacks.policyVersions;
    }
  }

  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      logger.info('CONFIG', 'Cache cleared for key', { key });
    } else {
      this.cache.clear();
      logger.info('CONFIG', 'All cache cleared');
    }
  }

  async getDeductionPercentage(): Promise<number> {
    const config = await this.getDepositConfig();
    return config.deductionPercentage / 100;
  }

  async validateDepositAmount(amount: number): Promise<boolean> {
    const config = await this.getDepositConfig();
    return amount >= config.minDeposit && amount <= config.maxDeposit;
  }

  async getFullConfig(): Promise<any> {
    return this.getGlobalConfigFromDb();
  }

  async updateConfig(payload: any): Promise<any> {
    const current = await this.getGlobalConfigFromDb();
    const updated = { ...current, ...payload };
    const { error } = await supabase
      .from("platform_config")
      .upsert({
        key: "global_config",
        value: updated,
      });

    if (error) throw error;
    this.clearCache();
    return updated;
  }
}

export default new ConfigService();
