import { supabase } from "../lib/supabase";

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
    try {
      const { data, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("is_active", true);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") return [];
        throw error;
      }

      return (data || []).map((row: any) => ({
        code: row.code,
        title: row.title,
        description: row.description,
        discountType: row.discount_type,
        discountValue: Number(row.discount_value),
        maxDiscount: row.max_discount ? Number(row.max_discount) : null,
        minOrderValue: Number(row.min_order_value || 0),
        serviceTypes: row.service_types || [],
      }));
    } catch {
      return [];
    }
  }

  async validateCode(payload: {
    code: string;
    amount: number;
    serviceType?: PromotionServiceType;
  }): Promise<ValidatedPromotion> {
    const code = String(payload.code || "").trim().toUpperCase();
    const amount = Number(payload.amount || 0);

    try {
      const { data: promo, error } = await supabase
        .from("promotions")
        .select("*")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!promo) {
        throw new Error("Cupom inválido ou expirado");
      }

      const minOrder = Number(promo.min_order_value || 0);
      if (amount < minOrder) {
        throw new Error(`Valor mínimo para este cupom é R$ ${minOrder.toFixed(2)}`);
      }

      if (payload.serviceType && promo.service_types && promo.service_types.length > 0) {
        if (!promo.service_types.includes(payload.serviceType)) {
          throw new Error("Cupom não aplicável a este tipo de serviço");
        }
      }

      let discountAmount = 0;
      const val = Number(promo.discount_value);
      if (promo.discount_type === "fixed") {
        discountAmount = val;
      } else if (promo.discount_type === "percentage") {
        discountAmount = amount * (val / 100);
      }

      if (promo.max_discount) {
        const max = Number(promo.max_discount);
        if (discountAmount > max) {
          discountAmount = max;
        }
      }

      if (discountAmount > amount) {
        discountAmount = amount;
      }

      const finalAmount = amount - discountAmount;

      return {
        code: promo.code,
        title: promo.title,
        description: promo.description,
        discountType: promo.discount_type,
        discountValue: val,
        discountAmount,
        finalAmount,
      };
    } catch (error: any) {
      console.error("Erro ao validar cupom:", error);
      throw new Error(error.message || "Erro ao validar cupom");
    }
  }
}

export default new PromotionService();
