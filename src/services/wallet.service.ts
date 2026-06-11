import { supabase } from "../lib/supabase";
import { requireUserId } from "./appwrite-auth.service";

export interface Withdrawal {
  _id: string;
  amount: number;
  status: "pending" | "processing" | "paid" | "rejected";
  createdAt: string;
  pixKey: string;
}

export interface StatementItem {
  _id: string;
  type: "ride" | "withdrawal";
  amount: number;
  date: string;
  description: string;
  status?: string;
}

export interface StatementPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
}

export interface StatementResponse {
  items: StatementItem[];
  pagination: StatementPagination;
}

export interface Balance {
  totalEarnings: number;
  totalWithdrawn: number;
  available: number;
}

class WalletService {
  /**
   * Get wallet balance
   */
  async getBalance(): Promise<Balance> {
    const userId = await requireUserId();

    // 1. Get balance from profiles
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      if (profileError.code !== "42P01" && profileError.code !== "PGRST205") {
        throw profileError;
      }
    }

    // 2. Sum withdrawals from withdrawals table
    let totalWithdrawn = 0;
    try {
      const { data: withdrawals, error: wError } = await supabase
        .from("withdrawals")
        .select("amount")
        .eq("user_id", userId)
        .neq("status", "rejected");

      if (wError) {
        if (wError.code !== "42P01" && wError.code !== "PGRST205") throw wError;
      } else {
        totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + Number(w.amount), 0);
      }
    } catch (err: any) {
      if (err?.code !== "42P01" && err?.code !== "PGRST205") throw err;
    }

    return {
      totalEarnings: 0,
      totalWithdrawn,
      available: Number(profile?.wallet_balance || 0),
    };
  }

  /**
   * Request withdrawal
   */
  async withdraw(amount: number, pixKey: string, pixKeyType: string): Promise<Withdrawal> {
    const userId = await requireUserId();

    // 1. Check current driver balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("wallet_balance")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) throw profileError;

    const currentBalance = Number(profile?.wallet_balance || 0);
    if (currentBalance < amount) {
      throw new Error("Saldo insuficiente");
    }

    // 2. Deduct amount from profiles
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ wallet_balance: currentBalance - amount })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 3. Create withdrawal record
    let withdrawalId = `local_w_${Date.now()}`;
    let withdrawalCreatedAt = new Date().toISOString();
    let withdrawalStatus = "pending";

    try {
      const { data: withdrawal, error: wError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: userId,
          amount,
          pix_key: pixKey,
          pix_key_type: pixKeyType as any,
          status: "pending",
        })
        .select()
        .single();

      if (wError) {
        if (wError.code !== "42P01" && wError.code !== "PGRST205") throw wError;
      } else if (withdrawal) {
        withdrawalId = withdrawal.id;
        withdrawalCreatedAt = withdrawal.created_at;
        withdrawalStatus = withdrawal.status;
      }
    } catch (err: any) {
      if (err?.code !== "42P01" && err?.code !== "PGRST205") throw err;
    }

    // 4. Create ledger transaction record
    try {
      const { error: txError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: userId,
          type: "withdrawal",
          amount,
          description: `Saque via Pix`,
          status: "pending",
        });

      if (txError) {
        if (txError.code !== "42P01" && txError.code !== "PGRST205") throw txError;
      }
    } catch (err: any) {
      if (err?.code !== "42P01" && err?.code !== "PGRST205") throw err;
    }

    return {
      _id: withdrawalId,
      amount,
      status: withdrawalStatus as any,
      createdAt: withdrawalCreatedAt,
      pixKey,
    };
  }

  /**
   * Get statement (extrato)
   */
  async getStatement(page = 1, limit = 50): Promise<StatementResponse> {
    const userId = await requireUserId();

    try {
      // Fetch transactions count
      const { count, error: countError } = await supabase
        .from("wallet_transactions")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (countError) {
        if (countError.code === "42P01" || countError.code === "PGRST205") {
          return { items: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false } };
        }
        throw countError;
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      // Fetch paginated transactions
      const fromIndex = (page - 1) * limit;
      const toIndex = fromIndex + limit - 1;

      const { data: transactions, error: txError } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(fromIndex, toIndex);

      if (txError) {
        if (txError.code === "42P01" || txError.code === "PGRST205") {
          return { items: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false } };
        }
        throw txError;
      }

      const items: StatementItem[] = (transactions || []).map((t) => {
        const isNegative = t.type === "withdrawal" || t.type === "deduction" || t.type === "app_fee_debit";
        return {
          _id: t.id,
          type: t.type === "withdrawal" ? "withdrawal" : "ride",
          amount: isNegative ? -Number(t.amount) : Number(t.amount),
          date: t.created_at,
          description: t.description || (t.type === "withdrawal" ? "Saque via Pix" : "Corrida realizada"),
          status: t.status || "completed",
        };
      });

      return {
        items,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
        },
      };
    } catch (error: any) {
      if (error?.code === "42P01" || error?.code === "PGRST205") {
        return { items: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false } };
      }
      throw error;
    }
  }
}

export default new WalletService();
