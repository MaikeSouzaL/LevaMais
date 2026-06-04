import axios from "axios";

export interface Ride {
  _id: string;
  serviceType: "ride" | "delivery" | string;
  status: string;
  pickup: {
    address: string;
  };
  dropoff: {
    address: string;
  };
  pricing?: {
    total?: number;
    platformFee?: number;
  };
  clientId?: {
    _id?: string;
    name?: string;
  };
}

export interface OperationsSummary {
  success: boolean;
  generatedAt: string;
  health: "healthy" | "warning" | "critical";
  rides: {
    active: number;
    byStatus: Record<string, number>;
    byService: Record<string, number>;
    paymentPending: number;
    waitingRequests: number;
  };
  drivers: {
    total: number;
    approved: number;
    online: number;
    available: number;
    busy: number;
    onRide: number;
    offline: number;
    staleLocations: number;
  };
  tracking: {
    expected: number;
    fresh: number;
    stale: number;
    missing: number;
    coveragePct: number;
    staleRideIds: string[];
  };
  alerts: Array<{
    id: string;
    severity: "warning" | "critical";
    title: string;
    message: string;
    value: number;
  }>;
  recentEvents: Array<{
    id: string;
    serviceType: string;
    status: string;
    clientName: string;
    pickup: string;
    dropoff: string;
    total: number;
    updatedAt: string;
  }>;
}

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const ridesService = {
  async getAll(): Promise<Ride[]> {
    try {
      const res = await axios.get(`${API_URL}/rides`, {
        headers: { "x-admin-key": ADMIN_API_KEY },
      });

      // backend legacy patterns: { rides: [] } or [].
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.rides)) return res.data.rides;
      return [];
    } catch {
      // Graceful fallback for admin dashboards when route auth is not wired for x-admin-key yet.
      return [];
    }
  },

  async getNfse(rideId: string): Promise<any> {
    const res = await axios.get(`${API_URL}/rides/${rideId}/nfse`, {
      headers: { "x-admin-key": ADMIN_API_KEY },
    });
    return res.data;
  },
};

export const operationsService = {
  async getSummary(): Promise<OperationsSummary | null> {
    try {
      const res = await axios.get(`${API_URL}/operations/summary`, {
        headers: { "x-admin-key": ADMIN_API_KEY },
      });
      return res.data?.success ? res.data : null;
    } catch {
      return null;
    }
  },
};
