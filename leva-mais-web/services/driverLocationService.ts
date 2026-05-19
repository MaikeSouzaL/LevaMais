import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

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

export interface DriverLocation {
  _id: string;
  driverId: {
    _id: string;
    name: string;
    phone: string;
    profilePhoto?: string;
    email: string;
  };
  location: {
    type: "Point";
    coordinates: [number, number]; // [longitude, latitude]
  };
  status: "offline" | "available" | "busy" | "on_ride";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  lastUpdated: string;
  heading?: number;
  speed?: number;
}

export const driverLocationService = {
  async getAll(params?: { status?: string; vehicleType?: string }): Promise<DriverLocation[]> {
    try {
      const res = await api.get("/driver-location/all", { params });
      return res.data.locations || [];
    } catch {
      return [];
    }
  }
};
