import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || '';

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
  status: "requesting" | "payment_pending" | "accepted" | "driver_assigned" | "driver_arriving" | "arrived" | "in_progress" | "completed" | "cancelled" | "scheduled";
  serviceType: "ride" | "delivery";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  pricing?: {
    total: number;
    driverValue: number;
    appFee: number;
    platformFee?: number;
  };
  payment?: {
    method?: "cash" | "card" | "wallet" | "pix";
    status?: "not_selected" | "pending" | "processing" | "authorized" | "completed" | "failed" | "refunded";
    transactionId?: string;
    paidAt?: string;
  };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    initialClientOffer?: number | null;
    suggestedMinPrice?: number | null;
    finalAgreedPrice?: number | null;
    selectedDriverId?: string | null;
    selectedAt?: string;
    offers?: Array<{
      driverId: string | { _id: string; name?: string };
      amount: number;
      status: "accepted" | "countered" | "rejected" | "client_countered";
      message?: string;
      createdAt?: string;
    }>;
  };
  cancellationFee?: {
    amount?: number;
    reason?: string;
  };
  details?: {
    itemType?: string;
    cargoSize?: "small" | "medium" | "large";
    approximateWeightKg?: number;
    isFragile?: boolean;
    needsHelper?: boolean;
    recipientName?: string;
    recipientPhone?: string;
    recipientInstructions?: string;
    pickupPin?: string;
    deliveryPin?: string;
    pickupComplement?: string;
    dropoffComplement?: string;
    specialInstructions?: string;
  };
  proofs?: {
    pickupPhoto?: string;
    deliveryPhoto?: string;
    pickupAt?: string;
    deliveryAt?: string;
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

export interface RouteAuditPhase {
  pointCount: number;
  startTime: string;
  endTime: string;
}

export interface RouteAudit {
  totalPoints: number;
  totalDistanceMeters: number;
  plannedDistanceMeters: number;
  routeDivergencePercent: number | null;
  avgSpeedKmh: number | null;
  phases?: {
    to_pickup?: RouteAuditPhase;
    at_pickup?: RouteAuditPhase;
    to_dropoff?: RouteAuditPhase;
    at_dropoff?: RouteAuditPhase;
    [key: string]: RouteAuditPhase | undefined;
  };
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
  },

  async getRouteAudit(rideId: string): Promise<RouteAudit | null> {
    try {
      const res = await api.get(`/rides/${rideId}/route-audit`);
      return res.data;
    } catch {
      return null;
    }
  },
};
