"use client";

import { apiClient } from "./apiClient";
import type { Readiness, Store, StoreHour, StoreProduct, Partner } from "@/types";

export interface MeResponse {
  partner?: Partner;
  stores?: Store[];
  data?: {
    partner?: Partner;
    stores?: Store[];
  };
}

export async function getPartnerMe() {
  const response = await apiClient.get<MeResponse>("/partner/me");
  const partner = response.data.partner || response.data.data?.partner;
  if (!partner) throw new Error("Parceiro nao encontrado para este usuario");
  return {
    partner,
    stores: response.data.stores || response.data.data?.stores || [],
  };
}

export async function getStore(storeId: string) {
  const response = await apiClient.get<{ store: Store; readiness: Readiness; data?: { store: Store; readiness: Readiness } }>(
    `/partner/stores/${storeId}`,
  );
  const store = response.data.store || response.data.data?.store;
  const readiness = response.data.readiness || response.data.data?.readiness;
  if (!store || !readiness) throw new Error("Loja nao encontrada");
  return {
    store,
    readiness,
  };
}

export async function updateStore(storeId: string, payload: {
  description?: string;
  prepTimeMinutes?: number;
  minOrderValue?: number;
  deliveryMode?: string;
  hours?: StoreHour[];
  tags?: string[];
}) {
  const response = await apiClient.patch(`/partner/stores/${storeId}`, payload);
  return response.data;
}

export async function updateAvailability(storeId: string, isOpenManualOverride: string) {
  const response = await apiClient.patch(`/partner/stores/${storeId}/availability`, { isOpenManualOverride });
  return response.data;
}

export async function listProducts(storeId: string) {
  const response = await apiClient.get<{ products?: StoreProduct[]; data?: StoreProduct[] }>(
    `/partner/stores/${storeId}/products`,
  );
  return response.data.products || response.data.data || [];
}

export async function createProduct(storeId: string, payload: Partial<StoreProduct>) {
  const response = await apiClient.post(`/partner/stores/${storeId}/products`, payload);
  return response.data.product || response.data.data;
}

export async function updateProduct(productId: string, payload: Partial<StoreProduct>) {
  const response = await apiClient.patch(`/partner/products/${productId}`, payload);
  return response.data.product || response.data.data;
}

export async function disableProduct(productId: string) {
  const response = await apiClient.delete(`/partner/products/${productId}`);
  return response.data.product || response.data.data;
}
