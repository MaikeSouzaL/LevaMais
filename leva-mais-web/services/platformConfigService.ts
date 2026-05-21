export interface PlatformConfig {
  _id?: string;
  appFeePercentage?: number;
  isDevelopmentMode?: boolean;
  defaultSearchRadius?: number;
  queueRedispatchInterval?: number;
  rideSearchTimeoutSeconds?: number;
  splitRules?: {
    representativeShare?: number;
  };
  driverGoals?: {
    dailyGoalRides?: number;
    dailyBonusAmount?: number;
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

const DEFAULT_CONFIG: PlatformConfig = {
  appFeePercentage: 15,
  isDevelopmentMode: true,
  defaultSearchRadius: 5000,
  queueRedispatchInterval: 60,
  rideSearchTimeoutSeconds: 600,
  splitRules: { representativeShare: 50 },
  driverGoals: { dailyGoalRides: 10, dailyBonusAmount: 20 },
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
  },

  async update(config: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const current = await this.get();
    const updated = { ...current, ...config };
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
    return updated;
  }
};
