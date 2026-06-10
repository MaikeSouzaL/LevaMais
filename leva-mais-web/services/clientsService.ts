import { supabase } from "../lib/supabase";

export interface Client {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  userType?: "client";
  isActive: boolean;
  createdAt: string;
  city?: string;
  emailVerified?: boolean;
  clientVerification?: {
    status?: string;
    cpfStatus?: string;
    selfieStatus?: string;
    documents?: {
      selfie?: string;
    };
    rejectionReason?: string;
    submittedAt?: string;
    reviewedAt?: string;
  };
  lastLocation?: {
    type: "Point";
    coordinates: [number, number];
    updatedAt: string;
  };
}

export const clientsService = {
  async getAll(): Promise<Client[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("role", "client");

      if (error) throw error;

      return (data || []).map((row: any) => ({
        _id: row.id,
        name: row.full_name || "",
        email: row.email || "",
        phone: row.phone || "",
        cpf: row.cpf || undefined,
        userType: "client",
        isActive: row.is_active !== false,
        createdAt: row.created_at,
        city: row.city || undefined,
        clientVerification: row.client_verification || {
          status: "approved",
        },
      }));
    } catch (error) {
      console.error("Error fetching clients:", error);
      return [];
    }
  },

  async updateStatus(id: string, isActive: boolean): Promise<unknown> {
    const { data, error } = await supabase
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<unknown> {
    const { data, error } = await supabase
      .from("profiles")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return data;
  }
};
