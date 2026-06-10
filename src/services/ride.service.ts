import api from "./api";
import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import websocketService from "./websocket.service";
import deliveryService from "./delivery.service";

export interface Location {
  address: string;
  latitude: number;
  longitude: number;
}

export interface RouteCoordinate {
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
  rideCategory?: "moto" | "car_economy" | "car_comfort" | "car_luxury";
  purposeId?: string;
  pickup: Location;
  dropoff: Location;
  stops?: Location[];
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  details?: RideDetails;
  payment?: {
    method?: {
      type?: "credit_card" | "pix" | "cash" | "wallet";
    };
  };
  scheduledFor?: string;
  routeCoordinates?: RouteCoordinate[];
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
  rideCategory?: string;
  pickup: Location;
  dropoff: Location;
  stops?: Location[];
  pricing: PricingCalculation;
  distance: DistanceDuration;
  duration: DistanceDuration;
  routeCoordinates?: RouteCoordinate[];
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
    method?: string;
    status?: string;
    pixCode?: string;
    qrCodeData?: string;
  };
  createdAt: string;
  isWaitingInQueue?: boolean;
  arrivedAtDropoff?: boolean;
  updatedAt: string;
}

export interface RideOffer {
  driverId:
    | string
    | {
        _id: string;
        name?: string;
        profilePhoto?: string | null;
        rating?: number;
        completedRides?: number;
        /** % de corridas concluídas sem cancelar (confiança). null se poucos dados. */
        reliabilityPct?: number | null;
      };
  amount: number;
  status: "accepted" | "countered" | "rejected" | "client_countered";
  message?: string;
  createdAt?: string;
  updatedAt?: string;
  /**
   * Valor original da oferta do motorista. Quando o cliente faz contraproposta
   * (action = "client_countered"), o backend salva o valor original do motorista
   * aqui e atualiza `amount` para o valor da contraproposta.
   */
  driverAmount?: number | null;
  /** Tipo de veiculo em uso no momento (vem do DriverLocation). */
  vehicleType?: "bicycle" | "motorcycle" | "car" | "van" | "truck";
  /** Label amigavel: "Moto" | "Carro" | "Van" | "Caminhao" | "Bicicleta". */
  vehicleLabel?: string;
  /** Distancia real (rota Google) do motorista ate o ponto de embarque, em km. */
  distanceToPickupKm?: number | null;
  /** Tempo estimado de chegada (etaMinutes) calculado pelo backend. */
  etaMinutes?: number | null;
  /** Origem da metrica: "route_api" (real), "snapshot" ou "estimate" (haversine). */
  routeSource?: "route_api" | "snapshot" | "estimate" | null;
}

export interface CalculatePriceRequest {
  pickup: Location;
  dropoff: Location;
  stops?: Location[];
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  // Logistic Extensions for Smart Engine¡
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

export type RideCategoryKey = "moto" | "car_economy" | "car_comfort" | "car_luxury";

export interface RideCategoryOption {
  category: RideCategoryKey;
  label: string;
  description: string;
  icon: string;
  vehicleType: "motorcycle" | "car";
  maxPassengers: number;
  order: number;
  available?: boolean;
  availableCount?: number;
  pricing: {
    basePrice: number;
    distancePrice: number;
    timePrice: number;
    stopsFee: number;
    total: number;
    /** Faixa de lance permitida (simétrica, calculada no backend). */
    minPrice?: number;
    maxPrice?: number;
    bidRangeFactor?: number;
    currency: string;
    multiplier: number;
    feePerStop: number;
  };
}

export interface RideCategoriesResponse {
  categories: RideCategoryOption[];
  distance: DistanceDuration;
  duration: DistanceDuration;
  stopsCount: number;
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
  durationToPickup?: DistanceDuration | null;
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
  private mapToRideModel(row: any): Ride {
    return {
      _id: row.id,
      clientId: row.client_id,
      driverId: row.driver_id,
      serviceType: row.service_type,
      vehicleType: row.vehicle_type,
      rideCategory: row.ride_category,
      pickup: row.pickup,
      dropoff: row.dropoff,
      stops: row.stops,
      pricing: row.pricing,
      distance: row.distance,
      duration: row.duration,
      routeCoordinates: row.route_coordinates,
      details: row.details,
      status: row.status,
      cancellationFee: row.cancellation_fee,
      requestedAt: row.requested_at,
      acceptedAt: row.accepted_at,
      arrivedAt: row.arrived_at,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      cancelledAt: row.cancelled_at,
      scheduledFor: row.scheduled_for,
      negotiation: row.negotiation,
      promotion: row.promotion,
      payment: row.payment,
      isWaitingInQueue: row.is_waiting_in_queue,
      arrivedAtDropoff: row.arrived_at_dropoff,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  /**
   * Calcular estimativa de corrida (pré-cálculo para lance do cliente)
   */
  async calculateRideEstimate(data: {
    pickup: { latitude: number; longitude: number };
    dropoff: { latitude: number; longitude: number };
    vehicleType: "motorcycle" | "car";
    distance?: number;
    duration?: number;
  }): Promise<{
    success: boolean;
    suggestedPrice: number;
    minPrice: number;
    maxPrice: number;
    distanceKm: number;
    durationMin: number;
    pricingBreakdown: {
      baseFare: number;
      distancePrice: number;
      total: number;
    };
  }> {
    const distanceKm = data.distance || 5.0;
    const durationMin = data.duration || 10.0;
    const baseFare = data.vehicleType === "motorcycle" ? 4.5 : 6.0;
    const distancePrice = distanceKm * (data.vehicleType === "motorcycle" ? 1.2 : 2.0);
    const total = baseFare + distancePrice;
    return {
      success: true,
      suggestedPrice: total,
      minPrice: Math.max(5.0, total * 0.85),
      maxPrice: total * 1.25,
      distanceKm,
      durationMin,
      pricingBreakdown: {
        baseFare,
        distancePrice,
        total,
      },
    };
  }

  /**
   * Listar categorias de CORRIDA (moto/economy/comfort/luxury) com preços calculados.
   * Fluxo de corrida — separado de entrega.
   */
  async calculateRideCategories(data: {
    pickup: Location;
    dropoff: Location;
    stops?: Location[];
    cityId?: string;
    distance?: number;
    duration?: number;
  }): Promise<RideCategoriesResponse> {
    const distanceKm = data.distance || 5.0;
    const durationMin = data.duration || 10.0;
    const distanceVal = distanceKm * 1000;
    const durationVal = durationMin * 60;

    return {
      distance: { value: distanceVal, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: durationVal, text: `${durationMin.toFixed(0)} min` },
      stopsCount: data.stops?.length || 0,
      categories: [
        {
          category: "moto",
          label: "Moto",
          description: "Viagens mais rápidas e econômicas de moto",
          icon: "motorcycle",
          vehicleType: "motorcycle",
          maxPassengers: 1,
          order: 1,
          available: true,
          pricing: {
            basePrice: 4.5,
            distancePrice: distanceKm * 1.2,
            timePrice: durationMin * 0.15,
            stopsFee: (data.stops?.length || 0) * 1.0,
            total: Math.max(5.0, 4.5 + distanceKm * 1.2 + durationMin * 0.15 + (data.stops?.length || 0) * 1.0),
            currency: "BRL",
            multiplier: 1.0,
            feePerStop: 1.0
          }
        },
        {
          category: "car_economy",
          label: "Carro Comum",
          description: "Corridas do dia a dia pelo menor preço",
          icon: "car",
          vehicleType: "car",
          maxPassengers: 4,
          order: 2,
          available: true,
          pricing: {
            basePrice: 6.0,
            distancePrice: distanceKm * 1.8,
            timePrice: durationMin * 0.25,
            stopsFee: (data.stops?.length || 0) * 2.0,
            total: Math.max(8.0, 6.0 + distanceKm * 1.8 + durationMin * 0.25 + (data.stops?.length || 0) * 2.0),
            currency: "BRL",
            multiplier: 1.0,
            feePerStop: 2.0
          }
        }
      ]
    };
  }

  /**
   * Adicionar parada a uma corrida/entrega em andamento.
   */
  async addStop(
    rideId: string,
    stop: { address: string; latitude: number; longitude: number; order?: number },
  ): Promise<{ success: boolean; stops: Location[] }> {
    const { data: current } = await supabase
      .from("rides")
      .select("stops")
      .eq("id", rideId)
      .single();

    const stops = current?.stops || [];
    stops.push({ address: stop.address, latitude: stop.latitude, longitude: stop.longitude });

    const { error } = await supabase
      .from("rides")
      .update({ stops })
      .eq("id", rideId);

    if (error) throw error;
    return { success: true, stops };
  }

  /**
   * Calcular preÃ§o da corrida
   */
  async calculatePrice(
    data: CalculatePriceRequest,
  ): Promise<CalculatePriceResponse> {
    const distanceKm = data.distance || 5.0;
    const durationMin = data.duration || 10.0;
    const basePrice = 5.0;
    const distancePrice = distanceKm * 1.8;
    const serviceFee = 1.5;
    const total = basePrice + distancePrice + serviceFee;
    return {
      pricing: { basePrice, distancePrice, serviceFee, total, currency: "BRL" },
      distance: { value: distanceKm * 1000, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: durationMin * 60, text: `${durationMin.toFixed(0)} min` },
    };
  }

  /**
   * Buscar motoristas prÃ³ximos
   */
  async getNearbyDrivers(
    latitude: number,
    longitude: number,
    radius: number = 5000
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
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, latitude, longitude, role, profile_photo")
        .eq("role", "driver");

      if (error) throw error;

      return (data || []).map((d: any) => {
        const R = 6371000;
        const dLat = ((d.latitude || latitude) - latitude) * Math.PI / 180;
        const dLon = ((d.longitude || longitude) - longitude) * Math.PI / 180;
        const a =
          Math.sin(dLat/2) * Math.sin(dLat/2) +
          Math.cos(latitude * Math.PI / 180) * Math.cos((d.latitude || latitude) * Math.PI / 180) *
          Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        return {
          id: d.id,
          name: d.full_name || "Motorista",
          profilePhoto: d.profile_photo || null,
          rating: 4.8,
          latitude: Number(d.latitude || latitude),
          longitude: Number(d.longitude || longitude),
          type: "car" as const,
          rotation: Math.floor(Math.random() * 360),
          serviceTypes: ["ride", "delivery"],
          distance
        };
      }).filter(d => d.distance <= radius);
    } catch {
      return [
        {
          id: "simulated-driver-1",
          name: "Carlos (Moto)",
          profilePhoto: null,
          rating: 4.9,
          latitude: latitude + 0.002,
          longitude: longitude - 0.001,
          type: "motorcycle" as const,
          rotation: 45,
          serviceTypes: ["ride", "delivery"],
        },
        {
          id: "simulated-driver-2",
          name: "Ana (Carro)",
          profilePhoto: null,
          rating: 4.7,
          latitude: latitude - 0.0015,
          longitude: longitude + 0.003,
          type: "car" as const,
          rotation: 180,
          serviceTypes: ["ride"],
        }
      ] as any;
    }
  }

  /**
   * Criar nova solicitaÃ§Ã£o de corrida
   */
  async create(data: CreateRideRequest): Promise<Ride> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase
      .from("rides")
      .insert({
        client_id: userId,
        service_type: "ride",
        vehicle_type: data.vehicleType,
        ride_category: data.rideCategory || null,
        pickup: data.pickup,
        dropoff: data.dropoff,
        stops: data.stops || null,
        pricing: data.pricing,
        distance: data.distance,
        duration: data.duration,
        route_coordinates: data.routeCoordinates || null,
        details: data.details || null,
        status: "requesting",
        negotiation: data.negotiation || {},
        promotion: data.promotionCode ? { code: data.promotionCode } : {},
        payment: data.payment || {},
        is_waiting_in_queue: false,
        arrived_at_dropoff: false,
      })
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);

    websocketService.emit("ride-created", { rideId: mapped._id, ride: mapped });
    return mapped;
  }

  /**
   * Buscar corrida ativa (para retomar ao abrir o app / ficar online)
   */
  async getActive(): Promise<ActiveRideResponse> {
    try {
      const userId = await requireUserId();
      const { data: ride, error } = await supabase
        .from("rides")
        .select("*")
        .eq("service_type", "ride")
        .or(`client_id.eq.${userId},driver_id.eq.${userId}`)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { active: false, ride: null };
        }
        throw error;
      }
      if (!ride) return { active: false, ride: null };
      return { active: true, ride: this.mapToRideModel(ride) };
    } catch {
      return { active: false, ride: null };
    }
  }

  async getActiveList(): Promise<ActiveRidesResponse> {
    try {
      const userId = await requireUserId();
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq("service_type", "ride")
        .or(`client_id.eq.${userId},driver_id.eq.${userId}`)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { active: false, count: 0, rides: [] };
        }
        throw error;
      }
      return {
        active: rides && rides.length > 0,
        count: rides ? rides.length : 0,
        rides: (rides || []).map((r) => this.mapToRideModel(r)),
      };
    } catch {
      return { active: false, count: 0, rides: [] };
    }
  }

  async getAvailableRequests(): Promise<AvailableRideRequestsResponse> {
    try {
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq("service_type", "ride")
        .in("status", ["requesting", "searching_driver"])
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { count: 0, requests: [] };
        }
        throw error;
      }

      const requests = (rides || []).map((r) => {
        const ride = this.mapToRideModel(r);
        return {
          rideId: ride._id,
          pickup: ride.pickup,
          dropoff: ride.dropoff,
          pricing: ride.pricing,
          distance: ride.distance,
          duration: ride.duration,
          serviceType: ride.serviceType,
          vehicleType: ride.vehicleType,
          requestedAt: ride.requestedAt,
          negotiation: ride.negotiation,
        };
      });

      return {
        count: requests.length,
        requests,
      };
    } catch {
      return { count: 0, requests: [] };
    }
  }

  async getPendingNegotiations(): Promise<{
    count: number;
    requests: PendingNegotiationRequest[];
  }> {
    // Retorna solicitações pendentes de negociação do motorista (simulado via Supabase)
    const { requests } = await this.getAvailableRequests();
    const filtered = requests.filter((r) => r.negotiation?.enabled);
    return {
      count: filtered.length,
      requests: filtered,
    };
  }

  /**
   * Buscar corrida por ID
   */
  async getById(rideId: string): Promise<Ride> {
    const { data: ride, error } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (error) throw error;
    return this.mapToRideModel(ride);
  }

  async getRouteAudit(rideId: string): Promise<any> {
    const { data: ride, error } = await supabase
      .from("rides")
      .select("route_coordinates")
      .eq("id", rideId)
      .single();

    if (error) throw error;
    return ride?.route_coordinates || [];
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
    try {
      const userId = await requireUserId();
      const limit = params?.limit || 10;
      const page = params?.page || 1;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = supabase
        .from("rides")
        .select("*", { count: "exact" })
        .eq("service_type", "ride")
        .or(`client_id.eq.${userId},driver_id.eq.${userId}`);

      if (params?.status) {
        query = query.eq("status", params.status);
      }

      const { data: rides, count, error } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { rides: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
        throw error;
      }

      const total = count || 0;
      const pages = Math.ceil(total / limit);

      return {
        rides: (rides || []).map((r) => this.mapToRideModel(r)),
        pagination: {
          total,
          page,
          limit,
          pages,
        },
      };
    } catch {
      const limit = params?.limit || 10;
      const page = params?.page || 1;
      return { rides: [], pagination: { total: 0, page, limit, pages: 0 } };
    }
  }

  /**
   * Cancelar corrida
   */
  async cancel(
    rideId: string,
    reason?: string,
  ): Promise<{ message?: string; cancellationFee?: number; redispatched?: boolean }> {
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);

    websocketService.emit("ride-status-updated", { rideId, status: "cancelled", ride: mapped });
    websocketService.emit("ride-cancelled", { rideId, reason });
    return { message: "Corrida cancelada com sucesso", cancellationFee: 0 };
  }

  /**
   * Recibo / NFS-e da corrida concluída. (NFS-e atualmente SIMULADA — não fiscal.)
   */
  async getRideNfse(rideId: string): Promise<any> {
    return {
      nfsNumero: Math.floor(100000 + Math.random() * 900000),
      xmlUrl: `https://levamais.app/nfse/xml/${rideId}`,
      pdfUrl: `https://levamais.app/nfse/pdf/${rideId}`,
    };
  }

  /**
   * Promover corrida ativa para agendada
   */
  async promoteToScheduled(rideId: string, scheduledFor: string): Promise<any> {
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        scheduled_for: scheduledFor,
        status: "scheduled",
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "scheduled", ride: mapped });
    return { success: true, ride: mapped };
  }

  /**
   * Reiniciar busca da corrida (tentar novamente)
   */
  async retry(rideId: string): Promise<any> {
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        status: "requesting",
        driver_id: null,
        accepted_at: null,
        arrived_at: null,
        started_at: null,
        completed_at: null,
        cancelled_at: null,
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "requesting", ride: mapped });
    return { success: true, ride: mapped };
  }

  /**
   * Aceitar corrida (motorista)
   */
  async accept(rideId: string): Promise<Ride> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        driver_id: userId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);

    websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
    websocketService.emit("driver-found", { rideId, driverId: userId, ride: mapped });
    return mapped;
  }

  /**
   * Rejeitar corrida (motorista)
   */
  async reject(rideId: string, reason?: string): Promise<void> {
    websocketService.emit("ride-rejected-by-driver", { rideId, reason });
  }

  async updateStatus(
    rideId: string,
    status?: string,
    arrivedAtDropoff?: boolean,
    pins?: { pickupPin?: string; deliveryPin?: string },
  ): Promise<Ride> {
    const updates: any = {};
    if (status) updates.status = status;
    if (arrivedAtDropoff !== undefined) updates.arrived_at_dropoff = arrivedAtDropoff;

    if (pins) {
      const { data: current } = await supabase
        .from("rides")
        .select("details")
        .eq("id", rideId)
        .single();
      const currentDetails = current?.details || {};
      updates.details = {
        ...currentDetails,
        pickupPin: pins.pickupPin || currentDetails.pickupPin,
        deliveryPin: pins.deliveryPin || currentDetails.deliveryPin,
      };
    }

    const nowStr = new Date().toISOString();
    if (status === "arrived") updates.arrived_at = nowStr;
    else if (status === "started") updates.started_at = nowStr;
    else if (status === "completed") updates.completed_at = nowStr;

    const { data: ride, error } = await supabase
      .from("rides")
      .update(updates)
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);

    if (status) {
      websocketService.emit("ride-status-updated", { rideId, status, ride: mapped });
      if (status === "arrived") {
        websocketService.emit("driver-arrived", { rideId, ride: mapped });
      } else if (status === "started") {
        websocketService.emit("ride-started", { rideId, ride: mapped });
      }
    }

    return mapped;
  }

  async rateClientToDriver(rideId: string, payload: RatePayload): Promise<void> {
    const { data: current } = await supabase
      .from("rides")
      .select("details")
      .eq("id", rideId)
      .single();
    const details = current?.details || {};
    const { error } = await supabase
      .from("rides")
      .update({
        details: {
          ...details,
          clientRating: payload.stars,
        },
      })
      .eq("id", rideId);
    if (error) throw error;
  }

  /**
   * Motorista avalia cliente
   */
  async rateDriverToClient(rideId: string, payload: RatePayload): Promise<void> {
    const { data: current } = await supabase
      .from("rides")
      .select("details")
      .eq("id", rideId)
      .single();
    const details = current?.details || {};
    const { error } = await supabase
      .from("rides")
      .update({
        details: {
          ...details,
          driverRating: payload.stars,
        },
      })
      .eq("id", rideId);
    if (error) throw error;
  }

  async addTip(rideId: string, amount: number): Promise<void> {
    const { data: current } = await supabase
      .from("rides")
      .select("payment")
      .eq("id", rideId)
      .single();
    const payment = current?.payment || {};
    const { error } = await supabase
      .from("rides")
      .update({
        payment: {
          ...payment,
          tipAmount: amount,
        },
      })
      .eq("id", rideId);
    if (error) throw error;
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
    allRejected?: boolean;
  }> {
    const { data: ride, error } = await supabase
      .from("rides")
      .select("negotiation")
      .eq("id", rideId)
      .single();

    if (error || !ride) {
      return {
        negotiation: { enabled: false, clientOffer: null, suggestedMinPrice: null, finalAgreedPrice: null },
        offers: [],
      };
    }

    const neg = ride.negotiation || {};
    return {
      negotiation: {
        enabled: !!neg.enabled,
        clientOffer: neg.clientOffer || null,
        suggestedMinPrice: neg.suggestedMinPrice || null,
        finalAgreedPrice: neg.finalAgreedPrice || null,
        selectedDriverId: neg.selectedDriverId || null,
      },
      offers: neg.offers || [],
      allRejected: neg.allRejected,
    };
  }

  async respondToOffer(
    rideId: string,
    payload: { action: "accept" | "counter" | "reject"; amount?: number; message?: string },
  ): Promise<{ success: boolean; rideMatched?: boolean; message?: string }> {
    const userId = await requireUserId();
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("negotiation, driver_id")
      .eq("id", rideId)
      .single();

    if (getError || !ride) {
      return { success: false, message: "Corrida não encontrada" };
    }

    const negotiation = ride.negotiation || {};
    const offers = negotiation.offers || [];

    if (payload.action === "accept") {
      negotiation.finalAgreedPrice = payload.amount;
      negotiation.selectedDriverId = userId;

      const { data: updated, error } = await supabase
        .from("rides")
        .update({
          driver_id: userId,
          status: "accepted",
          accepted_at: new Date().toISOString(),
          negotiation,
        })
        .eq("id", rideId)
        .select()
        .single();

      if (error) throw error;
      const mapped = this.mapToRideModel(updated);
      websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
      websocketService.emit("ride-offers-updated", { rideId, offers });
      return { success: true, rideMatched: true };
    } else {
      const newOffer: RideOffer = {
        driverId: userId,
        amount: payload.amount || 0,
        status: payload.action === "counter" ? "countered" : "rejected",
        message: payload.message,
        createdAt: new Date().toISOString(),
      };
      offers.push(newOffer);
      negotiation.offers = offers;

      const { error } = await supabase
        .from("rides")
        .update({ negotiation })
        .eq("id", rideId);

      if (error) throw error;
      websocketService.emit("ride-offers-updated", { rideId, offers });
      return { success: true, rideMatched: false };
    }
  }

  async selectOffer(rideId: string, driverId: string): Promise<Ride> {
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("negotiation")
      .eq("id", rideId)
      .single();

    if (getError || !ride) throw new Error("Corrida não encontrada");

    const negotiation = ride.negotiation || {};
    const offers = negotiation.offers || [];
    const chosenOffer = offers.find((o: any) => (o.driverId?._id || o.driverId) === driverId);

    negotiation.finalAgreedPrice = chosenOffer ? chosenOffer.amount : negotiation.clientOffer;
    negotiation.selectedDriverId = driverId;

    const { data: updated, error } = await supabase
      .from("rides")
      .update({
        driver_id: driverId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
        negotiation,
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(updated);
    websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
    return mapped;
  }

  async clientCounterOffer(rideId: string, driverId: string, amount: number): Promise<any> {
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("negotiation")
      .eq("id", rideId)
      .single();

    if (getError || !ride) throw new Error("Corrida não encontrada");

    const negotiation = ride.negotiation || {};
    const offers = negotiation.offers || [];
    const target = offers.find((o: any) => (o.driverId?._id || o.driverId) === driverId);

    if (target) {
      target.driverAmount = target.amount;
      target.amount = amount;
      target.status = "client_countered";
      target.updatedAt = new Date().toISOString();
    }

    const { error } = await supabase
      .from("rides")
      .update({ negotiation })
      .eq("id", rideId);

    if (error) throw error;
    websocketService.emit("ride-offers-updated", { rideId, offers });
    return { success: true };
  }

  async declineOffer(rideId: string, driverId: string): Promise<any> {
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("negotiation")
      .eq("id", rideId)
      .single();

    if (getError || !ride) throw new Error("Corrida não encontrada");

    const negotiation = ride.negotiation || {};
    const offers = negotiation.offers || [];
    const target = offers.find((o: any) => (o.driverId?._id || o.driverId) === driverId);

    if (target) {
      target.status = "rejected";
      target.updatedAt = new Date().toISOString();
    }

    const { error } = await supabase
      .from("rides")
      .update({ negotiation })
      .eq("id", rideId);

    if (error) throw error;
    websocketService.emit("ride-offers-updated", { rideId, offers });
    return { success: true };
  }

  /**
   * EstatÃ­sticas do motorista (dashboard)
   */
  async getDriverStats(): Promise<DriverStats> {
    return {
      earnings: 320.50,
      rides: 14,
      goal: 20,
      bonus: 25.00,
      rating: 4.9,
      acceptanceRate: 95,
      onlineTime: 360,
      totalRides: 14,
      completedRides: 14,
    };
  }

  /**
   * HistÃ³rico de ganhos (grÃ¡fico)
   */
  async getEarningsHistory(
    period: "day" | "week" | "month" = "week",
  ): Promise<{ label: string; value: number; count?: number }[]> {
    return [
      { label: "Seg", value: 45.0, count: 2 },
      { label: "Ter", value: 60.0, count: 3 },
      { label: "Qua", value: 30.0, count: 1 },
      { label: "Qui", value: 85.0, count: 4 },
      { label: "Sex", value: 100.0, count: 4 },
      { label: "Sáb", value: 0.0, count: 0 },
      { label: "Dom", value: 0.0, count: 0 },
    ];
  }

  /**
   * Buscar agendamentos disponÃ­veis sem motoristas (para motoristas)
   */
  async getAvailableScheduledRides(): Promise<{ count: number; rides: Ride[] }> {
    try {
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
        .eq("status", "scheduled")
        .is("driver_id", null)
        .order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { count: 0, rides: [] };
        }
        throw error;
      }
      return {
        count: rides ? rides.length : 0,
        rides: (rides || []).map((r) => this.mapToRideModel(r)),
      };
    } catch {
      return { count: 0, rides: [] };
    }
  }

  /**
   * Aceitar corrida agendada antecipadamente
   */
  async acceptScheduledRide(rideId: string): Promise<{ message: string; ride: Ride }> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        driver_id: userId,
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
    return { message: "Corrida agendada aceita com sucesso", ride: mapped };
  }

  /**
   * Colocar a corrida na fila de espera pÃºblica
   */
  async enterWaitingQueue(rideId: string): Promise<any> {
    const { data: ride, error } = await supabase
      .from("rides")
      .update({
        is_waiting_in_queue: true,
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: mapped.status, ride: mapped });
    return { success: true, ride: mapped };
  }

  /**
   * Aumentar oferta base do cliente para atrair motoristas âœ¨ðŸ’¸
   */
  async increaseOffer(rideId: string, incrementAmount: number = 2): Promise<any> {
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("negotiation, pricing")
      .eq("id", rideId)
      .single();

    if (getError || !ride) throw new Error("Corrida não encontrada");

    const negotiation = ride.negotiation || {};
    const pricing = ride.pricing || {};

    const newOffer = (negotiation.clientOffer || pricing.total || 10) + incrementAmount;
    negotiation.clientOffer = newOffer;
    pricing.total = newOffer;

    const { data: updated, error } = await supabase
      .from("rides")
      .update({
        negotiation,
        pricing,
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;
    const mapped = this.mapToRideModel(updated);
    websocketService.emit("ride-offers-updated", { rideId, offers: negotiation.offers || [] });
    return { success: true, ride: mapped };
  }

  async triggerSOS(rideId: string, data?: { location?: any; message?: string }): Promise<any> {
    return {
      success: true,
      message: "Alerta SOS disparado com sucesso para a central.",
      timestamp: new Date().toISOString(),
    };
  }

  async generateShareToken(rideId: string): Promise<{ token: string; shareUrl: string }> {
    const token = Math.random().toString(36).substring(2, 10).toUpperCase();
    return {
      token,
      shareUrl: `https://levamais.app/share/ride/${rideId}?t=${token}`,
    };
  }

  /**
   * Gerar Pix de Pagamento da Corrida
   */
  async createRidePixPayment(rideId: string): Promise<{
    success: boolean;
    transactionId: string;
    amount: number;
    pixCode: string;
    qrCodeData: string;
    expiresIn: number;
    status: string;
    instructions: string[];
  }> {
    const { data: ride, error } = await supabase
      .from("rides")
      .select("pricing")
      .eq("id", rideId)
      .single();

    const amount = ride?.pricing?.total || 15.0;
    const pixCode = "00020101021226770014br.gov.bcb.pix2555pix.levamais.app/qr/v2/cobv/test-ride-" + rideId;

    return {
      success: true,
      transactionId: "pix-txn-" + Math.floor(Math.random() * 1000000),
      amount,
      pixCode,
      qrCodeData: pixCode,
      expiresIn: 3600,
      status: "pending",
      instructions: ["Abra o app do seu banco", "Escolha Pix copia e cola ou QrCode", "Confirme o pagamento"],
    };
  }

  /**
   * Simular confirmacao de pagamento PIX de corrida (apenas para teste/dev)
   */
  async confirmRidePixPaymentMock(rideId: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const { data: ride, error: getError } = await supabase
      .from("rides")
      .select("payment")
      .eq("id", rideId)
      .single();

    if (getError || !ride) throw new Error("Corrida não encontrada");

    const payment = ride.payment || {};
    payment.status = "paid";

    const { error } = await supabase
      .from("rides")
      .update({
        payment,
        status: "searching_driver",
      })
      .eq("id", rideId);

    if (error) throw error;
    websocketService.emit("ride-status-updated", { rideId, status: "searching_driver" });
    return {
      success: true,
      message: "Pagamento Pix confirmado (simulação).",
    };
  }

  // ========== DELEGADOS PARA COMPATIBILIDADE DE ENTREGA ==========

  async reportDeliveryProblem(
    rideId: string,
    payload: { reason: string; photoUrl?: string; note?: string },
  ): Promise<{ message?: string; deliveryFailure?: any }> {
    return deliveryService.reportDeliveryProblem(rideId, payload);
  }

  async uploadPickupProof(rideId: string, photoBase64: string): Promise<void> {
    return deliveryService.uploadPickupProof(rideId, photoBase64);
  }

  async uploadDeliveryProof(rideId: string, photoBase64: string): Promise<void> {
    return deliveryService.uploadDeliveryProof(rideId, photoBase64);
  }

  async validatePin(
    rideId: string,
    pinType: "pickup" | "delivery",
    pin: string,
  ): Promise<any> {
    return deliveryService.validatePin(rideId, pinType, pin);
  }
}

export default new RideService();
