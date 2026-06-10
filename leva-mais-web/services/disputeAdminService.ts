import { supabase } from "../lib/supabase";

export type DisputeStatus = "open" | "in_review" | "resolved" | "rejected" | "cancelled";
export type DisputeSeverity = "low" | "medium" | "high" | "critical";

export interface DisputeItem {
  _id: string;
  rideId?: {
    _id: string;
    status?: string;
    serviceType?: string;
    pricing?: { total?: number };
  } | string;
  openedBy: string;
  clientId: string;
  driverId?: string;
  category: string;
  status: DisputeStatus;
  severity: DisputeSeverity;
  description: string;
  resolution?: {
    summary?: string;
    amountAdjusted?: number;
    resolvedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export const disputeAdminService = {
  async list(status?: string): Promise<DisputeItem[]> {
    try {
      let query = supabase.from("disputes").select("*");

      if (status && status !== "all") {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }

      return (data || []).map((row: any) => ({
        _id: row.id,
        rideId: row.ride_id || "",
        openedBy: row.user_id || "",
        clientId: row.user_id || "",
        driverId: undefined,
        category: row.category || "other",
        status: row.status as DisputeStatus,
        severity: (row.severity || "medium") as DisputeSeverity,
        description: row.description || "",
        resolution: row.resolution || undefined,
        createdAt: row.created_at,
        updatedAt: row.updated_at || row.created_at,
      }));
    } catch (error) {
      console.error("Error listing disputes for admin:", error);
      return [];
    }
  },

  async update(
    disputeId: string,
    payload: {
      status?: DisputeStatus;
      severity?: DisputeSeverity;
      resolutionSummary?: string;
      amountAdjusted?: number;
    }
  ): Promise<any> {
    const updates: any = {};
    if (payload.status) updates.status = payload.status;
    if (payload.severity) updates.severity = payload.severity;

    if (payload.resolutionSummary !== undefined || payload.amountAdjusted !== undefined) {
      updates.resolution = {
        summary: payload.resolutionSummary || "",
        amountAdjusted: Number(payload.amountAdjusted || 0),
        resolvedAt: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from("disputes")
      .update(updates)
      .eq("id", disputeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
