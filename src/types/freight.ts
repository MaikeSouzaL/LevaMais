import type { ItemSize, DriverRoute } from "./routes";

export type FreightStatus =
  | "requested"
  | "quoted"
  | "accepted"
  | "rejected"
  | "cancelled"
  | "in_transit"
  | "delivered"
  | "completed"
  | "refunded"
  | "expired";

export interface PublicCarrier {
  _id: string;
  brandName: string;
  slug?: string;
  logo?: string;
  bio?: string;
  rating?: { average: number; count: number };
  serviceAreas?: { label?: string }[];
  pricing?: { basePrice?: number; pricePerKg?: number };
}

export interface CarrierProfile extends PublicCarrier {
  stats?: { totalRoutes?: number; totalDeliveries?: number; totalEarnings?: number };
  routes?: DriverRoute[];
}

export interface FreightContact {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string;
  contactPhone?: string;
}

export interface FreightRequest {
  _id: string;
  clientId: string;
  carrierId: string | { _id: string; brandName?: string; slug?: string; rating?: { average: number; count: number } };
  driverId?: string;
  pickup?: FreightContact;
  dropoff?: FreightContact;
  item: { description?: string; size: ItemSize; weightKg?: number; declaredValue?: number };
  desiredDate?: string | null;
  notes?: string;
  quote?: { price?: number | null; message?: string; quotedAt?: string | null };
  pricing?: { price: number; commissionPct: number; commissionAmount: number; driverPayout: number };
  payment?: { escrow: { status: string; amount?: number } };
  rideId?: string | null;
  status: FreightStatus;
  createdAt?: string;
}

export interface CreateFreightPayload {
  carrierId: string;
  pickup?: FreightContact;
  dropoff?: FreightContact;
  item: { description?: string; size?: ItemSize; weightKg?: number; declaredValue?: number };
  notes?: string;
}
