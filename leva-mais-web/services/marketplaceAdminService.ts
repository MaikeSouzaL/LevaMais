import axios from "axios";

export type PartnerStatus = "active" | "paused" | "under_review" | "blocked";
export type PartnerKycStatus = "none" | "pending" | "approved" | "rejected" | "suspended";
export type KycAction = "approve" | "reject" | "suspend" | "reset";

export interface PartnerItem {
  _id: string;
  ownerUserId?: { _id: string; name?: string; email?: string; phone?: string } | string;
  legalName: string;
  tradeName: string;
  document?: string;
  contact?: { email?: string; phone?: string; whatsapp?: string };
  kyc?: { status: PartnerKycStatus; rejectionReason?: string; reviewedAt?: string };
  payout?: { method?: string; pixKey?: string; holdDays?: number };
  status: PartnerStatus;
  statusReason?: string;
  stores?: StoreItem[];
  createdAt?: string;
}

export interface CategoryItem {
  _id: string;
  slug: string;
  name: string;
  kind: "store" | "product";
  icon?: string;
  order?: number;
  defaultCommissionPct?: number | null;
  active?: boolean;
}

export interface StoreItem {
  _id: string;
  partnerId?: string;
  name: string;
  slug?: string;
  categoryId?: { _id: string; name?: string; slug?: string; defaultCommissionPct?: number | null } | string;
  status?: string;
  commissionPct?: number | null;
  rating?: { average?: number; count?: number };
  createdAt?: string;
}

export interface ResolvedCommission {
  pct: number;
  source: "store" | "category" | "platform";
}

function getAdminHeaders() {
  const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";
  return { "x-admin-key": ADMIN_API_KEY };
}

function normalizeApiBase(input: string) {
  const raw = String(input || "").trim().replace(/\/+$/, "");
  if (!raw) return "";
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

function getApiCandidates() {
  const envBase = normalizeApiBase(process.env.NEXT_PUBLIC_API_URL || "");
  const browserBase =
    typeof window !== "undefined"
      ? normalizeApiBase(`${window.location.origin}/api`)
      : "";

  const localFallbacks = [
    "http://localhost:3001/api",
    "http://127.0.0.1:3001/api",
    "http://localhost:3000/api",
    "http://127.0.0.1:3000/api",
  ].map(normalizeApiBase);

  return Array.from(new Set([envBase, browserBase, ...localFallbacks].filter(Boolean)));
}

async function withApiFallback<T>(runner: (apiBase: string) => Promise<T>) {
  const candidates = getApiCandidates();
  let lastError: unknown = null;
  for (const apiBase of candidates) {
    try {
      return await runner(apiBase);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

const BASE = "/admin/marketplace";

export const marketplaceAdminService = {
  // Parceiros
  async listPartners(status?: string): Promise<PartnerItem[]> {
    return withApiFallback(async (apiBase) => {
      const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      const res = await axios.get(`${apiBase}${BASE}/partners${query}`, { headers: getAdminHeaders() });
      return res?.data?.data || [];
    });
  },

  async getPartner(id: string): Promise<PartnerItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.get(`${apiBase}${BASE}/partners/${id}`, { headers: getAdminHeaders() });
      return res?.data?.data || null;
    });
  },

  async createPartner(payload: {
    ownerUserId: string;
    legalName: string;
    tradeName: string;
    document?: string;
    contact?: { email?: string; phone?: string; whatsapp?: string };
  }): Promise<PartnerItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.post(`${apiBase}${BASE}/partners`, payload, { headers: getAdminHeaders() });
      return res?.data?.data || null;
    });
  },

  async updateKyc(id: string, action: KycAction, reason?: string): Promise<PartnerItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.patch(
        `${apiBase}${BASE}/partners/${id}/kyc`,
        { action, reason },
        { headers: getAdminHeaders() },
      );
      return res?.data?.data || null;
    });
  },

  async updateStatus(id: string, status: PartnerStatus, reason?: string): Promise<PartnerItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.patch(
        `${apiBase}${BASE}/partners/${id}/status`,
        { status, reason },
        { headers: getAdminHeaders() },
      );
      return res?.data?.data || null;
    });
  },

  // Categorias
  async listCategories(): Promise<CategoryItem[]> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.get(`${apiBase}${BASE}/categories`, { headers: getAdminHeaders() });
      return res?.data?.data || [];
    });
  },

  async createCategory(payload: {
    slug: string;
    name: string;
    kind?: "store" | "product";
    icon?: string;
    defaultCommissionPct?: number | null;
  }): Promise<CategoryItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.post(`${apiBase}${BASE}/categories`, payload, { headers: getAdminHeaders() });
      return res?.data?.data || null;
    });
  },

  async updateCategory(
    id: string,
    payload: { name?: string; icon?: string; active?: boolean; defaultCommissionPct?: number | null },
  ): Promise<CategoryItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.patch(`${apiBase}${BASE}/categories/${id}`, payload, { headers: getAdminHeaders() });
      return res?.data?.data || null;
    });
  },

  // Lojas / comissão
  async listStores(partnerId?: string): Promise<StoreItem[]> {
    return withApiFallback(async (apiBase) => {
      const query = partnerId ? `?partnerId=${encodeURIComponent(partnerId)}` : "";
      const res = await axios.get(`${apiBase}${BASE}/stores${query}`, { headers: getAdminHeaders() });
      return res?.data?.data || [];
    });
  },

  async createStore(payload: {
    partnerId: string;
    categoryId: string;
    name: string;
    description?: string;
    commissionPct?: number | null;
    minOrderValue?: number;
    prepTimeMinutes?: number;
    deliveryMode?: "platform" | "pickup" | "both";
    address?: {
      street?: string;
      number?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zipCode?: string;
    };
    latitude?: number;
    longitude?: number;
  }): Promise<StoreItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.post(`${apiBase}${BASE}/stores`, payload, { headers: getAdminHeaders() });
      return res?.data?.data || null;
    });
  },

  async updateStoreStatus(id: string, status: "active" | "paused" | "under_review" | "blocked"): Promise<StoreItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.patch(
        `${apiBase}${BASE}/stores/${id}/status`,
        { status },
        { headers: getAdminHeaders() },
      );
      return res?.data?.data || null;
    });
  },

  async setStoreCommission(id: string, commissionPct: number | null): Promise<StoreItem | null> {
    return withApiFallback(async (apiBase) => {
      const res = await axios.patch(
        `${apiBase}${BASE}/stores/${id}/commission`,
        { commissionPct },
        { headers: getAdminHeaders() },
      );
      return res?.data?.data || null;
    });
  },
};
