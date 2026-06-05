/**
 * Tipos de domínio das Rotas Planejadas / Maloteiro (Fase D) — espelham os schemas
 * do backend (DriverRoute, RouteReservation).
 */

import type { EscrowStatus, PaymentMethod } from './marketplace';

export type VehicleType = 'motorcycle' | 'car' | 'van' | 'truck';

export interface GeoPoint {
  cityId?: string | null;
  label?: string;
  location?: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
}

export type DriverRouteStatus = 'draft' | 'published' | 'in_transit' | 'completed' | 'cancelled';

export interface DriverRoute {
  _id: string;
  driverId: string;
  vehicleType: VehicleType;
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints?: GeoPoint[];
  departAt: string;
  arriveEstimateAt?: string | null;
  capacity: {
    maxItems: number;
    maxWeightKg: number;
    maxVolumeL: number;
    acceptedItemTypes?: string[];
  };
  capacityUsed?: { items: number; weightKg: number; volumeL: number };
  pricing: {
    basePrice: number;
    pricePerKg: number;
    sizeMultipliers?: { small: number; medium: number; large: number };
    dynamicEnabled?: boolean;
  };
  status: DriverRouteStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface RouteSchedule {
  _id: string;
  driverId: string;
  carrierId?: string | null;
  vehicleType: VehicleType;
  origin: GeoPoint;
  destination: GeoPoint;
  waypoints?: GeoPoint[];
  daysOfWeek: number[]; // 0=dom ... 6=sáb
  departTime: string; // "HH:mm"
  capacity: { maxItems: number; maxWeightKg: number; maxVolumeL?: number };
  pricing: { basePrice: number; pricePerKg: number };
  active: boolean;
  lastGeneratedDate?: string | null;
  createdAt?: string;
}

export type ItemSize = 'small' | 'medium' | 'large';

export type RouteReservationStatus =
  | 'requested'
  | 'accepted'
  | 'rejected'
  | 'awaiting_pickup'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled'
  | 'refunded';

export interface RouteContact {
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  contactName?: string;
  contactPhone?: string;
}

export interface RouteReservation {
  _id: string;
  routeId: string;
  clientId: string;
  driverId?: string | null;
  item: {
    type?: string;
    description?: string;
    size: ItemSize;
    weightKg?: number;
    declaredValue?: number;
  };
  pickup: RouteContact;
  dropoff: RouteContact;
  pricing: {
    price: number;
    commissionPct?: number;
    commissionAmount?: number;
    driverPayout?: number;
    promotionCode?: string;
    discountAmount?: number;
  };
  payment: {
    method: PaymentMethod;
    escrow: { status: EscrowStatus; amount?: number };
  };
  rideId?: string | null;
  status: RouteReservationStatus;
  createdAt?: string;
  updatedAt?: string;
}
