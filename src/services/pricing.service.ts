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
   * Busca regras de preço para uma cidade específica
   */
  getRules: async (cityId: string) => {
    // Rota mapeada em routes/pricing.routes.js como '/'
    const response = await api.get<PricingRule[]>('/pricing', {
      params: { cityId, active: true }
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
