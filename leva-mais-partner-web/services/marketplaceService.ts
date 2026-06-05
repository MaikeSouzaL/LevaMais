"use client";

import { apiClient } from "./apiClient";
import type { Store, StoreProduct } from "@/types";

export interface CategoryItem {
  _id: string;
  slug: string;
  name: string;
  kind: "store" | "product";
  icon?: string;
  order: number;
}

export interface CartValidatedItem {
  productId: string;
  name: string;
  quantity: number;
  basePrice: number;
  modifiers: Array<{
    groupName: string;
    optionName: string;
    priceDelta: number;
  }>;
  lineTotal: number;
  notes?: string;
}

export interface CartValidationResult {
  storeId: string;
  storeName: string;
  items: CartValidatedItem[];
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    total: number;
  };
}

export async function getMarketplaceCategories() {
  const response = await apiClient.get<{ categories?: CategoryItem[]; data?: CategoryItem[] }>(
    "/marketplace/categories",
  );
  return response.data.categories || response.data.data || [];
}

export async function getMarketplaceStores(filters?: {
  cityId?: string;
  categoryId?: string;
  lat?: number;
  lng?: number;
  q?: string;
}) {
  const response = await apiClient.get<{ stores?: Store[]; data?: Store[] }>("/marketplace/stores", {
    params: filters,
  });
  return response.data.stores || response.data.data || [];
}

export async function getMarketplaceStoreBySlug(slug: string) {
  const response = await apiClient.get<{
    store: Store;
    readiness: { canSell: boolean; reason: string; openNow: boolean; activePartner: boolean; activeStore: boolean };
    data?: {
      store: Store;
      readiness: { canSell: boolean; reason: string; openNow: boolean; activePartner: boolean; activeStore: boolean };
    };
  }>(`/marketplace/stores/${slug}`);
  const store = response.data.store || response.data.data?.store;
  const readiness = response.data.readiness || response.data.data?.readiness;
  if (!store || !readiness) throw new Error("Loja nao encontrada");
  return { store, readiness };
}

export async function getMarketplaceStoreProducts(storeId: string) {
  const response = await apiClient.get<{ products?: StoreProduct[]; data?: StoreProduct[] }>(
    `/marketplace/stores/${storeId}/products`,
  );
  return response.data.products || response.data.data || [];
}

export async function getMarketplaceProductDetail(productId: string) {
  const response = await apiClient.get<{ product?: StoreProduct; data?: StoreProduct }>(
    `/marketplace/products/${productId}`,
  );
  const product = response.data.product || response.data.data;
  if (!product) throw new Error("Produto nao encontrado");
  return product;
}

export async function validateMarketplaceCart(
  storeId: string,
  items: Array<{
    productId: string;
    quantity: number;
    modifiers: Array<{ groupName: string; optionName: string }>;
    notes?: string;
  }>,
) {
  const response = await apiClient.post<{ data?: CartValidationResult } | CartValidationResult>(
    "/marketplace/cart/validate",
    { storeId, items },
  );
  // Axios response.data might contain data wrapper or not depending on structure
  const result = (response.data as { data?: CartValidationResult }).data || (response.data as CartValidationResult);
  if (!result || !result.pricing) throw new Error("Erro ao validar carrinho");
  return result;
}

export interface StoreOrder {
  _id: string;
  orderNumber: string;
  clientId: string;
  storeId: {
    _id: string;
    name: string;
    slug: string;
    logo?: string;
    cover?: string;
    tags?: string[];
    phone?: string;
    address?: string;
    location?: { coordinates: [number, number] };
  };
  partnerId?: {
    _id: string;
    legalName: string;
    tradeName: string;
    contact?: { phone?: string; email?: string };
  };
  items: Array<{
    productId: string;
    name: string;
    quantity: number;
    basePrice: number;
    modifiers: Array<{ groupName: string; optionName: string; priceDelta: number }>;
    lineTotal: number;
    notes?: string;
  }>;
  pricing: {
    subtotal: number;
    deliveryFee: number;
    serviceFee: number;
    discountAmount: number;
    promotionCode?: string;
    total: number;
    commissionPct?: number;
    commissionAmount?: number;
    partnerPayout?: number;
  };
  payment: {
    method: "wallet" | "card" | "pix";
    escrow: {
      status: string;
      amount: number;
    };
    payoutStatus: string;
  };
  status: "pending_payment" | "placed" | "accepted" | "preparing" | "dispatched" | "ready_for_pickup" | "delivered" | "cancelled" | "refunded";
  statusHistory: Array<{
    status: string;
    at: string;
    by: string;
    note?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export async function createMarketplaceOrder(payload: {
  storeId: string;
  items: Array<{
    productId: string;
    quantity: number;
    modifiers: Array<{ groupName: string; optionName: string }>;
    notes?: string;
  }>;
  paymentMethod?: "wallet" | "card" | "pix";
  deliveryMode?: "platform" | "pickup";
  address?: {
    latitude: number;
    longitude: number;
    addressLine: string;
  };
  promotionCode?: string;
}) {
  const response = await apiClient.post<{ data: StoreOrder }>(
    "/marketplace/orders",
    payload,
  );
  return response.data.data;
}

export async function listMarketplaceOrders() {
  const response = await apiClient.get<{ data: StoreOrder[] }>("/marketplace/orders");
  return response.data.data;
}

export async function getMarketplaceOrderDetail(orderId: string) {
  const response = await apiClient.get<{ data: StoreOrder }>(`/marketplace/orders/${orderId}`);
  return response.data.data;
}
