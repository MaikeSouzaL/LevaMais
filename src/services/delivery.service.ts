import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import websocketService from "./websocket.service";
import type {
  Location, PricingCalculation, DistanceDuration, RideDetails, CreateRideRequest,
  Ride, RideOffer, CalculatePriceRequest, CalculatePriceResponse,
  ActiveRideResponse, ActiveRidesResponse, RatePayload
} from "./ride.service";

class DeliveryService {
  private mapToRideModel(r: any): Ride {
    return {
      _id: r.id, clientId: r.client_id, driverId: r.driver_id, serviceType: r.service_type,
      vehicleType: r.vehicle_type, rideCategory: r.ride_category, pickup: r.pickup, dropoff: r.dropoff,
      stops: r.stops, pricing: r.pricing, distance: r.distance, duration: r.duration,
      routeCoordinates: r.route_coordinates, details: r.details, status: r.status,
      cancellationFee: r.cancellation_fee, requestedAt: r.requested_at, acceptedAt: r.accepted_at,
      arrivedAt: r.arrived_at, startedAt: r.started_at, completedAt: r.completed_at,
      cancelledAt: r.cancelled_at, scheduledFor: r.scheduled_for, negotiation: r.negotiation,
      promotion: r.promotion, payment: r.payment, isWaitingInQueue: r.is_waiting_in_queue,
      arrivedAtDropoff: r.arrived_at_dropoff, createdAt: r.created_at, updatedAt: r.updated_at,
    };
  }

  async calculatePrice(data: CalculatePriceRequest): Promise<CalculatePriceResponse> {
    const basePrice = 10.0, distanceKm = data.distance || 5.0, durationMin = data.duration || 10.0;
    const distancePrice = distanceKm * 2.0, total = basePrice + distancePrice;
    return {
      pricing: { basePrice, distancePrice, serviceFee: 2.0, total, currency: "BRL" },
      distance: { value: distanceKm * 1000, text: `${distanceKm.toFixed(1)} km` },
      duration: { value: durationMin * 60, text: `${durationMin.toFixed(0)} min` },
    };
  }

  async create(data: CreateRideRequest): Promise<Ride> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase
      .from("rides")
      .insert({
        client_id: userId, service_type: "delivery", vehicle_type: data.vehicleType,
        ride_category: data.rideCategory || null, pickup: data.pickup, dropoff: data.dropoff,
        stops: data.stops || null, pricing: data.pricing, distance: data.distance, duration: data.duration,
        route_coordinates: data.routeCoordinates || null, details: data.details || null, status: "requesting",
        negotiation: data.negotiation || {}, promotion: data.promotionCode ? { code: data.promotionCode } : {},
        payment: data.payment || {}, is_waiting_in_queue: false, arrived_at_dropoff: false,
      })
      .select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-created", { rideId: mapped._id, ride: mapped });
    return mapped;
  }

  async getActive(): Promise<ActiveRideResponse> {
    try {
      const userId = await requireUserId();
      const { data: ride, error } = await supabase
        .from("rides").select("*")
        .eq("service_type", "delivery")
        .or(`client_id.eq.${userId},driver_id.eq.${userId}`)
        .not("status", "in", '("completed","cancelled")')
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { active: false, ride: null };
        }
        throw error;
      }
      return { active: !!ride, ride: ride ? this.mapToRideModel(ride) : null };
    } catch {
      return { active: false, ride: null };
    }
  }

  async getActiveList(): Promise<ActiveRidesResponse> {
    try {
      const userId = await requireUserId();
      const { data: rides, error } = await supabase
        .from("rides").select("*")
        .eq("service_type", "delivery")
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
        active: !!(rides && rides.length > 0),
        count: rides ? rides.length : 0,
        rides: (rides || []).map((r) => this.mapToRideModel(r)),
      };
    } catch {
      return { active: false, count: 0, rides: [] };
    }
  }

  async getHistory(params?: { status?: string; limit?: number; page?: number }): Promise<{
    rides: Ride[]; pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    try {
      const userId = await requireUserId(), limit = params?.limit || 10, page = params?.page || 1;
      const from = (page - 1) * limit, to = from + limit - 1;
      let query = supabase.from("rides").select("*", { count: "exact" }).eq("service_type", "delivery")
        .or(`client_id.eq.${userId},driver_id.eq.${userId}`);
      if (params?.status) query = query.eq("status", params.status);
      const { data: rides, count, error } = await query.order("created_at", { ascending: false }).range(from, to);
      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return { rides: [], pagination: { total: 0, page, limit, pages: 0 } };
        }
        throw error;
      }
      const total = count || 0;
      return {
        rides: (rides || []).map((r) => this.mapToRideModel(r)),
        pagination: { total, page, limit, pages: Math.ceil(total / limit) },
      };
    } catch {
      const limit = params?.limit || 10, page = params?.page || 1;
      return { rides: [], pagination: { total: 0, page, limit, pages: 0 } };
    }
  }

  async cancel(rideId: string, reason?: string): Promise<{ message?: string; cancellationFee?: number; redispatched?: boolean }> {
    const { data: ride, error } = await supabase.from("rides")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "cancelled", ride: mapped });
    websocketService.emit("ride-cancelled", { rideId, reason });
    return { message: "Entrega cancelada com sucesso", cancellationFee: 0 };
  }

  async accept(rideId: string): Promise<Ride> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase.from("rides")
      .update({ driver_id: userId, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
    websocketService.emit("driver-found", { rideId, driverId: userId, ride: mapped });
    return mapped;
  }

  async reject(rideId: string, reason?: string): Promise<void> {
    websocketService.emit("ride-rejected-by-driver", { rideId, reason });
  }

  async updateStatus(rideId: string, status?: string, arrivedAtDropoff?: boolean, pins?: { pickupPin?: string; deliveryPin?: string }): Promise<Ride> {
    const updates: any = {};
    if (status) updates.status = status;
    if (arrivedAtDropoff !== undefined) updates.arrived_at_dropoff = arrivedAtDropoff;
    if (pins) {
      const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
      const currentDetails = current?.details || {};
      updates.details = { ...currentDetails, pickupPin: pins.pickupPin || currentDetails.pickupPin, deliveryPin: pins.deliveryPin || currentDetails.deliveryPin };
    }
    const nowStr = new Date().toISOString();
    if (status === "arrived") updates.arrived_at = nowStr;
    else if (status === "started") updates.started_at = nowStr;
    else if (status === "completed") updates.completed_at = nowStr;

    const { data: ride, error } = await supabase.from("rides").update(updates).eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    if (status) {
      websocketService.emit("ride-status-updated", { rideId, status, ride: mapped });
      if (status === "arrived") websocketService.emit("driver-arrived", { rideId, ride: mapped });
      else if (status === "started") websocketService.emit("ride-started", { rideId, ride: mapped });
    }
    return mapped;
  }

  async rateClientToDriver(rideId: string, payload: RatePayload): Promise<void> {
    const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
    const details = current?.details || {};
    const { error } = await supabase.from("rides").update({ details: { ...details, clientRating: payload.stars } }).eq("id", rideId);
    if (error) throw error;
  }

  async rateDriverToClient(rideId: string, payload: RatePayload): Promise<void> {
    const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
    const details = current?.details || {};
    const { error } = await supabase.from("rides").update({ details: { ...details, driverRating: payload.stars } }).eq("id", rideId);
    if (error) throw error;
  }

  async reportDeliveryProblem(rideId: string, payload: { reason: string; photoUrl?: string; note?: string }): Promise<{ message?: string; deliveryFailure?: any }> {
    const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
    const details = current?.details || {};
    const { data: ride, error } = await supabase.from("rides")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString(), details: { ...details, deliveryProblem: payload } })
      .eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    websocketService.emit("ride-status-updated", { rideId, status: "cancelled", ride: mapped });
    return { message: "Problema relatado com sucesso", deliveryFailure: payload };
  }

  async uploadPickupProof(rideId: string, photoBase64: string): Promise<void> {
    const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
    const details = current?.details || {};
    const { error } = await supabase.from("rides").update({ details: { ...details, pickupProof: `${photoBase64.substring(0, 100)}...` } }).eq("id", rideId);
    if (error) throw error;
  }

  async uploadDeliveryProof(rideId: string, photoBase64: string): Promise<void> {
    const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
    const details = current?.details || {};
    const { error } = await supabase.from("rides").update({ details: { ...details, deliveryProof: `${photoBase64.substring(0, 100)}...` } }).eq("id", rideId);
    if (error) throw error;
  }

  async validatePin(rideId: string, pinType: "pickup" | "delivery", pin: string): Promise<{
    success: boolean; valid: boolean; required: boolean; validatedAt?: string; attempts?: number; remaining?: number; message?: string;
  }> {
    const { data: ride, error } = await supabase.from("rides").select("details").eq("id", rideId).single();
    if (error || !ride) return { success: false, valid: false, required: false, message: "Corrida não encontrada" };
    const details = ride.details || {};
    const expectedPin = pinType === "pickup" ? details.pickupPin : details.deliveryPin;
    if (!expectedPin) return { success: true, valid: true, required: false };
    const isValid = String(expectedPin) === String(pin);
    return {
      success: true, valid: isValid, required: true,
      validatedAt: isValid ? new Date().toISOString() : undefined,
      message: isValid ? "PIN validado com sucesso" : "PIN incorreto",
    };
  }

  async getOffers(rideId: string): Promise<{
    negotiation: { enabled: boolean; clientOffer: number | null; suggestedMinPrice: number | null; finalAgreedPrice: number | null; selectedDriverId?: string | null };
    offers: RideOffer[]; allRejected?: boolean;
  }> {
    const { data: ride, error } = await supabase.from("rides").select("negotiation").eq("id", rideId).single();
    if (error || !ride) return { negotiation: { enabled: false, clientOffer: null, suggestedMinPrice: null, finalAgreedPrice: null }, offers: [] };
    const neg = ride.negotiation || {};
    return {
      negotiation: {
        enabled: !!neg.enabled, clientOffer: neg.clientOffer || null, suggestedMinPrice: neg.suggestedMinPrice || null,
        finalAgreedPrice: neg.finalAgreedPrice || null, selectedDriverId: neg.selectedDriverId || null,
      },
      offers: neg.offers || [], allRejected: neg.allRejected,
    };
  }

  async respondToOffer(rideId: string, payload: { action: "accept" | "counter" | "reject"; amount?: number; message?: string }): Promise<{ success: boolean; rideMatched?: boolean; message?: string }> {
    const userId = await requireUserId();
    const { data: ride, error: getError } = await supabase.from("rides").select("negotiation, driver_id").eq("id", rideId).single();
    if (getError || !ride) return { success: false, message: "Corrida não encontrada" };
    const negotiation = ride.negotiation || {}, offers = negotiation.offers || [];

    if (payload.action === "accept") {
      negotiation.finalAgreedPrice = payload.amount;
      negotiation.selectedDriverId = userId;
      const { data: updated, error } = await supabase.from("rides")
        .update({ driver_id: userId, status: "accepted", accepted_at: new Date().toISOString(), negotiation })
        .eq("id", rideId).select().single();
      if (error) throw error;
      const mapped = this.mapToRideModel(updated);
      websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
      websocketService.emit("ride-offers-updated", { rideId, offers });
      return { success: true, rideMatched: true };
    } else {
      const newOffer: RideOffer = {
        driverId: userId, amount: payload.amount || 0, status: payload.action === "counter" ? "countered" : "rejected",
        message: payload.message, createdAt: new Date().toISOString(),
      };
      offers.push(newOffer);
      negotiation.offers = offers;
      const { error } = await supabase.from("rides").update({ negotiation }).eq("id", rideId);
      if (error) throw error;
      websocketService.emit("ride-offers-updated", { rideId, offers });
      return { success: true, rideMatched: false };
    }
  }

  async selectOffer(rideId: string, driverId: string): Promise<Ride> {
    const { data: ride, error: getError } = await supabase.from("rides").select("negotiation").eq("id", rideId).single();
    if (getError || !ride) throw new Error("Corrida não encontrada");
    const negotiation = ride.negotiation || {}, offers = negotiation.offers || [];
    const chosenOffer = offers.find((o: any) => (o.driverId?._id || o.driverId) === driverId);

    negotiation.finalAgreedPrice = chosenOffer ? chosenOffer.amount : negotiation.clientOffer;
    negotiation.selectedDriverId = driverId;
    const { data: updated, error } = await supabase.from("rides")
      .update({ driver_id: driverId, status: "accepted", accepted_at: new Date().toISOString(), negotiation })
      .eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(updated);
    websocketService.emit("ride-status-updated", { rideId, status: "accepted", ride: mapped });
    return mapped;
  }
}

export default new DeliveryService();
