import api from "./api";

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface PricingCalculation {
  basePrice: number;
  distancePrice: number;
  serviceFee: number;
  total: number;
  currency: string;
  platformFee?: number;
  driverValue?: number;
}

export interface DistanceDuration {
  value: number;
  text: string;
}

export interface RideDetails {
  itemType?: string;
  needsHelper?: boolean;
  insurance?: "none" | "basic" | "standard" | "premium";
  specialInstructions?: string;
}

export interface CreateRideRequest {
  serviceType: "ride" | "delivery";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  purposeId?: string;
  pickup: Location;
  dropoff: Location;
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  details?: RideDetails;
  payment?: {
    method?: {
      type?: "credit_card" | "pix" | "cash";
    };
  };
}

export interface Ride {
  _id: string;
  clientId: any;
  driverId?: any;
  serviceType: string;
  vehicleType: string;
  purposeId?: string;
  pickup: Location;
  dropoff: Location;
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  details?: RideDetails;
  status: string;
  requestedAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  payment?: { 
      method?: { 
          type?: string 
      } 
  };
  createdAt: string;
  updatedAt: string;
}

export interface CalculatePriceRequest {
  pickup: Location;
  dropoff: Location;
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  purposeId?: string;
}

export interface CalculatePriceResponse {
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
}

export interface ActiveRideResponse {
  active: boolean;
  ride: Ride | null;
}

export type RatePayload = {
  stars: number;
  comment?: string;
};

export interface DriverStats {
  earnings: number;
  rides: number;
  goal: number;
  bonus: number;
}

class RideService {
  /**
   * Calcular preço da corrida
   */
  async calculatePrice(
    data: CalculatePriceRequest,
  ): Promise<CalculatePriceResponse> {
    try {
      const response = await api.post("/rides/calculate-price", data);
      return response.data;
    } catch (e: any) {
      // melhora mensagem no app
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Falha ao calcular preço";
      throw new Error(msg);
    }
  }

  /**
   * Criar nova solicitação de corrida
   */
  async create(data: CreateRideRequest): Promise<Ride> {
    const response = await api.post("/rides", data);
    return response.data.ride;
  }

  /**
   * Buscar corrida ativa (para retomar ao abrir o app / ficar online)
   */
  async getActive(): Promise<ActiveRideResponse> {
    const response = await api.get("/rides/active");
    return response.data;
  }

  /**
   * Buscar corrida por ID
   */
  async getById(rideId: string): Promise<Ride> {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  }

  /**
   * Buscar histórico de corridas
   */
  async getHistory(params?: {
    status?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    rides: Ride[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      pages: number;
    };
  }> {
    const response = await api.get("/rides", { params });
    return response.data;
  }

  /**
   * Cancelar corrida
   */
  async cancel(rideId: string, reason?: string): Promise<void> {
    await api.post(`/rides/${rideId}/cancel`, { reason });
  }

  /**
   * Aceitar corrida (motorista)
   */
  async accept(rideId: string): Promise<Ride> {
    const response = await api.post(`/rides/${rideId}/accept`);
    return response.data.ride;
  }

  /**
   * Rejeitar corrida (motorista)
   */
  async reject(rideId: string, reason?: string): Promise<void> {
    await api.post(`/rides/${rideId}/reject`, { reason });
  }

  /**
   * Atualizar status da corrida (motorista)
   */
  async updateStatus(rideId: string, status: string): Promise<Ride> {
    const response = await api.patch(`/rides/${rideId}/status`, { status });
    return response.data.ride;
  }

  /**
   * Cliente avalia motorista
   */
  async rateClientToDriver(rideId: string, payload: RatePayload): Promise<void> {
    await api.post(`/rides/${rideId}/rate-client`, payload);
  }

  /**
   * Motorista avalia cliente
   */
  async rateDriverToClient(rideId: string, payload: RatePayload): Promise<void> {
    await api.post(`/rides/${rideId}/rate-driver`, payload);
  }

  /**
   * Prova de coleta (entrega)
   */
  async uploadPickupProof(rideId: string, photoBase64: string): Promise<void> {
    await api.post(`/rides/${rideId}/proof/pickup`, { photoBase64 });
  }

  /**
   * Prova de entrega (entrega)
   */
  async uploadDeliveryProof(rideId: string, photoBase64: string): Promise<void> {
    await api.post(`/rides/${rideId}/proof/delivery`, { photoBase64 });
  }

  /**
   * Estatísticas do motorista (dashboard)
   */
  async getDriverStats(): Promise<DriverStats> {
    const response = await api.get("/rides/stats");
    return response.data;
  }

  /**
   * Histórico de ganhos (gráfico)
   */
  async getEarningsHistory(period: 'day' | 'week' | 'month' = 'week'): Promise<{ label: string; value: number; count?: number }[]> {
    const response = await api.get("/rides/earnings-history", {
        params: { period }
    });
    return response.data;
  }
}

export default new RideService();
