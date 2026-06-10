import { supabase } from '../lib/supabase';

export interface PricingRule {
  _id: string;
  vehicleCategory: string;
  purposeId?: { _id: string; name: string } | string;
  pricing: {
    basePrice: number;
    minimumFee: number;
    pricePerKm: number;
    pricePerMinute: number;
  };
}

const DEFAULT_RULES: PricingRule[] = [
  {
    _id: "pr1",
    vehicleCategory: "motorcycle",
    pricing: {
      basePrice: 4.00,
      minimumFee: 6.00,
      pricePerKm: 1.20,
      pricePerMinute: 0.15,
    },
  },
  {
    _id: "pr2",
    vehicleCategory: "car",
    pricing: {
      basePrice: 6.00,
      minimumFee: 8.00,
      pricePerKm: 1.80,
      pricePerMinute: 0.20,
    },
  },
  {
    _id: "pr3",
    vehicleCategory: "van",
    pricing: {
      basePrice: 15.00,
      minimumFee: 25.00,
      pricePerKm: 3.50,
      pricePerMinute: 0.30,
    },
  },
  {
    _id: "pr4",
    vehicleCategory: "truck",
    pricing: {
      basePrice: 35.00,
      minimumFee: 60.00,
      pricePerKm: 5.50,
      pricePerMinute: 0.50,
    },
  },
];

const pricingService = {
  /**
   * Busca regras de preço do Supabase
   */
  getRules: async (): Promise<PricingRule[]> => {
    try {
      const { data, error } = await supabase
        .from("pricing_rules")
        .select("*")
        .eq("active", true);

      if (error) {
        if (error.code === "42P01") return DEFAULT_RULES;
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        vehicleCategory: row.vehicle_category,
        purposeId: row.purpose_id,
        pricing: row.pricing || {
          basePrice: Number(row.base_price || 0),
          minimumFee: Number(row.minimum_fee || 0),
          pricePerKm: Number(row.price_per_km || 0),
          pricePerMinute: Number(row.price_per_minute || 0),
        },
      }));
    } catch (error) {
      console.error("Erro ao buscar regras de preco:", error);
      return DEFAULT_RULES;
    }
  },

  /**
   * Busca configuração global de preços
   */
  getConfig: async () => {
    try {
      const { data, error } = await supabase
        .from("platform_config")
        .select("*")
        .eq("key", "pricing_config")
        .maybeSingle();

      if (error) {
        if (error.code === "42P01") return { taxRate: 0.15 };
        throw error;
      }

      return data?.value || { taxRate: 0.15 };
    } catch {
      return { taxRate: 0.15 };
    }
  }
};

export default pricingService;
