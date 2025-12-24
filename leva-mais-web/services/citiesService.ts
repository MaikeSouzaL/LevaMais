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
 * Representante da cidade
 */
export interface CityRepresentative {
  _id?: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  cnpj?: string; // Opcional se for PJ
  isActive: boolean;
  createdAt?: string;
}

/**
 * Configuração de revenue sharing
 */
export interface RevenueSharing {
  representativePercentage: number; // % do representante (padrão 50%)
  platformPercentage: number; // % da plataforma (padrão 50%)
  minimumMonthlyFee?: number; // Taxa mínima mensal (opcional)
  paymentDay: number; // Dia do mês para pagamento (1-31)
}

/**
 * Cidade no sistema
 */
export interface City {
  _id?: string;
  name: string;
  state: string;
  region: "Norte" | "Nordeste" | "Centro-Oeste" | "Sudeste" | "Sul";
  ibgeCode?: string; // Código IBGE da cidade
  timezone: string; // Ex: "America/Sao_Paulo"

  // Representante
  representative?: CityRepresentative;
  representativeId?: string;

  // Revenue Sharing
  revenueSharing: RevenueSharing;

  // Configurações
  pricingConfigId?: string; // Ref para PricingConfig específico da cidade
  isActive: boolean;

  // Estatísticas
  stats?: {
    totalDrivers: number;
    totalClients: number;
    totalRides: number;
    monthlyRevenue: number;
  };

  createdAt?: string;
  updatedAt?: string;
}

/**
 * Filtros para busca de cidades
 */
export interface CityFilters {
  search?: string; // Nome ou estado
  region?: string;
  isActive?: boolean;
  hasRepresentative?: boolean;
}

/**
 * Estatísticas de uma cidade
 */
export interface CityStats {
  totalRides: number;
  completedRides: number;
  cancelledRides: number;
  totalRevenue: number;
  platformRevenue: number;
  representativeRevenue: number;
  totalDrivers: number;
  activeDrivers: number;
  totalClients: number;
  activeClients: number;
  averageRideValue: number;
  period: {
    start: string;
    end: string;
  };
}

class CitiesService {
  /**
   * Buscar todas as cidades
   */
  async getAll(filters?: CityFilters): Promise<City[]> {
    try {
      const response = await api.get("/cities", { params: filters });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("Erro ao buscar cidades:", error);
        throw new Error(
          error.response?.data?.message || "Erro ao buscar cidades"
        );
      }
      console.error("Erro desconhecido:", error);
      throw error;
    }
  }

  /**
   * Buscar cidade por ID
   */
  async getById(id: string): Promise<City> {
    try {
      const response = await api.get(`/cities/${id}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao buscar cidade:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao buscar cidade"
        );
      }
      throw error;
    }
  }

  /**
   * Criar nova cidade
   */
  async create(
    city: Omit<City, "_id" | "createdAt" | "updatedAt">
  ): Promise<City> {
    try {
      const response = await api.post("/cities", city);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar cidade:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao criar cidade"
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar cidade
   */
  async update(id: string, data: Partial<City>): Promise<City> {
    try {
      const response = await api.put(`/cities/${id}`, data);
      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar cidade:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao atualizar cidade"
        );
      }
      throw error;
    }
  }

  /**
   * Deletar cidade
   */
  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/cities/${id}`);
    } catch (error) {
      console.error("Erro ao deletar cidade:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao deletar cidade"
        );
      }
      throw error;
    }
  }

  /**
   * Ativar/Desativar cidade
   */
  async toggleActive(id: string, isActive: boolean): Promise<City> {
    try {
      const response = await api.patch(`/cities/${id}/toggle`, { isActive });
      return response.data.city;
    } catch (error) {
      console.error("Erro ao alterar status da cidade:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao alterar status"
        );
      }
      throw error;
    }
  }

  /**
   * Associar representante à cidade
   */
  async assignRepresentative(
    cityId: string,
    representative: CityRepresentative
  ): Promise<City> {
    try {
      const response = await api.post(
        `/cities/${cityId}/representative`,
        representative
      );
      return response.data.city;
    } catch (error) {
      console.error("Erro ao associar representante:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao associar representante"
        );
      }
      throw error;
    }
  }

  /**
   * Remover representante da cidade
   */
  async removeRepresentative(cityId: string): Promise<City> {
    try {
      const response = await api.delete(`/cities/${cityId}/representative`);
      return response.data.city;
    } catch (error) {
      console.error("Erro ao remover representante:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao remover representante"
        );
      }
      throw error;
    }
  }

  /**
   * Atualizar configuração de revenue sharing
   */
  async updateRevenueSharing(
    cityId: string,
    revenueSharing: RevenueSharing
  ): Promise<City> {
    try {
      const response = await api.put(
        `/cities/${cityId}/revenue-sharing`,
        revenueSharing
      );
      return response.data.city;
    } catch (error) {
      console.error("Erro ao atualizar revenue sharing:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao atualizar revenue sharing"
        );
      }
      throw error;
    }
  }

  /**
   * Buscar estatísticas de uma cidade
   */
  async getStats(
    cityId: string,
    startDate?: string,
    endDate?: string
  ): Promise<CityStats> {
    try {
      const response = await api.get(`/cities/${cityId}/stats`, {
        params: { startDate, endDate },
      });
      return response.data.stats;
    } catch (error) {
      console.error("Erro ao buscar estatísticas:", error);
      if (axios.isAxiosError(error)) {
        throw new Error(
          error.response?.data?.message || "Erro ao buscar estatísticas"
        );
      }
      throw error;
    }
  }

  /**
   * Buscar regiões disponíveis
   */
  getRegions(): string[] {
    return ["Norte", "Nordeste", "Centro-Oeste", "Sudeste", "Sul"];
  }

  /**
   * Buscar timezones do Brasil
   */
  getTimezones(): { value: string; label: string }[] {
    return [
      // UTC-5 (Acre)
      { value: "America/Rio_Branco", label: "Acre - Rio Branco (UTC-5)" },

      // UTC-4 (Amazonas, Rondônia, Roraima, Mato Grosso)
      { value: "America/Manaus", label: "Amazonas - Manaus (UTC-4)" },
      { value: "America/Porto_Velho", label: "Rondônia - Porto Velho (UTC-4)" },
      { value: "America/Boa_Vista", label: "Roraima - Boa Vista (UTC-4)" },
      { value: "America/Cuiaba", label: "Mato Grosso - Cuiabá (UTC-4)" },

      // UTC-3 (Brasília - Maior parte do Brasil)
      { value: "America/Sao_Paulo", label: "São Paulo - Brasília (UTC-3)" },
      { value: "America/Bahia", label: "Bahia - Salvador (UTC-3)" },
      { value: "America/Fortaleza", label: "Ceará - Fortaleza (UTC-3)" },
      { value: "America/Recife", label: "Pernambuco - Recife (UTC-3)" },
      { value: "America/Belem", label: "Pará - Belém (UTC-3)" },
      { value: "America/Maceio", label: "Alagoas - Maceió (UTC-3)" },
      { value: "America/Araguaina", label: "Tocantins - Araguaína (UTC-3)" },
      { value: "America/Santarem", label: "Pará - Santarém (UTC-3)" },

      // UTC-2 (Fernando de Noronha)
      { value: "America/Noronha", label: "Fernando de Noronha (UTC-2)" },
    ];
  }

  /**
   * Validar configuração de revenue sharing
   */
  validateRevenueSharing(revenueSharing: RevenueSharing): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Soma deve ser 100%
    const total =
      revenueSharing.representativePercentage +
      revenueSharing.platformPercentage;
    if (Math.abs(total - 100) > 0.01) {
      errors.push("A soma das porcentagens deve ser 100%");
    }

    // Representante deve ter entre 0-100%
    if (
      revenueSharing.representativePercentage < 0 ||
      revenueSharing.representativePercentage > 100
    ) {
      errors.push("Porcentagem do representante deve estar entre 0% e 100%");
    }

    // Plataforma deve ter entre 0-100%
    if (
      revenueSharing.platformPercentage < 0 ||
      revenueSharing.platformPercentage > 100
    ) {
      errors.push("Porcentagem da plataforma deve estar entre 0% e 100%");
    }

    // Dia do pagamento válido
    if (revenueSharing.paymentDay < 1 || revenueSharing.paymentDay > 31) {
      errors.push("Dia de pagamento deve estar entre 1 e 31");
    }

    // Taxa mínima não pode ser negativa
    if (
      revenueSharing.minimumMonthlyFee !== undefined &&
      revenueSharing.minimumMonthlyFee < 0
    ) {
      errors.push("Taxa mínima mensal não pode ser negativa");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Configuração padrão de revenue sharing (50/50)
   */
  getDefaultRevenueSharing(): RevenueSharing {
    return {
      representativePercentage: 50,
      platformPercentage: 50,
      paymentDay: 5, // Dia 5 de cada mês
      minimumMonthlyFee: 0,
    };
  }
}

export const citiesService = new CitiesService();
