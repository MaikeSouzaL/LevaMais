import axios from "axios";

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

const _RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3001/api";
const API_URL = _RAW_API_URL.replace("localhost", "127.0.0.1");
const ADMIN_API_KEY = process.env.NEXT_PUBLIC_ADMIN_API_KEY || "dev-admin-key";

export const withdrawalsService = {
  async getAll(status?: string): Promise<Withdrawal[]> {
    try {
      const url = status 
        ? `${API_URL}/auth/withdrawals?status=${status}` 
        : `${API_URL}/auth/withdrawals`;
      const res = await axios.get(url, {
        headers: { "x-admin-key": ADMIN_API_KEY }
      });
      return res.data?.withdrawals || [];
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      return [];
    }
  },

  async approve(id: string, transactionId?: string): Promise<any> {
    const res = await axios.patch(
      `${API_URL}/auth/withdrawals/${id}`,
      { status: "paid", transactionId },
      { headers: { "x-admin-key": ADMIN_API_KEY } }
    );
    return res.data;
  },

  async reject(id: string, reason: string): Promise<any> {
    const res = await axios.patch(
      `${API_URL}/auth/withdrawals/${id}`,
      { status: "rejected", reason },
      { headers: { "x-admin-key": ADMIN_API_KEY } }
    );
    return res.data;
  }
};
