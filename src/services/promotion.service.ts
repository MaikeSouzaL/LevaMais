import api from "./api";

export type PromotionServiceType = "ride" | "delivery";

export type Promotion = {
  code: string;
  title: string;
  description?: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  maxDiscount?: number | null;
  minOrderValue?: number;
  serviceTypes?: PromotionServiceType[];
};

export type ValidatedPromotion = {
  code: string;
  title: string;
  description?: string;
  discountType: "fixed" | "percentage";
  discountValue: number;
  discountAmount: number;
  finalAmount: number;
};

class PromotionService {
  async listActive(): Promise<Promotion[]> {
    const response = await api.get("/promotions");
    return response.data?.promotions || [];
  }

  async validateCode(payload: {
    code: string;
    amount: number;
    serviceType?: PromotionServiceType;
  }): Promise<ValidatedPromotion> {
    const code = String(payload.code || "").trim().toUpperCase();
    const amount = Number(payload.amount || 0);

    const response = await api.get(`/promotions/${encodeURIComponent(code)}`, {
      params: {
        amount,
        serviceType: payload.serviceType,
      },
    });

    return response.data?.promotion;
  }
}

export default new PromotionService();
