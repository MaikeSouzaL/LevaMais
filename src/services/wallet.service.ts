import api from "./api";

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
    const response = await api.get("/wallet/balance");
    return response.data;
  }

  /**
   * Request withdrawal
   */
  async withdraw(amount: number, pixKey: string, pixKeyType: string): Promise<Withdrawal> {
    const response = await api.post("/wallet/withdraw", {
      amount,
      pixKey,
      pixKeyType,
    });
    return response.data.withdrawal;
  }

  /**
   * Get statement (extrato)
   */
  async getStatement(page = 1, limit = 50): Promise<StatementResponse> {
    const response = await api.get("/wallet/statement", {
      params: { page, limit },
    });

    const payload = response.data || {};
    const items = Array.isArray(payload) ? payload : payload.items || [];
    const pagination = payload.pagination || {
      page,
      limit,
      total: items.length,
      totalPages: 1,
      hasNext: false,
    };

    return { items, pagination };
  }
}

export default new WalletService();
