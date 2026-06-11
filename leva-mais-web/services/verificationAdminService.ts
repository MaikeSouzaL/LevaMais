import { supabase } from "../lib/supabase";

export const verificationAdminService = {
  async listUsers(userType: "driver" | "client") {
    try {
      if (userType === "client") {
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
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select(`
            *,
            driver_details!driver_details_id_fkey(*)
          `)
          .eq("role", "driver");
        if (error) throw error;

        return (data || []).map((row: any) => {
          const details = row["driver_details!driver_details_id_fkey"]?.[0] || 
                          row["driver_details!driver_details_id_fkey"] || 
                          row.driver_details?.[0] || 
                          row.driver_details || 
                          null;
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
          };
        });
      }
    } catch (error) {
      console.error("Error listing users for verification:", error);
      return [];
    }
  },

  async updateUserById(userId: string, payload: Record<string, unknown>) {
    const profileUpdates: any = {};
    if (payload.isActive !== undefined) profileUpdates.is_active = payload.isActive;
    if (payload.name !== undefined) profileUpdates.full_name = payload.name;

    if (Object.keys(profileUpdates).length > 0) {
      const { data, error } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
    return null;
  },

  async updateClientVerification(userId: string, field: "cpfStatus" | "selfieStatus", status: string, reason?: string) {
    const { data: profile, error: getError } = await supabase
      .from("profiles")
      .select("client_verification")
      .eq("id", userId)
      .single();

    if (getError) throw getError;

    const currentVerification = profile?.client_verification || {};
    const updatedVerification = {
      ...currentVerification,
      [field]: status,
      ...(reason ? { rejectionReason: reason } : {}),
      reviewedAt: new Date().toISOString(),
    };

    if (updatedVerification.cpfStatus === "approved" && updatedVerification.selfieStatus === "approved") {
      updatedVerification.status = "approved";
    } else if (updatedVerification.cpfStatus === "rejected" || updatedVerification.selfieStatus === "rejected") {
      updatedVerification.status = "rejected";
    }

    const { data: updated, error } = await supabase
      .from("profiles")
      .update({ client_verification: updatedVerification })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async updateDriverVerification(
    userId: string,
    field:
      | "cnhFrontStatus"
      | "cnhBackStatus"
      | "selfieStatus"
      | "cpfStatus"
      | "bankAccountStatus"
      | "faceMatchStatus"
      | "backgroundCheckStatus"
      | "driverStatus",
    status: string,
    reason?: string,
    riskFlags?: string[]
  ) {
    const { data: details, error: getError } = await supabase
      .from("driver_details")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (getError) throw getError;

    const currentDocs = details?.documents || {};
    const updatedDocs = {
      ...currentDocs,
    };

    const updates: any = {};
    if (field === "driverStatus") {
      updates.status = status;
      if (reason) updates.rejection_reason = reason;
    } else {
      updatedDocs[field] = status;
      updates.documents = updatedDocs;
      if (reason) updatedDocs.rejectionReason = reason;
    }

    if (riskFlags) {
      updates.risk_flags = riskFlags;
    }

    const { data: updated, error } = await supabase
      .from("driver_details")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return updated;
  },
};
