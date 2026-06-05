import apiClient from "./api";
import type { FreightRequest, PublicCarrier, CarrierProfile, CreateFreightPayload } from "@/types/freight";

// Service do app para Frete sob demanda (Modo Transportadora / T3).

function one(data: any): any {
  return data?.data ?? data?.freight ?? null;
}
function many(data: any): any[] {
  const list = data?.data ?? data?.freights ?? data?.carriers ?? [];
  return Array.isArray(list) ? list : [];
}

const freightService = {
  // ----- CLIENTE -----
  async listCarriers(city?: string): Promise<PublicCarrier[]> {
    const { data } = await apiClient.get("/carrier/public", { params: city ? { city } : undefined });
    return many(data) as PublicCarrier[];
  },

  async getProfile(slug: string): Promise<CarrierProfile> {
    const { data } = await apiClient.get(`/carrier/public/${slug}`);
    return (data?.data ?? data?.carrier) as CarrierProfile;
  },

  async create(payload: CreateFreightPayload): Promise<FreightRequest> {
    const { data } = await apiClient.post("/freight", payload);
    return one(data) as FreightRequest;
  },

  async listMine(): Promise<FreightRequest[]> {
    const { data } = await apiClient.get("/freight/mine");
    return many(data) as FreightRequest[];
  },

  async accept(id: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/accept`, {});
    return one(data) as FreightRequest;
  },

  async cancel(id: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/cancel`, {});
    return one(data) as FreightRequest;
  },

  // ----- TRANSPORTADORA (motorista) -----
  async listIncoming(): Promise<FreightRequest[]> {
    const { data } = await apiClient.get("/freight/incoming");
    return many(data) as FreightRequest[];
  },

  async quote(id: string, price: number, message?: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/quote`, { price, message });
    return one(data) as FreightRequest;
  },

  async reject(id: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/reject`, {});
    return one(data) as FreightRequest;
  },

  async pickup(id: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/pickup`, {});
    return one(data) as FreightRequest;
  },

  async deliver(id: string): Promise<FreightRequest> {
    const { data } = await apiClient.post(`/freight/${id}/deliver`, {});
    return one(data) as FreightRequest;
  },
};

export default freightService;
