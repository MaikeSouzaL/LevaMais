import axios from "axios";

export interface PlatformConfig {
  _id?: string;
  isDevelopmentMode?: boolean;
  requireClientVerification?: boolean;
  surgeEnabled?: boolean;
  geofencingEnabled?: boolean;
  appFeePercentage?: number;
  rideSearchTimeoutSeconds?: number;
  driverDailyGoalRides?: number;
  driverDailyBonusAmount?: number;
  appTimeZone?: string;
  suggestedMinPricePercent?: number;
  vehiclePricing?: {
    motorcycle?: { minimumKm?: number; minimumFee?: number; pricePerKm?: number };
    car?: { minimumKm?: number; minimumFee?: number; pricePerKm?: number };
    van?: { minimumKm?: number; minimumFee?: number; pricePerKm?: number };
    truck?: { minimumKm?: number; minimumFee?: number; pricePerKm?: number };
  };
  logisticsMultipliers?: {
    priorityEconomic?: number;
    priorityFast?: number;
    priorityUrgent?: number;
    cargoSizeSmall?: number;
    cargoSizeMedium?: number;
    cargoSizeLarge?: number;
    fragileSurcharge?: number;
    helperSurcharge?: number;
    weightUpTo5kg?: number;
    weightUpTo15kg?: number;
    weightUpTo30kg?: number;
    weightUpTo50kg?: number;
    weightAbove50kg?: number;
  };
  supportChannels?: {
    phone?: string;
    email?: string;
    whatsapp?: string;
    helpCenterUrl?: string;
  };
  policyVersions?: {
    termsVersion?: string;
    privacyPolicyVersion?: string;
    consentVersion?: string;
  };
}

const STORAGE_KEY = "leva_mais_platform_config";
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

const DEFAULT_CONFIG: PlatformConfig = {
  isDevelopmentMode: true,
  requireClientVerification: false,
  surgeEnabled: false,
  geofencingEnabled: false,
  appFeePercentage: 15,
  rideSearchTimeoutSeconds: 60,
  driverDailyGoalRides: 10,
  driverDailyBonusAmount: 20,
  appTimeZone: "America/Sao_Paulo",
  suggestedMinPricePercent: 0.8,
  vehiclePricing: {
    motorcycle: { minimumKm: 3, minimumFee: 7, pricePerKm: 0.99 },
    car: { minimumKm: 3, minimumFee: 8, pricePerKm: 2.5 },
    van: { minimumKm: 5, minimumFee: 20, pricePerKm: 4 },
    truck: { minimumKm: 5, minimumFee: 35, pricePerKm: 6 },
  },
  logisticsMultipliers: {
    priorityEconomic: 1.0,
    priorityFast: 1.3,
    priorityUrgent: 1.8,
    cargoSizeSmall: 1.0,
    cargoSizeMedium: 1.15,
    cargoSizeLarge: 1.4,
    fragileSurcharge: 1.1,
    helperSurcharge: 1.15,
    weightUpTo5kg: 1.0,
    weightUpTo15kg: 1.1,
    weightUpTo30kg: 1.25,
    weightUpTo50kg: 1.5,
    weightAbove50kg: 1.8,
  },
  supportChannels: {
    phone: "0800123456",
    email: "suporte@levamais.app",
    whatsapp: "5500000000000",
    helpCenterUrl: ""
  },
  policyVersions: {
    termsVersion: "2026-05-14",
    privacyPolicyVersion: "2026-05-14",
    consentVersion: "2026-05-14"
  }
};

export const platformConfigService = {
  async get(): Promise<PlatformConfig> {
    try {
      const res = await axios.get(`${API_URL}/auth/platform-config`, {
        headers: { "x-admin-key": ADMIN_API_KEY },
      });
      const data = res?.data?.data || DEFAULT_CONFIG;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    } catch {
      if (typeof window === "undefined") return DEFAULT_CONFIG;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONFIG));
        return DEFAULT_CONFIG;
      }
      try {
        return JSON.parse(stored);
      } catch {
        return DEFAULT_CONFIG;
      }
    }
  },

  async update(config: Partial<PlatformConfig>): Promise<PlatformConfig> {
    try {
      const res = await axios.patch(`${API_URL}/auth/platform-config`, config, {
        headers: { "x-admin-key": ADMIN_API_KEY },
      });
      const data = res?.data?.data || DEFAULT_CONFIG;
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      }
      return data;
    } catch {
      const current = await this.get();
      const updated = { ...current, ...config };
      if (typeof window !== "undefined") {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      }
      return updated;
    }
  },
};
