import { supabase } from '../lib/supabase';

export interface PricingModel {
  /** Taxa base (já inclui os primeiros `includedKm`). */
  baseFare: number;
  /** Preço mínimo cobrado. */
  minFare: number;
  /** Km inclusos na taxa base (raio grátis). */
  includedKm: number;
  /** Preço por km acima de `includedKm`. */
  pricePerKm: number;
  /** Preço por minuto (0 em entrega). */
  pricePerMinute: number;
  /** Taxa por parada extra. */
  perStopFee: number;
}

export interface PricingRule {
  _id: string;
  vehicleCategory: string;
  serviceType: 'ride' | 'delivery';
  city: string | null;
  pricing: PricingModel;
}

function normalizeModel(p: any): PricingModel {
  return {
    baseFare: Number(p?.baseFare ?? 0),
    minFare: Number(p?.minFare ?? 0),
    includedKm: Number(p?.includedKm ?? 0),
    pricePerKm: Number(p?.pricePerKm ?? 0),
    pricePerMinute: Number(p?.pricePerMinute ?? 0),
    perStopFee: Number(p?.perStopFee ?? 0),
  };
}

/**
 * Calcula a tarifa com o modelo "base + raio grátis + km extra":
 *   total = max(minFare, baseFare
 *               + max(0, distanceKm - includedKm) * pricePerKm
 *               + durationMin * pricePerMinute
 *               + stopsCount * perStopFee)
 */
export function calculateFare(
  model: PricingModel,
  distanceKm: number,
  durationMin: number = 0,
  stopsCount: number = 0,
): {
  baseFare: number;
  distancePrice: number;
  timePrice: number;
  stopsFee: number;
  total: number;
  billableKm: number;
} {
  const billableKm = Math.max(0, distanceKm - model.includedKm);
  const distancePrice = Number((billableKm * model.pricePerKm).toFixed(2));
  const timePrice = Number((durationMin * model.pricePerMinute).toFixed(2));
  const stopsFee = Number((stopsCount * model.perStopFee).toFixed(2));
  const subtotal = model.baseFare + distancePrice + timePrice + stopsFee;
  const total = Number(Math.max(model.minFare, subtotal).toFixed(2));
  return { baseFare: model.baseFare, distancePrice, timePrice, stopsFee, total, billableKm };
}

const pricingService = {
  /**
   * Regras de preço do Supabase para um tipo de serviço e cidade.
   * Sem fallback mockado — se não houver regra configurada na dashboard, retorna vazio.
   * Prioriza regra da cidade; cai para a regra global (city = null).
   */
  getRules: async (
    serviceType: 'ride' | 'delivery' = 'ride',
    city?: string | null,
  ): Promise<PricingRule[]> => {
    let rows: PricingRule[] = [];
    
    try {
      const { data, error } = await supabase
        .from('pricing_rules')
        .select('*')
        .eq('active', true)
        .eq('service_type', serviceType);

      if (!error && data && data.length > 0) {
        rows = data.map((row: any) => ({
          _id: row.id,
          vehicleCategory: row.vehicle_category,
          serviceType: row.service_type,
          city: row.city ?? null,
          pricing: normalizeModel(row.pricing),
        }));
      }
    } catch {
      // Ignora erro e tenta o fallback do platform_config
    }

    // Se não houver regras no banco na tabela pricing_rules, tenta buscar do platform_config
    if (rows.length === 0) {
      try {
        const { data } = await supabase
          .from('platform_config')
          .select('value')
          .eq('key', 'global_config')
          .maybeSingle();

        const v = data?.value || {};
        const vehiclePricing = v.vehiclePricing || {};

        rows = Object.entries(vehiclePricing).map(([vehicleCategory, val]: any) => {
          const minFee = Number(val?.minimumFee ?? (vehicleCategory === 'motorcycle' ? 7.00 : 8.00));
          const minKm = Number(val?.minimumKm ?? 3);
          const pricePerKm = Number(val?.pricePerKm ?? 0.99);
          return {
            _id: `global_${vehicleCategory}`,
            vehicleCategory,
            serviceType,
            city: null,
            pricing: {
              baseFare: minFee,
              minFare: minFee,
              includedKm: minKm,
              pricePerKm: pricePerKm,
              pricePerMinute: serviceType === 'ride' ? (vehicleCategory === 'motorcycle' ? 0.10 : 0.20) : 0,
              perStopFee: 0,
            }
          };
        });
      } catch {
        // Ignora
      }
    }

    // Mantém apenas a regra mais específica por categoria (cidade > global)
    const byCategory = new Map<string, PricingRule>();
    for (const r of rows) {
      const matchesCity = city && r.city && r.city.toLowerCase() === city.toLowerCase();
      const isGlobal = !r.city;
      if (!matchesCity && !isGlobal) continue;
      const existing = byCategory.get(r.vehicleCategory);
      if (!existing || (matchesCity && !existing.city)) {
        byCategory.set(r.vehicleCategory, r);
      }
    }
    return Array.from(byCategory.values());
  },

  /** Configuração global da plataforma (taxa, gating de saldo, timeouts). */
  getConfig: async (): Promise<{
    appFeePercentage: number;
    minDriverBalanceToGoOnline: number;
    rideSearchTimeoutSeconds: number;
    allowNegativeBalance: boolean;
  }> => {
    const { data } = await supabase
      .from('platform_config')
      .select('value')
      .eq('key', 'global_config')
      .maybeSingle();
    const v = data?.value || {};
    return {
      appFeePercentage: Number(v.appFeePercentage ?? 15),
      minDriverBalanceToGoOnline: Number(v.minDriverBalanceToGoOnline ?? 5),
      rideSearchTimeoutSeconds: Number(v.rideSearchTimeoutSeconds ?? 60),
      allowNegativeBalance: Boolean(v.allowNegativeBalance ?? true),
    };
  },
};

export default pricingService;
