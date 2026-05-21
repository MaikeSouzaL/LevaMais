import api from './api';

export interface PricingRule {
  _id: string;
  vehicleCategory: string;
  purposeId?: { _id: string; name: string } | string; // Pode vir populado ou ID
  pricing: {
    basePrice: number;
    minimumFee: number;
    pricePerKm: number;
    pricePerMinute: number;
  };
}

const pricingService = {
  /**
   * Busca regras de preço (sem filtro por cidade, backend não suporta mais)
   */
  getRules: async () => {
    const response = await api.get<PricingRule[]>('/pricing', {
      params: { active: true }
    });
    return response.data;
  },

  /**
   * Busca configuração global de preços
   */
  getConfig: async () => {
      const response = await api.get('/pricing/config');
      return response.data;
  }
};

export default pricingService;
