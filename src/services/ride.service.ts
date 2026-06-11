import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import deliveryService from "./delivery.service";
import pricingService, { calculateFare, calculateDeliveryFare } from "./pricing.service";

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
  // Cidade do usuário — seleciona a tabela de preço da cidade (fallback: regra global).
  city?: string | null;
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
    if (!data.distance || data.distance <= 0) {
      throw new Error("Distância da rota não informada. Tente novamente.");
    }
    const distanceKm = data.distance;
    const durationMin = data.duration || 0;

    const rules = await pricingService.getRules("ride");
    const rule = rules.find((r) => r.vehicleCategory === data.vehicleType);
    if (!rule) throw new Error("Tabela de preços não configurada para este veículo.");

    const fare = calculateFare(rule.pricing, distanceKm, durationMin, 0);

    return {
      success: true,
      suggestedPrice: fare.total,
      minPrice: Math.max(rule.pricing.minFare, Number((fare.total * 0.85).toFixed(2))),
      maxPrice: Number((fare.total * 1.25).toFixed(2)),
      distanceKm,
      durationMin,
      pricingBreakdown: {
        baseFare: fare.baseFare,
        distancePrice: fare.distancePrice,
        total: fare.total,
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
    city?: string;
    distance?: number;
    duration?: number;
  }): Promise<RideCategoriesResponse> {
    if (!data.distance || data.distance <= 0) {
      throw new Error("Distância da rota não informada. Tente novamente.");
    }
    const distanceKm = data.distance;
    const durationMin = data.duration || 0;
    const stopsCount = data.stops?.length || 0;
    const distanceVal = distanceKm * 1000;
    const durationVal = durationMin * 60;

    const rules = await pricingService.getRules("ride", data.city);
    const motoRule = rules.find((r) => r.vehicleCategory === "motorcycle");
    const carRule = rules.find((r) => r.vehicleCategory === "car");
    if (!motoRule || !carRule) {
      throw new Error("Tabela de preços de corrida não configurada.");
    }

    const moto = calculateFare(motoRule.pricing, distanceKm, durationMin, stopsCount);
    const car = calculateFare(carRule.pricing, distanceKm, durationMin, stopsCount);

    return {
      distance: { value: distanceVal, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: durationVal, text: `${durationMin.toFixed(0)} min` },
      stopsCount,
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
            basePrice: moto.baseFare,
            distancePrice: moto.distancePrice,
            timePrice: moto.timePrice,
            stopsFee: moto.stopsFee,
            total: moto.total,
            currency: "BRL",
            multiplier: 1.0,
            feePerStop: motoRule.pricing.perStopFee,
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
            basePrice: car.baseFare,
            distancePrice: car.distancePrice,
            timePrice: car.timePrice,
            stopsFee: car.stopsFee,
            total: car.total,
            currency: "BRL",
            multiplier: 1.0,
            feePerStop: carRule.pricing.perStopFee,
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
    if (!data.distance || data.distance <= 0) {
      throw new Error("Distância da rota não informada. Tente novamente.");
    }
    const distanceKm = data.distance;
    const durationMin = data.duration || 0;
    const serviceType = data.serviceType || "ride";

    const rules = await pricingService.getRules(serviceType, data.city);
    const rule = rules.find((r) => r.vehicleCategory === data.vehicleType);
    if (!rule) throw new Error("Tabela de preços não configurada para este veículo.");

    const stopsCount = data.stops?.length || 0;
    const fare =
      serviceType === "delivery"
        ? calculateDeliveryFare(rule.pricing, distanceKm, stopsCount)
        : calculateFare(rule.pricing, distanceKm, durationMin, stopsCount);
    const cfg = await pricingService.getConfig();
    const serviceFee = Number((fare.total * cfg.appFeePercentage / 100).toFixed(2));

    return {
      pricing: {
        basePrice: fare.baseFare,
        distancePrice: fare.distancePrice,
        serviceFee,
        total: fare.total,
        currency: "BRL",
        platformFee: serviceFee,
        driverValue: Number((fare.total - serviceFee).toFixed(2)),
      },
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
      // Motoristas REAIS online (driver_locations) + suas preferências (driver_details) e perfil
      const { data, error } = await supabase
        .from("driver_locations")
        .select(`
          id, latitude, longitude, heading, current_vehicle_type, is_online,
          profiles!inner ( full_name, avatar_url, rating ),
          driver_details!inner ( service_types, vehicle_type, status )
        `)
        .eq("is_online", true);

      if (error) throw error;

      return (data || [])
        .map((d: any) => {
          if (d.latitude == null || d.longitude == null) return null;
          // só motoristas aprovados aparecem
          if (d.driver_details?.status !== "approved") return null;

          const R = 6371000;
          const dLat = (d.latitude - latitude) * Math.PI / 180;
          const dLon = (d.longitude - longitude) * Math.PI / 180;
          const a =
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(latitude * Math.PI / 180) * Math.cos(d.latitude * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
          const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

          return {
            id: d.id,
            name: d.profiles?.full_name || "Motorista",
            profilePhoto: d.profiles?.avatar_url || null,
            rating: Number(d.profiles?.rating ?? 5),
            latitude: Number(d.latitude),
            longitude: Number(d.longitude),
            type: (d.current_vehicle_type || d.driver_details?.vehicle_type || "car") as any,
            rotation: Number(d.heading || 0),
            serviceTypes: d.driver_details?.service_types || ["ride", "delivery"],
            distance,
          };
        })
        .filter((d): d is NonNullable<typeof d> => d !== null && d.distance <= radius);
    } catch {
      // Sem fallback mockado — se falhar, simplesmente não há motoristas próximos.
      return [];
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
      // Sem filtro de service_type: o monitor da Home e a lista de pedidos ativos
      // precisam enxergar corridas E entregas (cada consumidor trata serviceType).
      const { data: rides, error } = await supabase
        .from("rides")
        .select("*")
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
      // 1. Obter motorista logado e suas preferências
      const { data: { user } } = await supabase.auth.getUser();
      let acceptsCash = true;
      let acceptsCard = true;
      let acceptsPix = true;
      let driverVehicleType = "car";

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("driver_preferences, vehicle_type")
          .eq("id", user.id)
          .maybeSingle();
        
        if (profile) {
          const prefs = profile.driver_preferences || {};
          acceptsCash = prefs.acceptsCash !== false;
          acceptsCard = prefs.acceptsCardMachine !== false;
          acceptsPix = prefs.acceptsPix !== false;
          driverVehicleType = profile.vehicle_type || "car";
        }
      }

      // 2. Buscar corridas pendentes do banco
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

      // 3. Filtrar baseado no veículo e forma de pagamento do motorista
      const filteredRides = (rides || []).filter((r: any) => {
        // Filtrar tipo de veículo
        const rideVehicle = r.vehicle_type || "car";
        if (rideVehicle !== driverVehicleType) return false;

        // Filtrar método de pagamento
        const paymentMethod = r.payment?.method || "cash";
        if (paymentMethod === "cash" && !acceptsCash) return false;
        if (paymentMethod === "card" && !acceptsCard) return false;
        if ((paymentMethod === "wallet" || paymentMethod === "levapay") && !acceptsPix) return false;

        return true;
      });

      const requests = filteredRides.map((r) => {
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
    } catch (err) {
      console.warn("[getAvailableRequests] error", err);
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

      // Sem filtro de service_type: o histórico do cliente e do motorista deve
      // mostrar corridas E entregas (cada item carrega o serviceType para a UI).
      let query = supabase
        .from("rides")
        .select("*", { count: "exact" })
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
    try {
      // 1. Tentar chamar a RPC no banco de dados para segurança transacional
      const { data: fee, error: rpcErr } = await supabase.rpc("rpc_cancel_ride", {
        p_ride_id: rideId,
        p_reason: reason || "Cancelado pelo usuário"
      });

      if (!rpcErr) {
        return { message: "Corrida cancelada com sucesso", cancellationFee: Number(fee || 0) };
      }
      // Se não for erro de "função não encontrada", propaga
      if (rpcErr.code !== "PGRST202" && rpcErr.code !== "42883") {
        throw rpcErr;
      }
    } catch (rpcEx) {
      console.warn("[RideService] Falha na RPC rpc_cancel_ride, usando fallback local:", rpcEx);
    }

    // Fallback local caso a RPC não esteja instalada no Supabase
    const { data: ride, error: getErr } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (getErr || !ride) {
      throw getErr || new Error("Corrida não encontrada");
    }

    let appliedFee = 0;

    // Se tiver motorista e passou de 2 minutos ou motorista já chegou
    const hasDriver = !!ride.driver_id;
    const isArrived = ride.status === "arrived";
    const acceptedAt = ride.accepted_at ? new Date(ride.accepted_at).getTime() : null;
    const timeDiffSeconds = acceptedAt ? (Date.now() - acceptedAt) / 1000 : 0;

    if (hasDriver && (isArrived || timeDiffSeconds > 120)) {
      appliedFee = 5.00; // Taxa de cancelamento padrão fallback

      // Deduz do saldo do cliente
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", ride.client_id)
          .single();
        const newClientBalance = Number(profile?.wallet_balance || 0) - appliedFee;
        await supabase
          .from("profiles")
          .update({ wallet_balance: newClientBalance })
          .eq("id", ride.client_id);

        // Insere transação de débito do cliente
        await supabase.from("wallet_transactions").insert({
          user_id: ride.client_id,
          type: "cancellation_fee",
          amount: -appliedFee,
          description: "Multa por cancelamento de viagem (fallback)",
          reference_id: rideId,
          status: "paid",
        });
      } catch (clientWalletErr) {
        console.error("Erro ao debitar cliente (cancelamento):", clientWalletErr);
      }

      // Credita o motorista
      try {
        const { data: details } = await supabase
          .from("driver_details")
          .select("balance")
          .eq("id", ride.driver_id)
          .single();
        const newDriverBalance = Number(details?.balance || 0) + appliedFee;
        await supabase
          .from("driver_details")
          .update({ balance: newDriverBalance })
          .eq("id", ride.driver_id);

        // Insere transação de crédito do motorista
        await supabase.from("wallet_transactions").insert({
          user_id: ride.driver_id,
          type: "cancellation_fee",
          amount: appliedFee,
          description: "Crédito por cancelamento de viagem (fallback)",
          reference_id: rideId,
          status: "paid",
        });
      } catch (driverWalletErr) {
        console.error("Erro ao creditar motorista (cancelamento):", driverWalletErr);
      }
    }

    const { data: updatedRide, error } = await supabase
      .from("rides")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancellation_fee: appliedFee,
        details: {
          ...(ride.details || {}),
          cancel_reason: reason || "Cancelado pelo usuário",
        }
      })
      .eq("id", rideId)
      .select()
      .single();

    if (error) throw error;

    return { message: "Corrida cancelada com sucesso", cancellationFee: appliedFee };
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

    return mapped;
  }

  /**
   * Rejeitar corrida (motorista)
   */
  async reject(_rideId: string, _reason?: string): Promise<void> {
    // Status updates are handled via Supabase Realtime
  }

  async updateStatus(
    rideId: string,
    status?: string,
    arrivedAtDropoff?: boolean,
    pins?: { pickupPin?: string; deliveryPin?: string },
    realTrajectory?: Array<{ latitude: number; longitude: number; timestamp?: string }>
  ): Promise<Ride> {
    const updates: any = {};
    if (status) updates.status = status;
    if (arrivedAtDropoff !== undefined) updates.arrived_at_dropoff = arrivedAtDropoff;

    if (pins || realTrajectory) {
      const { data: current } = await supabase
        .from("rides")
        .select("details")
        .eq("id", rideId)
        .single();
      const currentDetails = current?.details || {};
      updates.details = {
        ...currentDetails,
        ...(pins ? {
          pickupPin: pins.pickupPin || currentDetails.pickupPin,
          deliveryPin: pins.deliveryPin || currentDetails.deliveryPin,
        } : {}),
        ...(realTrajectory ? { real_trajectory: realTrajectory } : {}),
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

    if (status === "completed") {
      // Liquida a corrida: debita taxa do motorista, transfere se pagamento=wallet
      supabase.rpc("rpc_settle_ride", { p_ride_id: rideId }).then(async ({ error: settleErr }) => {
        if (settleErr) {
          console.warn("[rpc_settle_ride] falhou, tentando fallback local:", settleErr);
          if (settleErr.code === "PGRST202" || settleErr.code === "42883") {
            // Executa fallback local
            try {
              const { data: rd } = await supabase.from("rides").select("*").eq("id", rideId).single();
              if (rd && rd.driver_id) {
                const totalPrice = Number(rd.negotiation?.finalAgreedPrice ?? rd.pricing?.total ?? 0);
                const paymentType = rd.payment?.method?.type || "cash";
                const isWallet = paymentType === "wallet";
                const appFeePercent = 15; // padrão 15%
                const appFee = Math.round(totalPrice * (appFeePercent / 100) * 100) / 100;
                const driverEarnings = totalPrice - appFee;

                if (isWallet) {
                  // Debita cliente
                  const { data: clientProfile } = await supabase.from("profiles").select("wallet_balance").eq("id", rd.client_id).single();
                  const newClientBal = Number(clientProfile?.wallet_balance || 0) - totalPrice;
                  await supabase.from("profiles").update({ wallet_balance: newClientBal }).eq("id", rd.client_id);

                  // Credita motorista
                  const { data: drDetails } = await supabase.from("driver_details").select("balance").eq("id", rd.driver_id).single();
                  const newDrBal = Number(drDetails?.balance || 0) + driverEarnings;
                  await supabase.from("driver_details").update({ balance: newDrBal }).eq("id", rd.driver_id);

                  // Lança transações
                  await supabase.from("wallet_transactions").insert([
                    { user_id: rd.client_id, type: "ride_payment", amount: -totalPrice, description: "Pagamento de corrida (fallback)", reference_id: rideId, status: "paid" },
                    { user_id: rd.driver_id, type: "ride_payment", amount: driverEarnings, description: "Ganhos de corrida (fallback)", reference_id: rideId, status: "paid" }
                  ]);
                } else {
                  // Dinheiro / Cartão: debita taxa do saldo do motorista
                  const { data: drDetails } = await supabase.from("driver_details").select("balance").eq("id", rd.driver_id).single();
                  const newDrBal = Number(drDetails?.balance || 0) - appFee;
                  await supabase.from("driver_details").update({ balance: newDrBal }).eq("id", rd.driver_id);

                  // Lança transação
                  await supabase.from("wallet_transactions").insert({
                    user_id: rd.driver_id, type: "app_fee_debit", amount: -appFee, description: "Taxa de intermediação de corrida (fallback)", reference_id: rideId, status: "paid"
                  });
                }

                // Marca liquidada nos detalhes
                const details = rd.details || {};
                await supabase.from("rides").update({ details: { ...details, settled: true } }).eq("id", rideId);
              }
            } catch (fallbackErr) {
              console.error("Erro no fallback do rpc_settle_ride:", fallbackErr);
            }
          }
        }
      });
    }

    return mapped;
  }

  /** Cliente avalia motorista → insere em ride_ratings (trigger agrega média em profiles). */
  async rateClientToDriver(rideId: string, payload: RatePayload): Promise<void> {
    const userId = await requireUserId();
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("driver_id")
      .eq("id", rideId)
      .single();
    if (rideError) throw rideError;
    if (!ride.driver_id) throw new Error("Corrida sem motorista");

    const { error } = await supabase.from("ride_ratings").insert({
      ride_id: rideId,
      rater_id: userId,
      ratee_id: ride.driver_id,
      rater_role: "client",
      stars: payload.stars,
      comment: payload.comment ?? null,
    });
    if (error && error.code !== "23505") throw error; // ignora duplicata
  }

  /** Motorista avalia cliente → insere em ride_ratings. */
  async rateDriverToClient(rideId: string, payload: RatePayload): Promise<void> {
    const userId = await requireUserId();
    const { data: ride, error: rideError } = await supabase
      .from("rides")
      .select("client_id")
      .eq("id", rideId)
      .single();
    if (rideError) throw rideError;

    const { error } = await supabase.from("ride_ratings").insert({
      ride_id: rideId,
      rater_id: userId,
      ratee_id: ride.client_id,
      rater_role: "driver",
      stars: payload.stars,
      comment: payload.comment ?? null,
    });
    if (error && error.code !== "23505") throw error;
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
    return { success: true };
  }

  /**
   * EstatÃ­sticas do motorista (dashboard)
   */
  async getDriverStats(): Promise<DriverStats> {
    const userId = await requireUserId();
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: rides } = await supabase
      .from("rides")
      .select("pricing, payment, completed_at")
      .eq("driver_id", userId)
      .eq("status", "completed");

    const all = rides || [];
    const today = all.filter((r: any) => r.completed_at && r.completed_at >= startOfDay.toISOString());
    const earningsOf = (r: any) =>
      Number(r.payment?.fareTotal ?? r.pricing?.total ?? 0) - Number(r.payment?.platformFee ?? 0);
    const earnings = Number(today.reduce((s: number, r: any) => s + earningsOf(r), 0).toFixed(2));

    const { data: profile } = await supabase
      .from("profiles")
      .select("rating")
      .eq("id", userId)
      .maybeSingle();

    return {
      earnings,
      rides: today.length,
      goal: 0,
      bonus: 0,
      rating: Number(profile?.rating ?? 5),
      totalRides: all.length,
      completedRides: all.length,
    };
  }

  /**
   * HistÃ³rico de ganhos (grÃ¡fico)
   */
  async getEarningsHistory(
    period: "day" | "week" | "month" = "week",
  ): Promise<{ label: string; value: number; count?: number }[]> {
    const userId = await requireUserId();
    const days = period === "month" ? 30 : period === "day" ? 1 : 7;
    const since = new Date();
    since.setDate(since.getDate() - (days - 1));
    since.setHours(0, 0, 0, 0);

    const { data: rides } = await supabase
      .from("rides")
      .select("pricing, payment, completed_at")
      .eq("driver_id", userId)
      .eq("status", "completed")
      .gte("completed_at", since.toISOString());

    const earningsOf = (r: any) =>
      Number(r.payment?.fareTotal ?? r.pricing?.total ?? 0) - Number(r.payment?.platformFee ?? 0);
    const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    const buckets: { label: string; value: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      buckets.push({
        label: days <= 7 ? weekdays[d.getDay()] : `${d.getDate()}/${d.getMonth() + 1}`,
        value: 0,
        count: 0,
      });
    }

    (rides || []).forEach((r: any) => {
      if (!r.completed_at) return;
      const d = new Date(r.completed_at);
      const idx = Math.floor((d.getTime() - since.getTime()) / (24 * 3600 * 1000));
      if (idx >= 0 && idx < buckets.length) {
        buckets[idx].value = Number((buckets[idx].value + earningsOf(r)).toFixed(2));
        buckets[idx].count += 1;
      }
    });

    return buckets;
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
