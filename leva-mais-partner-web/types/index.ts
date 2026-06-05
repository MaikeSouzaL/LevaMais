export type PartnerStatus = "active" | "paused" | "under_review" | "blocked";
export type KycStatus = "none" | "pending" | "approved" | "rejected" | "suspended";
export type StoreStatus = "active" | "paused" | "under_review" | "blocked";
export type DeliveryMode = "platform" | "pickup" | "both";
export type OpenOverride = "auto" | "force_open" | "force_closed";

export interface Partner {
  _id: string;
  legalName: string;
  tradeName: string;
  status: PartnerStatus;
  statusReason?: string;
  contact?: {
    email?: string;
    phone?: string;
    whatsapp?: string;
  };
  kyc?: {
    status: KycStatus;
    rejectionReason?: string;
  };
}

export interface Store {
  _id: string;
  name: string;
  slug: string;
  status: StoreStatus;
  description?: string;
  logo?: string;
  cover?: string;
  commissionPct?: number | null;
  prepTimeMinutes: number;
  minOrderValue: number;
  deliveryMode: DeliveryMode;
  isOpenManualOverride: OpenOverride;
  tags?: string[];
  hours?: StoreHour[];
  address?: {
    street?: string;
    number?: string;
    neighborhood?: string;
    city?: string;
  };
  rating?: {
    average?: number;
    count?: number;
  };
  readiness?: Readiness;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
    icon?: string;
  };
}

export interface StoreHour {
  weekday: number;
  open: string;
  close: string;
}

export interface Readiness {
  canSell: boolean;
  activePartner: boolean;
  activeStore: boolean;
  openNow: boolean;
  reason: string;
}

export interface ProductModifierOption {
  name: string;
  priceDelta: number;
  available: boolean;
}

export interface ProductModifierGroup {
  name: string;
  min: number;
  max: number;
  options: ProductModifierOption[];
}

export interface StoreProduct {
  _id: string;
  storeId: string;
  name: string;
  description?: string;
  photo?: string;
  image?: string;
  basePrice: number;
  unit: "unit" | "kg" | "g" | "l" | "ml" | "service";
  sku?: string;
  modifierGroups?: ProductModifierGroup[];
  requiresConfirmation?: boolean;
  available: boolean;
  stock?: number | null;
  order?: number;
  categoryId?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
}

export interface PartnerSession {
  token: string;
  user?: {
    id?: string;
    name?: string;
    email?: string;
    userType?: string;
  };
}
