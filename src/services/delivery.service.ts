import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";
import pricingService, { calculateFare } from "./pricing.service";
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
    if (!data.distance || data.distance <= 0) {
      throw new Error("Distância da rota não informada. Tente novamente.");
    }
    const distanceKm = data.distance;
    const durationMin = data.duration || 0;

    const rules = await pricingService.getRules("delivery");
    const rule = rules.find((r) => r.vehicleCategory === data.vehicleType);
    if (!rule) throw new Error("Tabela de preços de entrega não configurada para este veículo.");

    const fare = calculateFare(rule.pricing, distanceKm, durationMin, data.stops?.length || 0);
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
    try {
      // 1. Tentar chamar a RPC no banco de dados para segurança transacional
      const { data: fee, error: rpcErr } = await supabase.rpc("rpc_cancel_ride", {
        p_ride_id: rideId,
        p_reason: reason || "Cancelado pelo usuário"
      });

      if (!rpcErr) {
        return { message: "Entrega cancelada com sucesso", cancellationFee: Number(fee || 0) };
      }
      // Se não for erro de "função não encontrada", propaga
      if (rpcErr.code !== "PGRST202" && rpcErr.code !== "42883") {
        throw rpcErr;
      }
    } catch (rpcEx) {
      console.warn("[DeliveryService] Falha na RPC rpc_cancel_ride, usando fallback local:", rpcEx);
    }

    // Fallback local caso a RPC não esteja instalada no Supabase
    const { data: ride, error: getErr } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (getErr || !ride) {
      throw getErr || new Error("Entrega não encontrada");
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
          description: "Multa por cancelamento de entrega (fallback)",
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
          description: "Crédito por cancelamento de entrega (fallback)",
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
    return { message: "Entrega cancelada com sucesso", cancellationFee: appliedFee };
  }

  async accept(rideId: string): Promise<Ride> {
    const userId = await requireUserId();
    const { data: ride, error } = await supabase.from("rides")
      .update({ driver_id: userId, status: "accepted", accepted_at: new Date().toISOString() })
      .eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);
    return mapped;
  }

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
      const { data: current } = await supabase.from("rides").select("details").eq("id", rideId).single();
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

    const { data: ride, error } = await supabase.from("rides").update(updates).eq("id", rideId).select().single();
    if (error) throw error;
    const mapped = this.mapToRideModel(ride);

    if (status === "completed") {
      // Liquida a corrida/entrega: debita taxa do motorista, transfere se pagamento=wallet
      supabase.rpc("rpc_settle_ride", { p_ride_id: rideId }).then(({ error: settleErr }) => {
        if (settleErr) console.error("[rpc_settle_ride] falhou para entrega:", settleErr);
      });
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
    try {
      // 1. Tentar chamar a RPC no banco de dados para segurança transacional
      const { data: success, error: rpcErr } = await supabase.rpc("rpc_return_delivery", {
        p_ride_id: rideId,
        p_reason: payload.reason || "Destinatário ausente"
      });

      if (!rpcErr && success) {
        return { message: "Problema relatado com sucesso", deliveryFailure: payload };
      }
      if (rpcErr && rpcErr.code !== "PGRST202" && rpcErr.code !== "42883") {
        throw rpcErr;
      }
    } catch (rpcEx) {
      console.warn("[DeliveryService] Falha na RPC rpc_return_delivery, usando fallback local:", rpcEx);
    }

    // Fallback local caso a RPC não esteja instalada no Supabase
    const { data: ride, error: getErr } = await supabase
      .from("rides")
      .select("*")
      .eq("id", rideId)
      .single();

    if (getErr || !ride) {
      throw getErr || new Error("Entrega não encontrada");
    }

    const details = ride.details || {};
    const totalFare = Number(ride.pricing?.total || 0);
    const returnSurcharge = Math.round(totalFare * 0.50 * 100) / 100; // 50% de taxa adicional
    const totalCharge = totalFare + returnSurcharge;
    const appFee = Math.round(totalFare * 0.15 * 100) / 100; // comissão do app (15%)
    const driverValue = totalCharge - appFee;
    const paymentMethod = ride.payment?.method?.type || "cash";

    if (paymentMethod === "wallet") {
      // Debita o cliente pelo valor total + devolução
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("wallet_balance")
          .eq("id", ride.client_id)
          .single();
        const newClientBalance = Number(profile?.wallet_balance || 0) - totalCharge;
        await supabase
          .from("profiles")
          .update({ wallet_balance: newClientBalance })
          .eq("id", ride.client_id);

        // Transação
        await supabase.from("wallet_transactions").insert({
          user_id: ride.client_id,
          type: "delivery_failed_charge",
          amount: -totalCharge,
          description: "Cobrança de entrega malsucedida + retorno (fallback)",
          reference_id: rideId,
          status: "paid",
        });
      } catch (clientErr) {
        console.error("Erro ao debitar cliente na devolução:", clientErr);
      }

      // Credita o motorista
      try {
        const { data: detailsDb } = await supabase
          .from("driver_details")
          .select("balance")
          .eq("id", ride.driver_id)
          .single();
        const newDriverBalance = Number(detailsDb?.balance || 0) + driverValue;
        await supabase
          .from("driver_details")
          .update({ balance: newDriverBalance })
          .eq("id", ride.driver_id);

        // Transação
        await supabase.from("wallet_transactions").insert({
          user_id: ride.driver_id,
          type: "ride_payment",
          amount: driverValue,
          description: "Remuneração de entrega malsucedida + retorno (fallback)",
          reference_id: rideId,
          status: "paid",
        });
      } catch (driverErr) {
        console.error("Erro ao creditar motorista na devolução:", driverErr);
      }
    } else {
      // Dinheiro / máquina de cartão: desconta taxa do app do motorista
      try {
        const { data: detailsDb } = await supabase
          .from("driver_details")
          .select("balance")
          .eq("id", ride.driver_id)
          .single();
        const newDriverBalance = Number(detailsDb?.balance || 0) - appFee;
        await supabase
          .from("driver_details")
          .update({ balance: newDriverBalance })
          .eq("id", ride.driver_id);

        // Transação de comissão do motorista
        await supabase.from("wallet_transactions").insert({
          user_id: ride.driver_id,
          type: "app_fee_debit",
          amount: -appFee,
          description: "Taxa de intermediação de entrega devolvida (fallback)",
          reference_id: rideId,
          status: "paid",
        });
      } catch (driverErr) {
        console.error("Erro ao debitar comissão na devolução:", driverErr);
      }
    }

    const { data: updatedRide, error } = await supabase.from("rides")
      .update({
        status: "returned",
        cancelled_at: new Date().toISOString(),
        details: {
          ...details,
          settled: true,
          deliveryProblem: payload,
        }
      })
      .eq("id", rideId).select().single();

    if (error) throw error;
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
    return mapped;
  }
}

export default new DeliveryService();
