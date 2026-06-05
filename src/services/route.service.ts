import apiClient from "./api";
import type {
  DriverRoute,
  RouteReservation,
  RouteSchedule,
  VehicleType,
  ItemSize,
} from "@/types/routes";

export interface SchedulePayload {
  vehicleType: VehicleType;
  origin: { cityId?: string; label: string };
  destination: { cityId?: string; label: string };
  daysOfWeek: number[];
  departTime: string;
  capacity?: { maxItems?: number; maxWeightKg?: number };
  pricing?: { basePrice?: number; pricePerKg?: number };
}

// Service do app para Rotas Planejadas / Maloteiro (Fase D7–D9).
// Endpoints em /api/routes (auth via interceptor do apiClient).

function unwrap<T>(data: any, fallback: T): T {
  return (data?.data ?? data?.route ?? data?.routes ?? data?.reservation ?? data?.reservations ?? fallback) as T;
}

export interface PublishRoutePayload {
  vehicleType: VehicleType;
  origin: { cityId?: string; label: string; latitude?: number; longitude?: number };
  destination: { cityId?: string; label: string; latitude?: number; longitude?: number };
  waypoints?: Array<{ cityId?: string; label: string; latitude?: number; longitude?: number }>;
  departAt: string;
  arriveEstimateAt?: string;
  capacity?: { maxItems?: number; maxWeightKg?: number; maxVolumeL?: number; acceptedItemTypes?: string[] };
  pricing?: { basePrice?: number; pricePerKg?: number };
}

export interface CreateReservationPayload {
  routeId: string;
  item: { type?: string; description?: string; size?: ItemSize; weightKg?: number; declaredValue?: number };
  pickup?: { address?: string; latitude?: number; longitude?: number; contactName?: string; contactPhone?: string };
  dropoff?: { address?: string; latitude?: number; longitude?: number; contactName?: string; contactPhone?: string };
  withInsurance?: boolean;
}

const routeService = {
  // ---------- MOTORISTA ----------
  async publish(payload: PublishRoutePayload): Promise<DriverRoute> {
    const { data } = await apiClient.post("/routes", payload);
    return unwrap<DriverRoute>(data, {} as DriverRoute);
  },

  async listMine(status?: string): Promise<DriverRoute[]> {
    const { data } = await apiClient.get("/routes/mine", { params: status ? { status } : undefined });
    const list = unwrap<DriverRoute[]>(data, []);
    return Array.isArray(list) ? list : [];
  },

  async update(id: string, payload: Partial<PublishRoutePayload>): Promise<DriverRoute> {
    const { data } = await apiClient.patch(`/routes/${id}`, payload);
    return unwrap<DriverRoute>(data, {} as DriverRoute);
  },

  async cancel(id: string, reason?: string): Promise<DriverRoute> {
    const { data } = await apiClient.post(`/routes/${id}/cancel`, { reason });
    return unwrap<DriverRoute>(data, {} as DriverRoute);
  },

  async start(id: string): Promise<DriverRoute> {
    const { data } = await apiClient.post(`/routes/${id}/start`, {});
    return unwrap<DriverRoute>(data, {} as DriverRoute);
  },

  async listRouteReservations(id: string): Promise<RouteReservation[]> {
    const { data } = await apiClient.get(`/routes/${id}/reservations`);
    const list = unwrap<RouteReservation[]>(data, []);
    return Array.isArray(list) ? list : [];
  },

  async acceptReservation(reservationId: string): Promise<RouteReservation> {
    const { data } = await apiClient.post(`/routes/reservations/${reservationId}/accept`, {});
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  async rejectReservation(reservationId: string, reason?: string): Promise<RouteReservation> {
    const { data } = await apiClient.post(`/routes/reservations/${reservationId}/reject`, { reason });
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  async pickupReservation(reservationId: string, payload?: { pin?: string; photoBase64?: string }): Promise<RouteReservation> {
    const { data } = await apiClient.post(`/routes/reservations/${reservationId}/pickup`, payload || {});
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  async deliverReservation(reservationId: string, payload?: { pin?: string; photoBase64?: string }): Promise<RouteReservation> {
    const { data } = await apiClient.post(`/routes/reservations/${reservationId}/deliver`, payload || {});
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  // ---------- CLIENTE ----------
  async discover(params?: { cityId?: string; originCityId?: string; destinationCityId?: string; date?: string }): Promise<DriverRoute[]> {
    const { data } = await apiClient.get("/routes/discover", { params });
    const list = unwrap<DriverRoute[]>(data, []);
    return Array.isArray(list) ? list : [];
  },

  async getRoute(id: string): Promise<DriverRoute> {
    const { data } = await apiClient.get(`/routes/${id}`);
    return unwrap<DriverRoute>(data, {} as DriverRoute);
  },

  async createReservation(payload: CreateReservationPayload): Promise<RouteReservation> {
    const { data } = await apiClient.post("/routes/reservations", payload);
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  async listMyReservations(status?: string): Promise<RouteReservation[]> {
    const { data } = await apiClient.get("/routes/mine/reservations", { params: status ? { status } : undefined });
    const list = unwrap<RouteReservation[]>(data, []);
    return Array.isArray(list) ? list : [];
  },

  async getReservation(reservationId: string): Promise<RouteReservation> {
    const { data } = await apiClient.get(`/routes/reservations/${reservationId}`);
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  async cancelReservation(reservationId: string): Promise<RouteReservation> {
    const { data } = await apiClient.post(`/routes/reservations/${reservationId}/cancel`, {});
    return unwrap<RouteReservation>(data, {} as RouteReservation);
  },

  // ---------- TRANSPORTADORA: agendas recorrentes (T2) ----------
  async listSchedules(): Promise<RouteSchedule[]> {
    const { data } = await apiClient.get("/routes/schedules");
    const list = (data?.data ?? data?.schedules ?? []) as RouteSchedule[];
    return Array.isArray(list) ? list : [];
  },

  async createSchedule(payload: SchedulePayload): Promise<RouteSchedule> {
    const { data } = await apiClient.post("/routes/schedules", payload);
    return (data?.data ?? data?.schedule) as RouteSchedule;
  },

  async toggleSchedule(scheduleId: string): Promise<RouteSchedule> {
    const { data } = await apiClient.post(`/routes/schedules/${scheduleId}/toggle`, {});
    return (data?.data ?? data?.schedule) as RouteSchedule;
  },

  async deleteSchedule(scheduleId: string): Promise<void> {
    await apiClient.delete(`/routes/schedules/${scheduleId}`);
  },
};

export default routeService;
