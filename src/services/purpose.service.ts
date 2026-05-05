import api from './api';

export interface Purpose {
  _id: string;
  id: string; // slug (ex: 'delivery', 'moto-taxi')
  title: string;
  subtitle: string;
  serviceMode?: "ride" | "delivery" | "frete";
  vehicleType: 'motorcycle' | 'car' | 'van' | 'truck';
  icon: string;
  badges?: string[];
  isActive: boolean;
}

const purposeService = {
  /**
   * Busca todos os tipos de serviço ativos
   */
  getAll: async (isActive = true) => {
    // Busca na rota raiz /purposes
    const response = await api.get<Purpose[]>('/purposes', {
      params: { isActive }
    });
    return response.data;
  },

  /**
   * Busca tipos de serviço por categoria de veículo
   */
  getByVehicle: async (vehicleType: string) => {
     const response = await api.get<Purpose[]>(`/purposes/${vehicleType}`, {
         params: { isActive: true }
     });
     return response.data;
  }
};

export default purposeService;
