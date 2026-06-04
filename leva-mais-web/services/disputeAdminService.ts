import axios from "axios";

export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected" | "cancelled";
export type DisputeSeverity = "low" | "medium" | "high" | "critical";

export interface DisputeItem {
  _id: string;
  rideId?: {
    _id: string;
    status?: string;
    serviceType?: string;
    pricing?: { total?: number };
  } | string;
  openedBy: string;
  clientId: string;
  driverId?: string;
  category: string;
  status: DisputeStatus;
  severity: DisputeSeverity;
  description: string;
  resolution?: {
    summary?: string;
    amountAdjusted?: number;
    resolvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
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
    "http://localhost:3002/api",
    "http://127.0.0.1:3002/api",
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

export const disputeAdminService = {
  async list(status?: string) {
    return withApiFallback(async (apiBase) => {
      const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
      const response = await axios.get(`${apiBase}/disputes/admin${query}`, {
        headers: getAdminHeaders(),
      });
      return response?.data?.data || [];
    });
  },

  async update(
    disputeId: string,
    payload: {
      status?: DisputeStatus;
      severity?: DisputeSeverity;
      resolutionSummary?: string;
      amountAdjusted?: number;
    }
  ) {
    return withApiFallback(async (apiBase) => {
      const response = await axios.patch(`${apiBase}/disputes/admin/${disputeId}`, payload, {
        headers: getAdminHeaders(),
      });
      return response?.data?.data || null;
    });
  },
};
