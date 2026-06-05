/**
 * Tipos do Modo Transportadora (Fase D) — espelham o model Carrier do backend.
 */

export type CarrierStatus = "active" | "paused" | "under_review" | "blocked";
export type CarrierKycStatus = "none" | "pending" | "approved" | "rejected" | "suspended";

export interface CarrierServiceArea {
  cityId?: string | null;
  label?: string;
}

export interface Carrier {
  _id: string;
  driverUserId: string;
  brandName: string;
  slug?: string;
  logo?: string;
  bio?: string;
  document?: string;
  contact?: { phone?: string; whatsapp?: string; email?: string };
  serviceAreas?: CarrierServiceArea[];
  kyc?: { status: CarrierKycStatus; rejectionReason?: string; submittedAt?: string; reviewedAt?: string };
  pricing?: { basePrice?: number; pricePerKg?: number; sizeMultipliers?: { small: number; medium: number; large: number } };
  rating?: { average: number; count: number };
  stats?: { totalRoutes?: number; totalDeliveries?: number; totalEarnings?: number };
  status: CarrierStatus;
  statusReason?: string;
}

export interface CarrierOnboardingPayload {
  brandName: string;
  bio?: string;
  document?: string;
  contact?: { phone?: string; whatsapp?: string; email?: string };
  serviceAreas?: CarrierServiceArea[];
  pricing?: { basePrice?: number; pricePerKg?: number };
}
