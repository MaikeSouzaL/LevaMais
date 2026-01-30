import axios from "axios";
import type { VehicleType, PurposeItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export type PricingVehicleCategory = VehicleType; // same string union

export type PricingRule = {
  _id: string;
  name: string;
  cityId: { _id: string; name: string; state: string } | string;
  vehicleCategory: PricingVehicleCategory;
  purposeId?: (PurposeItem & { _id: string }) | string | null;
  pricing: {
    pricePerKm: number;
    minimumKm: number;
    minimumFee?: number;
    basePrice?: number;
    pricePerMinute?: number;
  };
  active: boolean;
  priority?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type CreatePricingRulePayload = {
  name: string;
  cityId: string;
  vehicleCategory: PricingVehicleCategory;
  purposeId?: string | null;
  pricing: {
    pricePerKm: number;
    minimumKm: number;
    minimumFee?: number;
  };
  active: boolean;
  priority?: number;
};

export type UpdatePricingRulePayload = Partial<CreatePricingRulePayload>;

export const pricingRulesService = {
  async list(params?: {
    cityId?: string;
    vehicleCategory?: PricingVehicleCategory;
    active?: boolean;
  }): Promise<PricingRule[]> {
    const res = await api.get("/pricing", { params });
    return res.data || [];
  },

  async create(payload: CreatePricingRulePayload): Promise<PricingRule> {
    try {
      const res = await api.post("/pricing", payload);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.response?.data?.error || "Erro ao criar regra");
      }
      throw error;
    }
  },

  async update(id: string, payload: UpdatePricingRulePayload): Promise<PricingRule> {
    try {
      const res = await api.put(`/pricing/${id}`, payload);
      return res.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.response?.data?.error || "Erro ao atualizar regra");
      }
      throw error;
    }
  },

  async remove(id: string): Promise<void> {
    try {
      await api.delete(`/pricing/${id}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.message || error.response?.data?.error || "Erro ao excluir regra");
      }
      throw error;
    }
  },
};
