import { supabase } from "../lib/supabase";

export interface Withdrawal {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    cpf?: string;
    bankAccount?: {
      bank?: string;
      agency?: string;
      account?: string;
      accountType?: string;
      pixKey?: string;
    };
  };
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: "pending" | "paid" | "rejected";
  createdAt: string;
  processedAt?: string;
  transactionId?: string;
  rejectionReason?: string;
}

export const withdrawalsService = {
  async getAll(status?: string): Promise<Withdrawal[]> {
    try {
      let query = supabase
        .from("withdrawals")
        .select(`
          *,
          profiles(*)
        `);

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) {
        if (error.code === "42P01") return [];
        throw error;
      }

      return (data || []).map((row: any) => {
        const profile = row.profiles?.[0] || row.profiles || {};
        return {
          _id: row.id,
          userId: {
            _id: profile.id || row.user_id,
            name: profile.full_name || "Sem Nome",
            email: profile.email || "",
            phone: profile.phone || undefined,
            cpf: profile.cpf || undefined,
            bankAccount: profile.bank_account || undefined,
          },
          amount: Number(row.amount || 0),
          pixKey: row.pix_key || "",
          pixKeyType: row.pix_key_type || "",
          status: row.status,
          createdAt: row.created_at,
          processedAt: row.processed_at || undefined,
          transactionId: row.transaction_id || undefined,
          rejectionReason: row.rejection_reason || undefined,
        };
      });
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      return [];
    }
  },

  async approve(id: string, transactionId?: string): Promise<any> {
    const { data, error } = await supabase
      .from("withdrawals")
      .update({
        status: "paid",
        transaction_id: transactionId,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async reject(id: string, reason: string): Promise<any> {
    const { data, error } = await supabase
      .from("withdrawals")
      .update({
        status: "rejected",
        rejection_reason: reason,
        processed_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};
