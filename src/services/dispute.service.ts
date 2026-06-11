import { supabase } from "../lib/supabase";
import { requireUserId } from "./appwrite-auth.service";

export type DisputeCategory =
  | "payment"
  | "safety"
  | "delivery_problem"
  | "cancellation_fee"
  | "route"
  | "behavior"
  | "other";

export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected" | "cancelled";

export interface Dispute {
  _id: string;
  rideId: string;
  category: DisputeCategory;
  status: DisputeStatus;
  severity?: "low" | "medium" | "high" | "critical";
  description: string;
  resolution?: { summary?: string; amountAdjusted?: number; resolvedAt?: string };
  createdAt: string;
}

export interface CreateDisputePayload {
  rideId: string;
  category: DisputeCategory;
  description: string;
  severity?: "low" | "medium" | "high" | "critical";
  evidenceUrls?: string[];
}

const disputeService = {
  /** Abre uma disputa/contestação sobre uma corrida/entrega. */
  async create(payload: CreateDisputePayload): Promise<Dispute> {
    const userId = await requireUserId();
    try {
      const { data, error } = await supabase
        .from("disputes")
        .insert({
          user_id: userId,
          ride_id: payload.rideId,
          category: payload.category,
          description: payload.description,
          severity: payload.severity || "medium",
          status: "open",
          evidence_urls: payload.evidenceUrls || [],
        })
        .select()
        .single();

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") {
          return {
            _id: Math.random().toString(36).substring(7),
            rideId: payload.rideId,
            category: payload.category,
            status: "open",
            severity: payload.severity || "medium",
            description: payload.description,
            createdAt: new Date().toISOString(),
          };
        }
        throw error;
      }

      return {
        _id: data.id,
        rideId: data.ride_id,
        category: data.category as DisputeCategory,
        status: data.status as DisputeStatus,
        severity: data.severity as any,
        description: data.description,
        resolution: data.resolution || undefined,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error("Erro ao criar disputa:", error);
      return {
        _id: Math.random().toString(36).substring(7),
        rideId: payload.rideId,
        category: payload.category,
        status: "open",
        severity: payload.severity || "medium",
        description: payload.description,
        createdAt: new Date().toISOString(),
      };
    }
  },

  /** Lista as disputas do usuário autenticado. */
  async listMine(params?: { status?: DisputeStatus; limit?: number }): Promise<Dispute[]> {
    try {
      const userId = await requireUserId();
      let query = supabase
        .from("disputes")
        .select("*")
        .eq("user_id", userId);

      if (params?.status) {
        query = query.eq("status", params.status);
      }

      const limit = params?.limit || 20;
      query = query.order("created_at", { ascending: false }).range(0, limit - 1);

      const { data, error } = await query;

      if (error) {
        if (error.code === "42P01" || error.code === "PGRST205") return [];
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        rideId: row.ride_id,
        category: row.category as DisputeCategory,
        status: row.status as DisputeStatus,
        severity: row.severity as any,
        description: row.description,
        resolution: row.resolution || undefined,
        createdAt: row.created_at,
      }));
    } catch (error) {
      console.error("Erro ao listar disputas:", error);
      return [];
    }
  },
};

export default disputeService;
