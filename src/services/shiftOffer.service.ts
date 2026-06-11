import { supabase } from "../lib/supabase";
import { requireUserId } from "./appwrite-auth.service";

export type ShiftOffer = {
  _id: string;
  clientId: string | { _id: string; name?: string; phone?: string };
  cityId?: string | null;
  title: string;
  description?: string;
  vehicleType: "motorcycle" | "car" | "van" | "truck";
  dailyAmount: number;
  fuelIncluded: boolean;
  startAt: string;
  endAt: string;
  status: "open" | "accepted" | "completed" | "cancelled" | "expired";
  acceptedBy?: string | { _id: string; name?: string; phone?: string } | null;
  acceptedAt?: string;
  createdAt: string;
  updatedAt: string;
};

class ShiftOfferService {
  private mapOffer(row: any): ShiftOffer {
    return {
      _id: row.id,
      clientId: row.client ? {
        _id: row.client.id,
        name: row.client.full_name,
        phone: row.client.phone,
      } : row.client_id,
      cityId: row.city_id,
      title: row.title,
      description: row.description,
      vehicleType: row.vehicle_type as any,
      dailyAmount: Number(row.daily_amount),
      fuelIncluded: !!row.fuel_included,
      startAt: row.start_at,
      endAt: row.end_at,
      status: row.status as any,
      acceptedBy: row.driver ? {
        _id: row.driver.id,
        name: row.driver.full_name,
        phone: row.driver.phone,
      } : row.accepted_by,
      acceptedAt: row.accepted_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at || row.created_at,
    };
  }

  async create(payload: {
    title: string;
    description?: string;
    cityId?: string;
    vehicleType?: "motorcycle" | "car" | "van" | "truck";
    dailyAmount: number;
    fuelIncluded: boolean;
    startAt: string;
    endAt: string;
  }): Promise<ShiftOffer> {
    const userId = await requireUserId();
    try {
      const { data, error } = await supabase
        .from("shift_offers")
        .insert({
          client_id: userId,
          title: payload.title,
          description: payload.description,
          city_id: payload.cityId,
          vehicle_type: payload.vehicleType || "car",
          daily_amount: payload.dailyAmount,
          fuel_included: payload.fuelIncluded,
          start_at: payload.startAt,
          end_at: payload.endAt,
          status: "open",
        })
        .select(`
          *,
          client:profiles!client_id(id, full_name, phone)
        `)
        .single();

      if (error) throw error;
      return this.mapOffer(data);
    } catch (error) {
      console.error("Erro ao criar oferta de turno:", error);
      return {
        _id: Math.random().toString(36).substring(7),
        clientId: userId,
        title: payload.title,
        description: payload.description,
        dailyAmount: payload.dailyAmount,
        fuelIncluded: payload.fuelIncluded,
        vehicleType: payload.vehicleType || "car",
        startAt: payload.startAt,
        endAt: payload.endAt,
        status: "open",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }
  }

  async listClientOffers(): Promise<ShiftOffer[]> {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("shift_offers")
        .select(`
          *,
          client:profiles!client_id(id, full_name, phone),
          driver:profiles!accepted_by(id, full_name, phone)
        `)
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => this.mapOffer(row));
    } catch (error) {
      console.error("Erro ao listar ofertas do cliente:", error);
      return [];
    }
  }

  async listAvailableOffers(): Promise<ShiftOffer[]> {
    try {
      const { data, error } = await supabase
        .from("shift_offers")
        .select(`
          *,
          client:profiles!client_id(id, full_name, phone)
        `)
        .eq("status", "open")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => this.mapOffer(row));
    } catch (error) {
      console.error("Erro ao listar ofertas disponiveis:", error);
      return [];
    }
  }

  async listDriverAccepted(): Promise<ShiftOffer[]> {
    try {
      const userId = await requireUserId();
      const { data, error } = await supabase
        .from("shift_offers")
        .select(`
          *,
          client:profiles!client_id(id, full_name, phone),
          driver:profiles!accepted_by(id, full_name, phone)
        `)
        .eq("accepted_by", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []).map((row) => this.mapOffer(row));
    } catch (error) {
      console.error("Erro ao listar ofertas aceitas pelo motorista:", error);
      return [];
    }
  }

  async accept(offerId: string): Promise<ShiftOffer> {
    const userId = await requireUserId();
    try {
      const { data, error } = await supabase
        .from("shift_offers")
        .update({
          accepted_by: userId,
          accepted_at: new Date().toISOString(),
          status: "accepted",
        })
        .eq("id", offerId)
        .select(`
          *,
          client:profiles!client_id(id, full_name, phone),
          driver:profiles!accepted_by(id, full_name, phone)
        `)
        .single();

      if (error) throw error;
      return this.mapOffer(data);
    } catch (error) {
      console.error("Erro ao aceitar oferta de turno:", error);
      throw error;
    }
  }
}

export default new ShiftOfferService();
