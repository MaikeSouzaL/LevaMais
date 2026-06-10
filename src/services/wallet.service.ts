import { supabase } from "../lib/supabase";
import { requireUserId } from "./supabase-auth.service";

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

    // 1. Get balance, total_earnings from driver_details
    const { data: details, error: detailsError } = await supabase
      .from("driver_details")
      .select("balance, total_earnings")
      .eq("id", userId)
      .maybeSingle();

    if (detailsError) throw detailsError;

    // 2. Sum withdrawals from withdrawals table
    const { data: withdrawals, error: wError } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("user_id", userId)
      .neq("status", "rejected");

    if (wError) throw wError;

    const totalWithdrawn = (withdrawals || []).reduce((sum, w) => sum + Number(w.amount), 0);

    return {
      totalEarnings: Number(details?.total_earnings || 0),
      totalWithdrawn,
      available: Number(details?.balance || 0),
    };
  }

  /**
   * Request withdrawal
   */
  async withdraw(amount: number, pixKey: string, pixKeyType: string): Promise<Withdrawal> {
    const userId = await requireUserId();

    // 1. Check current driver balance
    const { data: details, error: detailsError } = await supabase
      .from("driver_details")
      .select("balance")
      .eq("id", userId)
      .maybeSingle();

    if (detailsError) throw detailsError;

    const currentBalance = Number(details?.balance || 0);
    if (currentBalance < amount) {
      throw new Error("Saldo insuficiente");
    }

    // 2. Deduct amount from driver_details
    const { error: updateError } = await supabase
      .from("driver_details")
      .update({ balance: currentBalance - amount })
      .eq("id", userId);

    if (updateError) throw updateError;

    // 3. Create withdrawal record
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

    if (wError) throw wError;

    // 4. Create ledger transaction record
    const { error: txError } = await supabase
      .from("wallet_transactions")
      .insert({
        user_id: userId,
        type: "withdrawal",
        amount,
        description: `Saque via Pix`,
        status: "pending",
      });

    if (txError) throw txError;

    return {
      _id: withdrawal.id,
      amount: Number(withdrawal.amount),
      status: withdrawal.status as any,
      createdAt: withdrawal.created_at,
      pixKey: withdrawal.pix_key,
    };
  }

  /**
   * Get statement (extrato)
   */
  async getStatement(page = 1, limit = 50): Promise<StatementResponse> {
    const userId = await requireUserId();

    // Fetch transactions count
    const { count, error: countError } = await supabase
      .from("wallet_transactions")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) throw countError;

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

    if (txError) throw txError;

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
  }
}

export default new WalletService();
