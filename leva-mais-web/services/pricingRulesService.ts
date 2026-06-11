import { supabase } from "../lib/supabase";

export type ServiceType = "ride" | "delivery";
export type VehicleCategory = "motorcycle" | "car" | "van" | "truck";

export interface PricingModel {
  /** Preço mínimo cobrado (cobre os primeiros `includedKm`). */
  minFare: number;
  /** Taxa base (somada ao km extra; geralmente igual ao minFare em entrega). */
  baseFare: number;
  /** Km inclusos no preço mínimo (raio sem cobrança extra). */
  includedKm: number;
  /** Preço por km acima de `includedKm`. */
  pricePerKm: number;
  /** Preço por minuto (normalmente 0 em entrega). */
  pricePerMinute: number;
  /** Taxa por parada extra. */
  perStopFee: number;
}

export interface PricingRule {
  id: string;
  serviceType: ServiceType;
  vehicleCategory: VehicleCategory;
  /** Cidade (null = regra global/padrão usada quando não há regra da cidade). */
  city: string | null;
  pricing: PricingModel;
  active: boolean;
}

export const VEHICLE_CATEGORIES: VehicleCategory[] = ["motorcycle", "car", "van", "truck"];

export const VEHICLE_LABELS: Record<VehicleCategory, string> = {
  motorcycle: "Moto",
  car: "Carro",
  van: "Van",
  truck: "Caminhão/Baú",
};

export function emptyModel(): PricingModel {
  return {
    minFare: 0,
    baseFare: 0,
    includedKm: 0,
    pricePerKm: 0,
    pricePerMinute: 0,
    perStopFee: 0,
  };
}

function normalizeModel(p: any): PricingModel {
  return {
    minFare: Number(p?.minFare ?? 0),
    baseFare: Number(p?.baseFare ?? 0),
    includedKm: Number(p?.includedKm ?? 0),
    pricePerKm: Number(p?.pricePerKm ?? 0),
    pricePerMinute: Number(p?.pricePerMinute ?? 0),
    perStopFee: Number(p?.perStopFee ?? 0),
  };
}

function mapRow(row: any): PricingRule {
  return {
    id: row.id,
    serviceType: row.service_type,
    vehicleCategory: row.vehicle_category,
    city: row.city ?? null,
    pricing: normalizeModel(row.pricing),
    active: Boolean(row.active),
  };
}

/** Normaliza o nome da cidade para comparação (case-insensitive, sem espaços nas pontas). */
export function cityKey(city: string | null | undefined): string {
  return String(city ?? "").trim().toLowerCase();
}

export const pricingRulesService = {
  /** Lista todas as regras (ativas e inativas) — requer admin. */
  async list(): Promise<PricingRule[]> {
    const { data, error } = await supabase
      .from("pricing_rules")
      .select("*")
      .order("city", { ascending: true, nullsFirst: true })
      .order("service_type", { ascending: true })
      .order("vehicle_category", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapRow);
  },

  /** Lista as cidades distintas já cadastradas (sem a regra global). */
  async listCities(): Promise<string[]> {
    const rules = await this.list();
    const set = new Map<string, string>();
    for (const r of rules) {
      if (r.city && r.city.trim()) set.set(cityKey(r.city), r.city.trim());
    }
    return Array.from(set.values()).sort((a, b) => a.localeCompare(b));
  },

  /**
   * Salva (insere ou atualiza) a regra de um veículo para um service_type + cidade.
   * `city` null/"" = regra global. Faz match por (service_type, vehicle_category, city)
   * normalizado para evitar duplicatas.
   */
  async upsertRule(input: {
    serviceType: ServiceType;
    vehicleCategory: VehicleCategory;
    city: string | null;
    pricing: PricingModel;
    active?: boolean;
  }): Promise<PricingRule> {
    const cityValue = input.city && input.city.trim() ? input.city.trim() : null;
    const active = input.active ?? true;

    // Procura regra existente (mesmo serviço + veículo + cidade, case-insensitive)
    const all = await this.list();
    const existing = all.find(
      (r) =>
        r.serviceType === input.serviceType &&
        r.vehicleCategory === input.vehicleCategory &&
        cityKey(r.city) === cityKey(cityValue),
    );

    if (existing) {
      const { data, error } = await supabase
        .from("pricing_rules")
        .update({
          pricing: input.pricing,
          active,
          city: cityValue,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) throw error;
      return mapRow(data);
    }

    const { data, error } = await supabase
      .from("pricing_rules")
      .insert({
        service_type: input.serviceType,
        vehicle_category: input.vehicleCategory,
        city: cityValue,
        pricing: input.pricing,
        active,
      })
      .select()
      .single();
    if (error) throw error;
    return mapRow(data);
  },

  /** Remove uma regra. */
  async remove(id: string): Promise<void> {
    const { error } = await supabase.from("pricing_rules").delete().eq("id", id);
    if (error) throw error;
  },

  /**
   * Cidades onde o app está sendo ativado (clientes cadastrados por cidade).
   * Mostra ao admin onde precisa configurar preços. Requer admin.
   */
  async activeCities(): Promise<{ city: string; clients: number }[]> {
    const { data, error } = await supabase.rpc("admin_active_cities");
    if (error) throw error;
    return (data || []).map((r: any) => ({ city: String(r.city), clients: Number(r.clients) }));
  },
};

export default pricingRulesService;
