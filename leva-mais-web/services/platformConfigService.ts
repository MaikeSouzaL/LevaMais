import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface PlatformConfig {
  _id?: string;
  appFeePercentage: number; // Taxa padrão (ex: 15)
  splitRules?: {
    representativeShare: number; // Padrão 50
  };
}

export const platformConfigService = {
  async get(): Promise<PlatformConfig> {
    // Tenta buscar, se der erro retorna default
    try {
      const res = await api.get("/platform-config");
      return res.data;
    } catch {
      return { appFeePercentage: 15, splitRules: { representativeShare: 50 } };
    }
  },

  async update(data: Partial<PlatformConfig>): Promise<PlatformConfig> {
    const res = await api.put("/platform-config", data);
    return res.data;
  }
};
