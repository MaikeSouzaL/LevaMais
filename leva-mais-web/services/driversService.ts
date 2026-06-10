import { supabase } from "../lib/supabase";

export interface Driver {
  _id: string;
  name: string;
  email: string;
  phone: string;
  cpf?: string;
  userType?: "driver";
  isActive: boolean;
  createdAt: string;
  city?: string;
  driverStatus?: string;
  driverDocuments?: {
    cnhFront?: string;
    cnhBack?: string;
    selfie?: string;
    cnhFrontStatus?: string;
    cnhBackStatus?: string;
    selfieStatus?: string;
    rejectionReason?: string;
    submittedAt?: string;
  };
  vehicles?: Array<{
    _id?: string;
    type?: string;
    plate?: string;
    model?: string;
    color?: string;
    year?: number;
    status?: string;
    documents?: {
      crlvFront?: string;
      crlvBack?: string;
      vehiclePhoto?: string;
    };
  }>;
  bankAccount?: {
    bank?: string;
    agency?: string;
    account?: string;
    accountType?: string;
    pixKey?: string;
  };
}

export const driversService = {
  async getAll(): Promise<Driver[]> {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(`
          *,
          driver_details(*)
        `)
        .eq("role", "driver");

      if (error) throw error;

      return (data || []).map((row: any) => {
        const details = row.driver_details?.[0] || row.driver_details || null;
        return {
          _id: row.id,
          name: row.full_name || "",
          email: row.email || "",
          phone: row.phone || "",
          cpf: row.cpf || undefined,
          userType: "driver",
          isActive: row.is_active !== false,
          createdAt: row.created_at,
          city: row.city || undefined,
          driverStatus: details?.status || "none",
          driverDocuments: details?.documents || undefined,
          vehicles: details ? [
            {
              _id: details.id,
              type: details.vehicle_type,
              plate: details.vehicle_plate,
              model: details.vehicle_model,
              color: details.vehicle_color,
              year: details.vehicle_year,
              status: details.status === "approved" ? "approved" : "pending",
              documents: details.documents || {},
            }
          ] : [],
          bankAccount: details?.bank_account || undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching drivers:", error);
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
