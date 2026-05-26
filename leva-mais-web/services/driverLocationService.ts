import axios from "axios";

export interface DriverLocation {
  _id: string;
  driverId?: {
    _id?: string;
    name?: string;
    email?: string;
  };
  status?: "available" | "busy" | "on_ride" | "offline" | string;
  vehicleType?: "motorcycle" | "car" | "van" | "truck" | string;
  speed?: number;
  heading?: number;
  location?: {
    type?: string;
    coordinates?: [number, number];
  };
  updatedAt?: string;
}

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const driverLocationService = {
  async getAll(): Promise<DriverLocation[]> {
    try {
      const res = await axios.get(`${API_URL}/driver-location/all`, {
        headers: { "x-admin-key": ADMIN_API_KEY },
      });

      // backend legacy patterns: { locations: [] } or [].
      if (Array.isArray(res.data)) return res.data;
      if (Array.isArray(res.data?.locations)) return res.data.locations;
      return [];
    } catch {
      // Graceful fallback for admin dashboards when route auth is not wired for x-admin-key yet.
      return [];
    }
  },
};
