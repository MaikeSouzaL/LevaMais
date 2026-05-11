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
  subtotal?: number;
  discountAmount?: number;
  promotionCode?: string;
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
  priority?: number;
  specialInstructions?: string;
}

export interface CreateRideRequest {
  serviceType: "ride" | "delivery";
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  cityId?: string;
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
  scheduledFor?: string;
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number;
  };
  promotionCode?: string;
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
  scheduledFor?: string;
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    finalAgreedPrice?: number | null;
    selectedDriverId?: string | null;
    offers?: RideOffer[];
  };
  promotion?: {
    promotionId?: string;
    code?: string;
    discountType?: "fixed" | "percentage";
    discountValue?: number;
    discountAmount?: number;
    appliedAt?: string;
  };
  payment?: {
    method?: {
      type?: string;
    };
  };
  createdAt: string;
  isWaitingInQueue?: boolean;
  updatedAt: string;
}

export interface RideOffer {
  driverId: string | { _id: string; name?: string; profilePhoto?: string };
  amount: number;
  status: "accepted" | "countered" | "rejected";
  message?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CalculatePriceRequest {
  pickup: Location;
  dropoff: Location;
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  cityId?: string;
  purposeId?: string;
  // Logistic Extensions for Smart Engine ⚡
  serviceType?: "ride" | "delivery";
  deliveryType?: string;
  cargoSize?: string;
  priority?: number;
  needsHelper?: boolean;
  // Pre-computed precise routing metrics from trusted client
  distance?: number;
  duration?: number;
}

export interface CalculatePriceResponse {
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  smartPricing?: {
    minimumPrice: number;
    suggestedPrice: number;
    priorityPrice: number;
    distanceKm: number;
    demandLevel: string;
    deliveryScore: number;
  };
}

export interface ActiveRideResponse {
  active: boolean;
  ride: Ride | null;
}

export interface ActiveRidesResponse {
  active: boolean;
  count: number;
  rides: Ride[];
}

export interface AvailableRideRequest {
  rideId: string;
  pickup?: Location;
  dropoff?: Location;
  pricing?: PricingCalculation;
  distance?: DistanceDuration;
  duration?: DistanceDuration;
  serviceType?: string;
  vehicleType?: string;
  requestedAt?: string;
  distanceToPickup?: number;
  client?: {
    name?: string;
    phone?: string;
    profilePhoto?: string;
    rating?: number;
  };
  negotiation?: {
    enabled?: boolean;
    clientOffer?: number | null;
    suggestedMinPrice?: number | null;
    finalAgreedPrice?: number | null;
  };
}

export interface AvailableRideRequestsResponse {
  count: number;
  requests: AvailableRideRequest[];
  waitingQueueCount?: number;
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
   * Buscar motoristas próximos
   */
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5000, // 5km radius (fallback)
    cityId?: string // Para usar raio configurado da cidade
  ): Promise<Array<{
    id: string;
    latitude: number;
    longitude: number;
    type: "motorcycle" | "car" | "van" | "truck";
    rotation: number;
  }>> {
    const response = await api.get("/rides/nearby-drivers", {
      params: { latitude, longitude, radius, cityId }
    });
    return response.data;
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

  async getActiveList(): Promise<ActiveRidesResponse> {
    const response = await api.get("/rides/active/list");
    return response.data;
  }

  async getAvailableRequests(): Promise<AvailableRideRequestsResponse> {
    const response = await api.get("/rides/available-requests");
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
  async cancel(
    rideId: string,
    reason?: string,
  ): Promise<{ message?: string; cancellationFee?: number }> {
    const response = await api.post(`/rides/${rideId}/cancel`, { reason });
    return response.data || {};
  }

  /**
   * Reiniciar busca da corrida (tentar novamente)
   */
  async retry(rideId: string): Promise<any> {
    const response = await api.post(`/rides/${rideId}/retry`);
    return response.data;
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
  async rateClientToDriver(
    rideId: string,
    payload: RatePayload,
  ): Promise<void> {
    await api.post(`/rides/${rideId}/rate-client`, payload);
  }

  /**
   * Motorista avalia cliente
   */
  async rateDriverToClient(
    rideId: string,
    payload: RatePayload,
  ): Promise<void> {
    await api.post(`/rides/${rideId}/rate-driver`, payload);
  }

  async addTip(rideId: string, amount: number): Promise<void> {
    await api.post(`/rides/${rideId}/tip`, { amount });
  }

  async getOffers(rideId: string): Promise<{
    negotiation: {
      enabled: boolean;
      clientOffer: number | null;
      suggestedMinPrice: number | null;
      finalAgreedPrice: number | null;
      selectedDriverId?: string | null;
    };
    offers: RideOffer[];
  }> {
    const response = await api.get(`/rides/${rideId}/offers`);
    return {
      negotiation: response.data?.negotiation || {
        enabled: false,
        clientOffer: null,
        suggestedMinPrice: null,
        finalAgreedPrice: null,
      },
      offers: response.data?.offers || [],
    };
  }

  async respondToOffer(
    rideId: string,
    payload: { action: "accept" | "counter" | "reject"; amount?: number; message?: string },
  ): Promise<void> {
    await api.post(`/rides/${rideId}/offers/respond`, payload);
  }

  async selectOffer(rideId: string, driverId: string): Promise<Ride> {
    const response = await api.post(`/rides/${rideId}/offers/select`, { driverId });
    return response.data?.ride;
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
  async uploadDeliveryProof(
    rideId: string,
    photoBase64: string,
  ): Promise<void> {
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
  async getEarningsHistory(
    period: "day" | "week" | "month" = "week",
  ): Promise<{ label: string; value: number; count?: number }[]> {
    const response = await api.get("/rides/earnings-history", {
      params: { period },
    });
    return response.data;
  }

  /**
   * Buscar agendamentos disponíveis sem motoristas (para motoristas)
   */
  async getAvailableScheduledRides(): Promise<{ count: number; rides: Ride[] }> {
    const response = await api.get("/rides/scheduled/available");
    return response.data;
  }

  /**
   * Aceitar corrida agendada antecipadamente
   */
  async acceptScheduledRide(rideId: string): Promise<{ message: string; ride: Ride }> {
    const response = await api.post(`/rides/${rideId}/accept-scheduled`);
    return response.data;
  }

  /**
   * Colocar a corrida na fila de espera pública
   */
  async enterWaitingQueue(rideId: string): Promise<any> {
    const response = await api.post(`/rides/${rideId}/queue`);
    return response.data;
  }
}

export default new RideService();
