import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/utils/logger';

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

  async getRideCategories(): Promise<RideCategory[]> {
    const cacheKey = 'ride_categories';

    try {
      // Check cache first
      const cached = this.getCachedData<RideCategory[]>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Ride categories from cache', { count: cached.length });
        return cached;
      }

      // Try backend
      const response = await apiClient.get<RideCategory[]>('/config/ride-categories', {
        timeout: 5000,
      });

      this.setCachedData(cacheKey, response.data);
      logger.info('CONFIG', 'Ride categories from backend', { count: response.data.length });

      return response.data;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch ride categories, using fallback', error);
      return this.fallbacks.rideCategories;
    }
  }

  async getDeliveryTypes(): Promise<DeliveryType[]> {
    const cacheKey = 'delivery_types';

    try {
      const cached = this.getCachedData<DeliveryType[]>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Delivery types from cache', { count: cached.length });
        return cached;
      }

      const response = await apiClient.get<DeliveryType[]>('/config/delivery-types', {
        timeout: 5000,
      });

      this.setCachedData(cacheKey, response.data);
      logger.info('CONFIG', 'Delivery types from backend', { count: response.data.length });

      return response.data;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch delivery types, using fallback', error);
      return this.fallbacks.deliveryTypes;
    }
  }

  async getDeliveryVehicles(): Promise<DeliveryVehicle[]> {
    const cacheKey = 'delivery_vehicles';

    try {
      const cached = this.getCachedData<DeliveryVehicle[]>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Delivery vehicles from cache', { count: cached.length });
        return cached;
      }

      const response = await apiClient.get<DeliveryVehicle[]>('/config/delivery-vehicles', {
        timeout: 5000,
      });

      this.setCachedData(cacheKey, response.data);
      logger.info('CONFIG', 'Delivery vehicles from backend', { count: response.data.length });

      return response.data;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch delivery vehicles, using fallback', error);
      return this.fallbacks.deliveryVehicles;
    }
  }

  async getCancelReasons(category?: 'driver' | 'client'): Promise<CancelReason[]> {
    const cacheKey = `cancel_reasons_${category || 'all'}`;

    try {
      const cached = this.getCachedData<CancelReason[]>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Cancel reasons from cache', { count: cached.length, category });
        return cached;
      }

      const url = category
        ? `/config/cancel-reasons?category=${category}`
        : '/config/cancel-reasons';

      const response = await apiClient.get<CancelReason[]>(url, {
        timeout: 5000,
      });

      this.setCachedData(cacheKey, response.data);
      logger.info('CONFIG', 'Cancel reasons from backend', { count: response.data.length });

      return response.data;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch cancel reasons, using fallback', error);
      return this.fallbacks.cancelReasons;
    }
  }

  async getDepositConfig(): Promise<DriverDepositConfig> {
    const cacheKey = 'deposit_config';

    try {
      const cached = this.getCachedData<DriverDepositConfig>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Deposit config from cache');
        return cached;
      }

      const response = await apiClient.get<any>('/config/deposit-config', {
        timeout: 5000,
      });

      // Transform backend response to frontend format
      const depositArray = response.data?.data || [];
      const config: DriverDepositConfig = {
        minDeposit: 5,
        maxDeposit: 1000,
        presets: depositArray.map((item: any) => item.amount || item),
        currency: 'BRL',
        deductionPercentage: 15,
      };

      this.setCachedData(cacheKey, config);
      logger.info('CONFIG', 'Deposit config from backend', {
        presets: config.presets,
        deduction: config.deductionPercentage,
      });

      return config;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch deposit config, using fallback', error);
      return this.fallbacks.depositConfig;
    }
  }

  async getRideSettings(): Promise<RideSettings> {
    const cacheKey = 'ride_settings';

    try {
      const cached = this.getCachedData<RideSettings>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Ride settings from cache');
        return cached;
      }

      const response = await apiClient.get<RideSettings>('/config/ride-settings', {
        timeout: 5000,
      });

      this.setCachedData(cacheKey, response.data);
      logger.info('CONFIG', 'Ride settings from backend', {
        searchTimeout: response.data.searchTimeout,
        redispatchInterval: response.data.queueRedispatchInterval,
      });

      return response.data;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch ride settings, using fallback', error);
      return this.fallbacks.rideSettings;
    }
  }

  async getSupportChannels(): Promise<SupportChannels> {
    const cacheKey = 'support_channels';

    try {
      const cached = this.getCachedData<SupportChannels>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Support channels from cache');
        return cached;
      }

      const response = await apiClient.get<any>('/config/support-channels', {
        timeout: 5000,
      });

      const config: SupportChannels = response.data?.data || this.fallbacks.supportChannels;
      this.setCachedData(cacheKey, config);
      logger.info('CONFIG', 'Support channels from backend', config);

      return config;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch support channels, using fallback', error);
      return this.fallbacks.supportChannels;
    }
  }

  async getPolicyVersions(): Promise<PolicyVersions> {
    const cacheKey = 'policy_versions';

    try {
      const cached = this.getCachedData<PolicyVersions>(cacheKey);
      if (cached) {
        logger.info('CONFIG', 'Policy versions from cache');
        return cached;
      }

      const response = await apiClient.get<any>('/config/policy-versions', {
        timeout: 5000,
      });

      const config: PolicyVersions = response.data?.data || this.fallbacks.policyVersions;
      this.setCachedData(cacheKey, config);
      logger.info('CONFIG', 'Policy versions from backend', config);

      return config;
    } catch (error) {
      logger.warn('CONFIG', 'Failed to fetch policy versions, using fallback', error);
      return this.fallbacks.policyVersions;
    }
  }

  // Utility: Clear cache for a specific key or all
  clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      logger.info('CONFIG', 'Cache cleared for key', { key });
    } else {
      this.cache.clear();
      logger.info('CONFIG', 'All cache cleared');
    }
  }

  // Utility: Get deduction percentage for balance calculations
  async getDeductionPercentage(): Promise<number> {
    const config = await this.getDepositConfig();
    // deductionPercentage is already stored as a percentage (20), so divide by 100 to get decimal
    return config.deductionPercentage / 100;
  }

  // Utility: Validate deposit amount
  async validateDepositAmount(amount: number): Promise<boolean> {
    const config = await this.getDepositConfig();
    return amount >= config.minDeposit && amount <= config.maxDeposit;
  }

  // Fetch full platform config including isDevelopmentMode
  async getFullConfig(): Promise<any> {
    const res = await apiClient.get<any>("/config/all");
    return res.data?.data || res.data;
  }

  // Update platform config
  async updateConfig(payload: any): Promise<any> {
    const res = await apiClient.put<any>("/config/update", payload);
    return res.data?.data || res.data;
  }
}

export default new ConfigService();
