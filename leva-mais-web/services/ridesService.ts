import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    ...(ADMIN_API_KEY ? { "x-admin-key": ADMIN_API_KEY } : {}),
  },
});

export interface Ride {
  _id: string;
  clientId: {
    _id: string;
    name: string;
    phone: string;
    profilePhoto?: string;
  };
  driverId?: {
    _id: string;
    name: string;
    phone: string;
    profilePhoto?: string;
  };
  purposeId?: {
    _id: string;
    id: string;
    title: string;
  };
  pickup: {
    address: string;
    latitude: number;
    longitude: number;
  };
  dropoff: {
    address: string;
    latitude: number;
    longitude: number;
  };
  status: "requesting" | "accepted" | "driver_assigned" | "driver_arriving" | "arrived" | "in_progress" | "completed" | "cancelled" | "scheduled";
  serviceType: "ride" | "delivery";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  pricing?: {
    total: number;
    driverValue: number;
    appFee: number;
  };
  proofs?: {
    pickupPhoto?: string;
    deliveryPhoto?: string;
  };
  rating?: {
    clientRating?: {
      stars: number;
      feedback?: string;
      tips?: number;
    };
    driverRating?: {
      stars: number;
      feedback?: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

export const ridesService = {
  async getAll(params?: { status?: string; clientId?: string; driverId?: string }): Promise<Ride[]> {
    try {
      const res = await api.get("/rides", { params });
      return res.data.rides || [];
    } catch {
      return [];
    }
  },

  async getById(rideId: string): Promise<Ride | null> {
    try {
      const res = await api.get(`/rides/${rideId}`);
      return res.data;
    } catch {
      return null;
    }
  }
};
