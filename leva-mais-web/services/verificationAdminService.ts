import axios from "axios";

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

export const verificationAdminService = {
  async listUsers(userType: "driver" | "client") {
    return withApiFallback(async (apiBase) => {
      const response = await axios.get(`${apiBase}/auth/users?userType=${userType}`, {
        headers: getAdminHeaders(),
      });
      return response?.data?.users || [];
    });
  },

  async updateUserById(userId: string, payload: Record<string, unknown>) {
    return withApiFallback(async (apiBase) => {
      const response = await axios.patch(`${apiBase}/auth/users/${userId}`, payload, {
        headers: getAdminHeaders(),
      });
      return response?.data?.user || null;
    });
  },

  async updateClientVerification(userId: string, field: "cpfStatus" | "selfieStatus", status: string, reason?: string) {
    return withApiFallback(async (apiBase) => {
      const response = await axios.patch(
        `${apiBase}/auth/users/${userId}/client-verification`,
        { field, status, reason },
        { headers: getAdminHeaders() }
      );
      return response?.data?.user || null;
    });
  },

  async updateDriverVerification(
    userId: string,
    field: "cnhFrontStatus" | "cnhBackStatus" | "selfieStatus",
    status: string,
    reason?: string
  ) {
    return withApiFallback(async (apiBase) => {
      const response = await axios.patch(
        `${apiBase}/auth/users/${userId}/driver-verification`,
        { field, status, reason },
        { headers: getAdminHeaders() }
      );
      return response?.data?.user || null;
    });
  },
};
