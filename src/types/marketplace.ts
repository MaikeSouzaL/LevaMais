/**
 * Tipos de domínio do Marketplace (Fase D) — espelham os schemas do backend
 * (Category, Partner, Store, StoreProduct, StoreOrder).
 * Contratos do marketplace comercial. O app cliente nao compra no marketplace;
 * estes tipos servem ao backend, dashboard, portal parceiro/web cliente e,
 * quando necessario, ao app motorista/acompanhamento de entregas vinculadas.
 */

export type CategoryKind = 'store' | 'product';

export interface Category {
  _id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
  parentId?: string | null;
  icon?: string; // ícone Lucide
  order?: number;
  defaultCommissionPct?: number | null;
  active?: boolean;
}

export type PartnerStatus = 'active' | 'paused' | 'under_review' | 'blocked';
export type PartnerKycStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'suspended';

export interface Partner {
  _id: string;
  ownerUserId: string;
  legalName: string;
  tradeName: string;
  document?: string;
  contact?: { email?: string; phone?: string; whatsapp?: string };
  kyc?: {
    status: PartnerKycStatus;
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  payout?: { method: 'wallet' | 'pix'; pixKey?: string; holdDays?: number };
  status: PartnerStatus;
  statusReason?: string;
}

export type StoreStatus = 'active' | 'paused' | 'under_review' | 'blocked';
export type DeliveryMode = 'platform' | 'pickup' | 'both';

export interface StoreHours {
  weekday: number; // 0-6
  open: string; // "HH:mm"
  close: string;
}

export interface Store {
  _id: string;
  partnerId: string;
  name: string;
  slug?: string;
  categoryId: string;
  description?: string;
  logo?: string;
  cover?: string;
  address?: {
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  };
  location?: { type: 'Point'; coordinates: [number, number] }; // [lng, lat]
  cityId?: string | null;
  commissionPct?: number | null;
  hours?: StoreHours[];
  isOpenManualOverride?: 'auto' | 'force_open' | 'force_closed';
  prepTimeMinutes?: number;
  minOrderValue?: number;
  deliveryMode?: DeliveryMode;
  rating?: { average: number; count: number };
  tags?: string[];
  status: StoreStatus;
}

export type ProductUnit = 'unit' | 'kg' | 'g' | 'l' | 'ml' | 'service';

export interface ModifierOption {
  name: string;
  priceDelta?: number;
  available?: boolean;
}

export interface ModifierGroup {
  name: string;
  min?: number;
  max?: number;
  options: ModifierOption[];
}

export interface StoreProduct {
  _id: string;
  storeId: string;
  categoryId?: string | null;
  name: string;
  description?: string;
  photo?: string;
  basePrice: number;
  unit?: ProductUnit;
  sku?: string;
  modifierGroups?: ModifierGroup[];
  combo?: { isCombo: boolean; items?: Array<{ productId: string; quantity: number }> };
  requiresConfirmation?: boolean;
  available?: boolean;
  stock?: number | null;
  order?: number;
}

export type StoreOrderStatus =
  | 'pending_payment'
  | 'placed'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'awaiting_courier'
  | 'in_delivery'
  | 'delivered'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'refunded';

export type EscrowStatus = 'none' | 'reserved' | 'released' | 'refunded' | 'failed';
export type PaymentMethod = 'wallet' | 'pix' | 'card' | 'cash';

export interface StoreOrderItem {
  productId?: string;
  name: string;
  quantity: number;
  basePrice: number;
  modifiers?: Array<{ groupName: string; optionName: string; priceDelta: number }>;
  lineTotal: number;
  notes?: string;
}

export interface StoreOrder {
  _id: string;
  orderNumber?: string;
  clientId: string;
  storeId: string;
  partnerId?: string | null;
  items: StoreOrderItem[];
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee?: number;
    discountAmount?: number;
    promotionCode?: string;
    total: number;
    currency?: string;
    commissionPct?: number;
    commissionAmount?: number;
    partnerPayout?: number;
  };
  payment: {
    method: PaymentMethod;
    escrow: { status: EscrowStatus; amount?: number };
    payoutStatus?: 'pending' | 'released' | 'held';
  };
  rideId?: string | null;
  scheduledFor?: string | null;
  status: StoreOrderStatus;
  sla?: { acceptedAt?: string; readyAt?: string; promisedReadyAt?: string; deliveredAt?: string };
  rating?: { stars?: number; comment?: string; createdAt?: string };
  createdAt?: string;
  updatedAt?: string;
}
