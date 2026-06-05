import api from "./api";

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
    const { data } = await api.post("/disputes", payload);
    return data?.dispute || data?.data || data;
  },

  /** Lista as disputas do usuário autenticado. */
  async listMine(params?: { status?: DisputeStatus; limit?: number }): Promise<Dispute[]> {
    const { data } = await api.get("/disputes", { params });
    const disputes = data?.disputes || data?.data || data || [];
    return Array.isArray(disputes) ? disputes : [];
  },
};

export default disputeService;
