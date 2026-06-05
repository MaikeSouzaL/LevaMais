import apiClient from "./api";
import type { Carrier, CarrierOnboardingPayload } from "@/types/carrier";

// Service do app para o Modo Transportadora (Fase D / T1). Endpoints em /api/carrier.

function unwrap(data: any): any {
  return data?.data ?? data?.carrier ?? null;
}

const carrierService = {
  /** Retorna a transportadora do motorista logado, ou null se ainda não criou. */
  async getMe(): Promise<Carrier | null> {
    const { data } = await apiClient.get("/carrier/me");
    return unwrap(data);
  },

  async onboarding(payload: CarrierOnboardingPayload): Promise<Carrier> {
    const { data } = await apiClient.post("/carrier/onboarding", payload);
    return unwrap(data) as Carrier;
  },

  async updateMe(payload: Partial<CarrierOnboardingPayload> & { logo?: string }): Promise<Carrier> {
    const { data } = await apiClient.patch("/carrier/me", payload);
    return unwrap(data) as Carrier;
  },
};

export default carrierService;
