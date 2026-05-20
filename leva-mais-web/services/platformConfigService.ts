import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

const api = axios.create({
  baseURL: API_URL.endsWith("/") ? API_URL : `${API_URL}/`,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
  },
});

// Garantir que caminhos com barra inicial não quebrem a resolução da subpasta /api no Axios
api.interceptors.request.use((config) => {
  if (config.url && config.url.startsWith("/")) {
    config.url = config.url.substring(1);
  }
  return config;
});

export interface PlatformConfig {
  _id?: string;
  appFeePercentage: number;
  isDevelopmentMode?: boolean;
  defaultSearchRadius?: number;
  queueRedispatchInterval?: number;
  rideSearchTimeoutSeconds?: number;
  splitRules?: {
    representativeShare: number; // Padrão 50
  };
  driverGoals?: {
    dailyGoalRides: number;
    dailyBonusAmount: number;
  };
  supportChannels?: {
    phone: string;
    email: string;
    whatsapp: string;
    helpCenterUrl?: string;
  };
  policyVersions?: {
    termsVersion: string;
    privacyPolicyVersion: string;
    consentVersion: string;
  };
}

export const platformConfigService = {
  async get(): Promise<PlatformConfig> {
    try {
      const res = await api.get("/config/all");
      return res.data.data;
    } catch {
      return { 
        appFeePercentage: 15, 
        isDevelopmentMode: true,
        defaultSearchRadius: 5000,
        queueRedispatchInterval: 60,
        rideSearchTimeoutSeconds: 60,
        splitRules: { representativeShare: 50 },
        driverGoals: { dailyGoalRides: 10, dailyBonusAmount: 20 },
        supportChannels: { phone: "0800123456", email: "suporte@levamais.app", whatsapp: "5500000000000", helpCenterUrl: "" },
        policyVersions: { termsVersion: "2026-05-14", privacyPolicyVersion: "2026-05-14", consentVersion: "2026-05-14" }
      };
    }
  },

  async update(data: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const res = await api.put("/config/update", data);
    return res.data.data;
  }
};

