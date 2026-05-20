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
  cargoSize?: "small" | "medium" | "large";
  approximateWeightKg?: number;
  isFragile?: boolean;
  pickupComplement?: string;
  dropoffComplement?: string;
  recipientName?: string;
  recipientPhone?: string;
  recipientInstructions?: string;
  pickupPin?: string;
  deliveryPin?: string;
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
  searchTimeoutSeconds?: number;
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
  cancellationFee?: number;
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
  arrivedAtDropoff?: boolean;
  updatedAt: string;
}

export interface RideOffer {
  driverId: string | { _id: string; name?: string; profilePhoto?: string };
  amount: number;
  status: "accepted" | "countered" | "rejected" | "client_countered";
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
  // Logistic Extensions for Smart Engine âš¡
  serviceType?: "ride" | "delivery";
  deliveryType?: string;
  cargoSize?: string;
  priority?: number;
  needsHelper?: boolean;
  isFragile?: boolean;
  approximateWeightKg?: number;
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
  pendingNegotiationsCount?: number;
  clientCounteredCount?: number;
}

export interface PendingNegotiationRequest extends AvailableRideRequest {
  status?: string;
  client?: AvailableRideRequest["client"] & { id?: string };
  negotiation?: AvailableRideRequest["negotiation"] & {
    myOffer?: {
      amount: number;
      driverAmount?: number;
      status: "accepted" | "countered" | "rejected" | "client_countered";
      message?: string;
      createdAt?: string;
      updatedAt?: string;
    } | null;
  };
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
  rating?: number;
  acceptanceRate?: number;
  onlineTime?: number;
  totalRides?: number;
  completedRides?: number;
}

class RideService {
  /**
   * Calcular preÃ§o da corrida
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
        "Falha ao calcular preÃ§o";
      throw new Error(msg);
    }
  }

  /**
   * Buscar motoristas prÃ³ximos
   */
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5000, 
    cityId?: string 
  ): Promise<Array<{
    id: string;
    name?: string;
    profilePhoto?: string | null;
    rating?: number;
    latitude: number;
    longitude: number;
    type: "motorcycle" | "car" | "van" | "truck";
    rotation: number;
    serviceTypes?: string[];
  }>> {
    const response = await api.get("/rides/nearby-drivers", {
      params: { latitude, longitude, radius, cityId }
    });
    return response.data;
  }

  /**
   * Criar nova solicitaÃ§Ã£o de corrida
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

  async getPendingNegotiations(): Promise<{
    count: number;
    requests: PendingNegotiationRequest[];
  }> {
    const response = await api.get("/rides/negotiations/pending");
    return {
      count: Number(response.data?.count || 0),
      requests: Array.isArray(response.data?.requests) ? response.data.requests : [],
    };
  }



  /**
   * Buscar corrida por ID
   */
  async getById(rideId: string): Promise<Ride> {
    const response = await api.get(`/rides/${rideId}`);
    return response.data;
  }

  /**
   * Buscar histÃ³rico de corridas
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
   * Promover corrida ativa para agendada
   */
  async promoteToScheduled(rideId: string, scheduledFor: string): Promise<any> {
    const response = await api.post(`/rides/${rideId}/promote-to-scheduled`, { scheduledFor });
    return response.data;
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

  async updateStatus(
    rideId: string, 
    status?: string, 
    arrivedAtDropoff?: boolean, 
    pins?: { pickupPin?: string; deliveryPin?: string }
  ): Promise<Ride> {
    const body: any = {};
    if (status) body.status = status;
    if (arrivedAtDropoff) body.arrivedAtDropoff = true;
    if (pins?.pickupPin) body.pickupPin = pins.pickupPin;
    if (pins?.deliveryPin) body.deliveryPin = pins.deliveryPin;
    const response = await api.patch(`/rides/${rideId}/status`, body);
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

  async confirmNegotiationPayment(
    rideId: string,
    payload: { method: "cash" | "card" | "wallet" | "pix" },
  ): Promise<Ride> {
    const response = await api.post(`/rides/${rideId}/payment/confirm`, payload);
    return response.data?.ride;
  }

  async cancelPaymentSelection(rideId: string): Promise<Ride> {
    const response = await api.post(`/rides/${rideId}/payment/cancel-selection`);
    return response.data?.ride;
  }

  async clientCounterOffer(rideId: string, driverId: string, amount: number): Promise<any> {
    const response = await api.post(`/rides/${rideId}/offers/client-counter`, { driverId, amount });
    return response.data;
  }

  async declineOffer(rideId: string, driverId: string): Promise<any> {
    const response = await api.post(`/rides/${rideId}/offers/decline`, { driverId });
    return response.data;
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
   * EstatÃ­sticas do motorista (dashboard)
   */
  async getDriverStats(): Promise<DriverStats> {
    const response = await api.get("/rides/stats");
    return response.data;
  }

  /**
   * HistÃ³rico de ganhos (grÃ¡fico)
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
   * Buscar agendamentos disponÃ­veis sem motoristas (para motoristas)
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
   * Colocar a corrida na fila de espera pÃºblica
   */
  async enterWaitingQueue(rideId: string): Promise<any> {
    const response = await api.post(`/rides/${rideId}/queue`);
    return response.data;
  }

  /**
   * Aumentar oferta base do cliente para atrair motoristas âœ¨ðŸ’¸
   */
  async increaseOffer(rideId: string, incrementAmount: number = 2): Promise<any> {
    const response = await api.post(`/rides/${rideId}/offers/increase`, { incrementAmount });
    return response.data;
  }
}

export default new RideService();
