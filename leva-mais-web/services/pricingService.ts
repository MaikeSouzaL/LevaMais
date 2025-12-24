import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

// Criar instância do axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Configuração de preço por tipo de veículo
 */
export interface VehiclePricing {
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  pricePerKm: number; // Preço por km rodado
  minimumKm: number; // Km mínimo da corrida
  minimumFee?: number; // Valor mínimo (taxa mínima) da corrida
  enabled: boolean; // Se este tipo está ativo
}

/**
 * Horário de pico com multiplicador
 */
export interface PeakHour {
  id: string;
  name: string;
  dayOfWeek: number[]; // 0-6 (Domingo-Sábado)
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  multiplier: number; // Multiplicador do preço (ex: 1.5 = +50%)
  enabled: boolean;
}

/**
 * Taxa de cancelamento
 */
export interface CancellationFee {
  type: "client" | "driver";
  timeLimit: number; // Minutos após aceitar
  feePercentage: number; // % do valor da corrida
  minimumFee: number; // Taxa mínima fixa
  enabled: boolean;
}

/**
 * Configurações gerais da plataforma
 */
export interface PlatformSettings {
  platformFeePercentage: number; // Taxa da plataforma (%)
  searchRadius: number; // Raio de busca em km
  driverTimeoutSeconds: number; // Tempo de espera por motorista
  maxDriversToNotify: number; // Máximo de motoristas a notificar
  autoAcceptRadius: number; // Raio para aceitação automática (km)
}

/**
 * Preço adicional por tipo de finalidade
 */
export interface PurposePricing {
  purposeId: string;
  purposeName: string;
  additionalPercentage: number; // % adicional sobre o preço base
  additionalFixed: number; // Valor fixo adicional
  enabled: boolean;
}

/**
 * Configuração completa de preços
 */
export interface PricingConfig {
  _id?: string;
  vehiclePricing: VehiclePricing[];
  peakHours: PeakHour[];
  cancellationFees: CancellationFee[];
  platformSettings: PlatformSettings;
  purposePricing: PurposePricing[];
  updatedAt?: string;
  updatedBy?: string;
}

class PricingService {
  /**
   * Buscar configuração de preços
   */
  async getConfig(): Promise<PricingConfig> {
    try {
      const response = await api.get("/pricing/config");
      const cfg: PricingConfig = response.data.config;
      // Normalizar vehiclePricing para garantir minimumKm definido
      if (Array.isArray(cfg.vehiclePricing)) {
        cfg.vehiclePricing = cfg.vehiclePricing.map(
          (vp: Partial<VehiclePricing> & { minimumPrice?: number }) => {
            const pricePerKm =
              typeof vp.pricePerKm === "number" ? vp.pricePerKm : 0;
            let minimumKm = vp.minimumKm;
            if (typeof minimumKm !== "number" || Number.isNaN(minimumKm)) {
              // Se vier legado com minimumPrice, tenta converter para km mínimo aproximado
              if (typeof vp.minimumPrice === "number" && pricePerKm > 0) {
                minimumKm = Math.max(0, vp.minimumPrice / pricePerKm);
              } else {
                minimumKm = 0;
              }
            }
            return {
              ...vp,
              minimumKm,
            } as VehiclePricing;
          }
        );
      }
      return cfg;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        // Se não existir endpoint/config (404/500), retornar padrão
        if (error.response?.status === 404 || error.response?.status === 500) {
          console.info(
            "ℹ️ Backend não implementado. Usando configuração padrão."
          );
          return this.getDefaultConfig();
        }
        console.error("Erro ao buscar configuração:", error);
        throw new Error(
          error.response?.data?.message || "Erro ao buscar configuração"
        );
      }
      console.error("Erro desconhecido:", error);
      throw error;
    }
  }

  /**
   * Atualizar configuração de preços
   */
  async updateConfig(config: Partial<PricingConfig>): Promise<PricingConfig> {
    try {
      const response = await api.put("/pricing/config", config);
      return response.data.config;
    } catch (error) {
      console.error("Erro ao atualizar configuração:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao atualizar configuração"
        );
      }
      throw error;
    }
  }

  /**
   * Calcular preço estimado
   */
  async calculateEstimate(params: {
    vehicleType: string;
    distance: number; // km
    purposeId?: string;
  }): Promise<{
    distancePrice: number;
    purposePrice: number;
    peakMultiplier: number;
    platformFee: number;
    totalPrice: number;
  }> {
    try {
      const response = await api.post("/pricing/estimate", params);
      return response.data;
    } catch (error) {
      console.error("Erro ao calcular estimativa:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao calcular estimativa"
        );
      }
      throw error;
    }
  }

  /**
   * Configuração padrão
   */
  getDefaultConfig(): PricingConfig {
    return {
      vehiclePricing: [
        {
          vehicleType: "motorcycle",
          pricePerKm: 1.5,
          minimumKm: 0,
          minimumFee: 0,
          enabled: true,
        },
        {
          vehicleType: "car",
          pricePerKm: 2.0,
          minimumKm: 0,
          minimumFee: 0,
          enabled: true,
        },
        {
          vehicleType: "van",
          pricePerKm: 3.5,
          minimumKm: 0,
          minimumFee: 0,
          enabled: true,
        },
        {
          vehicleType: "truck",
          pricePerKm: 5.0,
          minimumKm: 0,
          minimumFee: 0,
          enabled: true,
        },
      ],
      peakHours: [
        {
          id: "morning_rush",
          name: "Horário de Pico - Manhã",
          dayOfWeek: [1, 2, 3, 4, 5], // Segunda a Sexta
          startTime: "07:00",
          endTime: "09:00",
          multiplier: 1.3,
          enabled: true,
        },
        {
          id: "evening_rush",
          name: "Horário de Pico - Tarde",
          dayOfWeek: [1, 2, 3, 4, 5],
          startTime: "17:00",
          endTime: "19:00",
          multiplier: 1.3,
          enabled: true,
        },
        {
          id: "weekend",
          name: "Final de Semana",
          dayOfWeek: [0, 6], // Domingo e Sábado
          startTime: "00:00",
          endTime: "23:59",
          multiplier: 1.2,
          enabled: true,
        },
      ],
      cancellationFees: [
        {
          type: "client",
          timeLimit: 5,
          feePercentage: 20,
          minimumFee: 5.0,
          enabled: true,
        },
        {
          type: "driver",
          timeLimit: 2,
          feePercentage: 10,
          minimumFee: 0,
          enabled: true,
        },
      ],
      platformSettings: {
        platformFeePercentage: 15,
        searchRadius: 10,
        driverTimeoutSeconds: 30,
        maxDriversToNotify: 5,
        autoAcceptRadius: 2,
      },
      purposePricing: [],
    };
  }

  /**
   * Validar configuração
   */
  validateConfig(config: Partial<PricingConfig>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar preços de veículos
    if (config.vehiclePricing) {
      config.vehiclePricing.forEach((vp, index) => {
        if (vp.pricePerKm < 0) {
          errors.push(
            `Veículo ${index + 1}: Preço por km não pode ser negativo`
          );
        }
        if (vp.minimumKm < 0) {
          errors.push(
            `Veículo ${index + 1}: Km mínimo deve ser maior ou igual a 0`
          );
        }
        if (vp.minimumFee != null && vp.minimumFee < 0) {
          errors.push(
            `Veículo ${index + 1}: Taxa mínima deve ser maior ou igual a 0`
          );
        }
      });
    }

    // Validar horários de pico
    if (config.peakHours) {
      config.peakHours.forEach((ph, index) => {
        if (ph.multiplier < 1) {
          errors.push(
            `Horário de pico ${
              index + 1
            }: Multiplicador deve ser maior ou igual a 1`
          );
        }
      });
    }

    // Validar configurações da plataforma
    if (config.platformSettings) {
      const ps = config.platformSettings;
      if (ps.platformFeePercentage < 0 || ps.platformFeePercentage > 50) {
        errors.push("Taxa da plataforma deve estar entre 0% e 50%");
      }
      if (ps.searchRadius < 1 || ps.searchRadius > 50) {
        errors.push("Raio de busca deve estar entre 1 e 50 km");
      }
      if (ps.driverTimeoutSeconds < 10 || ps.driverTimeoutSeconds > 120) {
        errors.push("Tempo de espera deve estar entre 10 e 120 segundos");
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const pricingService = new PricingService();
