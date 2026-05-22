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

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
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
};
