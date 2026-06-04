import axios from "axios";

export interface City {
  _id: string;
  name: string;
  state?: string;
  stateCode?: string;
  country?: string;
  isActive: boolean;
  center?: {
    latitude?: number;
    longitude?: number;
  };
  radiusKm?: number;
  defaultVehicleType?: "motorcycle" | "car" | "van" | "truck";
}

export type CityPayload = {
  name: string;
  state?: string;
  stateCode?: string;
  isActive?: boolean;
  center: {
    latitude: number;
    longitude: number;
  };
  radiusKm: number;
  defaultVehicleType?: "motorcycle" | "car" | "van" | "truck";
};

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const citiesService = {
  async list(includeInactive = true): Promise<City[]> {
    const res = await axios.get(`${API_URL}/cities`, {
      params: { includeInactive },
      headers: { "x-admin-key": ADMIN_API_KEY },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  async create(payload: CityPayload): Promise<City> {
    const res = await axios.post(`${API_URL}/cities`, payload, {
      headers: { "x-admin-key": ADMIN_API_KEY },
    });
    return res.data?.city;
  },

  async update(id: string, payload: CityPayload): Promise<City> {
    const res = await axios.patch(`${API_URL}/cities/${id}`, payload, {
      headers: { "x-admin-key": ADMIN_API_KEY },
    });
    return res.data?.city;
  },

  async deactivate(id: string): Promise<City> {
    const res = await axios.delete(`${API_URL}/cities/${id}`, {
      headers: { "x-admin-key": ADMIN_API_KEY },
    });
    return res.data?.city;
  },
};
